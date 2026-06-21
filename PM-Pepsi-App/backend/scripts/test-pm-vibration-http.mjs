/**
 * HTTP smoke test for /pm-vibration API chain.
 * Usage: npx tsx scripts/test-pm-vibration-http.mjs
 */
const API = 'http://127.0.0.1:4000'
const WO = process.env.PM_VIBRATION_TEST_WO ?? '4001567009'

async function main() {
  const health = await fetch(`${API}/api/v1/health`)
  console.log('[health]', health.status, await health.text())

  const loginRes = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ADMIN01', password: 'admin' }),
  })
  const loginBody = await loginRes.json()
  if (!loginRes.ok) {
    console.error('[FAIL] login', loginBody)
    process.exit(1)
  }
  const token = loginBody.token
  console.log('[OK] login ADMIN01')

  const searchRes = await fetch(`${API}/api/v1/work-orders/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      q: WO,
      activity: [],
      wktype: [],
      status: [],
      wkctr: [],
      team: [],
      functionalloc: [],
      equipment: [],
    }),
  })
  const searchBody = await searchRes.json()
  const hit = searchBody.items?.find((i) => i.wkorder === WO) ?? searchBody.items?.[0]
  if (!hit?.id) {
    console.error('[FAIL] work-orders/search', searchBody)
    process.exit(1)
  }
  console.log('[OK] search WO', hit.wkorder, 'id=', hit.id)

  const modalRes = await fetch(`${API}/api/v1/work-orders/${hit.id}/modal-detail`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const modal = await modalRes.json()
  if (!modalRes.ok) {
    console.error('[FAIL] modal-detail', modal)
    process.exit(1)
  }
  const items = modal.taskList?.items ?? []
  const pm = items.filter(
    (i) => i.measurementKind === 'current_3phase' || i.measurementKind === 'vibration_dst_db',
  )
  console.log('[OK] modal-detail', {
    wkorder: modal.woHeader?.wkorder,
    mntplan: modal.taskList?.mntplan,
    taskList: items.length,
    pmTasks: pm.length,
    headerShortText: modal.woHeader?.headerShortText,
    techId: modal.woHeader?.techId,
    sysCond: modal.woHeader?.sysCond,
  })

  const fe = await fetch('http://127.0.0.1:5173/pm-vibration')
  console.log('[frontend /pm-vibration]', fe.status, fe.ok ? 'SPA shell OK' : 'check vite dev server')

  console.log('\nOpen in browser:')
  console.log(`  http://localhost:5173/pm-vibration?wkorder=${WO}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
