import type { NavShellMode } from '@/api/schemas'

/** Desktop/mobile chrome flags per nav.shell_mode (U4g.10 regression) */
export function resolveNavShellLayout(mode: NavShellMode) {
  return {
    showDesktopSidebar: mode === 'sidebar' || mode === 'hamburger',
    showHeaderNav: mode === 'navbar',
    mobileDrawerOnly: mode === 'hamburger' || mode === 'sidebar',
  }
}
