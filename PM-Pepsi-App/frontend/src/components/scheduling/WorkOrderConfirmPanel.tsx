import type { workOrderConfirmQcSchema } from '@/api/schemas'
import {
  SchedulingPageSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { Badge } from '@/components/ui/badge'
import {
  SchedulingWoTabsList,
  WoModalTabFade,
  woTabTriggerClass,
} from '@/components/scheduling/SchedulingWoTabs'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BadgeCheck,
  Camera,
  Clock,
  MessageSquareText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'

export type ConfirmSubTab = 'personnel-close' | 'close' | 'images' | 'comments'

type ConfirmQc = z.infer<typeof workOrderConfirmQcSchema>

type Props = {
  confirmQc?: ConfirmQc | null
  personnelCount: number
  supervisorCloseCount: number
  imageCount: number
  confirmTab: ConfirmSubTab
  onConfirmTabChange: (tab: ConfirmSubTab) => void
  qcPanel: ReactNode
  personnelClosePanel: ReactNode
  supervisorClosePanel: ReactNode
  imagesPanel: ReactNode
  commentsPanel: ReactNode
}

function statusTone(status: ConfirmQc['status']): string {
  if (status === 'approved') return 'app-tone-success-badge'
  if (status === 'pending') return 'app-tone-warning-badge'
  if (status === 'rejected') return 'app-tone-danger-badge'
  return 'bg-app-subtle text-app-muted'
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: typeof Clock
  label: string
  value: number | string
  active?: boolean
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex min-w-[7rem] flex-1 items-center gap-2 rounded-button border px-3 py-2 text-left transition-all duration-200',
        active
          ? 'app-tone-success-stat-active app-surface-panel shadow-sm'
          : 'app-tone-success-stat app-surface-panel--soft hover:bg-[color-mix(in_srgb,var(--app-surface)_96%,var(--app-bg))]',
        onClick && 'cursor-pointer',
      )}
    >
      <Icon className="app-tone-success-icon size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="app-tone-success-label text-[10px] font-semibold uppercase tracking-wide">{label}</p>
        <p className="app-tone-success-strong text-sm font-bold tabular-nums">{value}</p>
      </div>
    </Comp>
  )
}

export function WorkOrderConfirmPanel({
  confirmQc,
  personnelCount,
  supervisorCloseCount,
  imageCount,
  confirmTab,
  onConfirmTabChange,
  qcPanel,
  personnelClosePanel,
  supervisorClosePanel,
  imagesPanel,
  commentsPanel,
}: Props) {
  const { t } = useTranslation('scheduling')
  const reduceMotion = useReducedMotion()
  const qcLabel = confirmQc?.statusLabel ?? '—'

  return (
    <div className="space-y-4">
      <SchedulingPageSection index={0}>
        <motion.div
          layout={!reduceMotion}
          className="app-tone-success-section rounded-card border p-4 shadow-[var(--app-shadow-card)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="app-tone-success-label flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="size-3.5" aria-hidden />
                {t('woConfirm.title')}
              </p>
              <p className="mt-0.5 text-body-sm text-app-muted">{t('woConfirm.subtitle')}</p>
            </div>
            <Badge className={cn('shrink-0 border-0', statusTone(confirmQc?.status ?? null))}>
              {qcLabel}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SummaryStat
              icon={UserCheck}
              label={t('woConfirm.personnelTime')}
              value={personnelCount}
              active={confirmTab === 'personnel-close'}
              onClick={() => onConfirmTabChange('personnel-close')}
            />
            <SummaryStat
              icon={Clock}
              label={t('woConfirm.close')}
              value={supervisorCloseCount}
              active={confirmTab === 'close'}
              onClick={() => onConfirmTabChange('close')}
            />
            <SummaryStat
              icon={Camera}
              label={t('woConfirm.images')}
              value={imageCount}
              active={confirmTab === 'images'}
              onClick={() => onConfirmTabChange('images')}
            />
            <SummaryStat
              icon={BadgeCheck}
              label="QC"
              value={confirmQc?.readyForReview ? t('woConfirm.readyForReview') : qcLabel}
              active={confirmTab === 'personnel-close' && confirmQc?.status === 'pending'}
            />
          </div>
        </motion.div>
      </SchedulingPageSection>

      {qcPanel}

      <Tabs value={confirmTab} onValueChange={(v) => onConfirmTabChange(v as ConfirmSubTab)}>
        <SchedulingWoTabsList activeValue={confirmTab} className="app-tabs-scroll">
          <TabsTrigger value="personnel-close" className={cn(woTabTriggerClass, 'gap-1.5')}>
            <UserCheck className="size-3.5" aria-hidden />
            {t('woConfirm.personnelTime')}{personnelCount > 0 ? ` (${personnelCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="close" className={cn(woTabTriggerClass, 'gap-1.5')}>
            <Clock className="size-3.5" aria-hidden />
            {t('woConfirm.close')}{supervisorCloseCount > 0 ? ` (${supervisorCloseCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="images" className={cn(woTabTriggerClass, 'gap-1.5')}>
            <Camera className="size-3.5" aria-hidden />
            {t('woConfirm.images')}{imageCount > 0 ? ` (${imageCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="comments" className={cn(woTabTriggerClass, 'gap-1.5')}>
            <MessageSquareText className="size-3.5" aria-hidden />
            {t('woConfirm.notesTab')}
          </TabsTrigger>
        </SchedulingWoTabsList>

        <TabsContent value="personnel-close" className="mt-4 space-y-3">
          <WoModalTabFade>{personnelClosePanel}</WoModalTabFade>
        </TabsContent>
        <TabsContent value="close" className="mt-4 space-y-3">
          <WoModalTabFade>{supervisorClosePanel}</WoModalTabFade>
        </TabsContent>
        <TabsContent value="images" className="mt-4 space-y-3">
          <WoModalTabFade>{imagesPanel}</WoModalTabFade>
        </TabsContent>
        <TabsContent value="comments" className="mt-4 space-y-3">
          <WoModalTabFade>{commentsPanel}</WoModalTabFade>
        </TabsContent>
      </Tabs>
    </div>
  )
}
