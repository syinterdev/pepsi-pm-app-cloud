#Requires -Version 5.1
<#
.SYNOPSIS
  รัน seed 009 + 010 + 011 หลัง migration ครบ

.EXAMPLE
  pwsh -File database/scripts/run-all-seeds.ps1
#>

param([string]$DatabaseUrl = '')

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$SeedsDir = Join-Path $RepoRoot 'database\seeds'

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
if (-not $DatabaseUrl) { Write-Error 'DATABASE_URL required' }

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) { Write-Error 'psql not in PATH' }

foreach ($f in @('009_dev_auth_seed.sql', '010_dev_demo_data.sql', '011_dev_manhours_seed.sql')) {
  $path = Join-Path $SeedsDir $f
  Write-Host "  -> $f"
  & psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $path
  if ($LASTEXITCODE -ne 0) { Write-Error "Failed: $f" }
}

Write-Host 'Seeds OK. Run: psql ... -f database/scripts/verify_app_schema.sql'
