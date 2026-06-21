import type { Pool } from 'pg'
import { isIntegrationTableMissing } from './integration-job.js'
import { getIntegrationWatchSettings } from './integration-settings.js'
import { runInboundIntegrationScan } from './integration-watch.js'

let lastRunAt = 0
let lastScheduledMinute: string | null = null

export function startIntegrationWatchScheduler(pool: Pool): void {
  const tick = async () => {
    try {
      const settings = await getIntegrationWatchSettings(pool)
      if (!settings.enabled) return

      const now = Date.now()
      const intervalMs = settings.intervalMinutes * 60_000
      if (now - lastRunAt < intervalMs) return

      const minuteSlot = new Date().toISOString().slice(0, 16)
      if (lastScheduledMinute === minuteSlot) return
      lastScheduledMinute = minuteSlot

      lastRunAt = now
      await runInboundIntegrationScan(pool, {
        trigger: 'schedule',
        startedBy: 'schedule',
      })
    } catch (err) {
      if (isIntegrationTableMissing(err)) return
      if (err instanceof Error && err.message === 'INTEGRATION_JOB_ALREADY_RUNNING') {
        return
      }
      console.error('[integration-watch]', err)
    }
  }

  void tick()
  setInterval(() => void tick(), 60_000)
}
