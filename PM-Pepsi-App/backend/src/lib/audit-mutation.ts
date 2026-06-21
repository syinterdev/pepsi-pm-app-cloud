import type { Request } from 'express'
import type { Pool } from 'pg'
import type { AuditLogWriteInput } from '../schemas/audit-log.js'
import { auditLogFromRequest } from './audit-log.js'

/** Fire-and-forget audit on successful mutation (non-blocking). */
export function voidAudit(
  pool: Pool,
  req: Request,
  input: Omit<AuditLogWriteInput, 'ip' | 'userAgent'>,
): void {
  void auditLogFromRequest(pool, req, input)
}

export function voidAuditDenied(
  pool: Pool,
  req: Request,
  action: string,
  perm: string,
  resource?: string,
): void {
  void auditLogFromRequest(pool, req, {
    action,
    resource: resource ?? 'rbac',
    status: 'denied',
    message: perm,
  })
}

const REDACT_KEYS = new Set([
  'password',
  'newpassword',
  'oldpassword',
  'confirmPassword',
  'token',
  'licensekey',
  'app.license_key',
])

export function sanitizeAuditPayload(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body
  const src = body as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(src)) {
    out[key] = REDACT_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value
  }
  return out
}
