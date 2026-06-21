import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  adminPermissionsResponseSchema,
  adminRoleMatrixResponseSchema,
  adminRolesListResponseSchema,
  createRoleBodySchema,
  roleOkSchema,
  setRolePermissionsBodySchema,
  simulateRoleResponseSchema,
  updateRoleBodySchema,
} from '../schemas/admin-roles.js'
import {
  createRole,
  deleteRole,
  getRoleMatrix,
  isRbacSchemaMissing,
  listPermissionsGrouped,
  listRoles,
  setRolePermissions,
  simulateRolePermissions,
  updateRole,
} from '../services/admin-roles.js'

const SCHEMA_HINT = 'รัน migration 044–046 (tbl_role, tbl_permission, tbl_role_permission)'

function schemaError(res: Response, err: unknown): boolean {
  if (isRbacSchemaMissing(err)) {
    res.status(503).json({ error: 'SCHEMA_NOT_READY', message: SCHEMA_HINT })
    return true
  }
  return false
}

export function registerAdminRolesRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.roles.read',
    'admin.roles.write',
  ])
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.roles.write')

  app.get('/api/v1/admin/roles', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const items = await listRoles(pool)
      res.json(adminRolesListResponseSchema.parse({ items }))
    } catch (err) {
      if (schemaError(res, err)) return
      throw err
    }
  })

  app.get('/api/v1/admin/roles/matrix', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await getRoleMatrix(pool)
      res.json(adminRoleMatrixResponseSchema.parse(data))
    } catch (err) {
      if (schemaError(res, err)) return
      throw err
    }
  })

  app.get('/api/v1/admin/permissions', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await listPermissionsGrouped(pool)
      res.json(adminPermissionsResponseSchema.parse(data))
    } catch (err) {
      if (schemaError(res, err)) return
      throw err
    }
  })

  const simulateHandler = async (req: Request, res: Response) => {
    try {
      const permissions = await simulateRolePermissions(pool, req.params.code)
      res.json(
        simulateRoleResponseSchema.parse({
          roleCode: req.params.code.toUpperCase(),
          permissions,
        }),
      )
    } catch (err) {
      if (schemaError(res, err)) return
      throw err
    }
  }

  app.get('/api/v1/admin/roles/:code/simulate', ...requireRead, simulateHandler)
  app.post('/api/v1/admin/roles/:code/simulate', ...requireRead, simulateHandler)

  app.post('/api/v1/admin/roles', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = createRoleBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const role = await createRole(pool, {
        roleCode: parsed.data.roleCode,
        roleName: parsed.data.roleName,
        roleNameEn: parsed.data.roleNameEn,
        roleColor: parsed.data.roleColor,
        description: parsed.data.description ?? null,
      })
      voidAudit(pool, req, {
        action: 'admin.roles.create',
        resource: 'tbl_role',
        resourceId: role.roleCode,
        after: role,
      })
      res.status(201).json(role)
    } catch (err) {
      if (schemaError(res, err)) return
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'ROLE_EXISTS') {
        res.status(409).json({ error: 'ROLE_EXISTS', message: 'role_code ซ้ำ' })
        return
      }
      throw err
    }
  })

  app.put('/api/v1/admin/roles/:code', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = updateRoleBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const role = await updateRole(pool, req.params.code, parsed.data)
      voidAudit(pool, req, {
        action: 'admin.roles.update',
        resource: 'tbl_role',
        resourceId: role.roleCode,
        after: role,
      })
      res.json(role)
    } catch (err) {
      if (schemaError(res, err)) return
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      throw err
    }
  })

  app.delete('/api/v1/admin/roles/:code', ...requireWrite, async (req: Request, res: Response) => {
    try {
      await deleteRole(pool, req.params.code)
      voidAudit(pool, req, {
        action: 'admin.roles.delete',
        resource: 'tbl_role',
        resourceId: req.params.code.toUpperCase(),
      })
      res.json(roleOkSchema.parse({ ok: true }))
    } catch (err) {
      if (schemaError(res, err)) return
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      if (msg === 'SYSTEM_ROLE') {
        res.status(403).json({ error: 'SYSTEM_ROLE', message: 'ห้ามลบ system role' })
        return
      }
      if (msg === 'ROLE_IN_USE') {
        res.status(409).json({ error: 'ROLE_IN_USE', message: 'ยังมีผู้ใช้ผูก userst อยู่' })
        return
      }
      throw err
    }
  })

  app.put(
    '/api/v1/admin/roles/:code/permissions',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = setRolePermissionsBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const result = await setRolePermissions(pool, req.params.code, parsed.data.grants)
        voidAudit(pool, req, {
          action: 'admin.roles.permissions',
          resource: 'tbl_role_permission',
          resourceId: req.params.code.toUpperCase(),
          after: { updated: result.updated, keys: Object.keys(parsed.data.grants).length },
        })
        res.json({ ok: true as const, ...result })
      } catch (err) {
        if (schemaError(res, err)) return
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        throw err
      }
    },
  )
}
