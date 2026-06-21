import { z } from 'zod'

export const pmReadingBatchItemSchema = z
  .object({
    machine: z.string().min(1).max(128),
    pmlist: z.string().min(1).max(128),
    kind: z.enum(['current_3phase', 'vibration_dst_db']),
    measuredAt: z.string().datetime().optional(),
    v1: z.number().finite(),
    v2: z.number().finite(),
    v3: z.number().finite().nullable().optional(),
    warningLimit: z.number().finite().nullable().optional(),
    alarmLimit: z.number().finite().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'current_3phase') {
      if (data.v3 == null || !Number.isFinite(data.v3)) {
        ctx.addIssue({ code: 'custom', path: ['v3'], message: 'v3 required for current_3phase' })
      }
    }
  })

export const pmReadingBatchBodySchema = z.object({
  wkorder: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  items: z.array(pmReadingBatchItemSchema).min(1).max(200),
})

export const pmReadingImportResultSchema = z.object({
  ok: z.literal(true),
  imported: z.number().int(),
  failed: z.number().int(),
  errors: z.array(
    z.object({
      rowNo: z.number().int(),
      wkorder: z.string(),
      message: z.string(),
    }),
  ),
})
