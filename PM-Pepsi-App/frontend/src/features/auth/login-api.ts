import {
  authSessionResponseSchema,
  authUserSchema,
  loginResponseSchema,
  logoutResponseSchema,
  type AuthUser,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import { clearImpersonationStarted, markImpersonationStarted } from '@/lib/impersonation-session'

const AUTH_TOKEN_KEY = 'pm_auth_token'
const AUTH_USER_KEY = 'pm_auth_user'
const IMPERSONATOR_TOKEN_KEY = 'pm_impersonator_token'
const IMPERSONATOR_USER_KEY = 'pm_impersonator_user'
export const AUTH_CHANGED_EVENT = 'pm-auth-changed'

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export async function refreshAuthSession(): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false
  try {
    const json = await fetchApi<unknown>('/api/v1/auth/me')
    const data = authSessionResponseSchema.parse(json)
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
    notifyAuthChanged()
    return true
  } catch {
    clearStoredAuth()
    return false
  }
}

export type LoginMode = 'workcenter' | 'member'

export async function loginWithApi(
  username: string,
  password: string,
  mode: LoginMode = 'workcenter',
) {
  const json = await fetchApi<unknown>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, mode }),
  })
  const data = loginResponseSchema.parse(json)
  sessionStorage.setItem(AUTH_TOKEN_KEY, data.token)
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
  notifyAuthChanged()
  await refreshAuthSession()
  return data
}

/** Stable parse cache — required for useSyncExternalStore (referential equality). */
let cachedUserRaw: string | null | undefined
let cachedUserParsed: AuthUser | null = null

function readStoredAuthUser(): AuthUser | null {
  const raw = sessionStorage.getItem(AUTH_USER_KEY)
  if (raw === cachedUserRaw) return cachedUserParsed
  cachedUserRaw = raw
  if (!raw) {
    cachedUserParsed = null
    return null
  }
  try {
    const parsed = authUserSchema.safeParse(JSON.parse(raw))
    cachedUserParsed = parsed.success ? parsed.data : null
  } catch {
    cachedUserParsed = null
  }
  return cachedUserParsed
}

export function getStoredAuthUser(): AuthUser | null {
  return readStoredAuthUser()
}

/** Snapshot for useSyncExternalStore — same reference until sessionStorage changes. */
export function getStoredAuthUserSnapshot(): AuthUser | null {
  return readStoredAuthUser()
}

export function isLoggedIn(): boolean {
  return getAuthToken() !== null && getStoredAuthUser() !== null
}

export async function logoutWithApi(): Promise<void> {
  const user = getStoredAuthUser()
  if (user) {
    try {
      const json = await fetchApi<unknown>('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.memId ?? user.idwkctr,
          username: user.username,
          accountType: user.accountType ?? 'workcenter',
        }),
      })
      logoutResponseSchema.parse(json)
    } catch {
      // เคลียร์ client แม้ API ล้มเหลว
    }
  }
  clearStoredAuth()
}

export function clearStoredAuth() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(IMPERSONATOR_TOKEN_KEY)
  sessionStorage.removeItem(IMPERSONATOR_USER_KEY)
  cachedUserRaw = undefined
  cachedUserParsed = null
  notifyAuthChanged()
}

export function applyImpersonationSession(data: { token: string; user: AuthUser }) {
  const currentToken = getAuthToken()
  const currentUser = getStoredAuthUser()
  if (currentToken && currentUser && !currentUser.impersonatedBy) {
    sessionStorage.setItem(IMPERSONATOR_TOKEN_KEY, currentToken)
    sessionStorage.setItem(IMPERSONATOR_USER_KEY, JSON.stringify(currentUser))
  }
  sessionStorage.setItem(AUTH_TOKEN_KEY, data.token)
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
  markImpersonationStarted()
  cachedUserRaw = undefined
  notifyAuthChanged()
}

export function endImpersonationSession(): boolean {
  const token = sessionStorage.getItem(IMPERSONATOR_TOKEN_KEY)
  const userRaw = sessionStorage.getItem(IMPERSONATOR_USER_KEY)
  if (!token || !userRaw) return false
  sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  sessionStorage.setItem(AUTH_USER_KEY, userRaw)
  sessionStorage.removeItem(IMPERSONATOR_TOKEN_KEY)
  sessionStorage.removeItem(IMPERSONATOR_USER_KEY)
  clearImpersonationStarted()
  cachedUserRaw = undefined
  notifyAuthChanged()
  return true
}
