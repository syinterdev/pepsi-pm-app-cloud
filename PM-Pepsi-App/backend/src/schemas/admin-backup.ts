import { z } from 'zod'

export const backupTriggerSchema = z.enum(['manual', 'schedule'])
export const backupStatusSchema = z.enum(['running', 'success', 'failed'])

export const backupHistoryItemSchema = z.object({
  id: z.number(),
  trigger: backupTriggerSchema,
  status: backupStatusSchema,
  sizeBytes: z.number().nullable(),
  filePath: z.string().nullable(),
  sha256: z.string().nullable(),
  durationMs: z.number().nullable(),
  startedBy: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  errorText: z.string().nullable(),
})

export type BackupHistoryItem = z.infer<typeof backupHistoryItemSchema>

export const backupListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type BackupListQuery = z.infer<typeof backupListQuerySchema>

export const backupListResponseSchema = z.object({
  items: z.array(backupHistoryItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

export const backupScheduleResponseSchema = z.object({
  scheduleCron: z.string(),
  retentionDays: z.number().int(),
  targetDir: z.string(),
  pgDumpAvailable: z.boolean(),
  psqlAvailable: z.boolean(),
  pgDumpBin: z.string(),
  psqlBin: z.string(),
  lastSuccess: backupHistoryItemSchema.nullable().optional(),
})

export const patchBackupScheduleBodySchema = z.object({
  scheduleCron: z.string().trim().min(9).max(64).optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
  targetDir: z.string().trim().min(3).max(500).optional(),
})

export const startBackupResponseSchema = z.object({
  item: backupHistoryItemSchema,
})

export const backupDeleteResponseSchema = z.object({
  ok: z.literal(true),
  id: z.number(),
})

export const restoreConfirmBodySchema = z.object({
  confirmPhrase: z.literal('RESTORE'),
})

export const restoreBackupResponseSchema = z.object({
  ok: z.literal(true),
  durationMs: z.number().int(),
  source: z.enum(['upload', 'history']),
  backupId: z.number().optional(),
})
