import { Pool, type PoolConfig } from 'pg'

export function createPool(connectionString: string) {
  const config: PoolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  }
  if (connectionString.includes('supabase.com') || process.env.PGSSLMODE === 'require') {
    config.ssl = { rejectUnauthorized: false }
  }
  return new Pool(config)
}
