import type { NavLinkEntry } from '@/components/layout/nav-config'
import { tAdminSectionLabel } from '@/lib/admin-i18n'
import { ADMIN_SECTIONS } from '@/lib/admin-sections'
import type { TFunction } from 'i18next'

/** Sidebar items for `/admin/*` — aligned with ADMIN_SECTIONS */
export function buildAdminNavEntries(t: TFunction<'admin'>): NavLinkEntry[] {
  return ADMIN_SECTIONS.filter((s) => s.implemented).map((s) => ({
    kind: 'item' as const,
    to: s.to,
    label: tAdminSectionLabel(s.segment, t),
    icon: s.icon,
    menuright: 'A',
    permission: s.permission,
    end: s.segment === '',
  }))
}
