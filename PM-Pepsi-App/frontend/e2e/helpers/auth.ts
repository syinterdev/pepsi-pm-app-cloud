import type { APIRequestContext, Page } from '@playwright/test'

export const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:4000'

type WorkcenterCreds = { username: string; password: string }

/** Dev seed `009_dev_auth_seed.sql` */
export function devSeedCredentials(): WorkcenterCreds | null {
  if (process.env.E2E_USE_DEV_SEED !== '1') return null
  return { username: 'ADMIN01', password: 'admin' }
}

export function devTechnicianCredentials(): WorkcenterCreds | null {
  if (process.env.E2E_USE_DEV_SEED !== '1') return null
  return { username: 'WC001', password: 'wc001' }
}

export function e2eCredentials(): WorkcenterCreds | null {
  const username = process.env.E2E_ADMIN_USER?.trim()
  const password = process.env.E2E_ADMIN_PASSWORD
  if (username && password) return { username, password }
  return devSeedCredentials()
}

export async function apiLoginAs(
  request: APIRequestContext,
  creds: WorkcenterCreds,
): Promise<{ token: string; user: Record<string, unknown>; apiBase: string }> {
  const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { username: creds.username, password: creds.password, mode: 'workcenter' },
  })
  if (!loginRes.ok()) {
    throw new Error(`Login failed (${creds.username}): ${loginRes.status()} ${await loginRes.text()}`)
  }
  const body = (await loginRes.json()) as { token: string; user: Record<string, unknown> }
  return { token: body.token, user: body.user, apiBase: API_BASE }
}

export async function apiLogin(request: APIRequestContext): Promise<{
  token: string
  user: unknown
  apiBase: string
}> {
  const creds = e2eCredentials()
  if (!creds) {
    throw new Error('Set E2E_ADMIN_USER/E2E_ADMIN_PASSWORD or E2E_USE_DEV_SEED=1')
  }
  return apiLoginAs(request, creds)
}

export type SessionOverride = 'supervisor-readonly'

function applySessionOverride(
  user: Record<string, unknown>,
  override?: SessionOverride,
): Record<string, unknown> {
  if (override !== 'supervisor-readonly') return user
  const perms = Array.isArray(user.permissions)
    ? (user.permissions as string[]).filter((p) => p !== 'confirmation.write')
    : ['confirmation.read', 'work-orders.read', 'dashboard.read', 'reports.read']
  return {
    ...user,
    userst: 'U',
    permissions: perms.includes('confirmation.read')
      ? perms
      : [...perms, 'confirmation.read'],
  }
}

export async function seedWorkcenterSession(
  request: APIRequestContext,
  page: Page,
  creds: WorkcenterCreds,
  opts?: { clearTourSeen?: boolean; override?: SessionOverride },
): Promise<void> {
  const { token, user } = await apiLoginAs(request, creds)
  const sessionUser = applySessionOverride(user, opts?.override)
  const clearTourSeen = opts?.clearTourSeen ?? false

  await page.addInitScript(
    ([tok, usr, clearSeen]) => {
      sessionStorage.setItem('pm_auth_token', tok)
      sessionStorage.setItem('pm_auth_user', JSON.stringify(usr))
      if (clearSeen) {
        localStorage.removeItem('pm_seen_admin_tour')
      } else {
        localStorage.setItem('pm_seen_admin_tour', '1')
      }
    },
    [token, sessionUser, clearTourSeen],
  )
}

export async function seedAdminSession(
  request: APIRequestContext,
  page: Page,
  opts?: { clearTourSeen?: boolean },
): Promise<void> {
  const creds = e2eCredentials()
  if (!creds) {
    throw new Error('Set E2E_ADMIN_USER/E2E_ADMIN_PASSWORD or E2E_USE_DEV_SEED=1')
  }
  await seedWorkcenterSession(request, page, creds, opts)
}
