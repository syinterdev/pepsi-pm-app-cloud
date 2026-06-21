import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearApiMetrics,
  getSlowApiMetrics,
  normalizeApiRoute,
  recordApiDuration,
} from './api-metrics.js'

describe('api-metrics', () => {
  beforeEach(() => clearApiMetrics())

  it('normalizes numeric and uuid segments', () => {
    expect(normalizeApiRoute('/api/v1/admin/users/42')).toBe('/api/v1/admin/users/:id')
    expect(
      normalizeApiRoute(
        '/api/v1/work-orders/550e8400-e29b-41d4-a716-446655440000',
      ),
    ).toBe('/api/v1/work-orders/:id')
  })

  it('returns routes with p95 above threshold', () => {
    const route = '/api/v1/admin/health'
    for (let i = 0; i < 20; i += 1) recordApiDuration(route, 100)
    for (let i = 0; i < 5; i += 1) recordApiDuration(route, 2500)
    const slow = getSlowApiMetrics({ p95ThresholdMs: 1000, limit: 10 })
    expect(slow.some((r) => r.route === route && r.p95Ms >= 1000)).toBe(true)
  })
})
