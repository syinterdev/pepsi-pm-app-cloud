import { markTourSeenOnServer } from '@/lib/user-pref-api'
import { isLoggedIn } from '@/features/auth/login-api'

const STORAGE_KEY = 'pm_seen_admin_tour'
const TOUR_KEY = 'admin'

export function hasSeenAdminTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markAdminTourSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
  if (isLoggedIn()) {
    void markTourSeenOnServer(TOUR_KEY).catch(() => {
      /* offline or migration 068 not applied */
    })
  }
}

export function clearAdminTourSeen(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Prefer server `seenTours.admin` when migration 068 is applied */
export async function hasSeenAdminTourAsync(): Promise<boolean> {
  if (hasSeenAdminTour()) return true
  if (!isLoggedIn()) return false
  try {
    const { fetchUserPreferences } = await import('@/lib/user-pref-api')
    const pref = await fetchUserPreferences()
    if (pref.seenTours[TOUR_KEY]) {
      markAdminTourSeen()
      return true
    }
  } catch {
    /* schema missing or network */
  }
  return false
}
