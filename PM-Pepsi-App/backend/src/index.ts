import 'dotenv/config'
import { createServer } from 'node:http'
import { loadEnv } from './config/env.js'
import { createApp } from './app.js'
import { createPool } from './db/pool.js'
import { refreshUploadLimitFromDb } from './lib/upload-settings.js'
import { startBackupScheduler } from './services/admin-backup.js'
import { startIntegrationWatchScheduler } from './services/integration-scheduler.js'

try {
  const env = loadEnv()
  const pool = createPool(env.DATABASE_URL)
  const app = createApp({
    pool,
    corsOrigin: env.CORS_ORIGIN,
    sessionSecret: env.SESSION_SECRET,
    databaseUrl: env.DATABASE_URL,
  })

  void refreshUploadLimitFromDb(pool).catch(() => {})
  setInterval(() => {
    void refreshUploadLimitFromDb(pool).catch(() => {})
  }, 60_000)

  if (process.env.BACKUP_SCHEDULER !== '0') {
    startBackupScheduler(pool, env.DATABASE_URL)
  }

  if (process.env.INTEGRATION_WATCH_SCHEDULER !== '0') {
    startIntegrationWatchScheduler(pool)
  }

  const server = createServer(app)

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`pm-api listening on port ${env.PORT}`)
    console.log(`  GET /api/v1/health`)
  })

  async function shutdown(signal: string) {
    console.log(`\n${signal} received, closing…`)
    await pool.end().catch(() => {})
    server.close(() => process.exit(0))
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
} catch (err) {
  console.error('[pm-api] startup failed:', err)
  process.exit(1)
}
