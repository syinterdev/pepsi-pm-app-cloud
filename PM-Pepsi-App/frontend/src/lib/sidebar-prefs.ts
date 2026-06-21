/** U4g.9 — local sidebar preferences (browser-only) */

export type SidebarDensity = 'comfortable' | 'compact'
export type SidebarWidth = 'narrow' | 'wide'

const PINNED_KEY = 'pm_sidebar_pinned'
const DENSITY_KEY = 'pm_sidebar_density'
const WIDTH_KEY = 'pm_sidebar_width'

export const SIDEBAR_PREFS_EVENT = 'pm-sidebar-prefs'

function dispatchChange(): void {
  try {
    window.dispatchEvent(new Event(SIDEBAR_PREFS_EVENT))
  } catch {
    /* ignore */
  }
}

export function readSidebarPinned(): boolean {
  try {
    return localStorage.getItem(PINNED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSidebarPinned(pinned: boolean): void {
  try {
    localStorage.setItem(PINNED_KEY, pinned ? '1' : '0')
    dispatchChange()
  } catch {
    /* ignore */
  }
}

export function readSidebarDensity(): SidebarDensity {
  try {
    return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

export function writeSidebarDensity(value: SidebarDensity): void {
  try {
    localStorage.setItem(DENSITY_KEY, value)
    dispatchChange()
  } catch {
    /* ignore */
  }
}

export function readSidebarWidth(): SidebarWidth {
  try {
    return localStorage.getItem(WIDTH_KEY) === 'wide' ? 'wide' : 'narrow'
  } catch {
    return 'narrow'
  }
}

export function writeSidebarWidth(value: SidebarWidth): void {
  try {
    localStorage.setItem(WIDTH_KEY, value)
    dispatchChange()
  } catch {
    /* ignore */
  }
}

export function subscribeSidebarPrefs(onChange: () => void): () => void {
  const handler = () => onChange()
  window.addEventListener(SIDEBAR_PREFS_EVENT, handler)
  return () => window.removeEventListener(SIDEBAR_PREFS_EVENT, handler)
}

/** Tailwind width classes for expanded / collapsed / mobile drawer */
export function sidebarWidthClasses(width: SidebarWidth): {
  expanded: string
  collapsed: string
  drawer: string
} {
  if (width === 'wide') {
    return {
      expanded: 'w-64',
      collapsed: 'w-[4.25rem]',
      drawer: 'w-[min(100vw,20rem)] max-w-[min(100vw,20rem)]',
    }
  }
  return {
    expanded: 'w-60',
    collapsed: 'w-[4.25rem]',
    drawer: 'w-[min(100vw,18rem)] max-w-[min(100vw,18rem)]',
  }
}
