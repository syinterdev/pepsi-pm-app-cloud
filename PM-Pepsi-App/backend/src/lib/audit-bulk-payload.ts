import type { ConfirmationMassCloseResult } from '../services/confirmation.js'
import type { WorkOrderTeamBulkResult } from '../services/work-orders.js'

/** Payload สำหรับ `tbl_audit_log` — bulk team (Phase 3) */
export function bulkTeamAuditFields(result: WorkOrderTeamBulkResult): {
  resourceId: string
  message: string
  before: { changes: WorkOrderTeamBulkResult['changes'] }
  after: {
    team: WorkOrderTeamBulkResult['team']
    updatedCount: number
    updatedIds: string[]
    notFound: string[]
  }
} {
  const n = result.updated.length
  return {
    resourceId: n > 0 ? result.updated[0]! : 'batch',
    message: `Bulk team → ${result.team || '(clear)'}: ${n} updated`,
    before: { changes: result.changes },
    after: {
      team: result.team,
      updatedCount: n,
      updatedIds: result.updated,
      notFound: result.notFound,
    },
  }
}

export type MassConfirmAuditBody = {
  idiw37n: number[]
  wkctr: string
  startD: string
  startT: string
  endD: string
  endT: string
}

/** Payload สำหรับ `tbl_audit_log` — mass confirm (SAP max 44) */
export function massConfirmAuditFields(
  body: MassConfirmAuditBody,
  result: ConfirmationMassCloseResult,
): {
  resourceId: string
  message: string
  before: MassConfirmAuditBody
  after: {
    wkctr: string
    succeededCount: number
    idiw37n: number[]
    failed: ConfirmationMassCloseResult['failed']
  }
} {
  const requested = body.idiw37n.length
  const ok = result.succeeded.length
  return {
    resourceId: ok > 0 ? String(result.succeeded[0]) : 'batch',
    message: `Mass confirm: ${ok}/${requested} WO`,
    before: body,
    after: {
      wkctr: body.wkctr,
      succeededCount: ok,
      idiw37n: result.succeeded,
      failed: result.failed,
    },
  }
}
