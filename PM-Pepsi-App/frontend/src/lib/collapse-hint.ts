import { i18n } from '@/i18n'

/** Strip "press arrow to…" prefix from collapsed filter subtitle */
export function collapseHintSummary(hint: string): string | undefined {
  const trimmed = hint.trim()
  if (!trimmed) return undefined
  const prefix = i18n.t('collapseHint.arrowPrefix', { ns: 'common' })
  const arrowRe = new RegExp(`^${escapeRegExp(prefix)}`)
  const sep = ' · '
  if (trimmed.includes(sep)) {
    const [first, ...rest] = trimmed.split(sep)
    if (first && arrowRe.test(first)) {
      const tail = rest.join(sep).trim()
      return tail || undefined
    }
  }
  if (arrowRe.test(trimmed)) return undefined
  return trimmed
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}