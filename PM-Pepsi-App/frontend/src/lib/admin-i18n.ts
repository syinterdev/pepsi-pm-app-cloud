import type { TFunction } from 'i18next'
import {
  ADMIN_SECTION_GROUPS,
  ADMIN_SECTIONS,
  type AdminSection,
  type AdminSectionGroup,
  type AdminSectionGroupId,
} from '@/lib/admin-sections'

export function adminSectionSegmentKey(segment: string): string {
  return segment || 'console'
}

export function tAdminSectionLabel(segment: string, t: TFunction<'admin'>): string {
  return t(`sections.${adminSectionSegmentKey(segment)}.label`)
}

export function tAdminSectionDescription(segment: string, t: TFunction<'admin'>): string {
  return t(`sections.${adminSectionSegmentKey(segment)}.description`)
}

export function tAdminSectionGroupLabel(groupId: AdminSectionGroupId, t: TFunction<'admin'>): string {
  return t(`sections.groups.${groupId}`)
}

export function localizeAdminSection(section: AdminSection, t: TFunction<'admin'>): AdminSection & {
  label: string
  description: string
} {
  return {
    ...section,
    label: tAdminSectionLabel(section.segment, t),
    description: tAdminSectionDescription(section.segment, t),
  }
}

export function localizeAdminSectionGroup(
  group: AdminSectionGroup,
  t: TFunction<'admin'>,
): AdminSectionGroup & { label: string } {
  return {
    ...group,
    label: tAdminSectionGroupLabel(group.id, t),
  }
}

export function adminSectionByPath(pathname: string): AdminSection | undefined {
  if (pathname === '/admin' || pathname === '/admin/') {
    return ADMIN_SECTIONS.find((s) => s.segment === '')
  }
  return ADMIN_SECTIONS.find((s) => s.segment && pathname === `/admin/${s.segment}`)
}

/** Breadcrumb trail for `/admin/*` */
export function adminBreadcrumbTrail(
  pathname: string,
  t: TFunction<'admin'>,
): { label: string; to?: string; current?: boolean }[] {
  const section = adminSectionByPath(pathname)
  const crumbs: { label: string; to?: string; current?: boolean }[] = [
    { label: t('breadcrumb.home'), to: '/' },
    { label: t('breadcrumb.admin'), to: '/admin' },
  ]

  if (!section) return crumbs

  if (!section.segment) {
    crumbs.push({ label: tAdminSectionLabel(section.segment, t), current: true })
    return crumbs
  }

  const group = ADMIN_SECTION_GROUPS.find((g) => g.id === section.group)
  if (group) crumbs.push({ label: tAdminSectionGroupLabel(group.id, t) })
  crumbs.push({ label: tAdminSectionLabel(section.segment, t), current: true })
  return crumbs
}

export function adminSectionGroupLabelForSection(
  section: AdminSection | undefined,
  t: TFunction<'admin'>,
): string | undefined {
  if (!section?.segment) return undefined
  const group = ADMIN_SECTION_GROUPS.find((g) => g.id === section.group)
  return group ? tAdminSectionGroupLabel(group.id, t) : undefined
}

/** Map `/admin/*` nav labels when localizing sidebar */
export function translateAdminNavLabel(path: string, t: TFunction): string | undefined {
  if (!path.startsWith('/admin')) return undefined
  const section = adminSectionByPath(path.split('?')[0] ?? path)
  if (!section) return undefined
  const key = `admin:sections.${adminSectionSegmentKey(section.segment)}.label`
  if (t(key) !== key) return t(key)
  return undefined
}
