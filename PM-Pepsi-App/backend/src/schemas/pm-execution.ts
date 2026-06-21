import { z } from 'zod'

export const pmMeasurementKindSchema = z.enum([
  'current_3phase',
  'vibration_dst_db',
  'none',
])

export const woPmReadingSchema = z.object({
  idreading: z.number().int(),
  machine: z.string(),
  pmlist: z.string(),
  kind: z.enum(['current_3phase', 'vibration_dst_db']),
  measuredAt: z.string(),
  v1: z.number(),
  v2: z.number(),
  v3: z.number().nullable(),
  unit: z.string(),
  warningLimit: z.number().nullable(),
  alarmLimit: z.number().nullable(),
  wkctr: z.string(),
})

export const woPmNoteEntrySchema = z.object({
  identry: z.number().int(),
  note: z.string(),
  wkctr: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
})

export const woPmExecutionSchema = z.object({
  notes: z.array(woPmNoteEntrySchema),
  note: z.string(),
  noteUpdatedAt: z.string().nullable(),
  noteWkctr: z.string(),
  canEdit: z.boolean(),
  readings: z.array(woPmReadingSchema),
})

export const woPmNoteBodySchema = z.object({
  note: z.string().trim().min(1).max(4000),
})

export const woPmNoteResponseSchema = z.object({
  ok: z.literal(true),
  entry: woPmNoteEntrySchema,
})

export const woPmReadingBodySchema = z
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

export const woPmReadingResponseSchema = z.object({
  item: woPmReadingSchema,
})

export const woPmPage2FormSchema = z.object({
  activityReportWkctr: z.string().nullable(),
  completedByName: z.string().nullable(),
  closedDate: z.string().nullable(),
  signatureText: z.string().nullable(),
  signatureAt: z.string().nullable(),
  signatureAction: z.enum(['approved', 'rejected']).nullable(),
  equipmentOk: z.enum(['Y', 'N']).nullable(),
})

export const woPmPage2BodySchema = z.object({
  equipmentOk: z.enum(['Y', 'N']),
})

export const woPmPage2ResponseSchema = z.object({
  ok: z.literal(true),
  page2Form: woPmPage2FormSchema,
})
