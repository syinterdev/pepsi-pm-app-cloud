import { describe, expect, it } from 'vitest'
import { filterReadingsForTask } from './pm-measurement-chart'
import type { WoPmReading } from '@/api/schemas'

const baseReading = (patch: Partial<WoPmReading> & Pick<WoPmReading, 'idreading' | 'kind'>): WoPmReading => ({
  idreading: patch.idreading,
  machine: patch.machine ?? 'Pump A',
  pmlist: patch.pmlist ?? 'ตรวจเช็คกระแส 3 เฟส',
  kind: patch.kind,
  measuredAt: patch.measuredAt ?? '2026-06-21T08:00:00.000Z',
  v1: patch.v1 ?? 1,
  v2: patch.v2 ?? 2,
  v3: patch.v3 ?? 3,
  unit: patch.unit ?? 'A',
  warningLimit: patch.warningLimit ?? null,
  alarmLimit: patch.alarmLimit ?? null,
  wkctr: patch.wkctr ?? 'ADMIN01',
})

describe('filterReadingsForTask', () => {
  const readings = [
    baseReading({ idreading: 1, kind: 'current_3phase', v1: 97.5 }),
    baseReading({ idreading: 2, kind: 'vibration_dst_db', v1: 1.2, unit: 'mm/s' }),
    baseReading({ idreading: 3, kind: 'current_3phase', machine: 'Fan B', v1: 40 }),
    baseReading({ idreading: 4, kind: 'vibration_dst_db', pmlist: 'Check grease', v1: 0.5 }),
  ]

  it('matches machine and pmlist when kind omitted', () => {
    expect(filterReadingsForTask(readings, 'Pump A', 'ตรวจเช็คกระแส 3 เฟส')).toHaveLength(2)
  })

  it('filters by current_3phase kind only', () => {
    const filtered = filterReadingsForTask(
      readings,
      'Pump A',
      'ตรวจเช็คกระแส 3 เฟส',
      'current_3phase',
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.idreading).toBe(1)
    expect(filtered[0]?.kind).toBe('current_3phase')
  })

  it('filters by vibration_dst_db kind only', () => {
    const filtered = filterReadingsForTask(
      readings,
      'Pump A',
      'ตรวจเช็คกระแส 3 เฟส',
      'vibration_dst_db',
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.idreading).toBe(2)
  })

  it('returns empty when kind does not match any reading for task', () => {
    expect(
      filterReadingsForTask(readings, 'Pump A', 'Check grease', 'current_3phase'),
    ).toHaveLength(0)
  })
})
