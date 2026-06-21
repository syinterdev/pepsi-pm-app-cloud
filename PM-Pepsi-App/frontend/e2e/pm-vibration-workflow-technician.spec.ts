import { expect, test } from '@playwright/test'
import { seedAdminSession } from './helpers/auth.js'

const WO_PUBLISHED = process.env.PM_VIBRATION_UAT_WO ?? '4001567009'

test.describe('PM Vibration L — technician manual workflow (no Excel)', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pm-app.locale', 'th')
      localStorage.setItem('pm_seen_admin_tour', '1')
    })
    await seedAdminSession(request, page)
  })

  test('manual flow — current paper + trend + vibration Dst/dB', async ({ page }) => {
    await page.goto(`/pm-vibration?wkorder=${WO_PUBLISHED}`, { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'วิธีใช้งานสำหรับช่าง (4 ขั้น)' })).toBeVisible({
      timeout: 30_000,
    })

    const paperRegion = page.getByRole('region', { name: /Work Order ตามเอกสาร SAP/i })
    await expect(paperRegion).toBeVisible()

    const currentInputs = paperRegion.locator('.sap-wo-print__measure-table input').first()
    await expect(currentInputs).toBeVisible()
    const allCurrent = paperRegion.locator('.sap-wo-print__measure-table tbody tr').first().locator('input')
    const count = await allCurrent.count()
    if (count >= 3) {
      await allCurrent.nth(0).fill('97.5')
      await allCurrent.nth(1).fill('97.6')
      await allCurrent.nth(2).fill('96.2')
    }

    await page.getByRole('button', { name: 'บันทึกค่ากระแส 3 เฟส' }).click()
    await expect(page.getByText(/บันทึกกระแส 3 เฟส.*กราฟอัปเดต/)).toBeVisible({ timeout: 15_000 })

    const currentTrend = page.getByRole('region', { name: 'กระแสไฟฟ้า 3 เฟส' })
    await expect(currentTrend).toBeVisible()
    const trendRow = currentTrend.locator('.sap-wo-print__measure-table tbody tr').first()
    const trendInputs = trendRow.locator('input')
    if ((await trendInputs.count()) >= 4) {
      await trendInputs.nth(1).fill('98')
      await trendInputs.nth(2).fill('97')
      await trendInputs.nth(3).fill('96')
    }
    await currentTrend.getByRole('button', { name: 'บันทึกตาราง → อัปเดตกราฟ' }).click()
    await expect(page.getByText(/บันทึก.*แถว.*กราฟอัปเดต/)).toBeVisible({ timeout: 15_000 })

    const vibTrend = page.getByRole('region', { name: 'Vibration — Dst / dB' })
    await expect(vibTrend).toBeVisible()
    const vibRow = vibTrend.locator('.sap-wo-print__measure-table tbody tr').first()
    const vibInputs = vibRow.locator('input')
    if ((await vibInputs.count()) >= 3) {
      await vibInputs.nth(1).fill('8')
      await vibInputs.nth(2).fill('45')
    }
    await vibTrend.getByRole('button', { name: 'บันทึกตาราง → อัปเดตกราฟ' }).click()
    await expect(page.getByText(/บันทึก.*แถว.*กราฟอัปเดต/)).toBeVisible({ timeout: 15_000 })

    await expect(vibTrend.getByText('ยังไม่มีค่าวัด — บันทึกครั้งแรกเพื่อเริ่มกราฟแนวโน้ม')).toHaveCount(0)

    await expect(page.getByText('ทางเลือก — นำเข้า Excel')).toBeVisible()
    const importDetails = page.locator('details').filter({ hasText: 'ทางเลือก — นำเข้า Excel' })
    await expect(importDetails).not.toHaveAttribute('open', '')

    await page.screenshot({
      path: 'test-results/pm-vibration-workflow-technician-manual.png',
      fullPage: true,
    })
  })
})
