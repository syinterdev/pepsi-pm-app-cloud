import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { licenseStatusLabel, migrationProgressPercent } from './about-display'

const t = ((key: string) => {
  const map: Record<string, string> = {
    'about.license.not_configured': 'ยังไม่ตั้งค่า',
    'about.license.active': 'ใช้งานได้',
  }
  return map[key] ?? key
}) as TFunction<'admin'>

describe('about-display', () => {
  it('labels known license statuses', () => {
    expect(licenseStatusLabel('not_configured', t)).toContain('ยังไม่')
    expect(licenseStatusLabel('active', t)).toBe('ใช้งานได้')
  })

  it('computes migration percent', () => {
    expect(migrationProgressPercent(7, 10)).toBe(70)
    expect(migrationProgressPercent(0, 0)).toBe(0)
  })
})
