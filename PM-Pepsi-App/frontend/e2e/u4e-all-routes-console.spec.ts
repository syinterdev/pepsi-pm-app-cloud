import { expect, test } from '@playwright/test'

import { ALL_APP_ROUTES } from './helpers/all-app-routes.js'

import {

  attachConsoleCollector,

  formatConsoleIssues,

} from './helpers/console-errors.js'

import { e2eCredentials, seedAdminSession } from './helpers/auth.js'



const hasCreds = e2eCredentials() != null



const CRASH_HEADING = /Try again|ลองแสดงผลอีกครั้ง|Something went wrong while rendering/i



for (const locale of ['en', 'th'] as const) {

  test.describe(`U4e — all routes (${locale}) — no page crash / console errors`, () => {

    test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')



    test.beforeEach(async ({ page, request }) => {

      await page.addInitScript((loc) => {

        localStorage.setItem('pm_seen_admin_tour', '1')

        localStorage.setItem('pm-app.locale', loc)

      }, locale)

      await seedAdminSession(request, page)

    })



    for (const row of ALL_APP_ROUTES) {

      test(`${row.label} ${row.path}`, async ({ page }) => {

        const issues = attachConsoleCollector(page)

        await page.goto(row.path, { waitUntil: 'domcontentloaded' })

        await page.waitForTimeout(2000)



        const crashVisible = await page

          .getByRole('button', { name: CRASH_HEADING })

          .isVisible()

          .catch(() => false)

        expect(crashVisible, `AppErrorBoundary visible on ${row.path}`).toBe(false)



        await expect(
          page.locator('main, [role="main"], .engineering-board').first(),
        ).toBeVisible({ timeout: 25_000 })



        expect(issues, formatConsoleIssues(`${row.path} (${locale})`, issues)).toEqual([])

      })

    }

  })

}


