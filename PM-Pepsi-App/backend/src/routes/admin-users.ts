import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { listPermissionsForUserst } from '../lib/has-permission.js'
import { IMPERSONATION_TTL_MS, signSessionToken } from '../lib/session-token.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  adminBulkUserroleBodySchema,
  adminBulkUserroleResponseSchema,
  adminDeactivateWithoutPhotoBodySchema,
  adminDeactivateWithoutPhotoResponseSchema,
  adminImpersonateResponseSchema,
  adminLockResponseSchema,
  adminMembersListResponseSchema,
  adminPhotoGoLiveQuerySchema,
  adminPhotoGoLiveResponseSchema,
  adminResetPasswordResponseSchema,
  adminUsersListQuerySchema,
  adminUsersListResponseSchema,
} from '../schemas/admin-users.js'
import {
  buildImpersonatedUser,
  bulkUpdateWorkcenterUserrole,
  listAdminMembers,
  loadAuthUserForImpersonation,
  lockMember,
  lockWorkcenter,
  resetMemberPassword,
  resetWorkcenterPassword,
  unlockMember,
  unlockWorkcenter,
} from '../services/admin-users.js'
import {
  deactivateWithoutPhoto,
  listPhotoGoLiveGaps,
} from '../services/personnel-photo-go-live.js'
import { listPersonnelAdmin } from '../services/personnel-admin.js'

function parseAccount(req: Request): { accountType: 'workcenter' | 'member'; id: string } {
  const accountType =
    req.query.accountType === 'member' || req.body?.accountType === 'member'
      ? 'member'
      : 'workcenter'
  const id = String(req.params.id ?? '').trim()
  return { accountType, id }
}

export function registerAdminUsersRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.users.read',
    'admin.users.write',
    'personnel.write',
  ])
  const requireWrite = createRequireAnyPermission(pool, sessionSecret)([
    'admin.users.write',
    'personnel.write',
  ])
  const requireImpersonate = createRequirePermission(pool, sessionSecret)(
    'admin.users.impersonate',
  )

  app.get('/api/v1/admin/users', ...requireRead, async (req: Request, res: Response) => {
    const parsed = adminUsersListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const data = await listPersonnelAdmin(pool, parsed.data)
      res.json(adminUsersListResponseSchema.parse(data))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('does not exist')) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message })
        return
      }
      throw err
    }
  })

  app.get(
    '/api/v1/admin/users/photo-go-live',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = adminPhotoGoLiveQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const data = await listPhotoGoLiveGaps(pool, {
          fromInput: parsed.data.from,
          toInput: parsed.data.to,
          weeksBack: parsed.data.weeksBack,
        })
        res.json(adminPhotoGoLiveResponseSchema.parse(data))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('does not exist')) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/admin/users/deactivate-without-photo',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = adminDeactivateWithoutPhotoBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const out = await deactivateWithoutPhoto(pool, {
          idwkctrs: parsed.data.idwkctrs,
          workstatus: parsed.data.workstatus,
        })
        voidAudit(pool, req, {
          action: 'admin.users.deactivate_without_photo',
          resource: 'tbworkcenter',
          resourceId: `${out.updated}`,
          after: {
            workstatus: out.workstatus,
            requested: parsed.data.idwkctrs.length,
            updated: out.updated,
            skipped: out.skipped,
          },
        })
        res.json(
          adminDeactivateWithoutPhotoResponseSchema.parse({
            ok: true,
            updated: out.updated,
            workstatus: out.workstatus,
            skipped: out.skipped,
          }),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('does not exist')) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/admin/users/bulk-userrole',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = adminBulkUserroleBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const out = await bulkUpdateWorkcenterUserrole(
          pool,
          parsed.data.idwkctrs,
          parsed.data.userrole,
        )
        voidAudit(pool, req, {
          action: 'admin.users.bulk_userrole',
          resource: 'tbworkcenter',
          resourceId: `${out.updated}`,
          after: {
            userrole: parsed.data.userrole,
            count: parsed.data.idwkctrs.length,
            updated: out.updated,
          },
        })
        res.json(
          adminBulkUserroleResponseSchema.parse({
            ok: true,
            updated: out.updated,
            userrole: parsed.data.userrole,
          }),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('does not exist')) {
          res.status(503).json({ error: 'SCHEMA_NOT_READY', message })
          return
        }
        throw err
      }
    },
  )

  app.get('/api/v1/admin/users/members', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await listAdminMembers(pool)
      res.json(adminMembersListResponseSchema.parse(data))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('does not exist')) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/users/:id/reset-password',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const { accountType, id } = parseAccount(req)
      try {
        const out =
          accountType === 'member'
            ? await resetMemberPassword(pool, Number(id.replace(/^mem:/, '')))
            : await resetWorkcenterPassword(pool, id)
        voidAudit(pool, req, {
          action: 'admin.users.reset_password',
          resource: accountType === 'member' ? 'tbl_member' : 'tbworkcenter',
          resourceId: id,
        })
        res.json(
          adminResetPasswordResponseSchema.parse({
            ok: true,
            temporaryPassword: out.temporaryPassword,
            passMustChange: true,
          }),
        )
      } catch (err) {
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        throw err
      }
    },
  )

  app.post('/api/v1/admin/users/:id/lock', ...requireWrite, async (req: Request, res: Response) => {
    const { accountType, id } = parseAccount(req)
    try {
      const out =
        accountType === 'member'
          ? await lockMember(pool, Number(id.replace(/^mem:/, '')))
          : await lockWorkcenter(pool, id)
      voidAudit(pool, req, {
        action: 'admin.users.lock',
        resource: accountType === 'member' ? 'tbl_member' : 'tbworkcenter',
        resourceId: id,
        after: out,
      })
      res.json(adminLockResponseSchema.parse({ ok: true, ...out }))
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/admin/users/:id/unlock', ...requireWrite, async (req: Request, res: Response) => {
    const { accountType, id } = parseAccount(req)
    try {
      const out =
        accountType === 'member'
          ? await unlockMember(pool, Number(id.replace(/^mem:/, '')))
          : await unlockWorkcenter(pool, id)
      voidAudit(pool, req, {
        action: 'admin.users.unlock',
        resource: accountType === 'member' ? 'tbl_member' : 'tbworkcenter',
        resourceId: id,
        after: out,
      })
      res.json(adminLockResponseSchema.parse({ ok: true, ...out }))
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/users/:id/impersonate',
    ...requireImpersonate,
    async (req: Request, res: Response) => {
      const admin = req.authUser
      if (!admin) {
        res.status(401).json({ error: 'UNAUTHORIZED' })
        return
      }
      if (admin.impersonatedBy) {
        res.status(400).json({
          error: 'ALREADY_IMPERSONATING',
          message: 'ออกจากการสวมสิทธิ์ก่อน',
        })
        return
      }

      const { accountType, id } = parseAccount(req)
      const target = await loadAuthUserForImpersonation(pool, id, accountType)
      if (!target) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }

      const impersonated = buildImpersonatedUser(target, admin)
      impersonated.permissions = await listPermissionsForUserst(pool, target.userst)

      voidAudit(pool, req, {
        action: 'auth.impersonate.start',
        resource: accountType === 'member' ? 'tbl_member' : 'tbworkcenter',
        resourceId: target.memId ?? target.idwkctr,
        after: { targetUsername: target.username, adminId: admin.idwkctr },
      })

      const token = signSessionToken(impersonated, sessionSecret, {
        ttlMs: IMPERSONATION_TTL_MS,
      })
      res.json(adminImpersonateResponseSchema.parse({ token, user: impersonated }))
    },
  )
}
