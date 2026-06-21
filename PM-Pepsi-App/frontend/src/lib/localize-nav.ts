import type { NavEntry, NavLinkEntry } from '@/components/layout/nav-config'
import { i18n } from '@/i18n'
import { translateAdminNavLabel } from '@/lib/admin-i18n'
import type { TFunction } from 'i18next'
import type { AppLocale } from '@/lib/app-locale'

/** tbmenu / fallback heading labels → i18n key under nav:headings.* */
export const NAV_HEADING_LABEL_KEYS: Record<string, string> = {
  'จอมอนิเตอร์ & สาธารณะ': 'monitorPublic',
  'ปฏิทิน & ใบงาน': 'calendarWo',
  'แผน & นำเข้า SAP': 'planSap',
  'ชั่วโมง & บุคลากร': 'hoursPersonnel',
  'รายงาน': 'reports',
  'ผู้ดูแลระบบ': 'admin',
  'ระบบ': 'system',
  // English headings from mixed menus
  'Monitor & Public': 'monitorPublic',
  'Calendar & Work Orders': 'calendarWo',
}

function navPathKey(to: string): string {
  return to.split('?')[0] ?? to
}

function translateRoute(path: string, t: TFunction): string | undefined {
  const admin = translateAdminNavLabel(path, t)
  if (admin) return admin
  const key = `nav:routes.${path}`
  if (!i18n.exists(key)) return undefined
  return t(key)
}

function translateHeading(label: string, t: TFunction): string | undefined {
  const slug = NAV_HEADING_LABEL_KEYS[label]
  if (!slug) return undefined
  const key = `nav:headings.${slug}`
  if (t(key) !== key) return t(key)
  return undefined
}

/** Apply UI locale to sidebar/nav labels (route keys + known headings). */
export function localizeNavEntries(
  entries: NavEntry[],
  t: TFunction,
  locale: AppLocale,
): NavEntry[] {
  if (locale === 'th') {
    return entries.map((entry) => {
      if (entry.kind !== 'item') return entry
      const path = navPathKey(entry.to)
      const thLabel = translateRoute(path, t)
      return thLabel ? { ...entry, label: thLabel } : entry
    })
  }

  return entries.map((entry) => {
    if (entry.kind === 'heading') {
      const label = translateHeading(entry.label, t) ?? entry.label
      return { ...entry, label }
    }
    const path = navPathKey((entry as NavLinkEntry).to)
    const label = translateRoute(path, t) ?? entry.label
    return { ...entry, label }
  })
}
