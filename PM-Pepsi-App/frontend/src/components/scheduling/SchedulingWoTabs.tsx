import { TabsList } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** WO modal tab motion — keep ≤200ms per PRE-UAT U4c */
export const WO_TAB_MOTION_MS = 0.15

type IndicatorState = { left: number; width: number }

type SchedulingWoTabsListProps = {
  activeValue: string
  className?: string
  children: ReactNode
}

export function SchedulingWoTabsList({
  activeValue,
  className,
  children,
}: SchedulingWoTabsListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<IndicatorState>({ left: 0, width: 0 })
  const reduceMotion = useReducedMotion()

  const syncIndicator = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>('[data-state="active"]')
    if (!active) {
      setIndicator({ left: 0, width: 0 })
      return
    }
    const listRect = list.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    setIndicator({
      left: activeRect.left - listRect.left + list.scrollLeft,
      width: activeRect.width,
    })
  }, [])

  useLayoutEffect(() => {
    syncIndicator()
  }, [activeValue, children, syncIndicator])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const onChange = () => syncIndicator()
    list.addEventListener('scroll', onChange, { passive: true })
    const ro = new ResizeObserver(onChange)
    ro.observe(list)
    window.addEventListener('resize', onChange)
    return () => {
      list.removeEventListener('scroll', onChange)
      ro.disconnect()
      window.removeEventListener('resize', onChange)
    }
  }, [syncIndicator, activeValue])

  return (
    <TabsList
      ref={listRef}
      className={cn(
        'scheduling-wo-tabs relative flex h-auto w-full max-w-full flex-nowrap justify-start gap-0 overflow-x-auto overscroll-x-contain rounded-xl border border-app/60 bg-app-subtle/50 p-1 [-webkit-overflow-scrolling:touch]',
        className,
      )}
    >
      {indicator.width > 0 ? (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute bottom-1 z-0 h-0.5 rounded-full bg-[var(--app-accent)] motion-reduce:transition-none',
            reduceMotion ? '' : 'transition-[left,width] duration-150 ease-out',
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
      ) : null}
      {children}
    </TabsList>
  )
}

export const woTabTriggerClass =
  'scheduling-wo-tabs__trigger relative z-[1] shrink-0 rounded-lg border-0 bg-transparent px-3 py-2 text-body-sm shadow-none data-[state=active]:bg-[color-mix(in_srgb,var(--app-accent)_10%,transparent)] data-[state=active]:text-[var(--app-accent)] data-[state=active]:shadow-none'

export function WoModalTabFade({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: WO_TAB_MOTION_MS, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  )
}
