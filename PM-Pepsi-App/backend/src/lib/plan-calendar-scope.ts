import { userstToUserrole } from './primary-roles.js'
import type { PlanCalendarScope } from '../services/plan-calendar.js'

/** ช่าง (W) เห็นเฉพาะงานที่จ่ายให้ตัวเอง · Planner/Admin เห็นทั้งโรงงานในเดือน */
export function resolvePlanCalendarScope(userst: string | null | undefined): PlanCalendarScope {
  return userstToUserrole(userst) === 'technician' ? 'assignee' : 'planner'
}
