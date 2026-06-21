/** Matches backend IMPERSONATION_TTL_MS (30 minutes). */
export const IMPERSONATION_TTL_MS = 30 * 60 * 1000
export const IMPERSONATION_STARTED_KEY = 'pm_impersonation_started_at'

export function markImpersonationStarted(): void {
  try {
    sessionStorage.setItem(IMPERSONATION_STARTED_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function clearImpersonationStarted(): void {
  try {
    sessionStorage.removeItem(IMPERSONATION_STARTED_KEY)
  } catch {
    /* ignore */
  }
}
