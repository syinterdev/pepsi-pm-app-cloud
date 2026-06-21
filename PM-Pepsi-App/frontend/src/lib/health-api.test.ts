import { describe, expect, it } from 'vitest'
import { publicHealthResponseSchema } from '@/lib/health-api'

describe('publicHealthResponseSchema', () => {
  it('parses health with versions', () => {
    const parsed = publicHealthResponseSchema.parse({
      ok: true,
      service: 'pm-api',
      time: '2026-05-22T00:00:00.000Z',
      db: 'ok',
      apiVersion: '1.2.3',
      webVersion: '0.0.0',
    })
    expect(parsed.apiVersion).toBe('1.2.3')
  })
})
