import { expect, test } from '@playwright/test'

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:4000'

test.describe('API smoke (no login)', () => {
  test('GET /api/v1/health returns ok and db status', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/health`)
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { ok: boolean; service: string; db: string }
    expect(body.ok).toBe(true)
    expect(body.service).toBe('pm-api')
    expect(['ok', 'error']).toContain(body.db)
  })

  test('GET /api/v1/settings/public returns branding shape', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/settings/public`)
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { appName?: string; themeMode?: string }
    expect(typeof body.appName).toBe('string')
    expect(body.themeMode === 'light' || body.themeMode === 'dark' || body.themeMode === 'system').toBe(
      true,
    )
  })

  test('POST /api/v1/auth/login rejects bad credentials', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { username: '__e2e_invalid__', password: 'wrong', mode: 'workcenter' },
    })
    expect(res.status()).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('INVALID_CREDENTIALS')
  })

  test('GET /api/v1/confirmation/export requires auth', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/confirmation/export`)
    expect(res.status()).toBe(401)
  })
})
