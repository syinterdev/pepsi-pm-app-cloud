import {
  SchedulingPageSection,
  SchedulingSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { APP_GROUP_HOVER_MOTION } from '@/lib/app-motion'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  CalendarDays,
  Cog,
  Factory,
  Gauge,
  Layers,
  MapPin,
  Settings2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type WorkOrderMachineData = {
  zone: string
  wkctrtype: string
  productline: string
  uptime: number | null
  machines: string[]
}

type Props = {
  machine: WorkOrderMachineData
  referenceDate: string
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

function InfoChip({
  icon: Icon,
  label,
  value,
  tone = 'info',
}: {
  icon: typeof Factory
  label: string
  value: string
  tone?: 'info' | 'warning'
}) {
  if (!value.trim()) return null
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-button border px-3 py-2 app-surface-panel--soft',
        tone === 'warning' ? 'app-tone-warning-tile' : 'app-tone-info-tile',
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0',
          tone === 'warning' ? 'app-tone-warning-icon' : 'app-tone-info-icon',
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wide',
            tone === 'warning' ? 'app-tone-warning-label' : 'app-tone-info-label',
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'truncate text-body-sm font-medium',
            tone === 'warning' ? 'app-tone-warning-strong' : 'app-tone-info-strong',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function MachineCard({
  name,
  index,
  reduceMotion,
}: {
  name: string
  index: number
  reduceMotion: boolean | null
}) {
  return (
    <motion.li
      layout={!reduceMotion}
      variants={reduceMotion ? undefined : cardVariants}
      className="group"
    >
      <article className="flex items-center gap-3 rounded-card border border-app/75 bg-[var(--app-surface)] p-4 shadow-sm transition-all duration-200 hover:border-[color-mix(in_srgb,var(--app-accent)_30%,var(--app-border))] hover:shadow-md">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--app-accent)_12%,white)] text-[color-mix(in_srgb,var(--app-accent)_85%,black)] ring-1 ring-[color-mix(in_srgb,var(--app-accent)_18%,transparent)]',
            APP_GROUP_HOVER_MOTION,
          )}
        >
          <Cog className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            เครื่องที่ {index + 1}
          </p>
          <p className="mt-0.5 truncate font-semibold text-app">{name}</p>
        </div>
        <Settings2
          className="size-4 shrink-0 text-app-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden
        />
      </article>
    </motion.li>
  )
}

export function WorkOrderMachinePanel({ machine, referenceDate }: Props) {
  const { t } = useTranslation('scheduling')
  const reduceMotion = useReducedMotion()
  const hasSummary =
    Boolean(machine.productline.trim()) ||
    Boolean(machine.zone.trim()) ||
    Boolean(machine.wkctrtype.trim()) ||
    machine.uptime != null
  const hasMachines = machine.machines.length > 0

  if (!hasSummary && !hasMachines) {
    return (
      <SchedulingPageSection index={0}>
        <div className="rounded-card border border-dashed border-app px-6 py-12 text-center">
          <Cog className="mx-auto size-10 text-app-muted/60" aria-hidden />
          <p className="mt-3 font-medium text-app">{t('woMachine.emptyTitle')}</p>
          <p className="mt-1 text-body-sm text-app-muted">{t('woMachine.emptyDesc')}</p>
        </div>
      </SchedulingPageSection>
    )
  }

  return (
    <div className="space-y-4">
      {machine.productline || machine.uptime != null ? (
        <SchedulingPageSection index={0}>
          <motion.div
            layout={!reduceMotion}
            className="app-tone-warning-section overflow-hidden rounded-card border p-4 shadow-[var(--app-shadow-card)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="app-tone-warning-label text-xs font-semibold uppercase tracking-wider">
                  {t('woMachine.productLine')}
                </p>
                <p className="app-tone-warning-strong font-mono text-2xl font-bold tracking-tight">
                  {machine.productline || '—'}
                </p>
                {referenceDate ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-app-muted">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    {t('woMachine.referenceDate')}{' '}
                    <span className="font-mono font-medium text-app">{referenceDate}</span>
                  </p>
                ) : null}
              </div>
              {machine.uptime != null ? (
                <div className="app-tone-warning-tile rounded-xl border app-surface-panel--soft px-4 py-3 text-center shadow-sm">
                  <p className="app-tone-warning-label flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
                    <Gauge className="size-3.5" aria-hidden />
                    Work
                  </p>
                  <p className="app-tone-warning-strong mt-0.5 text-2xl font-bold tabular-nums">
                    {machine.uptime}
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </SchedulingPageSection>
      ) : null}

      {machine.zone || machine.wkctrtype ? (
        <SchedulingPageSection index={1}>
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoChip icon={MapPin} label="Zone" value={machine.zone} />
            <InfoChip icon={Layers} label="Work Center Type" value={machine.wkctrtype} />
          </div>
        </SchedulingPageSection>
      ) : null}

      {hasMachines ? (
        <SchedulingPageSection index={2}>
          <SchedulingSection
            icon={Factory}
            title={t('woMachine.listTitle')}
            description={t('woMachine.listDesc')}
            badge={
              <span className="rounded-full bg-app-subtle px-2 py-0.5 text-[10px] font-semibold text-app-muted">
                {t('woMachine.machineCount', { count: machine.machines.length })}
              </span>
            }
            bodyClassName="space-y-3"
          >
            <motion.ul
              layout={!reduceMotion}
              variants={reduceMotion ? undefined : listVariants}
              initial={reduceMotion ? false : 'hidden'}
              animate="show"
              className="grid gap-3 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {machine.machines.map((name, idx) => (
                  <MachineCard
                    key={`${name}-${idx}`}
                    name={name}
                    index={idx}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          </SchedulingSection>
        </SchedulingPageSection>
      ) : (
        <SchedulingPageSection index={2}>
          <p className="rounded-card border border-dashed border-app px-4 py-8 text-center text-body-sm text-app-muted">
            มีข้อมูลสายการผลิต แต่ยังไม่มีรายชื่อเครื่องจักร
          </p>
        </SchedulingPageSection>
      )}
    </div>
  )
}
