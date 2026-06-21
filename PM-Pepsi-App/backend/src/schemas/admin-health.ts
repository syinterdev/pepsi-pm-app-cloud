import { z } from 'zod'

export const healthStatusSchema = z.enum(['ok', 'warning', 'error', 'unknown'])

export type HealthStatus = z.infer<typeof healthStatusSchema>

export const dbHealthSchema = z.object({
  status: healthStatusSchema,
  latencyMs: z.number().nullable(),
  pool: z.object({
    total: z.number().int(),
    idle: z.number().int(),
    waiting: z.number().int(),
  }),
  message: z.string().nullable().optional(),
})

export const diskHealthSchema = z.object({
  status: healthStatusSchema,
  path: z.string(),
  totalBytes: z.number().nullable(),
  freeBytes: z.number().nullable(),
  usedBytes: z.number().nullable(),
  usedPercent: z.number().nullable(),
  message: z.string().nullable().optional(),
})

export const processHealthSchema = z.object({
  status: healthStatusSchema,
  nodeVersion: z.string(),
  platform: z.string(),
  uptimeSec: z.number(),
  memoryRssMb: z.number(),
  memoryHeapUsedMb: z.number(),
})

export const migrationProbeSchema = z.object({
  id: z.string(),
  file: z.string(),
  label: z.string(),
  status: z.enum(['applied', 'pending', 'unverified']),
})

export const migrationHealthSchema = z.object({
  status: healthStatusSchema,
  migrationsDir: z.string().nullable(),
  totalFiles: z.number().int(),
  appliedCount: z.number().int(),
  pendingCount: z.number().int(),
  unverifiedCount: z.number().int(),
  latestAppliedId: z.string().nullable(),
  latestFile: z.string().nullable(),
  probes: z.array(migrationProbeSchema),
})

export const adminHealthResponseSchema = z.object({
  time: z.string(),
  service: z.string(),
  version: z.string(),
  db: dbHealthSchema,
  disk: diskHealthSchema,
  process: processHealthSchema,
  migration: migrationHealthSchema,
})

export type AdminHealthResponse = z.infer<typeof adminHealthResponseSchema>

export const healthErrorLogItemSchema = z.object({
  id: z.number(),
  actorId: z.string().nullable(),
  action: z.string(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  message: z.string().nullable(),
  createdAt: z.string(),
})

export const healthErrorLogResponseSchema = z.object({
  items: z.array(healthErrorLogItemSchema),
})

export const slowApiMetricSchema = z.object({
  route: z.string(),
  count: z.number().int(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  maxMs: z.number(),
})

export const healthSlowApiResponseSchema = z.object({
  thresholdMs: z.number().int(),
  items: z.array(slowApiMetricSchema),
})

export const healthMigrateResultSchema = z.object({
  applied: z.array(
    z.object({
      id: z.string(),
      file: z.string(),
      label: z.string(),
    }),
  ),
  pendingRemaining: z.number().int(),
  stoppedAt: z
    .object({
      file: z.string(),
      message: z.string(),
    })
    .nullable(),
})

export type HealthMigrateResult = z.infer<typeof healthMigrateResultSchema>
