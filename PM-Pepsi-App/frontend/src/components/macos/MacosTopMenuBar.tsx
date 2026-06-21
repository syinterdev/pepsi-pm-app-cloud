import { cn } from '@/lib/utils'
import { BatteryFull, SlidersHorizontal, Wifi } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export function MacosTopMenuBar({
  appName,
  onToggleControlCenter,
  controlCenterOpen,
}: {
  appName: string
  onToggleControlCenter: () => void
  controlCenterOpen: boolean
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const timeText = useMemo(() => {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [now])

  return (
    <div className="macos-topmenubar fixed inset-x-0 top-0 z-[60] h-6">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-3 text-body-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="macos-apple-mark select-none text-[13px]" aria-hidden>
            
          </span>
          <span className="truncate font-semibold">{appName}</span>
          <div className="hidden items-center gap-3 font-medium text-[color-mix(in_srgb,var(--app-text)_82%,transparent)] md:flex">
            <button type="button" className="macos-menubar-item">
              File
            </button>
            <button type="button" className="macos-menubar-item">
              Edit
            </button>
            <button type="button" className="macos-menubar-item">
              View
            </button>
            <button type="button" className="macos-menubar-item">
              Window
            </button>
            <button type="button" className="macos-menubar-item">
              Help
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[color-mix(in_srgb,var(--app-text)_86%,transparent)]">
          <Wifi className="size-[14px]" aria-hidden />
          <BatteryFull className="size-[14px]" aria-hidden />
          <span className="tabular-nums">{timeText}</span>
          <button
            type="button"
            className={cn('macos-menubar-cc', controlCenterOpen && 'is-open')}
            onClick={onToggleControlCenter}
            aria-label="Control Center"
            aria-pressed={controlCenterOpen}
          >
            <SlidersHorizontal className="size-[14px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

