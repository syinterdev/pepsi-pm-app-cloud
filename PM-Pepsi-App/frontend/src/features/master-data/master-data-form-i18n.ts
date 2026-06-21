import type { TFunction } from 'i18next'

type MdT = TFunction<'masterData', undefined>

export function mdField(t: MdT, key: string): string {
  return t(`fields.${key}` as 'fields')
}

export function mdRequired(t: MdT, key: string): string {
  return t('validation.required', { field: mdField(t, key) })
}

export function mdMaxLen(t: MdT, key: string, max: number): string {
  return t('validation.maxLength', { field: mdField(t, key), max })
}

export function mdNumber(t: MdT, key: string): string {
  return t('validation.number', { field: mdField(t, key) })
}
