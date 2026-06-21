export const RBAC_PREVIEW_EVENT = 'pm-rbac-preview-changed'
const STORAGE_KEY = 'pm_rbac_preview'

export type RbacPreview = {
  roleCode: string
  /** Thai label (role_name) */
  roleNameTh: string
  /** English label (role_name_en) */
  roleNameEn: string
  permissions: string[]
}

function normalizeRbacPreview(parsed: unknown): RbacPreview | null {
  if (!parsed || typeof parsed !== 'object') return null
  const p = parsed as Record<string, unknown>
  if (typeof p.roleCode !== 'string' || !Array.isArray(p.permissions)) return null
  const legacyName = typeof p.roleName === 'string' ? p.roleName : ''
  const roleNameTh =
    typeof p.roleNameTh === 'string' ? p.roleNameTh : legacyName || String(p.roleCode)
  const roleNameEn =
    typeof p.roleNameEn === 'string' ? p.roleNameEn : legacyName || roleNameTh
  return {
    roleCode: p.roleCode,
    roleNameTh,
    roleNameEn,
    permissions: p.permissions.filter((x): x is string => typeof x === 'string'),
  }
}

/** Stable parse cache — required for useSyncExternalStore (referential equality). */
let cachedPreviewRaw: string | null | undefined
let cachedPreviewParsed: RbacPreview | null = null

function readRbacPreview(): RbacPreview | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (raw === cachedPreviewRaw) return cachedPreviewParsed
  cachedPreviewRaw = raw
  if (!raw) {
    cachedPreviewParsed = null
    return null
  }
  try {
    cachedPreviewParsed = normalizeRbacPreview(JSON.parse(raw))
  } catch {
    cachedPreviewParsed = null
  }
  return cachedPreviewParsed
}

/** Snapshot for useSyncExternalStore — same reference until sessionStorage changes. */
export function getRbacPreviewSnapshot(): RbacPreview | null {
  return readRbacPreview()
}

export function subscribeRbacPreview(onStoreChange: () => void) {
  window.addEventListener(RBAC_PREVIEW_EVENT, onStoreChange)
  return () => window.removeEventListener(RBAC_PREVIEW_EVENT, onStoreChange)
}

export function setRbacPreview(preview: RbacPreview | null) {
  if (preview) {
    const raw = JSON.stringify(preview)
    sessionStorage.setItem(STORAGE_KEY, raw)
    cachedPreviewRaw = raw
    cachedPreviewParsed = preview
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
    cachedPreviewRaw = null
    cachedPreviewParsed = null
  }
  window.dispatchEvent(new Event(RBAC_PREVIEW_EVENT))
}

export function clearRbacPreview() {
  setRbacPreview(null)
}

/** Test-only: reset in-memory cache between vitest cases. */
export function resetRbacPreviewCacheForTests(): void {
  cachedPreviewRaw = undefined
  cachedPreviewParsed = null
}









