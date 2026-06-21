import { WoPmPhaseBadge } from '@/components/scheduling/WoPmPhaseBadge'
import {
  SchedulingPageSection,
  SchedulingSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  WORK_ORDER_TEAM_OPTIONS,
  type WorkOrderTeamCode,
} from '@/lib/wo-team'
import type { woPmPhaseSchema } from '@/api/schemas'
import type { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CalendarDays,
  ClipboardList,
  MapPin,
  Package,
  Users,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type WorkOrderSummaryData = {
  id: string
  wkorder: string
  opac: string
  mntplan: string
  orderType: string
  status: string
  systemStatus: string
  pmPhase: z.infer<typeof woPmPhaseSchema>
  workCenter: string
  resourcesLabel: string
  work: number
  actwork: number
  untime: string
  team: string
  equipment: string
  functLoc: string
  plannedDate: string
  finishDate: string
  mat: string
  description: string
  movePlan: {
    movedDate: string
    moveCount: number
    reasonName: string
    reasonCode: string
    movedByWkctr: string
  } | null
  canMovePlan: boolean
}

type Props = {
  order: WorkOrderSummaryData
  teamPending?: boolean
  canEditTeam?: boolean
  onTeamChange: (team: WorkOrderTeamCode) => void
  onMovePlan?: () => void
}

function DetailField({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <dt className="text-xs font-medium tracking-wide text-app-muted">{label}</dt>
      <dd className={cn('text-body-sm font-medium text-app', mono && 'font-mono tabular-nums')}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

const teamCodes = WORK_ORDER_TEAM_OPTIONS

export function WorkOrderSummaryPanel({
  order,
  teamPending = false,
  canEditTeam = true,
  onTeamChange,
  onMovePlan,
}: Props) {
  const { t } = useTranslation('scheduling')
  const reduceMotion = useReducedMotion()
  const statusLine =
    order.systemStatus && order.systemStatus !== order.status
      ? `${order.status} (${order.systemStatus})`
      : order.status

  return (
    <div className="space-y-4">
      <SchedulingPageSection index={0}>
        <motion.div
          layout={!reduceMotion}
          className="overflow-hidden rounded-card border border-[color-mix(in_srgb,var(--app-accent)_22%,var(--app-border))] bg-gradient-to-br from-[color-mix(in_srgb,var(--app-accent)_7%,var(--app-surface))] via-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_35%,var(--app-surface))] p-4 shadow-[var(--app-shadow-card)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">
                {t('woSummary.wkorderLabel')}
              </p>
              <p className="font-mono text-2xl font-bold tracking-tight text-app">{order.wkorder}</p>
              {order.opac ? (
                <p className="text-xs text-app-muted">
                  {t('woSummary.opac')}{' '}
                  <span className="font-mono font-medium text-app">{order.opac}</span>
                </p>
              ) : null}
            </div>
            <WoPmPhaseBadge phase={order.pmPhase} syst={order.status} showSyst />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailField label={t('woSummary.pmPlan')} value={order.mntplan || '—'} mono />
            <DetailField label={t('woSummary.orderType')} value={order.orderType} />
            <DetailField label={t('woSummary.status')} value={statusLine} />
            <DetailField label={t('woSummary.workCenter')} value={order.workCenter} mono />
          </dl>
        </motion.div>
      </SchedulingPageSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <SchedulingPageSection index={1}>
          <SchedulingSection
            icon={Wrench}
            title={t('woSummary.workAndResources')}
            description={t('woSummary.workAndResourcesDesc')}
          >
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label={t('woSummary.workAction')}
                value={
                  <>
                    {order.work}
                    {order.actwork ? ` / ${order.actwork}` : ''}
                    {order.untime ? ` ${order.untime}` : ''}
                  </>
                }
                mono
              />
              <DetailField
                label={t('woSummary.resources')}
                value={
                  order.resourcesLabel
                    ? `${order.workCenter} / ${order.resourcesLabel}`
                    : order.workCenter
                }
              />
            </dl>
          </SchedulingSection>
        </SchedulingPageSection>

        <SchedulingPageSection index={2}>
          <SchedulingSection icon={MapPin} title={t('woSummary.locationEquipment')}>
            <dl className="grid gap-4">
              <DetailField label={t('woSummary.equipment')} value={order.equipment} />
              <DetailField label={t('filters.labels.fl')} value={order.functLoc} mono />
            </dl>
          </SchedulingSection>
        </SchedulingPageSection>
      </div>

      <SchedulingPageSection index={3}>
        <SchedulingSection
          icon={Users}
          title={t('woSummary.teamTitle')}
          description={
            canEditTeam ? t('woSummary.teamDescEditable') : t('woSummary.teamDescReadOnly')
          }
          badge={
            order.team ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--app-accent)_12%,white)] px-2 py-0.5 text-[10px] font-semibold text-app">
                {t('shared.currentTeam', { team: order.team })}
              </span>
            ) : null
          }
        >
          <div
            className={cn(
              'grid grid-cols-2 gap-2 sm:grid-cols-4',
              (teamPending || !canEditTeam) && 'pointer-events-none opacity-60',
            )}
          >
            {teamCodes.map((code) => {
              const active = order.team === code
              return (
                <motion.button
                  key={code}
                  type="button"
                  disabled={!canEditTeam || teamPending}
                  whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => onTeamChange(code)}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-center transition-colors duration-200',
                    active
                      ? 'border-[color-mix(in_srgb,var(--app-accent)_45%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_10%,var(--app-surface))] shadow-md ring-1 ring-[color-mix(in_srgb,var(--app-accent)_20%,transparent)]'
                      : 'border-app/70 bg-[var(--app-surface)] hover:border-[color-mix(in_srgb,var(--app-accent)_28%,var(--app-border))] hover:bg-[color-mix(in_srgb,var(--app-accent)_4%,var(--app-surface))]',
                  )}
                >
                  <span className="block text-lg font-bold tracking-tight text-app">{code}</span>
                  <span className="mt-0.5 block text-xs text-app-muted">
                    {t('shared.teamBadge', { team: code })}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </SchedulingSection>
      </SchedulingPageSection>

      <SchedulingPageSection index={4}>
        <SchedulingSection icon={CalendarDays} title={t('woSummary.schedule')}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label={t('woSummary.plannedDate')} value={order.plannedDate || '—'} mono />
            <DetailField label={t('woSummary.finishDate')} value={order.finishDate || '—'} mono />
          </dl>
          {order.mat ? (
            <div className="mt-4 flex items-center gap-2 rounded-button border border-app/60 bg-app-subtle/40 px-3 py-2">
              <Package className="size-4 shrink-0 text-app-muted" aria-hidden />
              <span className="text-body-sm text-app">
                {t('woSummary.material')}{' '}
                <span className="font-mono font-medium">{order.mat}</span>
              </span>
            </div>
          ) : null}
        </SchedulingSection>
      </SchedulingPageSection>

      {order.movePlan ? (
        <SchedulingPageSection index={5}>
          <div className="app-tone-warning-move-plan rounded-card border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="app-tone-warning-move-plan__icon flex size-9 shrink-0 items-center justify-center rounded-xl">
                <ClipboardList className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="app-tone-warning-strong font-semibold">{t('woSummary.planMoved')}</p>
                <p className="app-tone-warning-label text-body-sm">
                  {order.movePlan.movedDate} · {t('shared.times', { count: order.movePlan.moveCount })}
                </p>
                <p className="app-tone-warning-label text-xs">
                  {order.movePlan.reasonCode} — {order.movePlan.reasonName} · WC {order.movePlan.movedByWkctr}
                </p>
              </div>
            </div>
          </div>
        </SchedulingPageSection>
      ) : null}

      {order.canMovePlan && onMovePlan ? (
        <SchedulingPageSection index={6}>
          <Button type="button" variant="outline" className="shadow-sm" onClick={onMovePlan}>
            {t('woSummary.movePlanButton')}
          </Button>
        </SchedulingPageSection>
      ) : null}

      {order.description?.trim() ? (
        <SchedulingPageSection index={7}>
          <div className="rounded-card border border-app/70 bg-app-subtle/30 px-4 py-3">
            <p className="text-xs font-medium text-app-muted">{t('woSummary.description')}</p>
            <p className="mt-1 text-body-sm leading-relaxed text-app">{order.description}</p>
          </div>
        </SchedulingPageSection>
      ) : null}
    </div>
  )
}
