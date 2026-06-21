import { expect, test } from '@playwright/test'
import {
  API_BASE,
  devTechnicianCredentials,
  e2eCredentials,
  seedAdminSession,
  seedWorkcenterSession,
} from './helpers/auth.js'

const WO_PUBLISHED = process.env.PM_VIBRATION_UAT_WO ?? '4001567009'

function statusBanner(page: import('@playwright/test').Page) {
  return page.getByRole('status').filter({
    has: page.getByRole('heading', { name: 'สถานะการใช้งาน' }),
  })
}

test.describe('PM Vibration J — RBAC W vs supervisor read-only', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'th')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
  })

  test('W (technician) — can save when WO selected', async ({ page, request }) => {
    const tech = devTechnicianCredentials() ?? e2eCredentials()
    test.skip(!tech, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER')

    await seedWorkcenterSession(request, page, tech!)
    await page.goto(`/pm-vibration?wkorder=${WO_PUBLISHED}`, { waitUntil: 'networkidle' })

    const banner = statusBanner(page)
    await expect(banner).toBeVisible({ timeout: 30_000 })
    await expect(banner.getByText(/มีสิทธิบันทึก/)).toBeVisible()

    const saveCurrent = page.getByRole('button', { name: 'บันทึกค่ากระแส 3 เฟส' })
    await expect(saveCurrent).toBeEnabled()

    await page.screenshot({ path: 'test-results/pm-vibration-rbac-technician-write.png', fullPage: true })
  })

  test('Supervisor (read-only) — inputs disabled, no upload', async ({ page, request }) => {
    const creds = e2eCredentials()
    test.skip(!creds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER')

    await seedWorkcenterSession(request, page, creds!, { override: 'supervisor-readonly' })
    await page.goto(`/pm-vibration?wkorder=${WO_PUBLISHED}`, { waitUntil: 'networkidle' })

    const banner = statusBanner(page)
    await expect(banner).toBeVisible({ timeout: 30_000 })
    await expect(banner.getByText(/ดูอย่างเดียว/)).toBeVisible()

    const saveCurrent = page.getByRole('button', { name: 'บันทึกค่ากระแส 3 เฟส' })
    await expect(saveCurrent).toBeDisabled()

    await page.getByText('ทางเลือก — นำเข้า Excel').click()
    await expect(page.getByRole('button', { name: 'อัปโหลด Excel' })).toHaveCount(0)

    await page.screenshot({ path: 'test-results/pm-vibration-rbac-supervisor-readonly.png', fullPage: true })
  })
})

test.describe('PM Vibration J — API permission probe', () => {
  test('technician session has confirmation.write from login API', async ({ request }) => {
    const tech = devTechnicianCredentials() ?? e2eCredentials()
    test.skip(!tech, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER')

    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { username: tech!.username, password: tech!.password, mode: 'workcenter' },
    })
    expect(loginRes.ok()).toBeTruthy()
    const body = (await loginRes.json()) as { user?: { permissions?: string[]; userst?: string } }
    const perms = body.user?.permissions ?? []
    const canWrite =
      perms.includes('confirmation.write') ||
      body.user?.userst === 'W' ||
      body.user?.userst === 'A'
    expect(canWrite).toBeTruthy()
  })
})
