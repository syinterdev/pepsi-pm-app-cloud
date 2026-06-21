import { readFileSync } from 'node:fs'
import * as XLSX from 'xlsx'
import { parseIw37nFileWithMeta } from '../src/services/iw37n-parser.js'

const path = process.argv[2] ?? 'C:/Users/Chinchettha/Desktop/sap_241163/IW37N.xlsx'
const buf = readFileSync(path)
const wb = XLSX.read(buf, { type: 'buffer' })
const sheet = wb.Sheets[wb.SheetNames[0]!]!
const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

console.log('path:', path)
console.log('sheet:', wb.SheetNames[0])
console.log('totalRows:', matrix.length)

for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
  if (i >= matrix.length) break
  const row = matrix[i]
  const cells = Array.isArray(row) ? row.slice(0, 19) : []
  console.log(`row${i + 1}:`, JSON.stringify(cells))
}

const { layout, rows: parsed } = parseIw37nFileWithMeta(buf, path.split(/[/\\]/).pop() ?? 'file.xlsx')
console.log('detectedLayout:', layout)
console.log('parsedRows:', parsed.length)

if (parsed[0]) {
  const r = parsed[0]
  console.log('sample1:', {
    wkorder: r.wkorder,
    opac: r.opac,
    wkctr: r.wkctr,
    bscstart: r.bscstart,
    syst: r.syst,
    equipment: r.equipment,
    functionalloc: r.functionalloc,
  })
}
if (parsed[parsed.length - 1]) {
  const r = parsed[parsed.length - 1]!
  console.log('sampleLast:', { wkorder: r.wkorder, opac: r.opac, syst: r.syst })
}

const noBsc = parsed.filter((r) => !r.bscstart).length
console.log('rowsWithoutBscstart:', noBsc, '(import will skip these)')
