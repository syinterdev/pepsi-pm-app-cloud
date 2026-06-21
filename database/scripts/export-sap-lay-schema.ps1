#Requires -Version 5.1
<#
.SYNOPSIS
  Export DDL (ไม่มีข้อมูล) จาก MySQL ฐาน sap_lay → database/legacy-reference/sap_lay-schema-tables.sql

.DESCRIPTION
  อ่าน host/user/password/database จาก sap/include/connection.php
  ต้องมี mysqldump.exe ใน PATH (ชุด MySQL client)

  ตัวอย่าง:
    pwsh -File database/scripts/export-sap-lay-schema.ps1
#>

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$ConnPhp = Join-Path $RepoRoot 'sap\include\connection.php'

if (-not (Test-Path $ConnPhp)) {
  Write-Error "Not found: $ConnPhp"
}

$content = Get-Content -Raw -Path $ConnPhp
function Get-PhpString($key) {
  if ($content -match "\`$GLOBALS\[`"$key`"\]\s*=\s*`"([^`"]+)`) {
    return $Matches[1]
  }
  return $null
}

$hostName = Get-PhpString 'host'
$user = Get-PhpString 'Uname'
$pass = Get-PhpString 'Pword'
$db = Get-PhpString 'DBName'

if (-not $hostName -or -not $user -or -not $db) {
  Write-Error 'Could not parse connection.php (host/Uname/DBName).'
}

$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
  Write-Warning 'mysqldump not in PATH. Add MySQL bin to PATH, then re-run.'
  exit 1
}

$OutDir = Join-Path $RepoRoot 'database\legacy-reference'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$tables = @(
  'tbworkcenter',
  'tbworkcenter_userlog',
  'tbactivitytype',
  'tbiw37n',
  'tbmenu',
  'view_order',
  'view_lineschdul'
)

$outFile = Join-Path $OutDir 'sap_lay-core-objects.mysql.sql'
Write-Host "Writing $outFile"

& mysqldump.exe `
  "-h$hostName" `
  "-u$user" `
  "-p$pass" `
  --no-data `
  --skip-comments `
  $db `
  @tables `
  | Set-Content -Encoding utf8 $outFile

Write-Host 'Done. Review file before commit (schema only, no rows).'
