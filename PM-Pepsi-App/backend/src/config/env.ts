import { z } from 'zod'

const connectionString = z
  .string()
  .min(1)
  .refine((s) => s.startsWith('postgres://') || s.startsWith('postgresql://'), 'Must be a postgres connection URL')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: connectionString,
  CORS_ORIGIN: z.string().optional(),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error(parsed.error.flatten())
    throw new Error('Invalid environment variables (see .env.example)')
  }
  return parsed.data
}
