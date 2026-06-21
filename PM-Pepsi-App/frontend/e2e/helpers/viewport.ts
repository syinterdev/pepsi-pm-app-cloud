import { expect, type Page } from '@playwright/test'

export const VIEWPORT_HD = { width: 1280, height: 720 } as const
export const VIEWPORT_FHD = { width: 1920, height: 1080 } as const
/** iPad portrait — tablet touch spot-check */
export const VIEWPORT_TABLET = { width: 768, height: 1024 } as const

/** ไม่มี horizontal overflow ทั้งหน้า (tolerance เล็กน้อยสำหรับ sub-pixel) */
export async function expectNoHorizontalPageOverflow(page: Page, label: string) {
  const extra = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })
  expect(extra, `${label}: document horizontal overflow`).toBeLessThanOrEqual(4)
}

export async function expectMainShellVisible(page: Page) {
  await expect(page.locator('main.app-shell-main').first()).toBeVisible()
}

/** ตารางใน `.app-table-shell` scroll ได้ — หรือ `main` scroll เมื่อ empty state */
export async function expectTableAreaScrollable(page: Page, label: string) {
  const shell = page.locator('.app-table-shell').first()
  if (await shell.isVisible().catch(() => false)) {
    const canScroll = await shell.evaluate((el) => {
      const s = getComputedStyle(el)
      return /auto|scroll/.test(`${s.overflow} ${s.overflowX} ${s.overflowY}`)
    })
    expect(canScroll, `${label}: table shell scroll`).toBe(true)
    return
  }
  const main = page.locator('main.app-shell-main').first()
  const mainScroll = await main.evaluate((el) => {
    const s = getComputedStyle(el)
    return /auto|scroll/.test(`${s.overflow} ${s.overflowY}`)
  })
  expect(mainScroll, `${label}: main scroll (empty table state)`).toBe(true)
}
