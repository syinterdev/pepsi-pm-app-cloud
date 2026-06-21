#Requires -Version 5.1
<#
.SYNOPSIS
  รัน migration 001–069 ต่อเนื่องบน PostgreSQL (schema app)

.PARAMETER DatabaseUrl
  connection string — ถ้าไม่ระบุ อ่านจาก PM-Pepsi-App/backend/.env (DATABASE_URL)

.EXAMPLE
  pwsh -File database/scripts/run-all-migrations.ps1
  pwsh -File database/scripts/run-all-migrations.ps1 -DatabaseUrl "postgresql://pepsipm:pepsipm@127.0.0.1:5433/pepsi_pm"
#>

param([string]$DatabaseUrl = '')

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$MigrationsDir = Join-Path $RepoRoot 'database\migrations'

if (-not $DatabaseUrl) {
  $envFile = Join-Path $RepoRoot 'PM-Pepsi-App\backend\.env'
  if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
      if ($line -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') {
        $DatabaseUrl = $Matches[1].Trim()
        break
      }
    }
  }
}

if (-not $DatabaseUrl) {
  Write-Error 'Set -DatabaseUrl or DATABASE_URL in PM-Pepsi-App/backend/.env'
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  foreach ($candidate in @(
      'C:\Program Files\PostgreSQL\18\bin\psql.exe',
      'C:\Program Files\PostgreSQL\17\bin\psql.exe',
      'C:\Program Files\PostgreSQL\11\bin\psql.exe'
    )) {
    if (Test-Path $candidate) { $psql = Get-Command $candidate; break }
  }
}
if (-not $psql) {
  Write-Error 'psql not in PATH. Run SQL files in database/migrations/ in order via pgAdmin.'
}

$files =
  Get-ChildItem -Path $MigrationsDir -Filter '*.sql' |
  ForEach-Object {
    if ($_.Name -match '^(\d{3})_') {
      [PSCustomObject]@{ Num = [int]$Matches[1]; File = $_ }
    }
  } |
  Sort-Object Num |
  ForEach-Object { $_.File }

Write-Host "Target: $($DatabaseUrl -replace ':[^:@]+@', ':***@')"
$lastNum = ($files | ForEach-Object { if ($_.Name -match '^(\d{3})_') { [int]$Matches[1] } } | Measure-Object -Maximum).Maximum
Write-Host "Running $($files.Count) migrations (001-$('{0:000}' -f $lastNum))..."

foreach ($f in $files) {
  Write-Host "  -> $($f.Name)"
  & $psql.Source -d $DatabaseUrl -v ON_ERROR_STOP=1 -f $f.FullName
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed: $($f.Name) (exit $LASTEXITCODE)"
  }
}

Write-Host 'Migrations OK. Next:'
Write-Host '  pwsh -File database/scripts/run-all-seeds.ps1'
Write-Host '  pwsh -File database/scripts/verify-admin-environment.ps1'
