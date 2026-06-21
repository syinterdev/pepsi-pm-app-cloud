#Requires -Version 5.1
<#
.SYNOPSIS
  Check section 0 database and environment (14-administrator.md)

.EXAMPLE
  powershell -File database/scripts/verify-admin-environment.ps1
  powershell -File database/scripts/verify-admin-environment.ps1 -SkipApi
#>

param(
  [string]$DatabaseUrl = '',
  [string]$ApiBase = 'http://127.0.0.1:4000',
  [switch]$SkipApi
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$script:fail = 0

function Fail($msg) { Write-Host "FAIL: $msg" -ForegroundColor Red; $script:fail++ }
function Ok($msg) { Write-Host "OK:   $msg" -ForegroundColor Green }

if (-not $DatabaseUrl) {
  $envFile = Join-Path $RepoRoot 'PM-Pepsi-App\backend\.env'
  foreach ($line in (Get-Content $envFile -ErrorAction SilentlyContinue)) {
    if ($line -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') { $DatabaseUrl = $Matches[1].Trim(); break }
  }
}
if (-not $DatabaseUrl) { Fail 'DATABASE_URL missing in PM-Pepsi-App/backend/.env'; exit 1 }

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  $pg11 = 'C:\Program Files\PostgreSQL\11\bin\psql.exe'
  if (Test-Path $pg11) { $psql = Get-Command $pg11 }
}
if (-not $psql) { Fail 'psql not found'; exit 1 }

Write-Host ''
Write-Host '=== 1) Admin tables ===' -ForegroundColor Cyan
$verifySql = Join-Path $RepoRoot 'database\scripts\verify_admin_data_tables.sql'
$out = & $psql.Source -d $DatabaseUrl -v ON_ERROR_STOP=1 -f $verifySql 2>&1 | Out-String
Write-Host $out
if ($out -match '\|\s*f\s*\|') { Fail 'Some admin tables missing (ok = f)' }
else { Ok 'All admin tables present' }

Write-Host ''
Write-Host '=== 2) Seed user ADMIN01 ===' -ForegroundColor Cyan
$admin = (& $psql.Source -d $DatabaseUrl -t -A -c "SELECT COUNT(*) FROM app.tbworkcenter WHERE idwkctr='ADMIN01';").Trim()
if ($admin -eq '1') { Ok 'ADMIN01 exists' }
else { Fail 'ADMIN01 missing - run database/seeds/009_dev_auth_seed.sql' }

$permA = (& $psql.Source -d $DatabaseUrl -t -A -c "SELECT COUNT(*) FROM app.tbl_role_permission WHERE role_code='A';").Trim()
if ([int]$permA -ge 20) { Ok "Role A has $permA grants" }
else { Fail "Role A grants too few ($permA)" }

Write-Host ''
Write-Host '=== 3) Backend .env ===' -ForegroundColor Cyan
$be = Join-Path $RepoRoot 'PM-Pepsi-App\backend\.env'
if (-not (Test-Path $be)) { Fail 'backend/.env missing' }
else {
  $beText = Get-Content $be -Raw
  if ($beText -match 'DATABASE_URL\s*=\s*\S+') { Ok 'DATABASE_URL set' } else { Fail 'DATABASE_URL empty' }
  if ($beText -match 'SESSION_SECRET\s*=\s*.{16,}') { Ok 'SESSION_SECRET set' } else { Fail 'SESSION_SECRET too short' }
}

Write-Host ''
Write-Host '=== 4) Frontend env ===' -ForegroundColor Cyan
$feLocal = Join-Path $RepoRoot 'PM-Pepsi-App\frontend\.env.local'
if (Test-Path $feLocal) {
  $fe = Get-Content $feLocal -Raw
  if ($fe -match 'VITE_ENABLE_MSW\s*=\s*true') { Fail 'VITE_ENABLE_MSW=true' }
  else { Ok '.env.local OK' }
}
else { Ok 'No .env.local - Vite proxy default is fine' }

if (-not $SkipApi) {
  Write-Host ''
  Write-Host '=== 5) API smoke ===' -ForegroundColor Cyan
  try {
    $health = Invoke-RestMethod -Uri "$ApiBase/api/v1/health" -TimeoutSec 8
    if ($health.db -eq 'ok') { Ok 'GET /api/v1/health db=ok' }
    else { Fail "health db=$($health.db)" }
  }
  catch { Fail "Cannot reach $ApiBase - start backend npm run dev" }

  try {
    $body = @{ username = 'ADMIN01'; password = 'admin' } | ConvertTo-Json
    $login = Invoke-RestMethod -Method Post -Uri "$ApiBase/api/v1/auth/login" -ContentType 'application/json' -Body $body -TimeoutSec 10
    if (-not $login.token) { Fail 'login no token' }
    else { Ok 'POST /auth/login ADMIN01' }

    $headers = @{ Authorization = "Bearer $($login.token)" }
    $me = Invoke-RestMethod -Uri "$ApiBase/api/v1/auth/me" -Headers $headers -TimeoutSec 10
    if ($me.user.permissions -contains 'admin.settings.read') { Ok 'admin.settings.read in JWT' }
    else { Fail 'missing admin.settings.read' }

    $null = Invoke-RestMethod -Uri "$ApiBase/api/v1/admin/settings" -Headers $headers -TimeoutSec 10
    Ok 'GET /admin/settings (no SCHEMA_NOT_READY)'
  }
  catch {
    if ($_.Exception.Message -match '503') { Fail 'SCHEMA_NOT_READY - run run-admin-migrations.ps1' }
    else { Fail $_.Exception.Message }
  }
}

Write-Host ''
if ($script:fail -eq 0) {
  Write-Host 'Section 0 checks passed.' -ForegroundColor Green
  exit 0
}
Write-Host "$($script:fail) check(s) failed." -ForegroundColor Red
exit 1
