import { expect, type Locator, type Page } from '@playwright/test'
import { ADMIN_TOUR_STEP_COUNT } from '../../src/components/admin/admin-tour-steps'

export { ADMIN_TOUR_STEP_COUNT }

/** Custom Joyride tooltip (AdminTourTooltip) */
export function adminTourTooltip(page: Page): Locator {
  return page.locator('.admin-tour-tooltip')
}

export function adminTourFooter(page: Page): Locator {
  return adminTourTooltip(page).locator('.admin-tour-tooltip__footer')
}

export class AdminTourPage {
  constructor(readonly page: Page) {}

  async openFromConsole() {
    const startBtn = this.page.getByRole('button', {
      name: /เริ่มทัวร์แนะนำ Admin/i,
    })
    await startBtn.scrollIntoViewIfNeeded()
    await startBtn.click()
    await expect(adminTourTooltip(this.page)).toBeVisible({ timeout: 15_000 })
  }

  async expectProgress(current: number, total = ADMIN_TOUR_STEP_COUNT) {
    await expect(adminTourTooltip(this.page).locator('.admin-tour-tooltip__step-pill')).toHaveText(
      `${current} / ${total}`,
    )
  }

  skipButton() {
    return adminTourTooltip(this.page).getByRole('button', { name: /ข้าม|Skip/i })
  }

  nextButton() {
    return adminTourTooltip(this.page).locator('button.admin-tour-btn--primary')
  }

  finishButton() {
    return adminTourTooltip(this.page).getByRole('button', { name: /เสร็จสิ้น|Last/i })
  }

  async skipTour() {
    await this.skipButton().click()
    await expect(adminTourTooltip(this.page)).toHaveCount(0, { timeout: 10_000 })
  }

  async advanceToFinish(maxClicks = ADMIN_TOUR_STEP_COUNT + 2) {
    let clicks = 0
    while (clicks < maxClicks) {
      const finish = this.finishButton()
      if (await finish.isVisible()) {
        await finish.click()
        return clicks
      }
      await this.nextButton().click()
      clicks += 1
      await this.page.waitForTimeout(400)
    }
    throw new Error(`Tour did not reach finish within ${maxClicks} clicks`)
  }
}
