/** ปิด portal → post-login แบบเดิม (ตั้ง `VITE_PORTAL_ENABLED=false`) */
export function isPortalEnabled(): boolean {
  return import.meta.env.VITE_PORTAL_ENABLED !== 'false'
}

/**
 * ข้าม /portal เมื่อมีสิทธิ์ module เดียว (ช่าง W) — เปิดด้วย `VITE_PORTAL_AUTO_SKIP=true`
 * ค่าเริ่มต้น: **แสดง portal เสมอ** (เหมาะ UAT / demo)
 */
export function isPortalAutoSkipEnabled(): boolean {
  return import.meta.env.VITE_PORTAL_AUTO_SKIP === 'true'
}

export const PORTAL_PATH = '/portal'

export const PORTAL_DEFERRED_PATH_KEY = 'pm_portal_deferred_path'
