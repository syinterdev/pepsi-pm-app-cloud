/** สถานะที่ไม่ใช่ SAP syst — ใช้สี move-over บนปฏิทินเท่านั้น */
export const SYSTEM_STATUS_FILTER_EXCLUDE = new Set(['MOVE OVER'])

export const TECO_STATUS_FILTER_OPTION = {
  code: 'TECO',
  label: 'TECO = งานที่ถูกปิดแล้ว',
} as const

export type SystemStatusFilterOption = { code: string; label: string }

export function formatSystemStatusFilterLabel(syst: string, wkstreason: string | null): string {
  const reason = wkstreason?.trim()
  return reason ? `${syst} = ${reason}` : syst
}

/** รวม TECO และเรียง syst — กันกรณียังไม่รัน migration 089 */
export function finalizeSystemStatusFilterOptions(
  rows: SystemStatusFilterOption[],
): SystemStatusFilterOption[] {
  const filtered = rows.filter((row) => !SYSTEM_STATUS_FILTER_EXCLUDE.has(row.code))
  if (!filtered.some((row) => row.code === TECO_STATUS_FILTER_OPTION.code)) {
    filtered.push({ ...TECO_STATUS_FILTER_OPTION })
  }
  return filtered.sort((a, b) => a.code.localeCompare(b.code))
}
