/**
 * Probe Excel files in `docs from customer/` for UAT report.
 * Usage: npx tsx scripts/probe-customer-excel.ts
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { buildPmReadingsImportTemplateBuffer, parsePmReadingsWorkbook } from '../src/lib/pm-readings-import.js'
import { parseConfirmFileWithMeta } from '../src/services/confirmation-import.js'
import { parseIw37nFileWithMeta } from '../src/services/iw37n-parser.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const customerDir = path.resolve(here, '../../../docs from customer')

type FileProbe = {
  file: string
  sheets: string
  iw37nRows: number | null
  iw37nIssues: number | null
  sampleWo: string | null
  confirmOk: number | null
  confirmLayout: string | null
  pmRows: number | null
  pmIssues: number | null
  note: string
}

async function probeFile(name: string): Promise<FileProbe> {
  const p = path.join(customerDir, name)
  const buf = await readFile(p)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const out: FileProbe = {
    file: name,
    sheets: wb.SheetNames.join(' · '),
    iw37nRows: null,
    iw37nIssues: null,
    sampleWo: null,
    confirmOk: null,
    confirmLayout: null,
    pmRows: null,
    pmIssues: null,
    note: '',
  }

  try {
    const iw = parseIw37nFileWithMeta(buf, name)
    out.iw37nRows = iw.rows.length
    out.iw37nIssues = iw.issues?.length ?? 0
    const orders = iw.rows.map((r) => r.wkorder).filter(Boolean)
    out.sampleWo = orders[0] ?? null
    if (orders.length > 0) {
      out.note = `IW37N layout=${iw.layout} orders=${orders.length} unique=${new Set(orders).size} range=${orders[0]}…${orders[orders.length - 1]}`
    }
  } catch {
    out.note += 'IW37N parse error; '
  }

  try {
    const cf = parseConfirmFileWithMeta(buf, name)
    out.confirmLayout = cf.layout
    out.confirmOk = cf.results.filter((r) => r.kind === 'ok').length
  } catch {
    out.note += 'Confirm parse error; '
  }

  try {
    const pm = parsePmReadingsWorkbook(buf)
    out.pmRows = pm.rows.length
    out.pmIssues = pm.issues.length
  } catch {
    out.note += 'PM parse error; '
  }

  if (!out.note) out.note = '—'
  return out
}

const files = (await readdir(customerDir)).filter((f) => /\.(xlsx|xls)$/i.test(f)).sort()
const probes: FileProbe[] = []
for (const f of files) {
  probes.push(await probeFile(f))
}

const zbA = await probeFile('Templete IW37N on PM App - ZB02All.xlsx')
const zbB = await probeFile('Templete IW37N on PM App - ZB02All 1.xlsx')
const tpl = parsePmReadingsWorkbook(buildPmReadingsImportTemplateBuffer())

console.log(JSON.stringify({ probes, zb02allIdentical: zbA.iw37nRows === zbB.iw37nRows && zbA.sampleWo === zbB.sampleWo, pmTemplate: { rows: tpl.rows.length, issues: tpl.issues.length } }, null, 2))
