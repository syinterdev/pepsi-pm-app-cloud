import type { ActiveAnnouncement } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import { fetchActiveAnnouncements } from '@/lib/announcements-api'
import {
  dismissAnnouncement,
  readDismissedAnnouncements,
} from '@/lib/announcement-dismiss'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

function levelClass(level: ActiveAnnouncement['level']): string {
  switch (level) {
    case 'warn':
      return 'app-announcement--warn'
    case 'error':
      return 'app-announcement--error'
    case 'maintenance':
      return 'app-announcement--maintenance'
    default:
      return 'app-announcement--info'
  }
}

export function AnnouncementBannerRow({
  item,
  onDismiss,
  className,
}: {
  item: ActiveAnnouncement
  onDismiss: (id: number) => void
  className?: string
}) {
  const { t } = useTranslation('common')

  return (
    <div
      role="status"
      className={cn(
        'app-announcement flex items-start gap-3 border-b px-4 py-2.5 text-body-sm',
        levelClass(item.level),
        className,
      )}
    >
      <Megaphone className="app-announcement__icon mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <strong className="font-semibold">{item.title}</strong>
        {item.body ? (
          <p className="mt-1 whitespace-pre-wrap opacity-90">{item.body}</p>
        ) : null}
      </div>
      {item.dismissable ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="app-announcement__dismiss shrink-0"
          aria-label={t('announcements.dismissAria', { title: item.title })}
          title={t('announcements.dismissTitle')}
          onClick={() => onDismiss(item.id)}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}

/** ประกาศที่ active — แสดงเฉพาะคอลัมน์เนื้อหา (ไม่ทับ sidebar) */
export function AnnouncementBanner() {
  const { t } = useTranslation('common')
  const [dismissed, setDismissed] = useState(() => readDismissedAnnouncements())

  const q = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: fetchActiveAnnouncements,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const onDismiss = useCallback((id: number) => {
    setDismissed(dismissAnnouncement(id))
  }, [])

  const visible = useMemo(
    () => (q.data?.items ?? []).filter((a) => !dismissed.has(a.id)),
    [q.data?.items, dismissed],
  )

  if (visible.length === 0) return null

  return (
    <div className="app-announcement-zone" role="region" aria-label={t('announcements.regionAria')}>
      {visible.map((item) => (
        <AnnouncementBannerRow key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
