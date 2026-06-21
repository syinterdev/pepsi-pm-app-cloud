import { expect, test } from '@playwright/test'
import { e2eCredentials } from './helpers/auth.js'

const hasCreds = e2eCredentials() != null
const creds = e2eCredentials()

test.describe('U4f — portal flow', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'en')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
  })

  test('login → portal PM card → PM app (role default)', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear()
    })
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#login-username')).toBeVisible({ timeout: 15_000 })

    await page.locator('#login-username').fill(creds!.username)
    await page.locator('#login-password').fill(creds!.password)
    await page.getByRole('button', { name: /Sign in|เข้าสู่ระบบ/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /Continue|ดำเนินการต่อ/i }).click()

    await expect(page).toHaveURL(/\/portal/, { timeout: 20_000 })
    await expect(page.getByRole('button', { name: /Open PM Maintenance/i })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('button', { name: /Open PM Maintenance/i }).click()
    await expect(page).not.toHaveURL(/\/portal/, { timeout: 20_000 })
    await expect(page.locator('main.app-shell-main, main').first()).toBeVisible({
      timeout: 20_000,
    })
    // Dev seed ADMIN01 (userst A) → home `/`
    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('seeded session — /portal shows modules', async ({ page, request }) => {
    const { seedAdminSession } = await import('./helpers/auth.js')
    await seedAdminSession(request, page)
    await page.goto('/portal', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('button', { name: /Open PM Maintenance/i })).toBeEnabled()
    const store = page.getByRole('button', { name: /Open Spare Parts Store/i })
    const repair = page.getByRole('button', { name: /Open Repair Request/i })
    await expect(store).toBeVisible()
    await expect(repair).toBeVisible()
    await expect(store).toBeDisabled()
    await expect(repair).toBeDisabled()
    await expect(page.getByText('Coming soon').first()).toBeVisible()
  })
})
