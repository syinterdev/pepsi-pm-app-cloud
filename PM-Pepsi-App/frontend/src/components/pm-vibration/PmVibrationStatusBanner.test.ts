import { describe, expect, it } from 'vitest'
import { buildPmVibrationStatusItems } from './PmVibrationStatusBanner'

const t = ((key: string, opts?: Record<string, unknown>) => {
  if (opts) return `${key}:${JSON.stringify(opts)}`
  return key
}) as never

describe('buildPmVibrationStatusItems', () => {
  it('warns when no WO selected', () => {
    const items = buildPmVibrationStatusItems(t, {
      orderId: null,
      wkorderLabel: '',
      canWrite: true,
      loading: false,
    })
    expect(items).toHaveLength(1)
    expect(items[0]?.key).toBe('wo')
    expect(items[0]?.level).toBe('warning')
  })

  it('links to master plan when mntplan exists but tasklist missing', () => {
    const items = buildPmVibrationStatusItems(t, {
      orderId: '1261',
      wkorderLabel: '4000126314',
      canWrite: true,
      loading: false,
      dataReadiness: {
        mntplan: '346012',
        tasklistPublished: false,
        taskCount: 0,
        currentTaskCount: 0,
        vibrationTaskCount: 0,
        readingCount: 0,
      },
    })
    const tasklist = items.find((i) => i.key === 'tasklist')
    expect(tasklist?.level).toBe('warning')
    expect(tasklist?.action?.to).toBe('/master-plan')
  })

  it('shows ready when data is complete', () => {
    const items = buildPmVibrationStatusItems(t, {
      orderId: '1261',
      wkorderLabel: '4001567009',
      canWrite: true,
      loading: false,
      dataReadiness: {
        mntplan: '610000004112',
        tasklistPublished: true,
        taskCount: 20,
        currentTaskCount: 0,
        vibrationTaskCount: 2,
        readingCount: 1,
      },
    })
    expect(items.find((i) => i.key === 'ready')?.level).toBe('success')
  })

  it('prompts manual entry when tasks exist but no readings', () => {
    const items = buildPmVibrationStatusItems(t, {
      orderId: '1261',
      wkorderLabel: '4001567009',
      canWrite: true,
      loading: false,
      dataReadiness: {
        mntplan: '610000004112',
        tasklistPublished: true,
        taskCount: 20,
        currentTaskCount: 3,
        vibrationTaskCount: 0,
        readingCount: 0,
      },
    })
    expect(items.find((i) => i.key === 'readings')?.text).toBe('readiness.noReadings')
    expect(items.find((i) => i.key === 'ready')?.text).toBe('readiness.manualOkNoReadings')
    expect(items.find((i) => i.key === 'ready')?.level).toBe('info')
  })
})
