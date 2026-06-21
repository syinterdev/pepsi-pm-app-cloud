import { expect, test } from '@playwright/test'
import { API_BASE, apiLogin, seedAdminSession } from './helpers/auth.js'

const POSITIVE_WO = process.env.PM_VIBRATION_UAT_WO ?? '4001567009'
const NEGATIVE_WO = process.env.PM_VIBRATION_UAT_WO_NO_TASK ?? '4000126314'

async function fetchModalHeader(request: import('@playwright/test').APIRequestContext, wkorder: string) {
  const { token } = await apiLogin(request)
  const searchRes = await request.post(`${API_BASE}/api/v1/work-orders/search`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      q: wkorder,
      activity: [],
      wktype: [],
      status: [],
      wkctr: [],
      team: [],
      functionalloc: [],
      equipment: [],
    },
  })
  expect(searchRes.ok()).toBeTruthy()
  const searchBody = (await searchRes.json()) as { items: { id: string; wkorder: string }[] }
  const hit = searchBody.items.find((i) => i.wkorder === wkorder) ?? searchBody.items[0]
  expect(hit?.id).toBeTruthy()

  const modalRes = await request.get(`${API_BASE}/api/v1/work-orders/${hit.id}/modal-detail`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(modalRes.ok()).toBeTruthy()
  return (await modalRes.json()) as {
    woHeader: Record<string, unknown>
    taskList?: { mntplan?: string; items?: unknown[] }
  }
}

test.describe('PM Vibration Phase 1 UAT', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'th')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
    await seedAdminSession(request, page)
  })

  test('A — WO with published Master Plan (4001567009)', async ({ page, request }) => {
    const modal = await fetchModalHeader(request, POSITIVE_WO)
    const h = modal.woHeader

    await page.goto(`/pm-vibration?wkorder=${POSITIVE_WO}`, { waitUntil: 'networkidle' })

    const form = page.getByRole('region', { name: /Work Order ตามเอกสาร SAP|work order header/i })
    await expect(form).toBeVisible({ timeout: 30_000 })
    await expect(form.getByText(POSITIVE_WO, { exact: true }).first()).toBeVisible()

    const formText = await form.innerText()

    // Positive — Man / หยุด-เดิน / mntplan
    await expect(form.locator('.sap-wo-print__inline', { hasText: 'Man' }).first()).toBeVisible()
    expect(formText).toMatch(/Man:\s*1/)
    await expect(
      form.locator('.sap-wo-print__inline', { hasText: 'หยุด / เดิน' }).first(),
    ).toBeVisible()
    expect(formText).toMatch(/หยุด \/ เดิน:\s*หยุด/)
    expect(String(h.headerShortText)).toBe(String(modal.taskList?.mntplan))
    expect(formText).toContain(String(h.headerShortText))

    // Descriptions from IW37N
    expect(formText).toContain('FACTORY 1 PC50MZ')
    expect(formText).toContain('Peeler & Slicer Zone')

    // Removed from header grid / middle block
    expect(formText).not.toMatch(/^Priority:/m)
    expect(formText).not.toMatch(/^End Date:/m)
    expect(formText).not.toContain('No Permits Found')
    expect(formText).not.toContain('Object List')
    expect(formText).not.toContain('No objects found')

    // PM list numbered before R/S/T table
    const pmList = form.locator('.sap-wo-print__pm-list li')
    await expect(pmList.first()).toBeVisible()
    expect(await pmList.count()).toBeGreaterThanOrEqual(20)
    expect(formText).toContain('Collection Vibrating Conveyor')

    await expect(form.locator('.sap-wo-print__longtext-sub')).toBeVisible()
    await expect(form.locator('.sap-wo-print__measure-table')).toBeVisible()

    await page.screenshot({
      path: 'test-results/pm-vibration-phase1-uat-positive.png',
      fullPage: true,
    })
  })

  test('B — WO without tasklist (4000126314)', async ({ page, request }) => {
    const modal = await fetchModalHeader(request, NEGATIVE_WO)
    const h = modal.woHeader

    await page.goto(`/pm-vibration?wkorder=${NEGATIVE_WO}`, { waitUntil: 'networkidle' })

    const form = page.getByRole('region', { name: /Work Order ตามเอกสาร SAP|work order header/i })
    await expect(form).toBeVisible({ timeout: 30_000 })

    const formText = await form.innerText()
    expect(String(h.headerShortText)).toBe('346012')
    expect(formText).toContain('346012')
    expect(String(h.man)).toBe('—')
    expect(formText).toMatch(/Man:\s*—/)
    expect(String(h.machineRunStatus)).toBe('—')
    expect(formText).toMatch(/หยุด \/ เดิน:\s*—/)

    await page.screenshot({
      path: 'test-results/pm-vibration-phase1-uat-negative.png',
      fullPage: true,
    })
  })
})
