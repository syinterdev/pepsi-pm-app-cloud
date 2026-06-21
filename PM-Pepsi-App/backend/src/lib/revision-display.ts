import type { RevisionRow } from './resource-revision.js'

const CHANGE_KIND_LABELS: Record<string, string> = {
  assign: 'จ่ายงานช่าง',
  unassign: 'ถอนการจ่ายงาน',
  reschedule: 'เลื่อนแผน',
  team_change: 'เปลี่ยนทีม',
  move_plan: 'ย้ายวันแผน',
}

function pickStr(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const v = (obj as Record<string, unknown>)[key]
  if (v == null || v === '') return undefined
  return String(v)
}

function formatRevisionSummary(row: RevisionRow): string {
  const before = row.beforeJson
  const after = row.afterJson
  if (row.changeKind === 'move_plan') {
    const from = pickStr(before, 'displayDate') ?? pickStr(before, 'planDate') ?? '—'
    const to = pickStr(after, 'targetDate') ?? '—'
    const reason = pickStr(after, 'reasonCode')
    return `ย้ายแผน ${from} → ${to}${reason ? ` · ${reason}` : ''}`
  }
  if (row.changeKind === 'assign') {
    const wkctrs = after && typeof after === 'object' && 'wkctrs' in after
      ? Array.isArray((after as { wkctrs?: unknown }).wkctrs)
        ? (after as { wkctrs: unknown[] }).wkctrs.join(', ')
        : pickStr(after, 'wkctrs')
      : pickStr(after, 'wkctr')
    return wkctrs ? `จ่ายให้ ${wkctrs}` : 'จ่ายงานช่าง'
  }
  return CHANGE_KIND_LABELS[row.changeKind] ?? row.changeKind
}

export function mapRevisionToHubItem(row: RevisionRow) {
  return {
    id: row.id,
    revisionNo: row.revisionNo,
    changeKind: row.changeKind,
    changeLabel: CHANGE_KIND_LABELS[row.changeKind] ?? row.changeKind,
    summary: formatRevisionSummary(row),
    workOrder: row.wkorder,
    jobDetail: row.operationshorttext,
    actorId: row.actorId,
    actorRole: row.actorRole,
    createdAt: row.createdAt,
  }
}
