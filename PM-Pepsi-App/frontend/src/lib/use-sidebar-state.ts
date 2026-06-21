import {
  readSidebarPinned,
  subscribeSidebarPrefs,
  writeSidebarPinned,
} from '@/lib/sidebar-prefs'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

const HOVER_EXPAND_DELAY_MS = 50

export type UseSidebarStateOptions = {
  /** Instant width change + no hover delay (prefers-reduced-motion / useReducedMotion) */
  reduceMotion?: boolean
}

/** Desktop: ยุบไอคอน · hover ขยาย · ปักหมุดค้างขยาย */
export function useSidebarState(options: UseSidebarStateOptions = {}) {
  const { reduceMotion = false } = options
  const pinned = useSyncExternalStore(subscribeSidebarPrefs, readSidebarPinned, () => false)
  const [hovered, setHoveredState] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearHoverTimer(), [clearHoverTimer])

  const setPinned = useCallback((value: boolean) => {
    writeSidebarPinned(value)
  }, [])

  const togglePinned = useCallback(() => {
    setPinned(!pinned)
  }, [pinned, setPinned])

  const setHovered = useCallback(
    (value: boolean) => {
      clearHoverTimer()
      if (reduceMotion) {
        setHoveredState(value)
        return
      }
      if (value) {
        hoverTimerRef.current = setTimeout(() => {
          hoverTimerRef.current = null
          setHoveredState(true)
        }, HOVER_EXPAND_DELAY_MS)
      } else {
        setHoveredState(false)
      }
    },
    [clearHoverTimer, reduceMotion],
  )

  const desktopExpanded = pinned || hovered

  return {
    pinned,
    setPinned,
    togglePinned,
    hovered,
    setHovered,
    desktopExpanded,
    mobileOpen,
    setMobileOpen,
  }
}
