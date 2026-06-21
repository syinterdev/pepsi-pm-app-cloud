import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      })
      return
    }
    req.body = parsed.data
    next()
  }
}
