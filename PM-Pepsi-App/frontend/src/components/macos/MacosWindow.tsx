import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Rnd } from 'react-rnd'

export function MacosWindow({
  title,
  children,
  defaultSize,
}: {
  title: string
  children: ReactNode
  defaultSize?: { width: number; height: number; x: number; y: number }
}) {
  const initial = defaultSize ?? { width: 1180, height: 760, x: 120, y: 72 }

  return (
    <motion.div
      className="macos-window-root fixed inset-0 z-[50] pointer-events-none"
      initial={{ opacity: 0, scale: 0.985, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Rnd
        default={initial}
        minWidth={720}
        minHeight={520}
        bounds="window"
        dragHandleClassName="macos-window-titlebar"
        className="pointer-events-auto"
      >
        <div className="macos-window h-full w-full overflow-hidden rounded-card border">
          <div className="macos-window-titlebar flex h-10 items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className={cn('macos-traffic', 'is-close')} aria-hidden />
              <span className={cn('macos-traffic', 'is-min')} aria-hidden />
              <span className={cn('macos-traffic', 'is-zoom')} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 px-3 text-center text-body-sm font-semibold text-[color-mix(in_srgb,var(--app-text)_78%,transparent)]">
              <span className="truncate">{title}</span>
            </div>
            <div className="w-[68px]" aria-hidden />
          </div>
          <div className="macos-window-content h-[calc(100%-40px)] overflow-auto">{children}</div>
        </div>
      </Rnd>
    </motion.div>
  )
}

