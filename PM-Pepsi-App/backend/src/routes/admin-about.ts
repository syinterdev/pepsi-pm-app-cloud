import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequirePermission } from '../middleware/require-permission.js'
import { adminAboutResponseSchema } from '../schemas/admin-about.js'
import { getAdminAbout } from '../services/admin-about.js'

export function registerAdminAboutRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequirePermission(pool, sessionSecret)('admin.about.read')

  app.get('/api/v1/admin/about', ...requireRead, async (_req: Request, res: Response) => {
    const data = await getAdminAbout(pool)
    res.json(adminAboutResponseSchema.parse(data))
  })
}
