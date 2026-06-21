import { Pool } from 'pg'

export function createPool(connectionString: string) {
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  })
}
