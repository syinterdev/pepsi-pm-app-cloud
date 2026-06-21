import type { Express, Response } from 'express'

import type { Pool } from 'pg'

import { createRequireApiAuth } from '../middleware/require-api-auth.js'

import { navMenuResponseSchema } from '../schemas/nav.js'

import { listNavMenuForUser } from '../services/nav-menu.js'



export function registerNavRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)

  app.get(
    '/api/v1/nav/menu',
    requireAuth,

    async (req, res: Response) => {

      const user = req.authUser!

      const payload = await listNavMenuForUser(pool, user.userst)

      res.json(navMenuResponseSchema.parse(payload))

    },

  )

}


