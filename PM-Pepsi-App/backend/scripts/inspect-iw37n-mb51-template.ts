/**
 * Inspect multi-sheet SAP template: IW37N & MB51
 * Usage: npx tsx scripts/inspect-iw37n-mb51-template.ts [path]
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { parseIw37nFileWithMeta } from '../src/services/iw37n-parser.js'
import { parseConfirmFileWithMeta } from '../src/services/confirmation-import.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const defaultPath = path.join(repoRoot, 'docs from customer/IW37N & MB51 template.xlsx')
const filePath = process.argv[2] ?? defaultPath
const buf = readFileSync(filePath)
const wb = XLSX.read(buf, { type: 'buffer' })
const baseName = path.basename(filePath)

console.log('file:', filePath)
console.log('sheets:', wb.SheetNames.join(' · '))
console.log('')

for (const sn of wb.SheetNames) {
  const sheet = wb.Sheets[sn]!
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  console.log(`=== Sheet: ${sn} (${matrix.length} rows) ===`)
  for (let i = 0; i < Math.min(8, matrix.length); i++) {
    const row = matrix[i] ?? []
    const cells = row.slice(0, 14).map((c) => (c === '' ? '·' : String(c).slice(0, 40)))
    console.log(`  r${i + 1}:`, cells.join(' | '))
  }
  console.log('')
}

const iw = parseIw37nFileWithMeta(buf, baseName)
const orders = iw.rows.map((r) => r.wkorder).filter((w) => /^\d{8,}$/.test(w))
console.log('--- Whole workbook IW37N parse ---')
console.log('layout:', iw.layout)
console.log('parsedRows:', iw.rows.length)
console.log('validOrderRows:', orders.length)
if (orders.length > 0) {
  console.log('orderRange:', orders[0], '…', orders[orders.length - 1])
  console.log('uniqueOrders:', new Set(orders).size)
}
const wktypes = [...new Set(iw.rows.map((r) => r.wktype).filter(Boolean))].slice(0, 10)
console.log('wktypeSample:', wktypes.join(', '))

const cf = parseConfirmFileWithMeta(buf, baseName)
const ok = cf.results.filter((r) => r.kind === 'ok')
console.log('--- Confirm parse (whole file) ---')
console.log('layout:', cf.layout, 'okRows:', ok.length)
