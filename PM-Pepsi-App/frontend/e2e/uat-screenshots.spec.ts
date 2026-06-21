import { expect, test } from '@playwright/test'
import { seedAdminSession } from './helpers/auth.js'
import { uatShot } from './helpers/screenshot-dir.js'
import { VIEWPORT_HD, VIEWPORT_TABLET } from './helpers/viewport.js'

const capture = process.env.CAPTURE_UAT_SCREENSHOTS === '1'

test.describe('UAT screenshots', () => {
  test.skip(!capture, 'Set CAPTURE_UAT_SCREENSHOTS=1 to write PNGs under docs/customer-requirements/screenshots/')

  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'en')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
    await seedAdminSession(request, page)
  })

  async function applyTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
    await page.evaluate((t) => {
      sessionStorage.setItem('pm_theme_preference', t)
      document.documentElement.classList.toggle('dark', t === 'dark')
    }, theme)
  }

  test('portal light + dark', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_HD)
    await page.goto('/portal', { waitUntil: 'networkidle' })
    await expect(page.getByRole('button', { name: /Open PM Maintenance/i })).toBeVisible({
      timeout: 20_000,
    })
    await applyTheme(page, 'light')
    await page.screenshot({ path: uatShot('u4f-portal', 'portal-light.png'), fullPage: true })
    await applyTheme(page, 'dark')
    await page.waitForTimeout(300)
    await page.screenshot({ path: uatShot('u4f-portal', 'portal-dark.png'), fullPage: true })
  })

  test('admin console + master hub', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_HD)
    await page.goto('/admin', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Admin Console/i })).toBeVisible({
      timeout: 20_000,
    })
    await page.screenshot({ path: uatShot('u4d-admin', 'admin-console-light.png'), fullPage: true })

    await page.goto('/admin/master', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Master Data center|ศูนย์ Master Data/i })).toBeVisible({
      timeout: 20_000,
    })
    await page.screenshot({ path: uatShot('u4d-admin', 'admin-master-hub-light.png'), fullPage: true })
  })

  test('sidebar expanded · rail · mobile drawer', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_HD)
    await page.addInitScript(() => {
      localStorage.setItem('pm_sidebar_pinned', '1')
    })
    await page.goto('/planning', { waitUntil: 'networkidle' })
    await expect(page.locator('.app-sidebar').first()).toBeVisible({ timeout: 20_000 })
    await page.screenshot({
      path: uatShot('u4g-10', 'u4g-sidebar-light-expanded.png'),
      fullPage: true,
    })

    await applyTheme(page, 'dark')
    await page.waitForTimeout(300)
    await page.screenshot({
      path: uatShot('u4g-10', 'u4g-sidebar-dark-expanded.png'),
      fullPage: true,
    })

    await applyTheme(page, 'light')
    await page.evaluate(() => {
      localStorage.setItem('pm_sidebar_pinned', '0')
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page.mouse.move(400, 400)
    await page.waitForTimeout(400)
    await page.screenshot({
      path: uatShot('u4g-10', 'u4g-sidebar-light-rail.png'),
      fullPage: true,
    })

    await page.setViewportSize(VIEWPORT_TABLET)
    await page.goto('/planning', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Open menu/i }).click()
    await expect(page.locator('#sidebar-mobile-drawer')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: uatShot('u4g-10', 'u4g-sidebar-light-drawer.png'),
      fullPage: true,
    })
  })
})
