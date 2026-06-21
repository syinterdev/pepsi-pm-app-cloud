import { expect, test } from '@playwright/test'
import { e2eCredentials, seedAdminSession } from './helpers/auth'

const hasCreds = e2eCredentials() != null

test.describe('Public UI smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /เข้าสู่ระบบ|Sign in/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.locator('#login-username')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
  })

  test('unauthenticated / redirects to login', async ({ page }) => {
    await page.goto('/work-orders')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })
})

test.describe('Authenticated UI smoke', () => {
  test.skip(!hasCreds, 'Set E2E_ADMIN_USER + E2E_ADMIN_PASSWORD (see e2e/.env.example)')

  test.beforeEach(async ({ page, request }) => {
    await seedAdminSession(request, page)
  })

  test('home dashboard loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 20_000 })
  })

  test('work orders page loads table shell', async ({ page }) => {
    await page.goto('/work-orders')
    await expect(page.getByRole('heading', { name: /ใบงาน|Work order/i })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('confirmation page loads', async ({ page }) => {
    await page.goto('/confirmation')
    await expect(page.getByRole('heading', { name: /Confirmation|รับรอง/i })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings')
    await expect(
      page.getByRole('heading', { name: /ตั้งค่า|Settings/i, level: 1 }),
    ).toBeVisible({
      timeout: 20_000,
    })
  })

  test('navbar shows English role label when locale is en', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'en')
    })
    await page.goto('/')
    await expect(page.locator('.app-topbar-user').getByText('Administrator')).toBeVisible({
      timeout: 20_000,
    })
  })

  test('admin roles matrix loads', async ({ page }) => {
    await page.goto('/admin/roles')
    await expect(
      page.getByRole('heading', { name: /บทบาท\s*&\s*สิทธิ์|Roles\s*&\s*permissions/i }),
    ).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByText(/confirmation\.export\.all/i)).toBeVisible({ timeout: 15_000 })
  })
})
