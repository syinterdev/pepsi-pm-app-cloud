import { z } from 'zod'

/** ค่า team ที่มอบหมายได้บน WO — สอดคล้องตัวกรอง PM Plan */
export const PM_PLAN_TEAM_CODES = ['A', 'B', 'EE', 'UT'] as const
export type PmPlanTeamCode = (typeof PM_PLAN_TEAM_CODES)[number]
export type PmPlanTeamField = PmPlanTeamCode | ''

export const pmPlanTeamFieldSchema = z.enum(['', 'A', 'B', 'EE', 'UT'])

export function isPmPlanTeamCode(team: string): team is PmPlanTeamCode {
  return (PM_PLAN_TEAM_CODES as readonly string[]).includes(team)
}
