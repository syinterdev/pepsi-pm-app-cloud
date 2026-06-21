/** SAP mass confirmation limit — ประชุมลูกค้า ครั้งที่ 2 / WORK-PHASES Phase 3 */
export const SAP_MASS_CONFIRM_MAX = 44

export function assertMassConfirmBatchSize(count: number): void {
  if (count > SAP_MASS_CONFIRM_MAX) {
    throw new Error(`Maximum ${SAP_MASS_CONFIRM_MAX} work orders per batch (SAP mass confirm)`)
  }
}
