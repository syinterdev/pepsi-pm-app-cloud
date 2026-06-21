/** Safe array helpers — avoid `.length` on undefined (prod / partial API / i18n). */

export function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}

export function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

export function coerceNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
}
