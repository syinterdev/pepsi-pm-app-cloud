import { Badge } from '@/components/ui/badge'
import { WO_PM_PHASE_META, resolveWoPmPhase, type WoPmPhase } from '@/lib/wo-pm-phase'
import { cn } from '@/lib/utils'

type WoPmPhaseBadgeProps = {
  phase?: WoPmPhase
  syst?: string
  /** แสดง syst จาก SAP คู่กับ badge เช่น Confirm (TECO) */
  showSyst?: boolean
  className?: string
}

export function WoPmPhaseBadge({
  phase: phaseProp,
  syst,
  showSyst = false,
  className,
}: WoPmPhaseBadgeProps) {
  const phase = phaseProp ?? resolveWoPmPhase(syst)
  const meta = WO_PM_PHASE_META[phase]
  const systLabel = (syst ?? '').trim()

  return (
    <Badge
      variant="outline"
      title={meta.title}
      aria-label={`สถานะ PM: ${meta.title}`}
      className={cn('font-semibold ring-1', meta.className, className)}
    >
      {meta.label}
      {showSyst && systLabel ? (
        <span className="ml-1 font-mono text-badge font-normal opacity-90">({systLabel})</span>
      ) : null}
    </Badge>
  )
}

/** สถานะ WO CRTD / REL / Confirm — alias ตาม U0 checklist */
export { WoPmPhaseBadge as WoStatusBadge }

export function WoPmPhaseLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-card border border-app bg-app-subtle px-3 py-2 text-xs text-app',
        className,
      )}
    >
      <span className="font-medium text-app">Create / REL / Confirm:</span>
      {(['create', 'rel', 'confirm'] as const).map((p) => (
        <WoPmPhaseBadge key={p} phase={p} />
      ))}
    </div>
  )
}
