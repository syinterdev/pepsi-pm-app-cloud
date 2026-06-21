import { describe, expect, it } from 'vitest'
import { rateLimitOptionsFromEnv } from './rate-limit.js'

describe('rateLimitOptionsFromEnv', () => {
  it('disables limiter in test NODE_ENV', () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
    expect(rateLimitOptionsFromEnv().enabled).toBe(false)
    process.env.NODE_ENV = prev
  })

  it('defaults to 100 requests per minute', () => {
    const prev = {
      NODE_ENV: process.env.NODE_ENV,
      RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX,
      RATE_LIMIT_ADMIN_MAX: process.env.RATE_LIMIT_ADMIN_MAX,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
    }
    process.env.NODE_ENV = 'development'
    delete process.env.RATE_LIMIT_AUTH_MAX
    delete process.env.RATE_LIMIT_ADMIN_MAX
    delete process.env.RATE_LIMIT_WINDOW_MS
    delete process.env.RATE_LIMIT_ENABLED

    const opts = rateLimitOptionsFromEnv()
    expect(opts.enabled).toBe(true)
    expect(opts.authMax).toBe(100)
    expect(opts.adminMax).toBe(100)
    expect(opts.windowMs).toBe(60_000)

    Object.assign(process.env, prev)
  })
})
