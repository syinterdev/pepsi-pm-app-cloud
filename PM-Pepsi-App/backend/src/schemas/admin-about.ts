import { z } from 'zod'
import { diskHealthSchema, migrationHealthSchema } from './admin-health.js'

export const adminAboutResponseSchema = z.object({
  time: z.string(),
  apiVersion: z.string(),
  webVersion: z.string(),
  buildCommit: z.string().nullable(),
  buildTime: z.string().nullable(),
  vendor: z.string(),
  client: z.string(),
  license: z.object({
    status: z.string(),
    expiresAt: z.string().nullable(),
  }),
  server: z.object({
    platform: z.string(),
    platformLabel: z.string(),
    nodeVersion: z.string(),
    uptimeSec: z.number(),
    disk: diskHealthSchema,
  }),
  migration: migrationHealthSchema.pick({
    status: true,
    totalFiles: true,
    appliedCount: true,
    pendingCount: true,
    unverifiedCount: true,
    latestAppliedId: true,
    latestFile: true,
  }),
})

export type AdminAboutResponse = z.infer<typeof adminAboutResponseSchema>
