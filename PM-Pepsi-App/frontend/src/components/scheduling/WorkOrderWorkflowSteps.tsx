import type { z } from 'zod'
import type { workOrderWorkflowStepSchema } from '@/api/schemas'
import { cn } from '@/lib/utils'

type Step = z.infer<typeof workOrderWorkflowStepSchema>

type WorkOrderWorkflowStepsProps = {
  steps: Step[]
  suffix?: string
  className?: string
  compact?: boolean
}

/**
 * ขั้นตอน workflow ใบงาน (PM Plan → ช่าง → Worktime)
 */
export function WorkOrderWorkflowSteps({
  steps,
  suffix: _suffix,
  className,
  compact = false,
}: WorkOrderWorkflowStepsProps) {
  if (steps.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      <ol
        className={cn(
          'grid gap-2',
          compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {steps.map((s) => (
          <li
            key={s.key}
            className={cn(
              'flex items-center gap-2 rounded-button border px-2 py-2 text-xs',
              s.done
                ? 'app-tone-success-workflow border'
                : 'border-app bg-app-subtle text-app-muted',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-badge font-semibold',
                s.done ? 'app-tone-success-fill' : 'bg-app-muted text-app',
              )}
            >
              {s.step}
            </span>
            <span className="min-w-0 flex-1 leading-snug">{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
