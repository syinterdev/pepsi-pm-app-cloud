/** ปิด portal API + handoff — ตั้ง `PORTAL_ENABLED=false` (ค่าเริ่มต้น: เปิด) */
export function isPortalEnabled(): boolean {
  return process.env.PORTAL_ENABLED?.trim().toLowerCase() !== 'false'
}

/** ปิด module handoff โดยไม่ปิด `GET /portal/modules` — `MODULE_HANDOFF_ENABLED=false` */
export function isModuleHandoffEnabled(): boolean {
  return process.env.MODULE_HANDOFF_ENABLED?.trim().toLowerCase() !== 'false'
}
