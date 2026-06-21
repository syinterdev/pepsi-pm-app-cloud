import { describe, expect, it } from 'vitest'
import {
  buildPmVibrationDeepLink,
  findMeasureTask,
  matchesPmTask,
  parsePmTaskFocusFromSearchParams,
  pmTaskAnchorId,
} from './pm-vibration-deep-link'

describe('pm-vibration-deep-link', () => {
  const tasks = [
    { machine: 'Main Oil Pump', pmlist: 'Motor Front', measurementKind: 'vibration_dst_db' as const },
    { machine: 'Combustion Fan', pmlist: 'ตรวจเช็คกระแส 3 เฟส', measurementKind: 'current_3phase' as const },
  ]

  it('matchesPmTask is case-insensitive', () => {
    expect(matchesPmTask(tasks[0], 'main oil pump', 'motor front')).toBe(true)
    expect(matchesPmTask(tasks[0], 'Main Oil Pump', 'Pump')).toBe(false)
  })

  it('findMeasureTask returns matching row', () => {
    expect(findMeasureTask(tasks, 'Combustion Fan', 'ตรวจเช็คกระแส 3 เฟส')?.machine).toBe(
      'Combustion Fan',
    )
    expect(findMeasureTask(tasks, 'Missing', 'x')).toBeUndefined()
  })

  it('buildPmVibrationDeepLink encodes query', () => {
    expect(buildPmVibrationDeepLink({ wkorder: '4001567009', machine: 'Pump', pmlist: 'A&B' })).toBe(
      '/pm-vibration?wkorder=4001567009&machine=Pump&pmlist=A%26B',
    )
  })

  it('parsePmTaskFocusFromSearchParams', () => {
    const params = new URLSearchParams('machine=Oil&pmlist=Check')
    expect(parsePmTaskFocusFromSearchParams(params)).toEqual({ machine: 'Oil', pmlist: 'Check' })
    expect(parsePmTaskFocusFromSearchParams(new URLSearchParams())).toBeNull()
  })

  it('pmTaskAnchorId is stable', () => {
    expect(pmTaskAnchorId('Main Oil Pump', 'Motor Front')).toBe('pm-task-main-oil-pump|motor-front')
  })
})
