import { cn } from '@/lib/utils'
import { Moon, Sun, Volume2, Wifi } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function MacosControlCenter({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (panelRef.current?.contains(t)) return
      onClose()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70]',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div
        ref={panelRef}
        className={cn(
          'macos-controlcenter fixed right-3 top-8 w-[280px] rounded-card border p-3 shadow-2xl',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
        )}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="macos-cc-tile col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold">Wi‑Fi</span>
              <Wifi className="size-4 opacity-80" aria-hidden />
            </div>
            <div className="mt-2 text-caption text-[var(--app-text-muted)]">Connected</div>
          </div>
          <div className="macos-cc-tile col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold">Sound</span>
              <Volume2 className="size-4 opacity-80" aria-hidden />
            </div>
            <div className="mt-2 h-2 rounded-full bg-black/10">
              <div className="h-2 w-[60%] rounded-full bg-[color-mix(in_srgb,var(--app-accent)_70%,transparent)]" />
            </div>
          </div>
          <div className="macos-cc-tile col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold">Light</span>
              <Sun className="size-4 opacity-80" aria-hidden />
            </div>
            <div className="mt-2 h-2 rounded-full bg-black/10">
              <div className="h-2 w-[52%] rounded-full bg-[color-mix(in_srgb,var(--sys-yellow-light)_70%,transparent)]" />
            </div>
          </div>
          <div className="macos-cc-tile col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold">Dark Mode</span>
              <Moon className="size-4 opacity-80" aria-hidden />
            </div>
            <div className="mt-2 text-caption text-[var(--app-text-muted)]">Use theme toggle</div>
          </div>
        </div>
        <div className="mt-2 text-badge text-[color-mix(in_srgb,var(--app-text)_60%,transparent)]">
          Prototype Control Center (admin)
        </div>
      </div>
    </div>
  )
}

