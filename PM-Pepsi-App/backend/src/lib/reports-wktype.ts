/**
 * ประเภท WO ในรายงานสัปดาห์ — สอดคล้อง ENG-UTILIZATION-2026 + MEETING ZD/ZB
 * PM = ZB02 (ZD02) · Reactive = ZB01 + ZB05 (ZD05 + ZD01)
 */
export const SUMMARY_WEEKLY_PM_WKTYPES = ['ZB02'] as const
export const SUMMARY_WEEKLY_REACTIVE_WKTYPES = ['ZB01', 'ZB05'] as const

export function sqlWktypeInList(codes: readonly string[]): string {
  const quoted = codes.map((c) => `'${c.replace(/'/g, "''")}'`).join(', ')
  return `wktype IN (${quoted})`
}
