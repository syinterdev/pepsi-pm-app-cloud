import { readFileSync } from 'node:fs'
import * as XLSX from 'xlsx'
import { parseConfirmFileWithMeta } from '../src/services/confirmation-import.js'
import { parseIw37nFileWithMeta } from '../src/services/iw37n-parser.js'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: tsx scripts/inspect-xlsx-sheets.ts <file...>')
  process.exit(1)
}

for (const p of files) {
  const buf = readFileSync(p)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const name = p.split(/[/\\]/).pop() ?? p
  console.log(`\n=== ${name} ===`)
  console.log('sheets:', wb.SheetNames.join(', '))

  const iw = parseIw37nFileWithMeta(buf, name)
  console.log('iw37n layout:', iw.layout, 'rows:', iw.rows.length)
  if (iw.rows[0]) {
    console.log('  sample wkorder:', iw.rows[0].wkorder, 'bscstart:', iw.rows[0].bscstart)
  }

  try {
    const cf = parseConfirmFileWithMeta(buf, name)
    const ok = cf.results.filter((r) => r.kind === 'ok').length
    const err = cf.results.filter((r) => r.kind === 'error').length
    console.log('confirm layout:', cf.layout, 'ok:', ok, 'err:', err)
    const firstOk = cf.results.find((r) => r.kind === 'ok')
    if (firstOk && firstOk.kind === 'ok') {
      console.log('  sample confirm wkorder:', firstOk.row.wkorder)
    }
  } catch (e) {
    console.log('confirm parse error:', e instanceof Error ? e.message : e)
  }
}
