import { describe, expect, it } from 'vitest'
import { resolveNavShellLayout } from '@/lib/nav-shell-layout'

describe('resolveNavShellLayout', () => {
  it('sidebar mode — desktop sidebar + mobile drawer', () => {
    expect(resolveNavShellLayout('sidebar')).toEqual({
      showDesktopSidebar: true,
      showHeaderNav: false,
      mobileDrawerOnly: true,
    })
  })

  it('hamburger mode — same desktop sidebar as sidebar mode', () => {
    expect(resolveNavShellLayout('hamburger')).toEqual({
      showDesktopSidebar: true,
      showHeaderNav: false,
      mobileDrawerOnly: true,
    })
  })

  it('navbar mode — top nav only, no desktop sidebar', () => {
    expect(resolveNavShellLayout('navbar')).toEqual({
      showDesktopSidebar: false,
      showHeaderNav: true,
      mobileDrawerOnly: false,
    })
  })
})
