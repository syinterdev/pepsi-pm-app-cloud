import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Pool } from 'pg'
import { auditLogFromRequest } from '../lib/audit-log.js'
import { sanitizeAuditPayload } from '../lib/audit-mutation.js'

function resolveMasterDataMutation(req: Request): {
  op: 'create' | 'update' | 'delete' | 'import'
  entity: string
  resourceId?: string
} | null {
  // Mounted at `/api/v1/master-data` — `req.path` is e.g. `/activitytype/PM01` or `/department/import`
  const segments = req.path.split('/').filter(Boolean)
  if (!segments.length) return null

  const entity = segments[0]
  if (entity === 'meta') return null

  const tail = segments.slice(1)
  const isImport = tail[tail.length - 1] === 'import'

  let op: 'create' | 'update' | 'delete' | 'import'
  if (req.method === 'DELETE') op = 'delete'
  else if (req.method === 'POST' && isImport) op = 'import'
  else if (req.method === 'POST') op = 'create'
  else if (req.method === 'PUT' || req.method === 'PATCH') op = 'update'
  else return null

  let resourceId: string | undefined
  if (op === 'update' || op === 'delete') {
    const fromParams = Object.values(req.params)
      .filter((v) => v != null && String(v).trim() !== '')
      .map((v) => String(v).trim())[0]
    const fromPath = tail.find((s) => s !== 'import')
    resourceId = fromParams ?? fromPath
  }

  return { op, entity, resourceId }
}

/**
 * Audits successful POST/PUT/PATCH/DELETE under `/api/v1/master-data/*`
 * without editing each entity handler individually.
 */
export function auditMasterDataMutations(pool: Pool): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      next()
      return
    }

    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return
      if (!req.authUser) return

      const resolved = resolveMasterDataMutation(req)
      if (!resolved) return

      const after =
        req.method !== 'DELETE' && req.body
          ? sanitizeAuditPayload(req.body)
          : undefined

      void auditLogFromRequest(pool, req, {
        action: `master-data.${resolved.op}`,
        resource: resolved.entity,
        resourceId: resolved.resourceId,
        after,
        status: 'ok',
      })
    })

    next()
  }
}
