import { z } from 'zod'

export const integrationJobStatusSchema = z.enum([
  'running',
  'success',
  'failed',
  'partial',
])

export const integrationJobTypeSchema = z.enum([
  'iw37n_in_scan',
  'confirm_in_scan',
  'inbound_scan',
])

export const integrationJobItemSchema = z.object({
  id: z.string(),
  jobType: integrationJobTypeSchema,
  status: integrationJobStatusSchema,
  trigger: z.enum(['manual', 'schedule']),
  fileName: z.string().nullable(),
  sha256: z.string().nullable(),
  batchId: z.string().nullable(),
  summary: z.record(z.unknown()),
  errorText: z.string().nullable(),
  startedBy: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
})

export const integrationJobsResponseSchema = z.object({
  items: z.array(integrationJobItemSchema),
})

export const integrationPendingFileSchema = z.object({
  name: z.string(),
  sizeBytes: z.number(),
})

export const integrationStatusResponseSchema = z.object({
  rootDir: z.string(),
  inboundIw37nDir: z.string(),
  inboundConfirmDir: z.string(),
  watchEnabled: z.boolean(),
  watchIntervalMinutes: z.number(),
  pendingIw37nFiles: z.array(integrationPendingFileSchema),
  pendingConfirmFiles: z.array(integrationPendingFileSchema),
  lastJob: integrationJobItemSchema.nullable(),
})

export const integrationRunResponseSchema = z.object({
  job: integrationJobItemSchema,
})
