import type { AppLocale } from '@/lib/app-locale'

export type RoleLabelSource = {
  roleNameTh?: string | null
  roleNameEn?: string | null
  sysstatus?: string | null
  userst?: string | null
}

/** Pick role label for current UI locale (navbar, profile, etc.). */
export function resolveRoleDisplayLabel(
  source: RoleLabelSource,
  locale: AppLocale,
): string {
  const th = source.roleNameTh?.trim() || source.sysstatus?.trim() || ''
  const en = source.roleNameEn?.trim() || th
  if (locale === 'en') return en || source.userst?.trim() || '—'
  return th || en || source.userst?.trim() || '—'
}

/** Menu Builder / preview dropdown — `A - Admin` */
export function formatRolePreviewOption(
  roleCode: string,
  locale: AppLocale,
  source?: RoleLabelSource | null,
): string {
  const code = roleCode.trim().toUpperCase()
  if (source) {
    const name = resolveRoleDisplayLabel({ ...source, userst: code }, locale)
    if (name && name !== code) return `${code} - ${name}`
  }
  return code
}
