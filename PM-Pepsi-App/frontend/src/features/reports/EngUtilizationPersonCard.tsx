import { Badge } from '@/components/ui/badge'
import { personnelImageUrl } from '@/lib/api-public'
import {
  formatEngUtilizationHrHour,
  type EngUtilizationChartRow,
} from '@/lib/eng-utilization-chart'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  person: EngUtilizationChartRow
  showRca?: boolean
  /** ธีม Engineering Board kiosk */
  variant?: 'default' | 'kiosk'
  /** บน board ใช้ `boardPersonnelAvatarUrl` แทน `/personnel/.../image` */
  imageUrl?: (idwkctr: string) => string
}

function initialsFromLabel(label: string): string {
  const m = label.match(/\(([^)]+)\)/)
  const name = m?.[1]?.trim() || label
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  return (name.slice(0, 2) || '?').toUpperCase()
}

/** Person card with photo */
export function EngUtilizationPersonCard({
  person,
  showRca = false,
  variant = 'default',
  imageUrl,
}: Props) {
  const { t } = useTranslation('reports')
  const kiosk = variant === 'kiosk'
  const [imgFailed, setImgFailed] = useState(false)
  const showPhoto = person.hasImage && !imgFailed
  const photoSrc = imageUrl
    ? imageUrl(person.idwkctr)
    : personnelImageUrl(person.idwkctr)
  const total = showRca
    ? person.percentPm + person.percentReactive + person.percentRca
    : person.percentTotalExcel

  const cardClass = kiosk
    ? 'eng-util-person-card eng-util-person-card--kiosk'
    : 'flex flex-col items-center rounded-card border border-app bg-[var(--app-surface)] p-3 shadow-sm'

  const avatarClass = kiosk
    ? 'eng-util-person-card__avatar'
    : 'relative flex size-20 items-center justify-center overflow-hidden rounded-card border border-app bg-app-muted'

  return (
    <div className={cardClass}>
      <div className={avatarClass}>
        {showPhoto ? (
          <img
            src={photoSrc}
            alt={person.label}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span
            className={
              kiosk
                ? 'text-xl font-semibold text-white/50'
                : 'text-lg font-semibold text-app-muted'
            }
          >
            {initialsFromLabel(person.label)}
          </span>
        )}
      </div>

      <p
        className={
          kiosk
            ? 'eng-util-person-card__label'
            : 'mt-2 line-clamp-2 min-h-[2.5rem] text-center text-xs font-medium leading-tight text-app'
        }
      >
        {person.label}
      </p>

      {kiosk ? (
        <div
          className="eng-util-person-card__stats"
          aria-label={t('engUtil.cardStatsAria')}
        >
          <div className="eng-util-person-card__stat">
            <span className="eng-util-person-card__stat-value">
              {formatEngUtilizationHrHour(person.hrHour)}
            </span>
            <span className="eng-util-person-card__stat-label">
              {t('engUtil.cardHrHour')}
            </span>
          </div>
          <div className="eng-util-person-card__stat">
            <span className="eng-util-person-card__stat-value">{person.woCount}</span>
            <span className="eng-util-person-card__stat-label">{t('engUtil.cardWo')}</span>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-center text-caption tabular-nums text-app-muted">
          {t('engUtil.cardHrWoLine', {
            hr: formatEngUtilizationHrHour(person.hrHour),
            wo: person.woCount,
          })}
        </p>
      )}

      <div
        className={
          kiosk
            ? 'eng-util-person-card__bar-track'
            : 'mt-2 h-2 w-full overflow-hidden rounded-full bg-app-muted'
        }
      >
        <div className="flex h-full w-full">
          <div
            className="app-tone-success-strip-fill h-full"
            style={{ width: `${Math.min(100, person.percentPm)}%` }}
            title={t('engUtil.cardPctPmTitle', {
              pct: person.percentPm.toFixed(1),
            })}
          />
          <div
            className="h-full bg-rose-500"
            style={{ width: `${Math.min(100, person.percentReactive)}%` }}
            title={t('engUtil.cardPctReactiveTitle', {
              pct: person.percentReactive.toFixed(1),
            })}
          />
          {showRca ? (
            <div
              className="app-tone-info-fill h-full"
              style={{ width: `${Math.min(100, person.percentRca)}%` }}
              title={t('engUtil.cardPctRcaTitle', {
                pct: person.percentRca.toFixed(1),
              })}
            />
          ) : null}
        </div>
      </div>
      <p
        className={
          kiosk
            ? 'eng-util-person-card__total'
            : 'app-tone-success-strong mt-1 text-center text-body-sm font-semibold tabular-nums'
        }
      >
        {total.toFixed(1)}%
      </p>
      <p className={kiosk ? 'eng-util-person-card__meta' : 'text-center text-badge text-app-muted'}>
        {t('engUtil.cardMeta', {
          pm: person.percentPm.toFixed(0),
          re: person.percentReactive.toFixed(0),
          rca: showRca
            ? t('engUtil.cardRcaSuffix', { pct: person.percentRca.toFixed(0) })
            : '',
        })}
      </p>
      {!kiosk && (!person.hasImage || imgFailed) ? (
        <Badge variant="outline" className="app-tone-warning-badge mt-1 text-badge">
          {t('engUtil.cardNoPhoto')}
        </Badge>
      ) : null}
    </div>
  )
}
