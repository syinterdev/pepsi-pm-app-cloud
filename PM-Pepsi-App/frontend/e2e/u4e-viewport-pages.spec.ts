import { expect, test } from '@playwright/test'
import { e2eCredentials, seedAdminSession } from './helpers/auth.js'
import { HOT_PATH_PAGES } from './helpers/hot-path-pages.js'
import {
  expectMainShellVisible,
  expectNoHorizontalPageOverflow,
  expectTableAreaScrollable,
  VIEWPORT_FHD,
  VIEWPORT_HD,
  VIEWPORT_TABLET,
} from './helpers/viewport.js'

const hasCreds = e2eCredentials() != null

async function seedPage(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
  await page.addInitScript(() => {
    localStorage.setItem('pm_seen_admin_tour', '1')
    localStorage.setItem('pm-app.locale', 'en')
  })
  await seedAdminSession(request, page)
}

test.describe('U4e viewport — 1280×720', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page, request }) => {
    await page.setViewportSize(VIEWPORT_HD)
    await seedPage(page, request)
  })

  test('desktop sidebar visible · mobile menu hidden', async ({ page }) => {
    await page.goto('/planning', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.app-sidebar').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /Open menu/i })).toBeHidden()
  })

  for (const row of HOT_PATH_PAGES) {
    test(`${row.id} ${row.path} — layout + table scroll`, async ({ page }) => {
      await page.goto(row.path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: row.heading }).first()).toBeVisible({
        timeout: 25_000,
      })
      await expectMainShellVisible(page)
      await expectNoHorizontalPageOverflow(page, row.id)
      if (row.tablePage) {
        await expectTableAreaScrollable(page, row.id)
      }
    })
  }
})

test.describe('U4e viewport — 1920×1080', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page, request }) => {
    await page.setViewportSize(VIEWPORT_FHD)
    await seedPage(page, request)
  })

  for (const row of HOT_PATH_PAGES) {
    test(`${row.id} ${row.path} — no layout overflow`, async ({ page }) => {
      await page.goto(row.path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: row.heading }).first()).toBeVisible({
        timeout: 25_000,
      })
      await expectMainShellVisible(page)
      await expectNoHorizontalPageOverflow(page, row.id)
      const mainWidth = await page.locator('main.app-shell-main').first().evaluate((el) => el.clientWidth)
      expect(mainWidth, `${row.id}: main content width`).toBeGreaterThan(900)
    })
  }
})

test.describe('U4e viewport — tablet 768×1024', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page, request }) => {
    await page.setViewportSize(VIEWPORT_TABLET)
    await seedPage(page, request)
  })

  test('mobile drawer opens from hamburger', async ({ page }) => {
    await page.goto('/planning', { waitUntil: 'domcontentloaded' })
    const menu = page.getByRole('button', { name: /Open menu/i })
    await expect(menu).toBeVisible({ timeout: 20_000 })
    await menu.click()
    await expect(page.locator('#sidebar-mobile-drawer')).toBeVisible({ timeout: 10_000 })
  })

  test('calendar renders FullCalendar grid', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Calendar|ปฏิทิน/i })).toBeVisible({
      timeout: 25_000,
    })
    await expect(page.locator('.fc').first()).toBeVisible({ timeout: 20_000 })
    await expectNoHorizontalPageOverflow(page, 'calendar')
  })

  test('work-orders modal opens (when rows exist)', async ({ page }) => {
    await page.goto('/work-orders', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Work order|ใบงาน/i })).toBeVisible({
      timeout: 25_000,
    })
    const openWo = page.locator('tbody button').first()
    const hasRow = await openWo.isVisible().catch(() => false)
    if (!hasRow) {
      test.skip(true, 'No work order rows in DB — skip modal viewport check')
      return
    }
    await openWo.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })
    const dialogBox = await page.getByRole('dialog').boundingBox()
    expect(dialogBox?.width ?? 0).toBeLessThanOrEqual(VIEWPORT_TABLET.width + 4)
  })

  for (const row of HOT_PATH_PAGES) {
    test(`${row.id} ${row.path} — fits tablet width`, async ({ page }) => {
      await page.goto(row.path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: row.heading }).first()).toBeVisible({
        timeout: 25_000,
      })
      await expectNoHorizontalPageOverflow(page, row.id)
    })
  }
})
