import type { Pool } from 'pg'
import { normalizeClientIp } from '../lib/normalize-ip.js'

export type BlockedIpRow = {
  id: number
  ip: string
  reason: string | null
  blockedBy: string
  createdAt: string
  expiresAt: string | null
}

export function isBlockedIpTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_blocked_ip') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

function mapRow(row: Record<string, unknown>): BlockedIpRow {
  return {
    id: Number(row.id),
    ip: String(row.ip),
    reason: row.reason != null ? String(row.reason) : null,
    blockedBy: String(row.blocked_by),
    createdAt: new Date(String(row.created_at)).toISOString(),
    expiresAt: row.expires_at != null ? new Date(String(row.expires_at)).toISOString() : null,
  }
}

let cache: { ips: Set<string>; loadedAt: number } | null = null
const CACHE_MS = 10_000

export function clearBlockedIpCache(): void {
  cache = null
}

async function refreshCache(pool: Pool): Promise<Set<string>> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < CACHE_MS) {
    return cache.ips
  }

  const { rows } = await pool.query<{ ip: string }>(
    `SELECT host(ip)::text AS ip
     FROM app.tbl_blocked_ip
     WHERE expires_at IS NULL OR expires_at > now()`,
  )
  const ips = new Set(rows.map((r) => r.ip))
  cache = { ips, loadedAt: now }
  return ips
}

export async function isIpBlocked(pool: Pool, rawIp: string | null | undefined): Promise<boolean> {
  const ip = normalizeClientIp(rawIp)
  if (!ip) return false
  const set = await refreshCache(pool)
  return set.has(ip)
}

export async function listBlockedIps(pool: Pool): Promise<BlockedIpRow[]> {
  const { rows } = await pool.query(
    `SELECT id, host(ip)::text AS ip, reason, blocked_by, created_at, expires_at
     FROM app.tbl_blocked_ip
     ORDER BY created_at DESC, id DESC`,
  )
  return rows.map((r) => mapRow(r as Record<string, unknown>))
}

export async function blockIp(
  pool: Pool,
  input: { ip: string; reason?: string | null; expiresAt?: string | null; blockedBy: string },
): Promise<BlockedIpRow> {
  const normalized = normalizeClientIp(input.ip)
  if (!normalized) {
    throw new Error('INVALID_IP')
  }

  const { rows } = await pool.query(
    `INSERT INTO app.tbl_blocked_ip (ip, reason, blocked_by, expires_at)
     VALUES ($1::inet, $2, $3, $4::timestamptz)
     ON CONFLICT (ip) DO UPDATE SET
       reason = EXCLUDED.reason,
       blocked_by = EXCLUDED.blocked_by,
       expires_at = EXCLUDED.expires_at,
       created_at = now()
     RETURNING id, host(ip)::text AS ip, reason, blocked_by, created_at, expires_at`,
    [normalized, input.reason ?? null, input.blockedBy, input.expiresAt ?? null],
  )

  clearBlockedIpCache()
  return mapRow(rows[0] as Record<string, unknown>)
}

export async function unblockIp(pool: Pool, id: number): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM app.tbl_blocked_ip WHERE id = $1`, [id])
  clearBlockedIpCache()
  return (rowCount ?? 0) > 0
}
