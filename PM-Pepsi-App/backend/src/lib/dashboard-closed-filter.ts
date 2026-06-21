/**
 * KPI "ปิดแล้ว" บน dashboard / board — นับหลัง Foreman อนุมัติ QC เท่านั้น
 * @see database/migrations/080_tbiw37n_confirm_qc.sql
 * @see docs/customer-requirements/CONFIRM-QC-FLOW.md
 */
export function dashboardClosedWhere(alias = 'i'): string {
  const a = alias.trim() || 'i'
  return `${a}.actfinish IS NOT NULL
     AND LOWER(TRIM(COALESCE(${a}.confirm_qc_status, ''))) = 'approved'`
}
