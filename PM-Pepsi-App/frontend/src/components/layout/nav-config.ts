import { i18n } from '@/i18n'
import { buildAdminNavEntries } from '@/lib/admin-nav-entries'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BadgeCheck,
  BarChart3,
  BookText,
  Boxes,
  CalendarDays,
  ClipboardList,
  Clock3,
  Database,
  Home,
  LayoutList,
  LineChart,
  Monitor,
  Printer,
  Settings,
  ShieldCheck,
  Timer,
  Users,
  Wrench,
} from 'lucide-react'
export type NavHeading = { kind: 'heading'; label: string }

export type NavLinkEntry = {
  kind: 'item'
  to: string
  label: string
  icon: LucideIcon
  menuright: string
  permission?: string
  end?: boolean
}

export type NavEntry = NavHeading | NavLinkEntry

/** Fallback nav when API menu unavailable — labels match `locales/en/nav.json` */
export const appNav: NavEntry[] = [
  { kind: 'heading', label: 'Monitor & Public' },
  {
    kind: 'item',
    to: '/board',
    label: 'Engineering Board (Kiosk)',
    icon: Monitor,
    menuright: 'A:U:W',
  },

  { kind: 'heading', label: 'Calendar & Work Orders' },
  { kind: 'item', to: '/', label: 'Dashboard', icon: Home, menuright: 'A:U:W', end: true },
  { kind: 'item', to: '/plan-calendar', label: 'Plan Calendar', icon: CalendarDays, menuright: 'A:U:W' },
  { kind: 'item', to: '/calendar', label: 'Work Scheduling Calendar', icon: CalendarDays, menuright: 'A:U:W' },
  { kind: 'item', to: '/backlog', label: 'Backlog', icon: LayoutList, menuright: 'A:U:W' },
  { kind: 'item', to: '/work-orders', label: 'WO / Confirmation', icon: ClipboardList, menuright: 'A:U:W' },
  {
    kind: 'item',
    to: '/pm-vibration',
    label: 'PM Measurements / 3-Phase',
    icon: LineChart,
    menuright: 'A:U:W',
    permission: 'confirmation.read',
  },
  { kind: 'item', to: '/confirmation', label: 'Confirmation', icon: BadgeCheck, menuright: 'A:U', permission: 'confirmation.read' },

  { kind: 'heading', label: 'Planning & SAP Import' },
  { kind: 'item', to: '/planning', label: 'PM/CM Planning', icon: Wrench, menuright: 'A' },
  {
    kind: 'item',
    to: '/integration',
    label: 'SAP CSV / Integration',
    icon: ArrowLeftRight,
    menuright: 'A',
  },
  { kind: 'item', to: '/iw37n', label: 'IW37N Import', icon: Database, menuright: 'A' },
  { kind: 'item', to: '/master-plan', label: 'Master Plan', icon: Boxes, menuright: 'A' },
  { kind: 'item', to: '/master-data', label: 'Master Data (SAP)', icon: Database, menuright: 'A' },

  { kind: 'heading', label: 'Hours & Personnel' },
  { kind: 'item', to: '/manhours', label: 'Manhours', icon: Timer, menuright: 'A' },
  { kind: 'item', to: '/worktime', label: 'Summary Overall', icon: Clock3, menuright: 'A:U:W' },
  {
    kind: 'item',
    to: '/personnel',
    label: 'Personal Dashboard',
    icon: Users,
    menuright: 'A:U:W',
    end: true,
  },

  { kind: 'heading', label: 'Reports' },
  {
    kind: 'item',
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    menuright: 'A:U:W',
    end: true,
  },
  { kind: 'item', to: '/reports/audit', label: 'Auditor Hub', icon: ShieldCheck, menuright: 'A:U:W' },
  { kind: 'item', to: '/activity-log', label: 'Activity Log', icon: BookText, menuright: 'A:U:W' },
  { kind: 'item', to: '/manhours-hr', label: 'Manhour HR', icon: Printer, menuright: 'A:U:W' },
  { kind: 'item', to: '/summary-weekly', label: 'Eng Utilization', icon: LineChart, menuright: 'A:U:W' },

  { kind: 'heading', label: 'Administrator' },
  ...buildAdminNavEntries(i18n.getFixedT('en', 'admin')),

  { kind: 'heading', label: 'System' },
  { kind: 'item', to: '/user-log', label: 'User Log', icon: BookText, menuright: 'A:U:W' },
  { kind: 'item', to: '/settings', label: 'Settings', icon: Settings, menuright: 'A' },
]
