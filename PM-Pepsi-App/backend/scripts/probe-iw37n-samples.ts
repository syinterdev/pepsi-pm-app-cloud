/**
 * Probe customer IW37N files for CRTD/REL + sample mntplan/WO.
 * Usage: npx tsx scripts/probe-iw37n-samples.ts
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../src/db/pool.js'
import { parseIw37nFileWithMeta } from '../src/services/iw37n-parser.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

const files = [
  'docs from customer/Templete IW37N on PM App - ZB02All.xlsx',
  'docs from customer/Templete IW37N on PM App - ZB02All 1.xlsx',
  'from customer/SAP data/Data/IW37N ล่าสุด.xlsx',
  'from customer/SAP data/Jul/IW37N May-Jun.xls',
  'from customer/Test/IW37N (15Jul20).xls',
  'from customer/Test/IW37N 1May-30Jun.xlsx',
]

for (const rel of files) {
  const fp = path.join(repoRoot, rel)
  try {
    const buf = readFileSync(fp)
    const { layout, rows } = parseIw37nFileWithMeta(buf, path.basename(fp))
    const crtdRel = rows.filter((r) => r.syst === 'CRTD' || r.syst === 'REL')
    const m342 = rows.filter((r) => String(r.mntplan).trim() === '342596')
    const wo400 = rows.filter((r) => String(r.wkorder).trim() === '4001560529')
    console.log(`\n${rel}`)
    console.log(
      `  layout=${layout} total=${rows.length} CRTD/REL=${crtdRel.length} mntplan342596=${m342.length} wo4001560529=${wo400.length}`,
    )
    if (m342[0]) {
      const r = m342[0]
      console.log(`  m342 sample: wo=${r.wkorder} syst=${r.syst} bscstart=${r.bscstart}`)
    }
    if (wo400[0]) {
      const r = wo400[0]
      console.log(`  wo sample: syst=${r.syst} mntplan=${r.mntplan}`)
    }
  } catch (e) {
    console.log(`\n${rel} ERR: ${e instanceof Error ? e.message : e}`)
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim()
if (databaseUrl) {
  const pool = createPool(databaseUrl)
  try {
    const total = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM app.tbiw37n`)
    const crtdRel = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM app.tbiw37n WHERE syst IN ('CRTD', 'REL')`,
    )
    const m342 = await pool.query<{ wkorder: string; syst: string; mntplan: string; bscstart: number }>(
      `SELECT wkorder, syst, mntplan, bscstart FROM app.tbiw37n WHERE mntplan = $1 LIMIT 5`,
      ['342596'],
    )
    const wo = await pool.query<{ idiw37: number; wkorder: string; syst: string; mntplan: string }>(
      `SELECT idiw37, wkorder, syst, mntplan FROM app.tbiw37n WHERE wkorder = $1 LIMIT 3`,
      ['4001560529'],
    )
    console.log('\n=== DB ===')
    console.log(`tbiw37n total=${total.rows[0]?.n ?? 0} CRTD/REL=${crtdRel.rows[0]?.n ?? 0}`)
    console.log('mntplan 342596:', m342.rows)
    console.log('wo 4001560529:', wo.rows)
  } finally {
    await pool.end()
  }
}
