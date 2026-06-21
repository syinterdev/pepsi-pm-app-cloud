/** Layout density for admin (skill-theme.md §5 — Cozy vs Compact). */
export type AdminLayoutDensity = 'cozy' | 'compact'

const STORAGE_KEY = 'pm_admin_density'

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStorage(value: AdminLayoutDensity): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
    sessionStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* ignore */
  }
}

export function readAdminDensity(): AdminLayoutDensity {
  const raw = readStorage()
  if (raw === 'compact') return 'compact'
  return 'cozy'
}

export function writeAdminDensity(value: AdminLayoutDensity): void {
  writeStorage(value)
  window.dispatchEvent(new Event(ADMIN_DENSITY_EVENT))
}

export const ADMIN_DENSITY_EVENT = 'pm-admin-density'

export function subscribeAdminDensity(onChange: () => void): () => void {
  const handler = () => onChange()
  window.addEventListener(ADMIN_DENSITY_EVENT, handler)
  return () => window.removeEventListener(ADMIN_DENSITY_EVENT, handler)
}
