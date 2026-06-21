import { coerceStringArray } from '@/lib/coerce-array'
import type { TFunction } from 'i18next'

/** Page hero hint chips — always returns a string[] (never undefined). */
export function hintsFromT(t: TFunction, key: string): string[] {
  return coerceStringArray(t(key, { returnObjects: true }))
}
