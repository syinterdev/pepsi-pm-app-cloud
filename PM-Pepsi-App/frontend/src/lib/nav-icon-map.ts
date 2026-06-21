import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  BookText,
  CalendarDays,
  ClipboardList,
  Clock3,
  Database,
  DatabaseBackup,
  Activity,
  History,
  Home,
  Info,
  Lock,
  LayoutDashboard,
  LayoutList,
  LineChart,
  Megaphone,
  MessageSquare,
  Palette,
  Printer,
  UserCog,
  Settings,
  Settings2,
  ShieldCheck,
  Menu,
  Timer,
  Users,
  Wrench,
  Circle,
} from 'lucide-react'

const byRoute: Record<string, LucideIcon> = {
  '/': Home,
  '/plan-calendar': CalendarDays,
  '/calendar': CalendarDays,
  '/backlog': LayoutList,
  '/work-orders': ClipboardList,
  '/confirmation': Users,
  '/planning': Wrench,
  '/integration': ArrowLeftRight,
  '/iw37n': Database,
  '/master-plan': Boxes,
  '/master-data': Database,
  '/manhours': Timer,
  '/worktime': Clock3,
  '/personnel': Users,
  '/personnel/confirm': ShieldCheck,
  '/reports': BarChart3,
  '/reports/audit': ShieldCheck,
  '/manhours-hr': Printer,
  '/summary-weekly': LineChart,
  '/settings': Settings,
  '/user-log': BookText,
  '/admin': LayoutDashboard,
  '/admin/branding': Palette,
  '/admin/settings': Settings2,
  '/admin/audit': History,
  '/admin/health': Activity,
  '/admin/backup': DatabaseBackup,
  '/admin/announcements': Megaphone,
  '/admin/telegram': MessageSquare,
  '/admin/security': Lock,
  '/admin/about': Info,
  '/admin/users': UserCog,
  '/admin/roles': ShieldCheck,
  '/admin/menu': Menu,
  '/personnel/admin': UserCog,
}

/** แปลง `menuicon` จาก tbmenu หรือใช้ route เป็น fallback */
export function resolveNavIcon(reactRoute: string, menuicon?: string): LucideIcon {
  const fromRoute = byRoute[reactRoute]
  if (fromRoute) return fromRoute
  const icon = (menuicon ?? '').toLowerCase()
  if (icon.includes('calendar')) return CalendarDays
  if (icon.includes('home')) return Home
  if (icon.includes('database')) return Database
  if (icon.includes('user')) return Users
  if (icon.includes('book')) return BookText
  if (icon.includes('chart')) return BarChart3
  if (icon.includes('cog')) return Settings
  if (icon.includes('palette')) return Palette
  return Circle
}
