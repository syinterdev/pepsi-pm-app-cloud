import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { publicSettingsResponseSchema } from '../schemas/settings.js'
import {
  getPublicFavicon,
  getPublicLoginBackground,
  getPublicLogo,
  getPublicSettings,
} from '../services/settings.js'

const PUBLIC_CACHE_SEC = 300

export function registerSettingsRoutes(app: Express, pool: Pool) {
  app.get('/api/v1/settings/public', async (_req: Request, res: Response) => {
    const data = await getPublicSettings(pool)
    res.setHeader('Cache-Control', `public, max-age=${PUBLIC_CACHE_SEC}`)
    res.json(publicSettingsResponseSchema.parse(data))
  })

  app.get('/api/v1/settings/public/logo', async (_req: Request, res: Response) => {
    const logo = await getPublicLogo(pool)
    if (!logo) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No custom logo configured' })
      return
    }
    res.setHeader('Content-Type', logo.mime)
    res.setHeader('Cache-Control', `public, max-age=${PUBLIC_CACHE_SEC}`)
    res.send(logo.buffer)
  })

  app.get('/api/v1/settings/public/favicon', async (_req: Request, res: Response) => {
    const buffer = await getPublicFavicon(pool)
    if (!buffer) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No custom favicon configured' })
      return
    }
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', `public, max-age=${PUBLIC_CACHE_SEC}`)
    res.send(buffer)
  })

  app.get('/api/v1/settings/public/login-background', async (_req: Request, res: Response) => {
    const buffer = await getPublicLoginBackground(pool)
    if (!buffer) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No custom login background configured' })
      return
    }
    res.setHeader('Content-Type', 'image/webp')
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate')
    res.send(buffer)
  })
}
