/**
 * P0.2 verification — IW37N CRTD/REL, mntplan binding, calendar/modal readiness.
 * Usage: npm run verify:iw37n-p02
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { getWorkOrderModalDetail } from '../src/services/work-orders.js'
import { FACTORY_CODE } from '../src/services/scheduling-shared.js'

const SAMPLE_WO = '4001560529'
const SAMPLE_MNTPLAN = '342596'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
let failed = false

function fail(msg: string) {
  console.error(`[FAIL] ${msg}`)
  failed = true
}

function ok(msg: string) {
  console.log(`[OK] ${msg}`)
}

try {
  const crtdRel = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.tbiw37n WHERE syst IN ('CRTD', 'REL')`,
  )
  const nCrtdRel = crtdRel.rows[0]?.n ?? 0
  if (nCrtdRel < 1) fail(`no CRTD/REL work orders (found ${nCrtdRel})`)
  else ok(`${nCrtdRel} work orders with syst CRTD or REL`)

  const woRow = await pool.query<{
    idiw37: number
    wkorder: string
    syst: string
    mntplan: string
    functionalloc: string
  }>(
    `SELECT idiw37, wkorder, syst, mntplan, functionalloc
     FROM app.tbiw37n
     WHERE wkorder = $1
     LIMIT 1`,
    [SAMPLE_WO],
  )
  const wo = woRow.rows[0]
  if (!wo) fail(`sample WO ${SAMPLE_WO} not in tbiw37n`)
  else {
    ok(`sample WO ${SAMPLE_WO}: syst=${wo.syst} mntplan=${wo.mntplan}`)
    if (wo.mntplan !== SAMPLE_MNTPLAN) {
      fail(`WO mntplan expected ${SAMPLE_MNTPLAN}, got ${wo.mntplan}`)
    }
    if (wo.syst !== 'CRTD' && wo.syst !== 'REL') {
      fail(`WO syst expected CRTD or REL, got ${wo.syst}`)
    }
    if (!wo.functionalloc.includes(FACTORY_CODE)) {
      fail(`WO functionalloc missing factory code ${FACTORY_CODE}: ${wo.functionalloc}`)
    }
  }

  const planCount = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.tbtasklist WHERE mntplan = $1`,
    [SAMPLE_MNTPLAN],
  )
  const nPlan = planCount.rows[0]?.n ?? 0
  if (nPlan < 1) fail(`mntplan ${SAMPLE_MNTPLAN} has no tbtasklist rows`)
  else ok(`mntplan ${SAMPLE_MNTPLAN} has ${nPlan} tasklist row(s)`)

  if (wo) {
    const view = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n
       FROM app.view_order v
       JOIN app.tbiw37n i ON i.idiw37 = v.idiw37
       WHERE i.wkorder = $1 AND i.functionalloc LIKE $2`,
      [SAMPLE_WO, `%${FACTORY_CODE}%`],
    )
    if ((view.rows[0]?.n ?? 0) < 1) {
      fail(`WO ${SAMPLE_WO} not visible in view_order (calendar filter)`)
    } else ok(`WO ${SAMPLE_WO} visible in view_order for calendar`)

    const modal = await getWorkOrderModalDetail(pool, String(wo.idiw37), {}, { userst: 'A' })
    if (!modal) fail(`modal-detail returned null for idiw37=${wo.idiw37}`)
    else {
      ok(
        `modal-detail: wkorder=${modal.woHeader.wkorder} mntplan=${modal.taskList.mntplan} ` +
          `taskList=${modal.taskList.items.length} item(s)`,
      )
      if (modal.taskList.items.length < 1) {
        fail('modal-detail taskList empty — mntplan not bound to published tasklist')
      }
    }
  }

  const batches = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM app.tbiw37n_import_batch`,
  )
  ok(`import batches in DB: ${batches.rows[0]?.n ?? 0}`)
} finally {
  await pool.end()
}

if (failed) process.exit(1)
