import { expect, test } from '@playwright/test'
import { apiLogin, e2eCredentials } from './helpers/auth'

const hasCreds = e2eCredentials() != null

test.describe('Confirmation export API (RBAC scope)', () => {
  test.skip(!hasCreds, 'Set E2E_ADMIN_USER + E2E_ADMIN_PASSWORD')

  test('export JSON returns scope ALL or OWN (not wkctr hardcode)', async ({ request }) => {
    const session = await apiLogin(request)
    const res = await request.get(`${session.apiBase}/api/v1/confirmation/export`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    if (res.status() === 503) {
      test.skip(true, 'Confirmation schema not migrated on this database')
    }
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as {
      scope: 'ALL' | 'OWN'
      actorWkctr: string
      totalRows: number
      items: unknown[]
    }
    expect(['ALL', 'OWN']).toContain(body.scope)
    expect(typeof body.actorWkctr).toBe('string')
    expect(typeof body.totalRows).toBe('number')
    expect(Array.isArray(body.items)).toBe(true)
  })
})
