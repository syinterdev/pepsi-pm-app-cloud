import type { Pool } from 'pg'

/** Single global backup/restore critical section per database */
const BACKUP_ADVISORY_LOCK_KEY = 928_451_063

export async function withBackupAdvisoryLock<T>(pool: Pool, fn: () => Promise<T>): Promise<T> {
  await pool.query(`SELECT pg_advisory_lock($1)`, [BACKUP_ADVISORY_LOCK_KEY])
  try {
    return await fn()
  } finally {
    await pool.query(`SELECT pg_advisory_unlock($1)`, [BACKUP_ADVISORY_LOCK_KEY])
  }
}
