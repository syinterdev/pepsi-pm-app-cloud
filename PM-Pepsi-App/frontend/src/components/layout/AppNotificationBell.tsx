import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api-public'
import { usePermission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AppNotificationBell() {
  const { t } = useTranslation('common')
  const canReceive = usePermission('confirmation.import')
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
    enabled: canReceive,
  })

  const markReadM = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllM = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = q.data?.unreadCount ?? 0
  const items = q.data?.items ?? []

  if (!canReceive) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="app-topbar-icon-btn relative size-11 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--app-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--app-surface)_88%,white)] shadow-sm hover:bg-[var(--app-surface)] hover:shadow-md"
          aria-label={
            unread > 0
              ? t('notifications.ariaUnread', { count: unread })
              : t('notifications.aria')
          }
        >
          <Bell className="size-4" aria-hidden />
          {unread > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-danger)] px-1 text-[10px] font-bold leading-none text-white"
              aria-hidden
            >
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-app px-3 py-2">
          <p className="text-body-sm font-semibold text-app">{t('notifications.title')}</p>
          {unread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={markAllM.isPending}
              onClick={() => markAllM.mutate()}
            >
              {t('notifications.markAllRead')}
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-body-sm text-app-muted">{t('notifications.empty')}</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                to={item.linkRoute ?? '/confirmation'}
                className={cn(
                  'block border-b border-app px-3 py-2.5 last:border-b-0 hover:bg-app-subtle',
                  !item.read && 'bg-[color-mix(in_srgb,var(--app-accent)_8%,transparent)]',
                )}
                onClick={() => {
                  if (!item.read) markReadM.mutate(item.id)
                  setOpen(false)
                }}
              >
                <p className="text-body-sm font-medium text-app">{item.title}</p>
                {item.body ? (
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-caption text-app-muted">
                    {item.body}
                  </p>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
