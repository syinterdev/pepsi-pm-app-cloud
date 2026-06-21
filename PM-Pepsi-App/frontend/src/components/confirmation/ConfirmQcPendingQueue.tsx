import { SchedulingSection } from '@/components/scheduling/SchedulingPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchConfirmQcPending } from '@/lib/api-public'
import {
  listKpiStaggerItemMotion,
  listKpiStaggerRootMotion,
} from '@/lib/list-kpi-stagger'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type ConfirmQcPendingQueueProps = {
  enabled?: boolean
  onOpenWo: (wkorder: string, idiw37: number) => void
  collapsible?: boolean
  defaultOpen?: boolean
}

export function ConfirmQcPendingQueue({
  enabled = true,
  onOpenWo,
  collapsible = false,
  defaultOpen = true,
}: ConfirmQcPendingQueueProps) {
  const { t } = useTranslation('confirmation')
  const reduceMotion = useReducedMotion()
  const pendingQ = useQuery({
    queryKey: ['confirmation', 'qc', 'pending'],
    queryFn: () => fetchConfirmQcPending(30),
    enabled,
    refetchInterval: 60_000,
  })

  if (!enabled) return null

  const items = pendingQ.data ?? []

  return (
    <SchedulingSection
      icon={ShieldCheck}
      title={t('qc.queueTitle')}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      collapsedHint={
        pendingQ.isLoading
          ? t('qc.queueLoadingHint')
          : items.length > 0
            ? t('qc.queuePendingHint', { count: items.length.toLocaleString() })
            : t('qc.queueEmptyHint')
      }
      badge={
        items.length > 0 ? (
          <Badge variant="outline" className="app-tone-warning-badge tabular-nums">
            {items.length}
          </Badge>
        ) : undefined
      }
      bodyClassName="p-0"
    >
      {pendingQ.isLoading ? (
        <div className="p-4">
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-center text-caption text-app-muted">{t('qc.queueEmpty')}</p>
      ) : (
        <motion.ul
          className="divide-y divide-app/50"
          {...listKpiStaggerRootMotion(reduceMotion, items.length)}
        >
          {items.map((row) => (
            <motion.li
              key={row.idiw37}
              {...listKpiStaggerItemMotion(reduceMotion, items.length)}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--status-info)_8%,var(--app-surface))]"
            >
              <div className="min-w-0">
                <span className="font-medium tabular-nums text-app">{row.wkorder}</span>
                <span className="ml-3 text-xs text-app-muted">
                  {t('qc.queuePhotos')} {row.imageCount}
                  <span className="mx-1.5 text-app/30">·</span>
                  {t('qc.queueClose')} {row.closeCount}
                  {row.submittedAt ? (
                    <>
                      <span className="mx-1.5 text-app/30">·</span>
                      {new Date(row.submittedAt).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </>
                  ) : null}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOpenWo(row.wkorder, row.idiw37)}
              >
                {t('qc.queueOpenWo')}
              </Button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </SchedulingSection>
  )
}
