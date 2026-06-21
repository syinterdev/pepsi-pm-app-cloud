import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  adminMenuListResponseSchema,
  createMenuBodySchema,
  menuOkSchema,
  navLayoutResponseSchema,
  patchNavLayoutBodySchema,
  reorderMenuBodySchema,
  updateMenuBodySchema,
} from '../schemas/admin-menu.js'
import { getNavShellMode, setNavShellMode } from '../services/admin-menu-layout.js'
import {
  createMenu,
  deleteMenu,
  listAdminMenu,
  reorderMenu,
  updateMenu,
} from '../services/admin-menu.js'
import { syncMenuFromPhpSeed } from '../services/admin-menu-sync.js'

export function registerAdminMenuRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.menu.read',
    'admin.menu.write',
    'admin.settings.read',
    'admin.settings.write',
  ])
  const requireWrite = createRequireAnyPermission(pool, sessionSecret)([
    'admin.menu.write',
    'admin.settings.write',
  ])

  app.get('/api/v1/admin/menu', ...requireRead, async (_req: Request, res: Response) => {
    const items = await listAdminMenu(pool)
    res.json(adminMenuListResponseSchema.parse({ items }))
  })

  app.get('/api/v1/admin/menu/layout', ...requireRead, async (_req: Request, res: Response) => {
    const navShellMode = await getNavShellMode(pool)
    res.json(navLayoutResponseSchema.parse({ navShellMode }))
  })

  app.put('/api/v1/admin/menu/layout', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = patchNavLayoutBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    const navShellMode = await setNavShellMode(pool, parsed.data.navShellMode)
    voidAudit(pool, req, {
      action: 'admin.menu.layout',
      resource: 'tbl_setting',
      resourceId: 'nav.shell_mode',
      after: { navShellMode },
    })
    res.json(navLayoutResponseSchema.parse({ navShellMode }))
  })

  app.post('/api/v1/admin/menu', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = createMenuBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    const row = await createMenu(pool, {
      menuKind: parsed.data.menuKind,
      menutitle: parsed.data.menutitle,
      menuright: parsed.data.menuright,
      menuicon: parsed.data.menuicon ?? null,
      menulink: parsed.data.menulink ?? null,
      reactRoute: parsed.data.reactRoute ?? null,
      menuname: parsed.data.menuname ?? null,
      idmenusub: parsed.data.idmenusub,
      menulavel: parsed.data.menulavel,
      endExact: parsed.data.endExact,
      menuon: parsed.data.menuon,
    })
    voidAudit(pool, req, {
      action: 'admin.menu.create',
      resource: 'tbmenu',
      resourceId: String(row.idmenu),
      after: row,
    })
    res.status(201).json(row)
  })

  app.put('/api/v1/admin/menu/:id', ...requireWrite, async (req: Request, res: Response) => {
    const idmenu = Number(req.params.id)
    if (!Number.isFinite(idmenu)) {
      res.status(400).json({ error: 'INVALID_ID' })
      return
    }
    const parsed = updateMenuBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const row = await updateMenu(pool, idmenu, parsed.data)
      voidAudit(pool, req, {
        action: 'admin.menu.update',
        resource: 'tbmenu',
        resourceId: String(idmenu),
        after: row,
      })
      res.json(row)
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      throw err
    }
  })

  app.delete('/api/v1/admin/menu/:id', ...requireWrite, async (req: Request, res: Response) => {
    const idmenu = Number(req.params.id)
    if (!Number.isFinite(idmenu)) {
      res.status(400).json({ error: 'INVALID_ID' })
      return
    }
    try {
      await deleteMenu(pool, idmenu)
      voidAudit(pool, req, {
        action: 'admin.menu.delete',
        resource: 'tbmenu',
        resourceId: String(idmenu),
      })
      res.json(menuOkSchema.parse({ ok: true }))
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/menu/sync-from-php',
    ...requireWrite,
    async (req: Request, res: Response) => {
      try {
        const result = await syncMenuFromPhpSeed(pool)
        voidAudit(pool, req, {
          action: 'admin.menu.sync',
          resource: 'tbmenu',
          after: result,
        })
        res.json({ ok: true as const, ...result })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'SEED_FILE_NOT_FOUND') {
          res.status(404).json({
            error: 'SEED_FILE_NOT_FOUND',
            message:
              'ไม่พบ database/seeds/generated/import_tbmenu_pg.sql — รัน database/scripts/import-auth-from-mysql.ps1 ก่อน',
          })
          return
        }
        if (msg === 'SEED_EMPTY') {
          res.status(400).json({ error: 'SEED_EMPTY' })
          return
        }
        throw err
      }
    },
  )

  app.post('/api/v1/admin/menu/reorder', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = reorderMenuBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    await reorderMenu(pool, parsed.data.items)
    voidAudit(pool, req, {
      action: 'admin.menu.reorder',
      resource: 'tbmenu',
      after: { count: parsed.data.items.length },
    })
    res.json(menuOkSchema.parse({ ok: true }))
  })
}
