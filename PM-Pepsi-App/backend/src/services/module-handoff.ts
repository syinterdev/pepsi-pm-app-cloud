import crypto from 'node:crypto'
import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import { isModuleHandoffEnabled } from '../lib/portal-enabled.js'
import { hasPermission, listPermissionsForUserst } from '../lib/has-permission.js'
import { enrichAuthUser } from '../lib/role-labels.js'

type AppModuleRow = {
  module_code: string
  perm_code: string
  base_url: string
  entry_path: string | null
  handoff_mode: string
  is_active: boolean
}

export type ModuleHandoffIssueResult = {
  redirectUrl: string
  expiresAt: string
  moduleCode: string
}

export type ModuleHandoffExchangeUser = {
  idwkctr: string
  memId: string | null
  username: string
  userst: string
  accountType: 'workcenter' | 'member'
  fullnameTh: string | null
  fullnameEng: string | null
  wkctr: string
  plnt: string | null
}

export type ModuleHandoffExchangeResult = {
  user: ModuleHandoffExchangeUser
  hubPermissions: string[]
  handoffAt: string
}

const handoffRate = new Map<string, number[]>()

export function hashHandoffCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export function generateHandoffCode(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export function buildModuleRedirectUrl(
  baseUrl: string,
  entryPath: string,
  code: string,
  moduleCode: string,
): string {
  const base = baseUrl.replace(/\/+$/, '')
  const path = entryPath.startsWith('/') ? entryPath : `/${entryPath}`
  const url = new URL(`${base}${path}`)
  url.searchParams.set('code', code)
  url.searchParams.set('module', moduleCode)
  return url.toString()
}

export function parseModuleHandoffClients(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>()
  const text = raw?.trim()
  if (!text) return map
  for (const part of text.split(',')) {
    const segment = part.trim()
    if (!segment) continue
    const colon = segment.indexOf(':')
    if (colon <= 0) continue
    const id = segment.slice(0, colon).trim()
    const secret = segment.slice(colon + 1).trim()
    if (id && secret) map.set(id, secret)
  }
  return map
}

function handoffTtlSec(): number {
  const raw = Number(process.env.MODULE_HANDOFF_TTL_SEC ?? 60)
  if (!Number.isFinite(raw) || raw < 10) return 60
  return Math.min(raw, 120)
}

function handoffRatePerMin(): number {
  const raw = Number(process.env.MODULE_HANDOFF_RATE_PER_MIN ?? 10)
  if (!Number.isFinite(raw) || raw < 1) return 10
  return raw
}

function isAllowedTargetOrigin(baseUrl: string): boolean {
  const allow = process.env.MODULE_HANDOFF_ALLOWED_ORIGINS?.trim()
  if (!allow) return true
  try {
    const origin = new URL(baseUrl).origin
    return allow
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(origin)
  } catch {
    return false
  }
}

function subjectOf(user: AuthUser): { subjectType: string; subjectId: string } {
  if (user.accountType === 'member' && user.memId) {
    return { subjectType: 'member', subjectId: user.memId }
  }
  return { subjectType: 'workcenter', subjectId: user.idwkctr }
}

function isRateLimited(actorKey: string): boolean {
  const now = Date.now()
  const windowMs = 60_000
  const limit = handoffRatePerMin()
  const prev = handoffRate.get(actorKey) ?? []
  const recent = prev.filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    handoffRate.set(actorKey, recent)
    return true
  }
  recent.push(now)
  handoffRate.set(actorKey, recent)
  return false
}

async function loadModule(pool: Pool, moduleCode: string): Promise<AppModuleRow | null> {
  const { rows } = await pool.query<AppModuleRow>(
    `SELECT module_code, perm_code, base_url, entry_path, handoff_mode, is_active
     FROM app.tbl_app_module
     WHERE module_code = $1`,
    [moduleCode],
  )
  return rows[0] ?? null
}

export async function issueModuleHandoff(
  pool: Pool,
  user: AuthUser,
  moduleCode: string,
  clientIp: string | null,
): Promise<
  | { ok: true; data: ModuleHandoffIssueResult }
  | { ok: false; status: number; error: string; message: string }
> {
  if (!isModuleHandoffEnabled()) {
    return {
      ok: false,
      status: 503,
      error: 'HANDOFF_DISABLED',
      message: 'Module handoff is disabled',
    }
  }

  if (user.impersonatedBy) {
    return {
      ok: false,
      status: 403,
      error: 'HANDOFF_FORBIDDEN',
      message: 'Handoff is not allowed while impersonating',
    }
  }

  const row = await loadModule(pool, moduleCode)
  if (!row || !row.is_active) {
    return {
      ok: false,
      status: 404,
      error: 'MODULE_NOT_FOUND',
      message: 'Module not found',
    }
  }

  if (!(await hasPermission(pool, user.userst, row.perm_code))) {
    return {
      ok: false,
      status: 403,
      error: 'HANDOFF_FORBIDDEN',
      message: 'No permission for this module',
    }
  }

  const baseUrl = row.base_url.trim()
  if (!baseUrl || row.handoff_mode === 'none') {
    return {
      ok: false,
      status: 409,
      error: 'MODULE_NOT_READY',
      message: 'Module is not ready for handoff',
    }
  }

  if (row.handoff_mode !== 'code_exchange') {
    return {
      ok: false,
      status: 409,
      error: 'MODULE_NOT_READY',
      message: 'Module does not use code exchange handoff',
    }
  }

  if (!isAllowedTargetOrigin(baseUrl)) {
    return {
      ok: false,
      status: 403,
      error: 'HANDOFF_FORBIDDEN',
      message: 'Target origin is not allowed',
    }
  }

  const actorKey = `${user.idwkctr}:${moduleCode}`
  if (isRateLimited(actorKey)) {
    return {
      ok: false,
      status: 429,
      error: 'HANDOFF_RATE_LIMIT',
      message: 'Too many handoff requests',
    }
  }

  const code = generateHandoffCode()
  const codeHash = hashHandoffCode(code)
  const ttlSec = handoffTtlSec()
  const expiresAt = new Date(Date.now() + ttlSec * 1000)
  const entryPath = row.entry_path?.trim() || '/auth/callback'
  const { subjectType, subjectId } = subjectOf(user)

  await pool.query(
    `INSERT INTO app.tbl_module_handoff_code (
       code_hash, module_code, subject_type, subject_id, username, userst,
       expires_at, issued_ip, target_base_url
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9)`,
    [
      codeHash,
      moduleCode,
      subjectType,
      subjectId,
      user.username,
      user.userst,
      expiresAt.toISOString(),
      clientIp,
      baseUrl,
    ],
  )

  return {
    ok: true,
    data: {
      redirectUrl: buildModuleRedirectUrl(baseUrl, entryPath, code, moduleCode),
      expiresAt: expiresAt.toISOString(),
      moduleCode,
    },
  }
}

function resolveClientSecret(
  moduleCode: string,
  authorization: string | undefined,
  clientHeader: string | undefined,
  secretHeader: string | undefined,
): string | null {
  const clients = parseModuleHandoffClients(process.env.MODULE_HANDOFF_CLIENTS)
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (bearer) {
    const byModule = clients.get(moduleCode)
    if (byModule && byModule === bearer) return moduleCode
    for (const [id, secret] of clients) {
      if (secret === bearer) return id
    }
    return null
  }
  const clientId = clientHeader?.trim()
  const secret = secretHeader?.trim()
  if (!clientId || !secret) return null
  if (clients.get(clientId) === secret && (clientId === moduleCode || clients.has(moduleCode))) {
    return clientId
  }
  if (clients.get(moduleCode) === secret) return moduleCode
  return null
}

function portalHubPermissions(perms: string[]): string[] {
  return perms.filter((p) => p === 'portal.view' || p.startsWith('module.'))
}

export async function exchangeModuleHandoff(
  pool: Pool,
  moduleCode: string,
  code: string,
  authorization: string | undefined,
  clientHeader: string | undefined,
  secretHeader: string | undefined,
): Promise<
  | { ok: true; data: ModuleHandoffExchangeResult; consumedBy: string }
  | { ok: false; status: number; error: string; message: string }
> {
  if (!isModuleHandoffEnabled()) {
    return {
      ok: false,
      status: 503,
      error: 'HANDOFF_DISABLED',
      message: 'Module handoff is disabled',
    }
  }

  const clientId = resolveClientSecret(moduleCode, authorization, clientHeader, secretHeader)
  if (!clientId) {
    return {
      ok: false,
      status: 401,
      error: 'EXCHANGE_UNAUTHORIZED',
      message: 'Invalid module client credentials',
    }
  }

  const codeTrim = code.trim()
  if (!codeTrim) {
    return {
      ok: false,
      status: 400,
      error: 'HANDOFF_CODE_INVALID',
      message: 'Missing handoff code',
    }
  }

  const codeHash = hashHandoffCode(codeTrim)
  const { rows } = await pool.query<{
    id: string
    module_code: string
    subject_type: string
    subject_id: string
    username: string
    userst: string
    expires_at: Date
    consumed_at: Date | null
  }>(
    `SELECT id, module_code, subject_type, subject_id, username, userst, expires_at, consumed_at
     FROM app.tbl_module_handoff_code
     WHERE code_hash = $1`,
    [codeHash],
  )

  const row = rows[0]
  if (!row) {
    return {
      ok: false,
      status: 400,
      error: 'HANDOFF_CODE_INVALID',
      message: 'Invalid handoff code',
    }
  }

  if (row.consumed_at) {
    return {
      ok: false,
      status: 409,
      error: 'HANDOFF_CODE_CONSUMED',
      message: 'Handoff code already used',
    }
  }

  if (row.expires_at.getTime() <= Date.now()) {
    return {
      ok: false,
      status: 410,
      error: 'HANDOFF_CODE_EXPIRED',
      message: 'Handoff code expired',
    }
  }

  if (row.module_code !== moduleCode) {
    return {
      ok: false,
      status: 403,
      error: 'MODULE_MISMATCH',
      message: 'Handoff code is for a different module',
    }
  }

  const consumedAt = new Date()
  const update = await pool.query(
    `UPDATE app.tbl_module_handoff_code
     SET consumed_at = $2, consumed_by = $3
     WHERE id = $1 AND consumed_at IS NULL`,
    [row.id, consumedAt.toISOString(), clientId],
  )
  if ((update.rowCount ?? 0) === 0) {
    return {
      ok: false,
      status: 409,
      error: 'HANDOFF_CODE_CONSUMED',
      message: 'Handoff code already used',
    }
  }

  const baseUser: AuthUser = {
    idwkctr: row.subject_type === 'workcenter' ? row.subject_id : '',
    username: row.username,
    wkctr: row.subject_type === 'workcenter' ? row.subject_id : row.username,
    plnt: null,
    userst: row.userst,
    sysstatus: '',
    accountType: row.subject_type === 'member' ? 'member' : 'workcenter',
    memId: row.subject_type === 'member' ? row.subject_id : undefined,
  }

  const enriched = await enrichAuthUser(pool, baseUser)
  const hubPermissions = portalHubPermissions(await listPermissionsForUserst(pool, row.userst))

  return {
    ok: true,
    consumedBy: clientId,
    data: {
      user: {
        idwkctr: enriched.idwkctr,
        memId: enriched.memId ?? null,
        username: enriched.username,
        userst: enriched.userst,
        accountType: enriched.accountType ?? 'workcenter',
        fullnameTh: enriched.fullnameTh ?? null,
        fullnameEng: enriched.fullnameEng ?? null,
        wkctr: enriched.wkctr,
        plnt: enriched.plnt ?? null,
      },
      hubPermissions,
      handoffAt: consumedAt.toISOString(),
    },
  }
}
