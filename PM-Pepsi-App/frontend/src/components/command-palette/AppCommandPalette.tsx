import type { NavEntry, NavLinkEntry } from '@/components/layout/nav-config'
import { CommandPaletteShortcutBadge } from '@/components/command-palette/CommandPaletteShortcutBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ADMIN_SECTIONS, getGroupedAdminSections } from '@/lib/admin-sections'
import { permissionForRoute } from '@/lib/nav-route-permissions'
import { useAppNav } from '@/lib/use-app-nav'
import { hasPermission } from '@/lib/permissions'
import { useAnyPermission, useAuthUser } from '@/lib/use-permission'
import { useShowPortalLink } from '@/lib/use-portal-modules'
import { cn } from '@/lib/utils'
import { Command } from 'cmdk'
import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

type PaletteItem = {
  id: string
  label: string
  hint?: string
  group: string
  to: string
  icon: LucideIcon
  disabled?: boolean
}

function navGroupOrder(entries: NavEntry[]): string[] {
  const order: string[] = []
  const seen = new Set<string>()
  for (const e of entries) {
    if (e.kind === 'heading' && !seen.has(e.label)) {
      seen.add(e.label)
      order.push(e.label)
    }
  }
  return order
}

function flattenNavItems(entries: NavEntry[]): PaletteItem[] {
  const out: PaletteItem[] = []
  let group = ''
  for (const e of entries) {
    if (e.kind === 'heading') {
      group = e.label
      continue
    }
    const item = e as NavLinkEntry
    out.push({
      id: `nav-${item.to}`,
      label: item.label,
      hint: item.to,
      group,
      to: item.to,
      icon: item.icon,
    })
  }
  return out
}

export function AppCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t: tAdmin } = useTranslation('admin')
  const { t: tPortal } = useTranslation('portal')
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authUser = useAuthUser()
  const showPortalLink = useShowPortalLink()
  const { entries } = useAppNav()
  const canAdmin = useAnyPermission(
    ADMIN_SECTIONS.filter((s) => s.implemented).map((s) => s.permission),
  )

  const canAccess = useCallback(
    (to: string) => {
      const perm = permissionForRoute(to)
      if (perm) return hasPermission(authUser, perm)
      return true
    },
    [authUser],
  )

  const adminItems = useMemo(() => {
    const groupLabel = new Map(
      getGroupedAdminSections(tAdmin, { skipOverview: false }).map((g) => [g.group.id, g.group.label]),
    )
    return getGroupedAdminSections(tAdmin, { skipOverview: false })
      .flatMap((g) => g.sections)
      .filter((s) => hasPermission(authUser, s.permission))
      .map((s) => ({
        id: `admin-${s.segment || 'console'}`,
        label: s.label,
        hint: s.description,
        group: `${tAdmin('breadcrumb.admin')} · ${groupLabel.get(s.group) ?? s.group}`,
        to: s.to,
        icon: s.icon,
        disabled: false,
      }))
  }, [authUser, tAdmin])

  const portalItems = useMemo((): PaletteItem[] => {
    if (!showPortalLink) return []
    return [
      {
        id: 'portal-hub',
        label: tPortal('backToPortal'),
        hint: tPortal('commandPaletteHint'),
        group: tPortal('commandPaletteGroup'),
        to: '/portal',
        icon: LayoutGrid,
      },
    ]
  }, [showPortalLink, tPortal])

  const navItems = useMemo(() => {
    const items = flattenNavItems(entries)
    const mainGroup = t('commandPalette.mainNavGroup')
    return items.map((item) =>
      item.group === '' ? { ...item, group: mainGroup } : item,
    )
  }, [entries, t])

  const run = useCallback(
    (to: string) => {
      onOpenChange(false)
      navigate(to)
    },
    [navigate, onOpenChange],
  )

  const orderedGroups = useMemo(() => {
    const byGroup = new Map<string, PaletteItem[]>()
    const push = (item: PaletteItem) => {
      if (!canAccess(item.to)) return
      const list = byGroup.get(item.group) ?? []
      list.push(item)
      byGroup.set(item.group, list)
    }
    portalItems.forEach(push)
    navItems.forEach(push)
    if (canAdmin) adminItems.forEach(push)

    const order: string[] = [
      ...portalItems.map((i) => i.group),
      ...navGroupOrder(entries),
    ]
    const adminGroupLabels = [
      ...new Set(adminItems.map((i) => i.group).filter((g) => !order.includes(g))),
    ]
    const keys = [...order, ...adminGroupLabels]

    return keys
      .filter((g) => (byGroup.get(g)?.length ?? 0) > 0)
      .map((name) => ({ name, items: byGroup.get(name)! }))
  }, [adminItems, canAccess, canAdmin, entries, navItems, portalItems])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t('commandPalette.title')}</DialogTitle>
        <DialogDescription>{t('commandPalette.description')}</DialogDescription>
      </DialogHeader>
      <DialogContent className="app-command-palette gap-0 overflow-hidden p-0 sm:max-w-lg">
        <Command className="app-command-palette__cmd" label={t('commandPalette.label')}>
          <div className="app-command-palette__input-row flex items-center gap-2 border-b border-app px-3">
            <Search className="size-4 shrink-0 text-app-muted" aria-hidden />
            <Command.Input
              placeholder={t('commandPalette.placeholder')}
              className="flex h-12 min-w-0 flex-1 bg-transparent py-3 text-body-sm outline-none placeholder:text-app-muted"
            />
            <CommandPaletteShortcutBadge className="shrink-0 text-app-muted" />
          </div>
          <Command.List className="max-h-[min(360px,50vh)] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-caption text-app-muted">
              {t('commandPalette.empty')}
            </Command.Empty>
            {orderedGroups.map(({ name, items }) => (
              <Command.Group key={name} heading={name} className="app-command-palette__group">
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Command.Item
                      key={item.id}
                      value={`${name} ${item.label} ${item.hint ?? ''} ${item.to}`}
                      disabled={item.disabled}
                      onSelect={() => run(item.to)}
                      className={cn(
                        'app-command-palette__item flex cursor-pointer items-center gap-3 rounded-button px-2 py-2.5 text-body-sm',
                        item.disabled && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className="app-command-palette__item-icon flex size-8 shrink-0 items-center justify-center rounded-button border border-app bg-app-subtle text-app-muted"
                        aria-hidden
                      >
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-app">{item.label}</span>
                        {item.hint ? (
                          <span className="block truncate text-caption text-app-muted">
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            ))}
          </Command.List>
          <div className="app-command-palette__footer flex items-center justify-between gap-2 border-t border-app px-3 py-2 text-caption text-app-muted">
            <span>{t('commandPalette.footer')}</span>
            <CommandPaletteShortcutBadge />
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

/** Global ⌘K / Ctrl+K */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'k' && e.key !== 'K') return
      if (!e.metaKey && !e.ctrlKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      onOpen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}
