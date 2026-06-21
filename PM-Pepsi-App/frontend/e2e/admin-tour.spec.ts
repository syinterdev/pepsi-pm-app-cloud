import { expect, test } from '@playwright/test'
import {
  ADMIN_TOUR_STEP_COUNT,
  AdminTourPage,
  adminTourTooltip,
} from './helpers/admin-tour'
import { e2eCredentials, seedAdminSession } from './helpers/auth'

const hasCreds = e2eCredentials() != null

test.describe('Admin tour E2E', () => {
  test.skip(!hasCreds, 'Requires E2E_ADMIN_USER and E2E_ADMIN_PASSWORD (admin workcenter login)')

  test.beforeEach(async ({ page, request }) => {
    await seedAdminSession(request, page)
  })

  test('UI: custom tooltip, progress pill, skip marks seen', async ({ page, request }) => {
    await seedAdminSession(request, page, { clearTourSeen: true })
    const tour = new AdminTourPage(page)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'ศูนย์ผู้ดูแลระบบ' })).toBeVisible({
      timeout: 15_000,
    })

    await tour.openFromConsole()
    await tour.expectProgress(1)
    await expect(adminTourTooltip(page).locator('.admin-tour-tooltip__title')).toContainText(
      /Command palette/i,
    )
    await expect(page.locator('.admin-tour-tooltip__progress-fill')).toBeVisible()

    await tour.skipTour()
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('pm_seen_admin_tour')))
      .toBe('1')
  })

  test('navigation: two next clicks land on Users with spotlight', async ({ page }) => {
    const tour = new AdminTourPage(page)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'ศูนย์ผู้ดูแลระบบ' })).toBeVisible({
      timeout: 15_000,
    })
    await tour.openFromConsole()

    await tour.nextButton().click()
    await tour.expectProgress(2)
    await tour.nextButton().click()

    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15_000 })
    await expect(page.locator('[data-tour="admin-users"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: /ผู้ใช้งาน/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(adminTourTooltip(page).locator('.admin-tour-tooltip__title')).toContainText(
      /ผู้ใช้/i,
    )
  })

  test('tour advances multiple steps then skip completes', async ({ page }) => {
    const tour = new AdminTourPage(page)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'ศูนย์ผู้ดูแลระบบ' })).toBeVisible({
      timeout: 15_000,
    })
    await tour.openFromConsole()

    await tour.nextButton().click()
    await tour.expectProgress(2)
    await tour.nextButton().click()
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 20_000 })

    await tour.skipTour()
    await expect(adminTourTooltip(page)).toHaveCount(0, { timeout: 10_000 })
    expect(ADMIN_TOUR_STEP_COUNT).toBeGreaterThan(3)
  })
})
