import { z } from 'zod'
import { auditLogItemSchema } from './admin-audit.js'

export const securityDaysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional().default(30),
})

export const failedLoginDaySchema = z.object({
  date: z.string(),
  count: z.number().int(),
})

export const failedLoginResponseSchema = z.object({
  days: z.number().int(),
  total: z.number().int(),
  series: z.array(failedLoginDaySchema),
})

export const securityDeniedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export const securityDeniedResponseSchema = z.object({
  items: z.array(auditLogItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

export const suspiciousIpSchema = z.object({
  ip: z.string(),
  hits: z.number().int(),
  lastAt: z.string(),
})

export const blockedIpItemSchema = z.object({
  id: z.number().int(),
  ip: z.string(),
  reason: z.string().nullable(),
  blockedBy: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
})

export const blockedIpListResponseSchema = z.object({
  items: z.array(blockedIpItemSchema),
})

export const createBlockedIpBodySchema = z.object({
  ip: z.string().trim().min(1).max(64),
  reason: z.string().trim().max(500).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const blockedIpDeleteResponseSchema = z.object({
  ok: z.literal(true),
  id: z.number().int(),
})

export const securityOverviewResponseSchema = z.object({
  failedLogin: failedLoginResponseSchema,
  denied: securityDeniedResponseSchema,
  rateLimitedIps: z.array(suspiciousIpSchema),
  rateLimitHits: z.number().int(),
  suspiciousIps: z.array(suspiciousIpSchema),
  blockedIps: blockedIpListResponseSchema,
  rateLimitNote: z.string(),
})
