import type { Request } from 'express'
import type { Pool } from 'pg'
import {
  auditLogInputSchema,
  type AuditActor,
  type AuditLogInput,
  type AuditLogWriteInput,
} from '../schemas/audit-log.js'
import { getClientIp } from './request-ip.js'

export function isAuditTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_audit_log') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

function jsonOrNull(value: unknown): string | null {
  if (value === undefined) return null
  return JSON.stringify(value)
}

/**
 * Append one row to `app.tbl_audit_log`.
 * Never throws — returns inserted id or null (table missing / DB error).
 */
export async function auditLog(
  pool: Pool,
  actor: AuditActor,
  input: AuditLogInput,
): Promise<number | null> {
  const parsed = auditLogInputSchema.parse(input)
  const actorId = actor.actorId?.trim() || null
  const actorRole = actor.actorRole?.trim() || null

  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO app.tbl_audit_log (
         actor_id, actor_role, action, resource, resource_id,
         before_json, after_json, ip, user_agent, status, message
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6::jsonb, $7::jsonb, $8::inet, $9, $10, $11
       )
       RETURNING id`,
      [
        actorId,
        actorRole,
        parsed.action,
        parsed.resource ?? null,
        parsed.resourceId ?? null,
        jsonOrNull(parsed.before),
        jsonOrNull(parsed.after),
        parsed.ip ?? null,
        parsed.userAgent ?? null,
        parsed.status,
        parsed.message ?? null,
      ],
    )
    const id = rows[0]?.id
    return id !== undefined ? Number(id) : null
  } catch (err) {
    if (isAuditTableMissing(err)) return null
    console.error('[auditLog]', parsed.action, err)
    return null
  }
}

/** Build actor from authenticated session (`req.authUser`). */
export function auditActorFromUser(user: {
  idwkctr?: string
  username?: string
  userst?: string
} | null | undefined): AuditActor {
  if (!user) return { actorId: null, actorRole: null }
  return {
    actorId: (user.idwkctr ?? user.username ?? '').trim() || null,
    actorRole: user.userst?.trim() || null,
  }
}

export function auditActorFromRequest(req: Request): AuditActor {
  return auditActorFromUser(req.authUser)
}

export function auditMetaFromRequest(req: Request): Pick<AuditLogInput, 'ip' | 'userAgent'> {
  const ua = req.headers['user-agent']
  return {
    ip: getClientIp(req),
    userAgent: typeof ua === 'string' ? ua.slice(0, 512) : null,
  }
}

/** Convenience: actor + IP/UA from Express request. */
export async function auditLogFromRequest(
  pool: Pool,
  req: Request,
  input: Omit<AuditLogWriteInput, 'ip' | 'userAgent'>,
): Promise<number | null> {
  const meta = auditMetaFromRequest(req)
  return auditLog(pool, auditActorFromRequest(req), { status: 'ok', ...input, ...meta })
}
