import { expect, type Page } from '@playwright/test'

export type AppLocale = 'en' | 'th'

const LOCALE_OPTION: Record<AppLocale, RegExp> = {
  en: /^English$/i,
  th: /^(ไทย|Thai)$/i,
}

/** สลับภาษาผ่าน globe ใน topbar (icon popover) */
export async function switchTopbarLocale(page: Page, locale: AppLocale) {
  const stored = await page.evaluate(() => localStorage.getItem('pm-app.locale'))
  if (stored === locale) return

  await page.getByRole('button', { name: /Switch language|สลับภาษา/i }).click()
  const panel = page.locator('.macos-popover-glass').filter({
    has: page.getByRole('button', { name: /^English$|^(ไทย|Thai)$/i }),
  })
  await expect(panel).toBeVisible({ timeout: 10_000 })
  await panel.getByRole('button', { name: LOCALE_OPTION[locale] }).click()
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('pm-app.locale')))
    .toBe(locale)
}

export async function expectLocaleText(page: Page, text: string) {
  await expect(page.locator('main').getByText(text, { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  })
}
