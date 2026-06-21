/** มอบหมายทีม WO — สอดคล้องตัวกรอง PM Plan / ปฏิทิน */
export const WORK_ORDER_TEAM_OPTIONS = ['A', 'B', 'EE', 'UT'] as const
export type WorkOrderTeamCode = (typeof WORK_ORDER_TEAM_OPTIONS)[number]
export type WorkOrderTeamField = WorkOrderTeamCode | ''

export function isWorkOrderTeamCode(team: string): team is WorkOrderTeamCode {
  return (WORK_ORDER_TEAM_OPTIONS as readonly string[]).includes(team)
}
