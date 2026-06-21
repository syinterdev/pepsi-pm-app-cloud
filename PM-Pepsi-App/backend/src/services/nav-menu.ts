import type { Pool } from 'pg'
import type { z } from 'zod'
import type { navMenuResponseSchema } from '../schemas/nav.js'
import { canAccessMenuright } from '../lib/menuright.js'

type NavMenuResponse = z.infer<typeof navMenuResponseSchema>
type NavItem = NavMenuResponse['items'][number]

/** Routes removed from product — hide from sidebar even if tbmenu still has a row. */
const DEPRECATED_NAV_ROUTES = new Set([
  '/line-calendar',
  '/manhours/admin',
  '/personnel/admin',
  '/personnel/confirm',
])

function isDeprecatedNavItem(to: string, menulink: string | null): boolean {
  if (DEPRECATED_NAV_ROUTES.has(to.split('?')[0] ?? to)) return true
  if (menulink?.toLowerCase().includes('line_calendar')) return true
  const link = menulink?.toLowerCase() ?? ''
  if (link.includes('m_manhour') && !link.includes('m_manhour_chart')) return true
  return false
}

type MenuRow = {
  menu_kind: string
  menutitle: string
  menuright: string
  menuicon: string | null
  menulink: string | null
  react_route: string | null
  end_exact: boolean
}

export async function listNavMenuForUser(pool: Pool, userst: string): Promise<NavMenuResponse> {
  const r = await pool.query<MenuRow>(
    `SELECT menu_kind, menutitle, menuright, menuicon, menulink, react_route, end_exact
     FROM app.tbmenu
     ORDER BY menuon ASC, idmenu ASC`,
  )

  const items: NavItem[] = []
  let pendingHeading: NavItem | null = null
  const pendingItems: NavItem[] = []

  const flushBlock = () => {
    if (pendingHeading && pendingItems.length > 0) {
      items.push(pendingHeading)
      items.push(...pendingItems)
    }
    pendingHeading = null
    pendingItems.length = 0
  }

  for (const row of r.rows) {
    if (row.menu_kind === 'heading') {
      flushBlock()
      pendingHeading = {
        kind: 'heading',
        label: row.menutitle.trim(),
        menuright: row.menuright.trim(),
      }
      continue
    }

    if (!canAccessMenuright(userst, row.menuright)) continue

    const to = row.react_route?.trim() || legacyMenulinkToRoute(row.menulink)
    if (!to || isDeprecatedNavItem(to, row.menulink)) continue

    pendingItems.push({
      kind: 'item',
      label: row.menutitle.trim(),
      to,
      menuright: row.menuright.trim(),
      icon: row.menuicon?.trim() || undefined,
      end: row.end_exact,
    })
  }
  flushBlock()

  return { items }
}

/** แปลง menulink URL → path React */
export function legacyMenulinkToRoute(menulink: string | null): string | null {
  if (!menulink?.trim()) return null
  const raw = menulink.trim()
  if (raw.startsWith('/')) return raw.split('?')[0] || raw

  const moduleMatch = raw.match(/[?&]module=([A-Za-z0-9_]+)/i)
  if (!moduleMatch) return null

  const mod = moduleMatch[1].toLowerCase()
  const map: Record<string, string> = {
    calendar: '/calendar',
    backlog: '/backlog',
    workorder: '/work-orders',
    m_confirmation: '/confirmation',
    m_planwork_view: '/planning',
    m_iw37n: '/iw37n',
    m_activitytype: '/master-data',
    m_manhour: '/manhours/admin',
    m_manhour_chart: '/manhours',
    m_manhour_chart_performance: '/manhours',
    m_manhour_chart_show: '/manhours',
    w_worktime_view: '/worktime',
    m_personel: '/personnel',
    w_manhours_hr: '/manhours-hr',
    w_summary_weekly: '/summary-weekly',
    w_summary_weekly_chart: '/summary-weekly/chart/full?variant=chart',
    w_summary_weekly_chart_full: '/summary-weekly/chart/full?variant=chart',
    w_summary_weekly_chart2: '/summary-weekly',
    w_summary_weekly_chart2_full: '/summary-weekly/chart/full?variant=chart2',
    user: '/settings',
    content: '/',
    info: '/',
  }
  return map[mod] ?? null
}
