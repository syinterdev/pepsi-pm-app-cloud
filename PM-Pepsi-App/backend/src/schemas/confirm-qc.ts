import { z } from 'zod'

export const confirmQcStatusSchema = z.enum(['pending', 'approved', 'rejected']).nullable()

export const confirmQcSnapshotSchema = z.object({
  idiw37: z.coerce.number().int(),
  wkorder: z.string(),
  status: confirmQcStatusSchema,
  statusLabel: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  note: z.string().nullable(),
  imageCount: z.number().int(),
  imageBefore: z.number().int(),
  imageAfter: z.number().int(),
  closeCount: z.number().int(),
  worktimeCount: z.number().int(),
  readyForReview: z.boolean(),
  approved: z.boolean(),
})

export const confirmQcSnapshotResponseSchema = z.object({
  qc: confirmQcSnapshotSchema,
})

export const confirmQcRejectBodySchema = z.object({
  note: z.string().max(500).optional(),
})

export const confirmQcPendingItemSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  wkctr: z.string().nullable(),
  syst: z.string().nullable(),
  systemstatus: z.string().nullable(),
  imageCount: z.number().int(),
  closeCount: z.number().int(),
  submittedAt: z.string().nullable(),
})

export const confirmQcPendingResponseSchema = z.object({
  items: z.array(confirmQcPendingItemSchema),
})
