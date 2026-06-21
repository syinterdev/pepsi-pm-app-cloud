import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'

const path =
  process.argv[2] ??
  'c:/Users/Chinchettha/Desktop/pepsi_pm_application-main/Vibration Record 2019.xlsx'

const wb = XLSX.read(readFileSync(path), { type: 'buffer', sheetRows: 30 })
console.log('Sheets:', wb.SheetNames)

for (const name of wb.SheetNames.slice(0, 8)) {
  const ws = wb.Sheets[name]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  console.log(`\n=== ${name} (preview ${rows.length} rows) ===`)
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    console.log(JSON.stringify(rows[i]))
  }
}
