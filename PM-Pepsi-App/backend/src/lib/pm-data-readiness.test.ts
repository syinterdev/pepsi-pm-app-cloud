import { describe, expect, it } from 'vitest'
import { buildPmDataReadiness } from './pm-data-readiness.js'

describe('buildPmDataReadiness', () => {
  it('reports empty mntplan and no tasks', () => {
    expect(
      buildPmDataReadiness({ mntplan: '', tasks: [], readingCount: 0 }),
    ).toEqual({
      mntplan: '',
      tasklistPublished: false,
      taskCount: 0,
      currentTaskCount: 0,
      vibrationTaskCount: 0,
      readingCount: 0,
    })
  })

  it('counts PM measurement tasks and readings', () => {
    expect(
      buildPmDataReadiness({
        mntplan: ' 610000004112 ',
        tasks: [
          { measurementKind: 'current_3phase' },
          { measurementKind: 'current_3phase' },
          { measurementKind: 'vibration_dst_db' },
          { measurementKind: 'none' },
        ],
        readingCount: 3,
      }),
    ).toEqual({
      mntplan: '610000004112',
      tasklistPublished: true,
      taskCount: 4,
      currentTaskCount: 2,
      vibrationTaskCount: 1,
      readingCount: 3,
    })
  })
})
