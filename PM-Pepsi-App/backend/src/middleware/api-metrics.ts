import type { Express, Request, Response, NextFunction } from 'express'
import { recordApiDuration } from '../lib/api-metrics.js'

/** Records wall-clock duration for `/api/v1/*` after response finishes. */
export function registerApiMetrics(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = performance.now()
    res.on('finish', () => {
      const ms = performance.now() - start
      recordApiDuration(req.path, ms)
    })
    next()
  })
}
