import type { TFunction } from 'i18next'
import { localizeAdminSection, localizeAdminSectionGroup } from '@/lib/admin-i18n'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Boxes,
  DatabaseBackup,
  History,
  Info,
  LayoutDashboard,
  ListTree,
  Lock,
  Megaphone,
  MessageSquare,
  Palette,
  Settings2,
  ShieldCheck,
  UserCog,
} from 'lucide-react'

export type AdminSectionGroupId = 'overview' | 'access' | 'appearance' | 'data' | 'ops' | 'comms'

export type AdminSectionGroup = {
  id: AdminSectionGroupId
  order: number
}

export const ADMIN_SECTION_GROUPS: AdminSectionGroup[] = [
  { id: 'overview', order: 0 },
  { id: 'access', order: 1 },
  { id: 'appearance', order: 2 },
  { id: 'data', order: 3 },
  { id: 'ops', order: 4 },
  { id: 'comms', order: 5 },
]

export type AdminSection = {
  /** Path segment after `/admin` (empty = console index) */
  segment: string
  to: string
  icon: LucideIcon
  permission: string
  group: AdminSectionGroupId
  /** Shown in nav but links to placeholder until Phase E */
  implemented: boolean
  tourTarget: string
}

/** Admin sections per 14-administrator.md — Phase F navigation */
export const ADMIN_SECTIONS: AdminSection[] = [
  {
    segment: '',
    to: '/admin',
    icon: LayoutDashboard,
    permission: 'admin.settings.read',
    group: 'overview',
    implemented: true,
    tourTarget: 'admin-console',
  },
  {
    segment: 'users',
    to: '/admin/users',
    icon: UserCog,
    permission: 'admin.users.read',
    group: 'access',
    implemented: true,
    tourTarget: 'admin-users',
  },
  {
    segment: 'roles',
    to: '/admin/roles',
    icon: ShieldCheck,
    permission: 'admin.roles.read',
    group: 'access',
    implemented: true,
    tourTarget: 'admin-roles',
  },
  {
    segment: 'menu',
    to: '/admin/menu',
    icon: ListTree,
    permission: 'admin.menu.read',
    group: 'access',
    implemented: true,
    tourTarget: 'admin-menu',
  },
  {
    segment: 'branding',
    to: '/admin/branding',
    icon: Palette,
    permission: 'admin.branding.read',
    group: 'appearance',
    implemented: true,
    tourTarget: 'admin-branding',
  },
  {
    segment: 'settings',
    to: '/admin/settings',
    icon: Settings2,
    permission: 'admin.settings.read',
    group: 'appearance',
    implemented: true,
    tourTarget: 'admin-settings',
  },
  {
    segment: 'master',
    to: '/admin/master',
    icon: Boxes,
    permission: 'master-data.read',
    group: 'data',
    implemented: true,
    tourTarget: 'admin-master',
  },
  {
    segment: 'audit',
    to: '/admin/audit',
    icon: History,
    permission: 'admin.audit.read',
    group: 'data',
    implemented: true,
    tourTarget: 'admin-audit',
  },
  {
    segment: 'health',
    to: '/admin/health',
    icon: Activity,
    permission: 'admin.health.read',
    group: 'ops',
    implemented: true,
    tourTarget: 'admin-health',
  },
  {
    segment: 'backup',
    to: '/admin/backup',
    icon: DatabaseBackup,
    permission: 'admin.backup.read',
    group: 'ops',
    implemented: true,
    tourTarget: 'admin-backup',
  },
  {
    segment: 'announcements',
    to: '/admin/announcements',
    icon: Megaphone,
    permission: 'admin.announcement.read',
    group: 'comms',
    implemented: true,
    tourTarget: 'admin-announcements',
  },
  {
    segment: 'telegram',
    to: '/admin/telegram',
    icon: MessageSquare,
    permission: 'admin.telegram.read',
    group: 'comms',
    implemented: true,
    tourTarget: 'admin-telegram',
  },
  {
    segment: 'security',
    to: '/admin/security',
    icon: Lock,
    permission: 'admin.security.read',
    group: 'comms',
    implemented: true,
    tourTarget: 'admin-security',
  },
  {
    segment: 'about',
    to: '/admin/about',
    icon: Info,
    permission: 'admin.about.read',
    group: 'comms',
    implemented: true,
    tourTarget: 'admin-about',
  },
]

export type LocalizedAdminSection = AdminSection & { label: string; description: string }

export type GroupedAdminSections = {
  group: AdminSectionGroup & { label: string }
  sections: LocalizedAdminSection[]
}

/** Sections grouped for Admin Console quick links & command palette */
export function getGroupedAdminSections(
  t: TFunction<'admin'>,
  opts?: {
    /** Exclude console index (segment '') */
    skipOverview?: boolean
  },
): GroupedAdminSections[] {
  const skipOverview = opts?.skipOverview ?? true
  const pool = ADMIN_SECTIONS.filter((s) => {
    if (!s.implemented) return false
    if (skipOverview && !s.segment) return false
    return true
  })

  return ADMIN_SECTION_GROUPS.map((group) => ({
    group: localizeAdminSectionGroup(group, t),
    sections: pool
      .filter((s) => s.group === group.id)
      .map((s) => localizeAdminSection(s, t)),
  })).filter((g) => g.sections.length > 0)
}

export const ADMIN_READ_PERMISSIONS = [
  ...new Set([
    ...ADMIN_SECTIONS.map((s) => s.permission),
    'admin.menu.write',
    'admin.console.read',
  ]),
] as string[]

/** Count of implemented admin pages (includes Console) */
export function countAccessibleAdminSections(
  permissions: string[] | undefined,
): { total: number; accessible: number } {
  const implemented = ADMIN_SECTIONS.filter((s) => s.implemented)
  const total = implemented.length
  if (!permissions?.length) {
    return { total, accessible: total }
  }
  const accessible = implemented.filter((s) => permissions.includes(s.permission)).length
  return { total, accessible }
}

export function adminSectionForPath(pathname: string): AdminSection | undefined {
  if (pathname === '/admin' || pathname === '/admin/') {
    return ADMIN_SECTIONS.find((s) => s.segment === '')
  }
  const match = ADMIN_SECTIONS.find(
    (s) => s.segment && pathname === `/admin/${s.segment}`,
  )
  return match
}
