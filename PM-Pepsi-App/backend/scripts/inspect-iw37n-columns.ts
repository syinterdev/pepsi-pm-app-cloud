import { readFileSync } from 'node:fs'
import * as XLSX from 'xlsx'

const path = process.argv[2] ?? 'C:/Users/Chinchettha/Desktop/sap_241163/IW37N.xlsx'
const buf = readFileSync(path)
const wb = XLSX.read(buf, { type: 'buffer' })
const sheet = wb.Sheets[wb.SheetNames[0]!]!
const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

const hdr = matrix[3] as unknown[]
const row = matrix[5] as unknown[]
console.log('header non-empty:')
if (Array.isArray(hdr)) {
  hdr.forEach((h, i) => {
    if (String(h).trim()) console.log(`  [${i}] ${h}`)
  })
}
console.log('row6 non-empty:')
if (Array.isArray(row)) {
  row.forEach((c, i) => {
    if (String(c).trim()) console.log(`  [${i}] ${c}`)
  })
}

let with7151 = 0
let total = 0
for (let i = 5; i < matrix.length; i++) {
  const r = matrix[i]
  if (!Array.isArray(r)) continue
  total++
  const text = r.map(String).join('|')
  if (text.includes('7151')) with7151++
}
console.log(`rows with 7151: ${with7151} / ${total}`)

// sample row with 7151
for (let i = 5; i < Math.min(matrix.length, 500); i++) {
  const r = matrix[i]
  if (!Array.isArray(r)) continue
  if (!r.some((c) => String(c).includes('7151'))) continue
  console.log('sample 7151 row:')
  r.forEach((c, j) => {
    if (String(c).trim()) console.log(`  [${j}] ${c}`)
  })
  break
}
