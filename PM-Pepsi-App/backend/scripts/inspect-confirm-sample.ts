import { readFileSync } from 'node:fs'
import * as XLSX from 'xlsx'
import { parseConfirmFileWithMeta } from '../src/services/confirmation-import.js'

const path = process.argv[2]!
const buf = readFileSync(path)
const wb = XLSX.read(buf, { type: 'buffer' })
const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]!]!, {
  header: 1,
  defval: '',
})

console.log('path:', path)
console.log('sheet:', wb.SheetNames[0])
console.log('totalRows:', matrix.length)
for (let i = 0; i < 6; i++) {
  const row = matrix[i]
  console.log(
    `row${i + 1}:`,
    JSON.stringify(Array.isArray(row) ? row.slice(0, 20) : row),
  )
}

const { layout, results: rows } = parseConfirmFileWithMeta(buf, path.split(/[/\\]/).pop() ?? 'file.xlsx')
const ok = rows.filter((r) => r.kind === 'ok')
const err = rows.filter((r) => r.kind === 'error')
console.log('detectedLayout:', layout)
console.log('parseConfirm:', { total: rows.length, ok: ok.length, err: err.length })
if (err[0]) console.log('firstError:', err[0].code, err[0].message)
if (ok[0]) console.log('firstOk:', ok[0].row)
