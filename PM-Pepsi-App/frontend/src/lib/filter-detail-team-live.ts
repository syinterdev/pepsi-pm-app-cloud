import type { z } from 'zod'
import type { workOrderFilterDetailResponseSchema } from '@/api/schemas'
import {
  isWorkOrderTeamCode,
  type WorkOrderTeamField,
} from '@/lib/wo-team'

export type FilterDetailData = z.infer<typeof workOrderFilterDetailResponseSchema>
export type TeamCode = WorkOrderTeamField

export function normalizeTeamCode(team: string | undefined): TeamCode {
  if (team && isWorkOrderTeamCode(team)) return team
  return ''
}

/** Patch saved `team` on search rows after batch/single save (keeps UI stable). */
export function patchRowsTeam<T extends { id: string; team: string }>(
  rows: T[],
  updates: ReadonlyMap<string, TeamCode>,
): T[] {
  return rows.map((row) => {
    const team = updates.get(row.id)
    if (team === undefined) return row
    return { ...row, team }
  })
}

type TeamTotals = FilterDetailData['teamA']

function adjustBucket(
  bucket: TeamCode,
  totals: {
    teamA: TeamTotals
    teamB: TeamTotals
    teamEE: TeamTotals
    teamUT: TeamTotals
  },
  countDelta: number,
  workDelta: number,
): void {
  if (bucket === 'A') {
    totals.teamA.count += countDelta
    totals.teamA.workSumMinutes += workDelta
  } else if (bucket === 'B') {
    totals.teamB.count += countDelta
    totals.teamB.workSumMinutes += workDelta
  } else if (bucket === 'EE') {
    totals.teamEE.count += countDelta
    totals.teamEE.workSumMinutes += workDelta
  } else if (bucket === 'UT') {
    totals.teamUT.count += countDelta
    totals.teamUT.workSumMinutes += workDelta
  }
}

/**
 * ปรับ Team A/B/EE/UT จากค่า server โดยใช้ delta ของแถวในตารางที่เปลี่ยน team ชั่วคราว (radio ก่อน Save).
 * B.4c — ไม่ refresh ทั้งหน้า
 */
export function applyPendingTeamToFilterDetail(
  base: FilterDetailData,
  rows: Array<{ id: string; team: string; work: number }>,
  pendingTeam: Record<string, TeamCode>,
): { data: FilterDetailData; hasPendingChanges: boolean } {
  const teamA = { ...base.teamA }
  const teamB = { ...base.teamB }
  const teamEE = { ...base.teamEE }
  const teamUT = { ...base.teamUT }
  const totals = { teamA, teamB, teamEE, teamUT }
  let hasPendingChanges = false

  for (const row of rows) {
    const saved = normalizeTeamCode(row.team)
    const pending = pendingTeam[row.id] ?? saved
    if (pending === saved) continue
    hasPendingChanges = true
    adjustBucket(saved, totals, -1, -row.work)
    adjustBucket(pending, totals, 1, row.work)
  }

  return {
    data: { ...base, teamA, teamB, teamEE, teamUT },
    hasPendingChanges,
  }
}
