import { expect, test } from '@playwright/test'
import { e2eCredentials, seedAdminSession } from './helpers/auth.js'

const hasCreds = e2eCredentials() != null

test.describe('Admin hub smoke', () => {
  test.skip(!hasCreds, 'Set E2E_USE_DEV_SEED=1 or E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'en')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
    await seedAdminSession(request, page)
  })

  test('console → roles → menu', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Admin Console/i })).toBeVisible({
      timeout: 25_000,
    })

    await page.goto('/admin/roles', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /Roles\s*&\s*permissions|บทบาท\s*&\s*สิทธิ์/i }),
    ).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText(/confirmation\.export\.all/i)).toBeVisible({ timeout: 15_000 })

    await page.goto('/admin/menu', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /^Menu$|^เมนู$/i })).toBeVisible({
      timeout: 25_000,
    })
  })
})
