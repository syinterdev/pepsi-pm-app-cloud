import { Link } from 'react-router-dom'
import {
  SchedulingPageSection,
  SchedulingSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ClipboardCheck,
  Cog,
  ExternalLink,
  Factory,
  Layers,
  ListChecks,
  MapPin,
  Package,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'
import type { WoPmExecution } from '@/api/schemas'
import { WorkOrderPmMeasurementBlock } from '@/components/scheduling/WorkOrderPmMeasurementBlock'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export type WorkOrderTaskListSummary = {
  tasklist: string
  legacy: string
  productline: string
  zone: string
  wkctrtype: string
}

export type WorkOrderTaskListItem = {
  tasklist: string
  machine: string
  pmlist: string
  displayLine?: string
  machinestatus: number | null
  mat: string
  matdescrip: string
  measurementKind?: 'current_3phase' | 'vibration_dst_db' | 'none'
  mpoint?: string
  measurementTitle?: string
  axisLabels?: [string, string, string]
  unit?: string
}

export type WorkOrderTaskListData = {
  mntplan: string
  summary: WorkOrderTaskListSummary | null
  items: WorkOrderTaskListItem[]
}

export type WorkOrderTaskWoContext = {
  wkorder: string
  plannedDate: string
  status: string
  mntplan: string
}

type Props = {
  taskList: WorkOrderTaskListData
  orderId?: string
  pmExecution?: WoPmExecution
  onPmSaved?: () => void
  /** Calendar / plan-calendar assigned modal — planner read-only layout */
  plannerLayout?: boolean
  woContext?: WorkOrderTaskWoContext | null
  canAssign?: boolean
  onGoPlanning?: () => void
  showMeasurements?: boolean
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function machineStatusMeta(
  status: number | null,
  t: ReturnType<typeof useTranslation>['t'],
): {
  label: string
  running: boolean
} {
  if (status === 1) return { label: t('taskList.stopped'), running: false }
  return { label: t('taskList.running'), running: true }
}

function stripLabelValue(label: string): string {
  const idx = label.indexOf(' = ')
  return idx >= 0 ? label.slice(idx + 3).trim() : label.trim()
}

function SummaryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Factory
  label: string
  value: string
}) {
  if (!value.trim()) return null
  return (
    <div className="flex items-center gap-2 rounded-button border border-app/60 app-tone-info-inner px-3 py-2">
      <Icon className="size-4 shrink-0 app-tone-info-icon" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide app-tone-info-eyebrow">{label}</p>
        <p className="truncate text-body-sm font-medium text-app">{value}</p>
      </div>
    </div>
  )
}

function WoContextStrip({
  ctx,
  t,
}: {
  ctx: WorkOrderTaskWoContext
  t: ReturnType<typeof useTranslation>['t']
}) {
  const mnt = ctx.mntplan.trim()
  return (
    <div className="rounded-card border border-app/70 bg-app-subtle/35 px-3 py-2.5 text-body-sm text-app">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono font-semibold">{ctx.wkorder}</span>
        {ctx.plannedDate ? (
          <>
            <span className="text-app-muted" aria-hidden>
              ·
            </span>
            <span>{ctx.plannedDate}</span>
          </>
        ) : null}
        {ctx.status ? (
          <>
            <span className="text-app-muted" aria-hidden>
              ·
            </span>
            <span className="rounded-full bg-app-subtle px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-app">
              {ctx.status}
            </span>
          </>
        ) : null}
        {mnt ? (
          <>
            <span className="text-app-muted" aria-hidden>
              ·
            </span>
            <span className="text-app-muted">{t('taskList.pmPlan')}</span>
            <Link
              to={`/master-plan?q=${encodeURIComponent(mnt)}`}
              className="inline-flex items-center gap-1 font-mono font-semibold text-primary hover:underline"
            >
              {mnt}
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            </Link>
          </>
        ) : null}
      </p>
    </div>
  )
}

function PlannerTaskItemCard({
  item,
  index,
  reduceMotion,
  t,
}: {
  item: WorkOrderTaskListItem
  index: number
  reduceMotion: boolean | null
  t: ReturnType<typeof useTranslation>['t']
}) {
  const status = machineStatusMeta(item.machinestatus, t)
  const line = item.displayLine?.trim() || item.pmlist || item.machine || '—'

  return (
    <motion.li layout={!reduceMotion} variants={reduceMotion ? undefined : cardVariants} className="group">
      <article
        className={cn(
          'relative flex items-start gap-3 overflow-hidden rounded-card border bg-[var(--app-surface)] p-3 shadow-sm',
          status.running ? 'app-tone-success-stat' : 'app-tone-warning-tile',
        )}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums',
            status.running ? 'app-tone-success-card-index' : 'app-tone-warning-card-index',
          )}
        >
          {index + 1}
        </span>
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-body-sm font-medium leading-relaxed text-app">
          {line}
        </p>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
            status.running ? 'app-tone-success-badge' : 'app-tone-warning-badge',
          )}
        >
          {status.running ? (
            <PlayCircle className="size-3.5" aria-hidden />
          ) : (
            <PauseCircle className="size-3.5" aria-hidden />
          )}
          {status.label}
        </span>
      </article>
    </motion.li>
  )
}

function TaskListItemCard({
  item,
  index,
  reduceMotion,
  orderId,
  pmExecution,
  onPmSaved,
  t,
  fallbackAxisLabels,
  showMeasurements,
}: {
  item: WorkOrderTaskListItem
  index: number
  reduceMotion: boolean | null
  orderId?: string
  pmExecution?: WoPmExecution
  onPmSaved?: () => void
  t: ReturnType<typeof useTranslation>['t']
  fallbackAxisLabels: [string, string, string]
  showMeasurements: boolean
}) {
  const status = machineStatusMeta(item.machinestatus, t)
  const line = item.displayLine?.trim()

  return (
    <motion.li
      layout={!reduceMotion}
      variants={reduceMotion ? undefined : cardVariants}
      className="group"
    >
      <article
        className={cn(
          'relative overflow-hidden rounded-card border bg-[var(--app-surface)] p-4 shadow-sm transition-shadow duration-200',
          'hover:shadow-md',
          status.running
            ? 'app-tone-success-stat hover:shadow-md'
            : 'app-tone-warning-tile hover:shadow-md',
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-1',
            status.running ? 'app-tone-success-strip-fill' : 'app-tone-warning-strip-fill',
          )}
          aria-hidden
        />

        <div className="flex flex-wrap items-start gap-3 pl-2">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums',
              status.running ? 'app-tone-success-card-index' : 'app-tone-warning-card-index',
            )}
          >
            {index + 1}
          </span>

          <div className="min-w-0 flex-1 space-y-2">
            {line ? (
              <p className="whitespace-pre-wrap text-body-sm font-semibold leading-relaxed text-app">{line}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-medium text-app-muted">
                      <Cog className="size-3.5 shrink-0" aria-hidden />
                      {t('taskList.machine')}
                    </p>
                    <p className="mt-0.5 truncate font-semibold text-app">{item.machine || '—'}</p>
                  </div>
                </div>
                <div className="rounded-button bg-app-subtle/45 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
                    {t('taskList.pmItem')}
                  </p>
                  <p className="mt-0.5 text-body-sm font-medium text-app">{item.pmlist || '—'}</p>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                  status.running ? 'app-tone-success-badge' : 'app-tone-warning-badge',
                )}
              >
                {status.running ? (
                  <PlayCircle className="size-3.5" aria-hidden />
                ) : (
                  <PauseCircle className="size-3.5" aria-hidden />
                )}
                {status.label}
              </span>
            </div>

            {item.mat ? (
              <div className="flex items-start gap-2 rounded-button border border-app/60 app-surface-panel px-3 py-2">
                <Package className="mt-0.5 size-4 shrink-0 text-app-muted" aria-hidden />
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-app">{item.mat}</p>
                  {item.matdescrip ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-app-muted">{item.matdescrip}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {showMeasurements && orderId && pmExecution ? (
              <WorkOrderPmMeasurementBlock
                orderId={orderId}
                item={{
                  ...item,
                  displayLine: item.displayLine ?? '',
                  measurementKind: item.measurementKind ?? 'none',
                  mpoint: item.mpoint ?? '',
                  measurementTitle: item.measurementTitle ?? '',
                  axisLabels: item.axisLabels ?? fallbackAxisLabels,
                  unit: item.unit ?? '',
                }}
                pmExecution={pmExecution}
                onSaved={() => onPmSaved?.()}
              />
            ) : null}
          </div>
        </div>
      </article>
    </motion.li>
  )
}

function TaskListEmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="rounded-card border border-dashed border-app px-6 py-12 text-center">
      <ListChecks className="mx-auto size-10 text-app-muted/60" aria-hidden />
      <p className="mt-3 font-medium text-app">{title}</p>
      <p className="mt-1 text-body-sm text-app-muted">{description}</p>
      {actionLabel && actionTo ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" asChild>
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}

export function WorkOrderTaskListPanel({
  taskList,
  orderId,
  pmExecution,
  onPmSaved,
  plannerLayout = false,
  woContext,
  canAssign = false,
  onGoPlanning,
  showMeasurements = true,
}: Props) {
  const { t } = useTranslation('scheduling')
  const reduceMotion = useReducedMotion()
  const { summary, items, mntplan } = taskList
  const mnt = mntplan.trim()
  const fallbackAxisLabels = useMemo(
    (): [string, string, string] => [
      t('pmMeasurement.valueN', { n: 1 }),
      t('pmMeasurement.valueN', { n: 2 }),
      t('pmMeasurement.valueN', { n: 3 }),
    ],
    [t],
  )

  const stats = useMemo(() => {
    let running = 0
    let stopped = 0
    for (const item of items) {
      if (item.machinestatus === 1) stopped += 1
      else running += 1
    }
    return { total: items.length, running, stopped }
  }, [items])

  const heroMeta = useMemo(() => {
    if (!summary) return ''
    const parts = [
      summary.legacy?.trim(),
      stripLabelValue(summary.wkctrtype),
      stripLabelValue(summary.zone),
    ].filter(Boolean)
    return parts.join(' · ')
  }, [summary])

  if (!mnt) {
    return (
      <SchedulingPageSection index={0}>
        {woContext ? <WoContextStrip ctx={woContext} t={t} /> : null}
        <div className={woContext ? 'mt-3' : undefined}>
          <TaskListEmptyState
            title={t('taskList.emptyNoMntplan.title')}
            description={t('taskList.emptyNoMntplan.desc')}
          />
        </div>
      </SchedulingPageSection>
    )
  }

  if (items.length === 0 && !summary) {
    return (
      <SchedulingPageSection index={0}>
        {woContext ? <WoContextStrip ctx={woContext} t={t} /> : null}
        <div className={woContext ? 'mt-3' : undefined}>
          <TaskListEmptyState
            title={t('taskList.emptyNotPublished.title')}
            description={t('taskList.emptyNotPublished.desc', { mntplan: mnt })}
            actionLabel={t('taskList.searchMasterPlan')}
            actionTo={`/master-plan?q=${encodeURIComponent(mnt)}`}
          />
        </div>
      </SchedulingPageSection>
    )
  }

  if (!summary && items.length === 0) {
    return (
      <SchedulingPageSection index={0}>
        <TaskListEmptyState title={t('taskList.notFoundTitle')} description={t('taskList.notFoundDesc')} />
      </SchedulingPageSection>
    )
  }

  return (
    <div className="space-y-4">
      {woContext ? <WoContextStrip ctx={woContext} t={t} /> : null}

      <SchedulingPageSection index={0}>
        <motion.div
          layout={!reduceMotion}
          className="app-tone-info-section-gradient overflow-hidden rounded-card border p-4 shadow-[var(--app-shadow-card)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider app-tone-info-eyebrow">
                {t('taskList.maintenancePlan')}
              </p>
              <p className="font-mono text-3xl font-bold tracking-tight text-app sm:text-4xl">{mnt}</p>
              {heroMeta ? (
                <p className="mt-2 text-body-sm text-app-muted">{heroMeta}</p>
              ) : null}
              {summary?.tasklist ? (
                <p className="mt-1 text-xs text-app-muted">
                  {t('taskList.taskListCode')}{' '}
                  <span className="font-mono font-medium text-app">{summary.tasklist}</span>
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="app-tone-info-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <ClipboardCheck className="size-3.5" aria-hidden />
                {t('shared.items', { count: stats.total })}
              </span>
              <span className="rounded-full bg-app-subtle px-2.5 py-0.5 text-[10px] font-semibold text-app-muted">
                {t('taskList.itemCountStopped', { stopped: stats.stopped })}
              </span>
            </div>
          </div>

          {!plannerLayout && summary ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryChip icon={Factory} label={t('taskList.productLine')} value={summary.productline} />
              <SummaryChip icon={MapPin} label={t('taskList.zone')} value={summary.zone} />
              <SummaryChip icon={Layers} label={t('taskList.wkctrType')} value={summary.wkctrtype} />
            </div>
          ) : null}
        </motion.div>
      </SchedulingPageSection>

      {items.length > 0 ? (
        <SchedulingPageSection index={1}>
          <SchedulingSection
            icon={ListChecks}
            title={t('taskList.itemsTitle')}
            description={t('taskList.itemsDesc')}
            badge={
              <span className="rounded-full bg-app-subtle px-2 py-0.5 text-[10px] font-semibold text-app-muted">
                {t('taskList.runningStopped', { running: stats.running, stopped: stats.stopped })}
              </span>
            }
            bodyClassName="space-y-3"
          >
            <motion.ul
              layout={!reduceMotion}
              variants={reduceMotion ? undefined : listVariants}
              initial={reduceMotion ? false : 'hidden'}
              animate="show"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) =>
                  plannerLayout ? (
                    <PlannerTaskItemCard
                      key={`${item.tasklist}-${item.machine}-${item.pmlist}-${idx}`}
                      item={item}
                      index={idx}
                      reduceMotion={reduceMotion}
                      t={t}
                    />
                  ) : (
                    <TaskListItemCard
                      key={`${item.tasklist}-${item.machine}-${item.pmlist}-${idx}`}
                      item={item}
                      index={idx}
                      reduceMotion={reduceMotion}
                      orderId={orderId}
                      pmExecution={pmExecution}
                      onPmSaved={onPmSaved}
                      t={t}
                      fallbackAxisLabels={fallbackAxisLabels}
                      showMeasurements={showMeasurements}
                    />
                  ),
                )}
              </AnimatePresence>
            </motion.ul>
          </SchedulingSection>
        </SchedulingPageSection>
      ) : (
        <SchedulingPageSection index={1}>
          <p className="rounded-card border border-dashed border-app px-4 py-8 text-center text-body-sm text-app-muted">
            {t('taskList.headerOnly')}
          </p>
        </SchedulingPageSection>
      )}

      {plannerLayout && canAssign && onGoPlanning ? (
        <SchedulingPageSection index={2}>
          <Button type="button" className="w-full gap-2 sm:w-auto" onClick={onGoPlanning}>
            {t('taskList.goPlanning')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </SchedulingPageSection>
      ) : null}
    </div>
  )
}
