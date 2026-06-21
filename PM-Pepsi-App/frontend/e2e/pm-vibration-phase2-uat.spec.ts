import { expect, test } from '@playwright/test'
import { API_BASE, apiLogin, seedAdminSession } from './helpers/auth.js'

const WO_PUBLISHED = process.env.PM_VIBRATION_UAT_WO ?? '4001567009'
const WO_NO_TASKLIST = process.env.PM_VIBRATION_UAT_WO_NO_TASK ?? '4000126314'
const WO_NO_MNTPLAN = process.env.PM_VIBRATION_UAT_WO_NO_MNTPLAN ?? '4000126416'

async function fetchModalDetail(
  request: import('@playwright/test').APIRequestContext,
  wkorder: string,
) {
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
    dataReadiness?: {
      mntplan: string
      tasklistPublished: boolean
      taskCount: number
      currentTaskCount: number
      vibrationTaskCount: number
      readingCount: number
    }
  }
}

function statusBanner(page: import('@playwright/test').Page) {
  return page.getByRole('status').filter({
    has: page.getByRole('heading', { name: 'สถานะการใช้งาน' }),
  })
}

test.describe('PM Vibration Phase 2 UAT — data readiness banner', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'th')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
    await seedAdminSession(request, page)
  })

  test('A — WO without mntplan shows warning + IW37N link', async ({ page, request }) => {
    const modal = await fetchModalDetail(request, WO_NO_MNTPLAN)
    expect(modal.dataReadiness?.mntplan.trim()).toBe('')

    await page.goto(`/pm-vibration?wkorder=${WO_NO_MNTPLAN}`, { waitUntil: 'networkidle' })

    const banner = statusBanner(page)
    await expect(banner).toBeVisible({ timeout: 30_000 })
    await expect(banner).toHaveClass(/app-tone-warning-callout/)
    await expect(banner.getByText(/ไม่มี Maintenance Plan/)).toBeVisible()
    await expect(banner.getByRole('link', { name: 'ไป IW37N' })).toHaveAttribute(
      'href',
      `/iw37n?q=${WO_NO_MNTPLAN}`,
    )

    await page.screenshot({ path: 'test-results/pm-vibration-phase2-uat-no-mntplan.png', fullPage: true })
  })

  test('B — WO with mntplan but no tasklist shows publish MP link', async ({ page, request }) => {
    const modal = await fetchModalDetail(request, WO_NO_TASKLIST)
    expect(modal.dataReadiness?.mntplan).toBe('346012')
    expect(modal.dataReadiness?.tasklistPublished).toBe(false)

    await page.goto(`/pm-vibration?wkorder=${WO_NO_TASKLIST}`, { waitUntil: 'networkidle' })

    const banner = statusBanner(page)
    await expect(banner).toBeVisible({ timeout: 30_000 })
    await expect(banner).toHaveClass(/app-tone-warning-callout/)
    await expect(banner.getByText(/Maintenance Plan: 346012/)).toBeVisible()
    await expect(banner.getByText(/ยังไม่มี Task List สำหรับ mntplan 346012/)).toBeVisible()
    await expect(banner.getByRole('link', { name: 'ไป Publish Master Plan' })).toHaveAttribute(
      'href',
      '/master-plan',
    )

    await page.screenshot({ path: 'test-results/pm-vibration-phase2-uat-no-tasklist.png', fullPage: true })
  })

  test('C — WO with published tasklist shows success readiness (no warning banner)', async ({
    page,
    request,
  }) => {
    const modal = await fetchModalDetail(request, WO_PUBLISHED)
    expect(modal.dataReadiness?.tasklistPublished).toBe(true)
    expect(modal.dataReadiness?.taskCount).toBeGreaterThan(0)

    await page.goto(`/pm-vibration?wkorder=${WO_PUBLISHED}`, { waitUntil: 'networkidle' })

    const banner = statusBanner(page)
    await expect(banner).toBeVisible({ timeout: 30_000 })
    await expect(banner).not.toHaveClass(/app-tone-warning-callout/)
    await expect(banner.getByText(/610000004112/)).toBeVisible()
    await expect(banner.getByText(/Task List publish แล้ว \(20 รายการ\)/)).toBeVisible()
    await expect(banner.getByText(/Vibration 2/)).toBeVisible()
    await expect(banner.getByText(/ยังไม่มีค่าวัดที่บันทึก/)).toBeVisible()

    const successIcons = banner.locator('.app-tone-success-fill')
    expect(await successIcons.count()).toBeGreaterThanOrEqual(4)

    await page.screenshot({ path: 'test-results/pm-vibration-phase2-uat-ready.png', fullPage: true })
  })

  test('D — switching WO updates banner immediately', async ({ page, request }) => {
    await page.goto(`/pm-vibration?wkorder=${WO_PUBLISHED}`, { waitUntil: 'networkidle' })
    const banner = statusBanner(page)
    await expect(banner.getByText(/610000004112/)).toBeVisible({ timeout: 30_000 })

    await page.goto(`/pm-vibration?wkorder=${WO_NO_TASKLIST}`, { waitUntil: 'networkidle' })
    await expect(banner.getByText(/Maintenance Plan: 346012/)).toBeVisible({ timeout: 30_000 })
    await expect(banner.getByText(/ยังไม่มี Task List สำหรับ mntplan 346012/)).toBeVisible()
    await expect(banner.getByText(/610000004112/)).not.toBeVisible()

    await page.screenshot({ path: 'test-results/pm-vibration-phase2-uat-switch-wo.png', fullPage: true })
  })
})
