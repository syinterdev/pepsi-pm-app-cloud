import type { TFunction } from 'i18next'

export function licenseStatusLabel(status: string, t: TFunction<'admin'>): string {
  const key = `about.license.${status}` as const
  const translated = t(key)
  return translated !== key ? translated : status
}

export function licenseStatusTone(status: string): 'ok' | 'warn' | 'muted' {
  if (status === 'active' || status === 'configured' || status === 'trial') return 'ok'
  if (status === 'expired') return 'warn'
  return 'muted'
}

export function migrationProgressPercent(applied: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((applied / total) * 100))
}
