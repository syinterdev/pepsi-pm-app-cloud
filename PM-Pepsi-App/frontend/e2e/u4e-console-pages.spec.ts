import { expect, test } from '@playwright/test'
import {
  attachConsoleCollector,
  formatConsoleIssues,
} from './helpers/console-errors.js'
import { e2eCredentials, seedAdminSession } from './helpers/auth.js'
import { HOT_PATH_PAGES } from './helpers/hot-path-pages.js'

const hasCreds = e2eCredentials() != null

test.describe('U4e — no console errors (pages 1–7)', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm_seen_admin_tour', '1')
      localStorage.setItem('pm-app.locale', 'en')
    })
    await seedAdminSession(request, page)
  })

  for (const row of HOT_PATH_PAGES) {
    test(`${row.id} ${row.path} — no console errors`, async ({ page }) => {
      const issues = attachConsoleCollector(page)
      await page.goto(row.path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: row.heading }).first()).toBeVisible({
        timeout: 25_000,
      })
      await page.waitForTimeout(1500)
      expect(issues, formatConsoleIssues(row.path, issues)).toEqual([])
    })
  }

  test('2-work-orders-modal — WO detail dialog — no console errors', async ({ page }) => {
    const issues = attachConsoleCollector(page)
    await page.goto('/work-orders', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Work order|ใบงาน/i })).toBeVisible({
      timeout: 25_000,
    })

    const openWo = page.locator('tbody button').first()
    const hasRow = await openWo.isVisible().catch(() => false)
    if (!hasRow) {
      test.skip(true, 'No work order rows in DB — skip modal console check')
      return
    }

    await openWo.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1500)
    expect(issues, formatConsoleIssues('WO modal', issues)).toEqual([])
  })
})
