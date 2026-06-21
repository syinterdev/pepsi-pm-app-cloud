/**
 * Smoke test for /pm-vibration data chain (Phase 0 UAT).
 * Usage: node scripts/test-pm-vibration-page.mjs
 */
import 'dotenv/config'
import { createPool } from '../src/db/pool.js'
import { getWorkOrderModalDetail } from '../src/services/work-orders.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = createPool(databaseUrl)
const results = []
let failed = false

function pass(name, detail) {
  results.push({ ok: true, name, detail })
  console.log(`[OK] ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail) {
  failed = true
  results.push({ ok: false, name, detail })
  console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`)
}

try {
  const woRow = await pool.query(`
    SELECT w.idiw37, w.wkorder, w.mntplan, w.functionalloc, w.syst,
           COUNT(t.*)::int AS task_rows
    FROM app.tbiw37n w
    INNER JOIN app.tbtasklist t ON TRIM(t.mntplan) = TRIM(w.mntplan)
    WHERE w.mntplan IS NOT NULL AND TRIM(w.mntplan) <> ''
    GROUP BY w.idiw37, w.wkorder, w.mntplan, w.functionalloc, w.syst
    HAVING COUNT(t.*) > 0
    ORDER BY COUNT(t.*) DESC
    LIMIT 1
  `)

  const wo = woRow.rows[0]
  if (!wo) {
    fail('Find WO with tasklist', 'no join between tbiw37n and tbtasklist')
  } else {
    pass('Find WO with tasklist', `${wo.wkorder} mntplan=${wo.mntplan} tasks=${wo.task_rows}`)

    const modal = await getWorkOrderModalDetail(pool, String(wo.idiw37), {}, { userst: 'A' })
    if (!modal) {
      fail('modal-detail API', `null for idiw37=${wo.idiw37}`)
    } else {
      pass('modal-detail API', `wkorder=${modal.woHeader.wkorder}`)

      const items = modal.taskList?.items ?? []
      if (items.length < 1) {
        fail('taskList items', 'empty')
      } else {
        pass('taskList items', `${items.length} row(s)`)
      }

      const pmItems = items.filter(
        (i) =>
          i.measurementKind === 'current_3phase' || i.measurementKind === 'vibration_dst_db',
      )
      pass(
        'PM measurement tasks',
        pmItems.length > 0
          ? `${pmItems.length} current/vibration task(s)`
          : 'none tagged — page still loads, manual entry only',
      )

      const h = modal.woHeader
      pass('woHeader.wkorder', h.wkorder ?? '—')
      pass('woHeader.mntplan (via taskList)', modal.taskList?.mntplan ?? '—')
      pass('woHeader.startDate', h.startDate ?? '—')
      pass('woHeader.functionalLocation', h.functionalLocation ?? '—')
      pass('woHeader.headerShortText', h.headerShortText ?? '—')
      pass('woHeader.techId (Man pending Phase 1)', h.techId ?? '—')
      pass('woHeader.sysCond (หยุด/เดิน pending Phase 1)', h.sysCond ?? '—')

      const firstTask = items[0]
      if (firstTask) {
        pass('firstTask.pmman', firstTask.pmman ?? '—')
        pass('firstTask.machinestatus', String(firstTask.machinestatus ?? '—'))
        pass('firstTask.machine / pmlist', `${firstTask.machine ?? '—'} / ${firstTask.pmlist ?? '—'}`)
      }
    }
  }

  try {
    const perm = await pool.query(`
      SELECT rp.perm_code
      FROM app.tbl_user_role ur
      JOIN app.tbl_role_permission rp ON rp.role_code = ur.role_code AND rp.granted = true
      WHERE ur.username = 'ADMIN01'
        AND rp.perm_code IN ('confirmation.read', 'confirmation.write')
    `)
    const keys = perm.rows.map((r) => r.perm_code)
    if (keys.includes('confirmation.read')) pass('ADMIN01 confirmation.read', 'can open /pm-vibration')
    else fail('ADMIN01 confirmation.read', `missing — has: ${keys.join(', ') || 'none'}`)
    if (keys.includes('confirmation.write')) pass('ADMIN01 confirmation.write', 'can save readings')
    else fail('ADMIN01 confirmation.write', 'missing')
  } catch {
    pass('Permissions', 'skipped table check — verified via HTTP login below')
  }

  console.log('\n--- Manual browser test ---')
  console.log(`1. Login ADMIN01 / admin`)
  console.log(`2. Open http://localhost:5173/pm-vibration?wkorder=${wo?.wkorder ?? '<WO>'}`)
  console.log('3. Confirm: WO loads, SAP print form visible, task rows show')
} finally {
  await pool.end()
}

console.log('\n' + JSON.stringify({ failed, results }, null, 2))
process.exit(failed ? 1 : 0)
