import { expect, test } from '@playwright/test'
import { e2eCredentials, seedAdminSession } from './helpers/auth.js'
import { HOT_PATH_PAGES } from './helpers/hot-path-pages.js'
import { expectLocaleText, switchTopbarLocale } from './helpers/locale-switch.js'
import { expectNoHorizontalPageOverflow, VIEWPORT_HD } from './helpers/viewport.js'

const hasCreds = e2eCredentials() != null

test.describe('U4e shell — language EN/TH on hot path pages', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page, request }) => {
    await page.setViewportSize(VIEWPORT_HD)
    await page.addInitScript(() => {
      localStorage.setItem('pm_seen_admin_tour', '1')
      localStorage.setItem('pm-app.locale', 'en')
    })
    await seedAdminSession(request, page)
  })

  for (const row of HOT_PATH_PAGES) {
    test(`${row.id} ${row.path} — EN → TH without layout break`, async ({ page }) => {
      test.skip(!row.localeText, 'No locale probe')

      await page.goto(row.path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: row.heading }).first()).toBeVisible({
        timeout: 25_000,
      })

      await expectLocaleText(page, row.localeText!.en)
      await switchTopbarLocale(page, 'th')
      await expectLocaleText(page, row.localeText!.th)
      await expectNoHorizontalPageOverflow(page, `${row.id}-th`)
    })
  }

  test('sidebar nav label updates with locale', async ({ page }) => {
    await page.goto('/planning', { waitUntil: 'domcontentloaded' })
    const settingsLink = page.locator('nav a[href="/settings"]').first()
    await expect(settingsLink).toContainText('Settings')
    await switchTopbarLocale(page, 'th')
    await expect(settingsLink).toContainText('ตั้งค่า')
  })
})
