import { z } from 'zod'
import { SAP_MASS_CONFIRM_MAX } from '../lib/mass-confirm-limit.js'

export const confirmationMassExportBodySchema = z.object({
  idiw37n: z.array(z.coerce.number().int().positive()).min(1).max(SAP_MASS_CONFIRM_MAX),
})

export const massConfirmExportItemSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  qcStatus: z.enum(['pending', 'approved', 'rejected']).nullable(),
  hasConfirm: z.boolean(),
  exportable: z.boolean(),
})

export const massConfirmExportSummarySchema = z.object({
  total: z.number().int(),
  complete: z.boolean(),
  hasConfirm: z.number().int(),
  qcApproved: z.number().int(),
  qcPending: z.number().int(),
  qcRejected: z.number().int(),
  exportable: z.number().int(),
  items: z.array(massConfirmExportItemSchema),
})

export const qcApproveBatchBodySchema = confirmationMassExportBodySchema

export const qcApproveBatchResponseSchema = z.object({
  approved: z.array(z.number().int()),
  skipped: z.array(
    z.object({
      idiw37: z.number().int(),
      wkorder: z.string(),
      reason: z.string(),
    }),
  ),
})
