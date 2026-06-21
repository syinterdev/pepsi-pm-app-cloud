import type { PmDataReadiness } from '@/api/schemas'
import { cn } from '@/lib/utils'
import type { TFunction } from 'i18next'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type Props = {
  orderId: string | null
  wkorderLabel: string
  canWrite: boolean
  loading: boolean
  dataReadiness?: PmDataReadiness
}

type BannerLevel = 'success' | 'warning' | 'info'

type BannerItem = {
  key: string
  level: BannerLevel
  text: string
  action?: { to: string; label: string }
}

export function buildPmVibrationStatusItems(
  t: TFunction<'pmVibration'>,
  opts: {
    orderId: string | null
    wkorderLabel: string
    canWrite: boolean
    loading: boolean
    dataReadiness?: PmDataReadiness
  },
): BannerItem[] {
  const { orderId, wkorderLabel, canWrite, loading, dataReadiness } = opts

  if (!orderId) {
    return [{ key: 'wo', level: 'warning', text: t('readiness.selectWo') }]
  }

  const items: BannerItem[] = [
    {
      key: 'wo',
      level: 'success',
      text: t('statusWoSelected', { wkorder: wkorderLabel || orderId }),
    },
    {
      key: 'write',
      level: canWrite ? 'success' : 'warning',
      text: canWrite ? t('statusCanWrite') : t('noWritePermission'),
    },
  ]

  if (loading || !dataReadiness) {
    items.push({ key: 'loading', level: 'info', text: t('statusLoading') })
    return items
  }

  const mntplan = dataReadiness.mntplan.trim()
  if (!mntplan) {
    items.push({
      key: 'mntplan',
      level: 'warning',
      text: t('readiness.noMntplan'),
      action: {
        to: wkorderLabel ? `/iw37n?q=${encodeURIComponent(wkorderLabel)}` : '/iw37n',
        label: t('readiness.goIw37n'),
      },
    })
    return items
  }

  items.push({
    key: 'mntplan',
    level: 'success',
    text: t('readiness.mntplanOk', { mntplan }),
  })

  if (!dataReadiness.tasklistPublished) {
    items.push({
      key: 'tasklist',
      level: 'warning',
      text: t('readiness.noTasklist', { mntplan }),
      action: { to: '/master-plan', label: t('readiness.goMasterPlan') },
    })
    return items
  }

  items.push({
    key: 'tasklist',
    level: 'success',
    text: t('readiness.tasklistOk', { count: dataReadiness.taskCount }),
  })

  const pmTaskCount = dataReadiness.currentTaskCount + dataReadiness.vibrationTaskCount
  if (pmTaskCount === 0) {
    items.push({
      key: 'pmTasks',
      level: 'info',
      text: t('readiness.noPmTasks'),
    })
  } else {
    items.push({
      key: 'pmTasks',
      level: 'success',
      text: t('readiness.pmTasksOk', {
        current: dataReadiness.currentTaskCount,
        vibration: dataReadiness.vibrationTaskCount,
      }),
    })
  }

  if (dataReadiness.readingCount === 0) {
    items.push({
      key: 'readings',
      level: 'info',
      text: t('readiness.noReadings'),
    })
  } else {
    items.push({
      key: 'readings',
      level: 'success',
      text: t('readiness.readingsOk', { count: dataReadiness.readingCount }),
    })
  }

  const canManualEnter =
    canWrite &&
    Boolean(mntplan) &&
    dataReadiness.tasklistPublished &&
    pmTaskCount > 0

  const ready = canManualEnter && dataReadiness.readingCount > 0

  items.push({
    key: 'ready',
    level: ready ? 'success' : canManualEnter ? 'info' : 'warning',
    text: ready
      ? t('readiness.readySave')
      : canManualEnter && dataReadiness.readingCount === 0
        ? t('readiness.manualOkNoReadings')
        : t('readiness.canEnter'),
  })

  return items
}

function levelIcon(level: BannerLevel): string {
  if (level === 'success') return '✓'
  if (level === 'warning') return '!'
  return 'i'
}

function levelIconClass(level: BannerLevel): string {
  if (level === 'success') {
    return 'app-tone-success-fill mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold'
  }
  if (level === 'warning') {
    return 'app-tone-warning-fill mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold'
  }
  return 'app-tone-info-fill mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold'
}

export function PmVibrationStatusBanner({
  orderId,
  wkorderLabel,
  canWrite,
  loading,
  dataReadiness,
}: Props) {
  const { t } = useTranslation('pmVibration')
  const items = buildPmVibrationStatusItems(t, {
    orderId,
    wkorderLabel,
    canWrite,
    loading,
    dataReadiness,
  })
  const hasWarning = items.some((item) => item.level === 'warning')
  const allSuccess = items.every((item) => item.level === 'success')

  return (
    <div
      className={cn(
        'rounded-card border p-4 text-sm text-app',
        hasWarning
          ? 'app-tone-warning-callout'
          : allSuccess
            ? 'app-tone-info-callout border-[color-mix(in_srgb,var(--app-success)_35%,var(--app-border))]'
            : 'app-tone-info-callout',
      )}
      role="status"
      aria-live="polite"
    >
      <h2 className="font-bold">{t('statusTitle')}</h2>
      <p className="mt-1 text-xs text-app-muted">{t('readiness.intro')}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-2">
            <span className={levelIconClass(item.level)} aria-hidden>
              {levelIcon(item.level)}
            </span>
            <span className="min-w-0 flex-1">
              {item.text}
              {item.action ? (
                <>
                  {' '}
                  <Link
                    to={item.action.to}
                    className="font-medium text-[var(--app-accent)] underline-offset-2 hover:underline"
                  >
                    {item.action.label}
                  </Link>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
