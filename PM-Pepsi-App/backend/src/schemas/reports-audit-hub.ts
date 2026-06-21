import { z } from 'zod'

export const auditHubResponseSchema = z.object({
  retentionDays: z.number().int(),
  retentionCutoffDate: z.string(),
  range: z.object({ from: z.string(), to: z.string() }),
  totals: z.object({
    events: z.number().int(),
    denied: z.number().int(),
    imports: z.number().int(),
    planning: z.number().int(),
    confirmations: z.number().int(),
    workOrders: z.number().int(),
  }),
  byPrefix: z.array(
    z.object({
      prefix: z.string(),
      label: z.string(),
      count: z.number().int(),
    }),
  ),
  planWo: z.object({
    year: z.number().int(),
    month: z.number().int(),
    monthLabel: z.string(),
    totalWo: z.number().int(),
    pmWo: z.number().int(),
    reactiveWo: z.number().int(),
    openWo: z.number().int(),
    assignedWo: z.number().int(),
    movedWo: z.number().int(),
  }),
  recentRevisions: z.array(
    z.object({
      id: z.string(),
      revisionNo: z.number().int(),
      changeKind: z.string(),
      changeLabel: z.string(),
      summary: z.string(),
      workOrder: z.string().nullable(),
      jobDetail: z.string().nullable(),
      actorId: z.string().nullable(),
      actorRole: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
})

export type AuditHubResponse = z.infer<typeof auditHubResponseSchema>
