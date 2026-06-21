import {
  SchedulingPageSection,
  SchedulingSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeftRight,
  CalendarDays,
  Coins,
  FileText,
  Package,
  PackageSearch,
  Receipt,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export type WorkOrderMaterialItem = {
  matpo: string
  pstngdate: string
  materialdesc: string
  amountinlc: number
  mvt: string
  material: string
}

export type WorkOrderMaterialsData = {
  items: WorkOrderMaterialItem[]
}

type Props = {
  materials: WorkOrderMaterialsData
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

function formatAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function MetaChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  if (!value.trim()) return null
  return (
    <div className="app-tone-info-tile flex min-w-0 items-center gap-2 rounded-button border app-surface-panel--soft px-2.5 py-1.5">
      <Icon className="app-tone-info-icon size-3.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="app-tone-info-label text-[10px] font-semibold uppercase tracking-wide">{label}</p>
        <p className="app-tone-info-strong truncate text-xs font-medium">{value}</p>
      </div>
    </div>
  )
}

function MaterialItemCard({
  item,
  index,
  reduceMotion,
  t,
}: {
  item: WorkOrderMaterialItem
  index: number
  reduceMotion: boolean | null
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  return (
    <motion.li
      layout={!reduceMotion}
      variants={reduceMotion ? undefined : cardVariants}
      className="group"
    >
      <article className="app-tone-info-card-border app-tone-info-card-border-hover overflow-hidden rounded-card border bg-[var(--app-surface)] shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-stretch">
          <div className="app-tone-info-card-strip w-1 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="app-tone-info-card-index flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
                    {t('woMaterial.materialCode')}
                  </p>
                  <p className="font-mono text-base font-bold text-app">{item.material || '—'}</p>
                  <p className="mt-1 text-body-sm leading-relaxed text-app">
                    {item.materialdesc || '—'}
                  </p>
                </div>
              </div>
              <div className="app-tone-info-stat-box rounded-xl border px-3 py-2 text-right">
                <p className="app-tone-info-label text-[10px] font-semibold uppercase tracking-wide">
                  {t('woMaterial.amountLc')}
                </p>
                <p className="app-tone-info-strong text-lg font-bold tabular-nums">
                  {formatAmount(item.amountinlc)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <MetaChip icon={Receipt} label="PO" value={item.matpo} />
              <MetaChip icon={CalendarDays} label={t('woMaterial.postingDate')} value={item.pstngdate} />
              <MetaChip icon={ArrowLeftRight} label="MvT" value={item.mvt} />
            </div>
          </div>
        </div>
      </article>
    </motion.li>
  )
}

export function WorkOrderMaterialPanel({ materials }: Props) {
  const { t } = useTranslation('scheduling')
  const reduceMotion = useReducedMotion()
  const { items } = materials

  const stats = useMemo(() => {
    const totalAmount = items.reduce((sum, row) => sum + (row.amountinlc ?? 0), 0)
    return { count: items.length, totalAmount }
  }, [items])

  if (items.length === 0) {
    return (
      <SchedulingPageSection index={0}>
        <div className="rounded-card border border-dashed border-app px-6 py-12 text-center">
          <PackageSearch className="mx-auto size-10 text-app-muted/60" aria-hidden />
          <p className="mt-3 font-medium text-app">{t('woMaterial.emptyTitle')}</p>
          <p className="mt-1 text-body-sm text-app-muted">{t('woMaterial.emptyDesc')}</p>
        </div>
      </SchedulingPageSection>
    )
  }

  return (
    <div className="space-y-4">
      <SchedulingPageSection index={0}>
        <motion.div
          layout={!reduceMotion}
          className="app-tone-info-hero rounded-card border p-4 shadow-[var(--app-shadow-card)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="app-tone-info-eyebrow text-xs font-semibold uppercase tracking-wider">
                {t('woMaterial.heroTitle')}
              </p>
              <p className="mt-0.5 text-body-sm text-app-muted">{t('woMaterial.heroDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="app-tone-info-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <Package className="size-3.5" aria-hidden />
                {t('woMaterial.itemCount', { count: stats.count })}
              </span>
              <span className="app-tone-info-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <Coins className="size-3.5" aria-hidden />
                {t('woMaterial.totalLc', { amount: formatAmount(stats.totalAmount) })}
              </span>
            </div>
          </div>
        </motion.div>
      </SchedulingPageSection>

      <SchedulingPageSection index={1}>
        <SchedulingSection
          icon={FileText}
          title={t('woMaterial.listTitle')}
          description={t('woMaterial.listDesc')}
          badge={
            <span className="rounded-full bg-app-subtle px-2 py-0.5 text-[10px] font-semibold text-app-muted">
              {t('woMaterial.rowCount', { count: stats.count })}
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
              {items.map((item, idx) => (
                <MaterialItemCard
                  key={`${item.material}-${item.pstngdate}-${item.matpo}-${idx}`}
                  item={item}
                  index={idx}
                  reduceMotion={reduceMotion}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </SchedulingSection>
      </SchedulingPageSection>
    </div>
  )
}
