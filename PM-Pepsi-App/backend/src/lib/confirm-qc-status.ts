/** Planner ตรวจชุดปิดงาน (รูป + เวลา + confirm) ก่อนเข้า dashboard */
export function isPlannerReviewerRole(userst: string | null | undefined): boolean {
  return (userst ?? '').trim().toUpperCase() === 'U'
}

export function assertPlannerReviewerRole(userst: string | null | undefined): void {
  if (!isPlannerReviewerRole(userst)) {
    throw new Error('PLANNER_REVIEW_REQUIRED')
  }
}
export const CONFIRM_QC_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ConfirmQcStatus = (typeof CONFIRM_QC_STATUSES)[number]

export function parseConfirmQcStatus(raw: unknown): ConfirmQcStatus | null {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'pending' || s === 'approved' || s === 'rejected') return s
  return null
}

/** นับเป็น「ปิดงานแล้ว」ใน workflow / dashboard / export */
export function isConfirmQcApproved(status: string | null | undefined): boolean {
  return status === 'approved'
}

export function confirmQcStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'pending':
      return 'รอ Planner ตรวจ'
    case 'approved':
      return 'อนุมัติแล้ว'
    case 'rejected':
      return 'ส่งกลับแก้ไข'
    default:
      return 'ยังไม่ส่งตรวจ'
  }
}
