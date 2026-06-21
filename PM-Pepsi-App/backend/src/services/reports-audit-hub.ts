import type { Pool } from 'pg'
import {
  auditRetentionCutoffDate,
  getAuditRetentionDays,
} from '../lib/audit-retention.js'
import { isAuditTableMissing } from '../lib/audit-log.js'
import { mapRevisionToHubItem } from '../lib/revision-display.js'
import { listRecentRevisions } from '../lib/resource-revision.js'
import type { AuditHubResponse } from '../schemas/reports-audit-hub.js'
import { getAuditHubPlanWoSnapshot } from './audit-hub-plan-wo.js'

const PREFIX_LABELS: { prefix: string; label: string }[] = [
  { prefix: 'iw37n.', label: 'IW37N' },
  { prefix: 'confirmation.', label: 'Confirmation' },
  { prefix: 'planning.', label: 'Planning' },
  { prefix: 'work-orders.', label: 'Work orders' },
  { prefix: 'integration.', label: 'Integration' },
  { prefix: 'manhours.', label: 'Manhours' },
  { prefix: 'master-data.', label: 'Master data' },
  { prefix: 'auth.', label: 'Auth' },
]

function defaultHubRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}

export async function getReportsAuditHub(pool: Pool): Promise<AuditHubResponse> {
  const retentionDays = await getAuditRetentionDays(pool)
  const range = defaultHubRange()

  try {
    const [totalsRes, prefixRes, planWo, revisionRows] = await Promise.all([
      pool.query<{
        events: string
        denied: string
        imports: string
        planning: string
        confirmations: string
        work_orders: string
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'ok')::text AS events,
           COUNT(*) FILTER (WHERE status = 'denied')::text AS denied,
           COUNT(*) FILTER (WHERE action LIKE 'iw37n.%' OR action LIKE 'integration.%')::text AS imports,
           COUNT(*) FILTER (WHERE action LIKE 'planning.%')::text AS planning,
           COUNT(*) FILTER (WHERE action LIKE 'confirmation.%')::text AS confirmations,
           COUNT(*) FILTER (WHERE action LIKE 'work-orders.%')::text AS work_orders
         FROM app.tbl_audit_log
         WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
        [range.from, range.to],
      ),
      pool.query<{ prefix: string; count: string }>(
        `SELECT
           split_part(action, '.', 1) || '.' AS prefix,
           COUNT(*)::text AS count
         FROM app.tbl_audit_log
         WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz
           AND status = 'ok'
         GROUP BY 1
         ORDER BY COUNT(*) DESC
         LIMIT 20`,
        [range.from, range.to],
      ),
      getAuditHubPlanWoSnapshot(pool),
      listRecentRevisions(pool, { from: range.from, to: range.to, limit: 25 }),
    ])

    const row = totalsRes.rows[0]
    const prefixMap = new Map(prefixRes.rows.map((r) => [r.prefix, Number(r.count)]))

    const byPrefix = PREFIX_LABELS.map(({ prefix, label }) => ({
      prefix,
      label,
      count: prefixMap.get(prefix) ?? 0,
    })).filter((p) => p.count > 0)

    return {
      retentionDays,
      retentionCutoffDate: auditRetentionCutoffDate(retentionDays),
      range,
      totals: {
        events: Number(row?.events ?? 0),
        denied: Number(row?.denied ?? 0),
        imports: Number(row?.imports ?? 0),
        planning: Number(row?.planning ?? 0),
        confirmations: Number(row?.confirmations ?? 0),
        workOrders: Number(row?.work_orders ?? 0),
      },
      byPrefix,
      planWo,
      recentRevisions: revisionRows.map(mapRevisionToHubItem),
    }
  } catch (err) {
    if (isAuditTableMissing(err)) {
      const planWo = await getAuditHubPlanWoSnapshot(pool)
      const revisionRows = await listRecentRevisions(pool, {
        from: range.from,
        to: range.to,
        limit: 25,
      })
      return {
        retentionDays,
        retentionCutoffDate: auditRetentionCutoffDate(retentionDays),
        range,
        totals: {
          events: 0,
          denied: 0,
          imports: 0,
          planning: 0,
          confirmations: 0,
          workOrders: 0,
        },
        byPrefix: [],
        planWo,
        recentRevisions: revisionRows.map(mapRevisionToHubItem),
      }
    }
    throw err
  }
}
