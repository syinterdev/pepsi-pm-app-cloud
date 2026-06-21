import { cn } from '@/lib/utils'
import { useReducedMotion } from 'framer-motion'
import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'

/** Sidebar active pill — ≤200ms per PRE-UAT U4g.3 / U4c */
export const SIDEBAR_NAV_INDICATOR_MS = 150

type IndicatorState = { top: number; left: number; width: number; height: number }

export function SidebarNavIndicator({
  navRef,
  enabled,
  syncKey,
}: {
  navRef: RefObject<HTMLElement | null>
  enabled: boolean
  /** pathname or key that changes when active item moves */
  syncKey?: string
}) {
  const [indicator, setIndicator] = useState<IndicatorState>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  })
  const reduceMotion = useReducedMotion()

  const sync = useCallback(() => {
    const nav = navRef.current
    if (!nav || !enabled) {
      setIndicator({ top: 0, left: 0, width: 0, height: 0 })
      return
    }
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]')
    if (!active) {
      setIndicator({ top: 0, left: 0, width: 0, height: 0 })
      return
    }
    const navRect = nav.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    setIndicator({
      top: activeRect.top - navRect.top + nav.scrollTop,
      left: activeRect.left - navRect.left + nav.scrollLeft,
      width: activeRect.width,
      height: activeRect.height,
    })
  }, [enabled, navRef])

  useLayoutEffect(() => {
    sync()
  }, [sync, syncKey])

  useLayoutEffect(() => {
    if (!enabled) return
    const nav = navRef.current
    if (!nav) return
    const onChange = () => sync()
    nav.addEventListener('scroll', onChange, { passive: true })
    const ro = new ResizeObserver(onChange)
    ro.observe(nav)
    const mo = new MutationObserver(onChange)
    mo.observe(nav, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-current', 'class'],
    })
    window.addEventListener('resize', onChange)
    return () => {
      nav.removeEventListener('scroll', onChange)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', onChange)
    }
  }, [enabled, navRef, sync, syncKey])

  if (!enabled || indicator.height <= 0) return null

  return (
    <span
      aria-hidden
      className={cn(
        'sidebar-nav-indicator pointer-events-none absolute z-0 motion-reduce:transition-none',
        !reduceMotion && 'transition-[top,left,width,height] duration-150 ease-out',
      )}
      style={{
        top: indicator.top,
        left: indicator.left,
        width: indicator.width,
        height: indicator.height,
      }}
    />
  )
}
