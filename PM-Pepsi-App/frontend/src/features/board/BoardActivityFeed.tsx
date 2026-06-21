import {
  formatBoardActivityPersonLabel,
  formatBoardActivityTime,
  type BoardActivityItem,
} from '@/lib/board-activity-api'
import { boardPersonnelAvatarUrl } from '@/lib/board-personnel-avatar'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  items: BoardActivityItem[]
  loading: boolean
  error: Error | null
  carousel?: boolean
}

function initialsFromLabel(label: string): string {
  const m = label.match(/\(([^)]+)\)/)
  const name = m?.[1]?.trim() || label
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  return (name.slice(0, 2) || '?').toUpperCase()
}

function ActivityCard({ item }: { item: BoardActivityItem }) {
  const [imgFailed, setImgFailed] = useState(false)
  const personLabel = formatBoardActivityPersonLabel(item)
  const showPhoto = item.hasImage && !imgFailed
  const kindClass =
    item.kind === 'closed'
      ? 'engineering-board__activity-card--closed'
      : 'engineering-board__activity-card--assigned'

  return (
    <article className={`engineering-board__activity-card ${kindClass}`}>
      <div className="engineering-board__activity-avatar">
        {showPhoto ? (
          <img
            src={boardPersonnelAvatarUrl(item.idwkctr)}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span>{initialsFromLabel(personLabel)}</span>
        )}
      </div>
      <div className="engineering-board__activity-body">
        <p className="engineering-board__activity-person">{personLabel}</p>
        <p className="engineering-board__activity-action">
          <span className="engineering-board__activity-label">{item.label}</span>
          <span className="engineering-board__activity-wo">WO {item.wkorder}</span>
        </p>
        <p className="engineering-board__activity-time">{formatBoardActivityTime(item.occurredAt)}</p>
      </div>
    </article>
  )
}

function ActivityCardSkeleton() {
  return <div className="engineering-board__activity-card engineering-board__activity-card--skeleton" />
}

export function BoardActivityFeed({ items, loading, error, carousel = false }: Props) {
  const { t } = useTranslation('board')
  const showSkeleton = loading && items.length === 0

  return (
    <section
      className={
        carousel
          ? 'engineering-board__zone engineering-board__zone--c engineering-board__panel engineering-board__panel--activity engineering-board__panel--activity-carousel'
          : 'engineering-board__zone engineering-board__zone--c engineering-board__panel engineering-board__panel--activity'
      }
      aria-label={t('activityFeed.aria')}
    >
      <div className="engineering-board__panel-head">
        <div>
          <p className="engineering-board__zone-tag">{t('activityFeed.zoneTag')}</p>
          <h2 className="engineering-board__panel-title engineering-board__panel-title--flush">
            {t('activityFeed.title')}
          </h2>
          <p className="engineering-board__activity-sub">{t('activityFeed.sub')}</p>
        </div>
        {!loading && !error ? (
          <span className="engineering-board__panel-badge">{items.length}</span>
        ) : null}
      </div>
      {error ? (
        <p className="engineering-board__activity-error">{t('activityFeed.error')}</p>
      ) : showSkeleton ? (
        <div className="engineering-board__activity-scroll">
          <div className="engineering-board__activity-list">
            {Array.from({ length: 4 }, (_, i) => (
              <ActivityCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <p className="engineering-board__empty">{t('activityFeed.empty')}</p>
      ) : (
        <div className="engineering-board__activity-scroll">
          <div className="engineering-board__activity-list">
            {items.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
