import { describe, expect, it, vi } from 'vitest'
import { fetchApi } from './fetch-api'
import { MaintenanceModeError } from './maintenance-error'

describe('fetchApi maintenance 503', () => {
  it('throws MaintenanceModeError when body.error is MAINTENANCE', async () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () =>
          JSON.stringify({
            error: 'MAINTENANCE',
            message: 'กำลังกู้คืนฐานข้อมูล',
          }),
      }),
    )
    await expect(fetchApi('/api/v1/planning/assign')).rejects.toBeInstanceOf(MaintenanceModeError)
    await expect(fetchApi('/api/v1/planning/assign')).rejects.toThrow('กำลังกู้คืนฐานข้อมูล')
    vi.unstubAllGlobals()
  })
})
