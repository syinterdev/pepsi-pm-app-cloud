import type { AuthUser } from '@/api/schemas'
import type { NavEntry, NavLinkEntry } from '@/components/layout/nav-config'
import type { TFunction } from 'i18next'

const ROUTE_HINT_KEYS: Record<string, string> = {
  '/plan-calendar': 'planCalendar',
  '/calendar': 'calendar',
  '/backlog': 'backlog',
  '/work-orders': 'workOrders',
  '/confirmation': 'confirmation',
  '/planning': 'planning',
  '/iw37n': 'iw37n',
  '/master-plan': 'masterPlan',
  '/master-data': 'masterData',
  '/manhours': 'manhours',
  '/worktime': 'worktime',
  '/personnel': 'personnel',
  '/personnel/confirm': 'personnelConfirm',
  '/reports': 'reports',
  '/manhours-hr': 'manhoursHr',
  '/summary-weekly': 'summaryWeekly',
  '/user-log': 'userLog',
  '/settings': 'settings',
  '/admin': 'admin',
}

function routeHint(to: string, t: TFunction<'home'>): string {
  const slug = ROUTE_HINT_KEYS[to]
  if (slug) return t(`routeHints.${slug}`)
  return t('routeHints.default')
}

export function displayUserName(user: AuthUser): string {
  const parts = [user.titlewkctr, user.namewkctr, user.surnamewkctr].filter(Boolean)
  const th = parts.join(' ').trim()
  if (th) return th
  if (user.fullnameTh?.trim()) return user.fullnameTh.trim()
  return user.username
}

export function navItemsToQuickLinks(
  entries: NavEntry[],
  t: TFunction<'home'>,
): {
  to: string
  label: string
  hint: string
  icon: NavLinkEntry['icon']
}[] {
  return entries
    .filter((e): e is NavLinkEntry => e.kind === 'item' && e.to !== '/')
    .map((e) => ({
      to: e.to,
      label: e.label.replace(/\s*\/\s*.+$/, '').trim() || e.label,
      hint: routeHint(e.to, t),
      icon: e.icon,
    }))
}
