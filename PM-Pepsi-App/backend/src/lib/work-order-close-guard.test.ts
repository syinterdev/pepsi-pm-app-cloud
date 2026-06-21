import { describe, expect, it } from 'vitest'
import { workOrderCloseGuardMessage } from './work-order-close-guard.js'

describe('workOrderCloseGuardMessage', () => {
  it('requires comment and after-PM image only', () => {
    expect(
      workOrderCloseGuardMessage({ commentCount: 0, imageBefore: 0, imageAfter: 1 }),
    ).toMatch(/รายละเอียด/)
    expect(
      workOrderCloseGuardMessage({ commentCount: 1, imageBefore: 0, imageAfter: 0 }),
    ).toMatch(/รูปหลังทำ PM/)
    expect(
      workOrderCloseGuardMessage({ commentCount: 1, imageBefore: 3, imageAfter: 1 }),
    ).toBeNull()
  })
})
