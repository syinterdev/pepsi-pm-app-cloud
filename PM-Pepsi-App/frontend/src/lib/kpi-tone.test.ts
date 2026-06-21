import { describe, expect, it } from 'vitest'
import { kpiStatToneClass } from '@/components/kpi/kpi-tone'

describe('kpiStatToneClass', () => {
  it('includes semantic tone classes', () => {
    expect(kpiStatToneClass('emerald')).toContain('app-tone-success')
    expect(kpiStatToneClass('amber')).toContain('app-tone-warning')
    expect(kpiStatToneClass('info')).toContain('app-tone-info')
  })
})
