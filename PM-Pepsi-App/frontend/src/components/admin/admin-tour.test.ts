import { clearAdminTourSeen, hasSeenAdminTour, markAdminTourSeen } from '@/lib/admin-tour-pref'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_TOUR_STEP_COUNT,
  buildAdminTourSteps,
  TOUR_PAGE_SECTIONS,
} from './admin-tour-steps'
import { restartAdminTour, shouldAutoStartAdminTour } from './AdminTour'

function stubWebStorage() {
  const local = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => local.get(k) ?? null,
    setItem: (k: string, v: string) => {
      local.set(k, v)
    },
    removeItem: (k: string) => {
      local.delete(k)
    },
  })
  vi.stubGlobal('sessionStorage', {
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
}

describe('AdminTour helpers', () => {
  beforeEach(() => {
    stubWebStorage()
    clearAdminTourSeen()
  })

  it('shouldAutoStartAdminTour when admin path and not seen', () => {
    expect(shouldAutoStartAdminTour('/admin', true)).toBe(true)
    expect(shouldAutoStartAdminTour('/admin/users', true)).toBe(true)
  })

  it('should not auto-start without permission or outside /admin', () => {
    expect(shouldAutoStartAdminTour('/admin', false)).toBe(false)
    expect(shouldAutoStartAdminTour('/planning', true)).toBe(false)
  })

  it('should not auto-start after tour seen', () => {
    markAdminTourSeen()
    expect(hasSeenAdminTour()).toBe(true)
    expect(shouldAutoStartAdminTour('/admin', true)).toBe(false)
  })

  it('expects Joyride steps = command hint + console + sub-pages', async () => {
    expect(ADMIN_TOUR_STEP_COUNT).toBe(2 + TOUR_PAGE_SECTIONS.length)
    const { i18n } = await import('@/i18n')
    expect(buildAdminTourSteps(i18n.getFixedT('en', 'admin'))).toHaveLength(ADMIN_TOUR_STEP_COUNT)
  })

  it('restartAdminTour clears seen flag and runs callback', () => {
    markAdminTourSeen()
    let ran = false
    restartAdminTour(() => {
      ran = true
    })
    expect(ran).toBe(true)
    expect(hasSeenAdminTour()).toBe(false)
  })
})
