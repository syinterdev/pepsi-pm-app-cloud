#Requires -Version 5.1
<#
.SYNOPSIS
  รัน migration ชุด Admin (044–069) บน PostgreSQL schema app

.DESCRIPTION
  ใช้เมื่อมี 001–043 แล้ว แต่ยังไม่มีตาราง RBAC / settings / audit / backup ฯลฯ
  ไฟล์ใช้ idempotent (IF NOT EXISTS) — รันซ้ำได้ส่วนใหญ่

.PARAMETER DatabaseUrl
  connection string — ค่าเริ่มต้นอ่านจาก PM-Pepsi-App/backend/.env

.EXAMPLE
  pwsh -File database/scripts/run-admin-migrations.ps1
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
if (-not $DatabaseUrl) { throw 'Set -DatabaseUrl or DATABASE_URL in PM-Pepsi-App/backend/.env' }

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  $pg11 = 'C:\Program Files\PostgreSQL\11\bin\psql.exe'
  if (Test-Path $pg11) { $psql = Get-Command $pg11 }
}
if (-not $psql) { throw 'psql not in PATH (install PostgreSQL client or use DBeaver)' }

$files =
  Get-ChildItem -Path $MigrationsDir -Filter '*.sql' |
  ForEach-Object {
    if ($_.Name -match '^(\d{3})_') {
      $num = [int]$Matches[1]
      if ($num -ge 44) { [PSCustomObject]@{ Num = $num; File = $_ } }
    }
  } |
  Sort-Object Num |
  ForEach-Object { $_.File }

Write-Host "Target: $($DatabaseUrl -replace ':[^:@]+@', ':***@')"
Write-Host "Admin migrations: $($files.Count) files (044–069)..."

foreach ($f in $files) {
  Write-Host "  -> $($f.Name)"
  & $psql.Source -d $DatabaseUrl -v ON_ERROR_STOP=1 -f $f.FullName
  if ($LASTEXITCODE -ne 0) { throw "Failed: $($f.Name) (exit $LASTEXITCODE)" }
}

Write-Host 'Admin migrations OK. Next:'
Write-Host '  psql ... -f database/scripts/verify_admin_data_tables.sql'
Write-Host '  pwsh -File database/scripts/verify-admin-environment.ps1'
