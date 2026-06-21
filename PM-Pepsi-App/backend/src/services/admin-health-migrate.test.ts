import type { Pool } from 'pg'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthMigrateError, runPendingMigrations } from './admin-health-migrate.js'

vi.mock('./maintenance-mode.js', () => ({
  getMaintenanceState: vi.fn(),
}))

vi.mock('./admin-health.js', () => ({
  resolveMigrationsDir: () => '/tmp/migrations',
  getMigrationHealth: vi.fn(),
}))

vi.mock('./pg-dump-backup.js', () => ({
  isPsqlAvailable: vi.fn(async () => true),
  runPsqlSqlFile: vi.fn(async () => undefined),
}))

import { getMaintenanceState } from './maintenance-mode.js'
import { getMigrationHealth } from './admin-health.js'
import { runPsqlSqlFile } from './pg-dump-backup.js'

describe('runPendingMigrations', () => {
  const pool = {} as Pool
  const dbUrl = 'postgresql://u:p@localhost:5432/pm'

  beforeEach(() => {
    vi.mocked(getMaintenanceState).mockReset()
    vi.mocked(getMigrationHealth).mockReset()
    vi.mocked(runPsqlSqlFile).mockClear()
  })

  it('requires maintenance mode', async () => {
    vi.mocked(getMaintenanceState).mockResolvedValue({ enabled: false, message: '' })
    await expect(runPendingMigrations(pool, dbUrl)).rejects.toMatchObject({
      code: 'MAINTENANCE_REQUIRED',
    })
  })

  it('applies pending probes in order', async () => {
    vi.mocked(getMaintenanceState).mockResolvedValue({ enabled: true, message: 'x' })
    vi.mocked(getMigrationHealth)
      .mockResolvedValueOnce({
        status: 'warning',
        migrationsDir: '/tmp/migrations',
        totalFiles: 2,
        appliedCount: 0,
        pendingCount: 2,
        unverifiedCount: 0,
        latestAppliedId: null,
        latestFile: null,
        probes: [
          { id: '047', file: '047_tbl_setting.sql', label: 'Setting', status: 'pending' },
          { id: '050', file: '050_tbl_audit_log.sql', label: 'Audit', status: 'pending' },
        ],
      })
      .mockResolvedValueOnce({
        status: 'ok',
        migrationsDir: '/tmp/migrations',
        totalFiles: 2,
        appliedCount: 2,
        pendingCount: 0,
        unverifiedCount: 0,
        latestAppliedId: '050',
        latestFile: '050_tbl_audit_log.sql',
        probes: [],
      })

    const result = await runPendingMigrations(pool, dbUrl)
    expect(result.applied).toHaveLength(2)
    expect(result.pendingRemaining).toBe(0)
    expect(runPsqlSqlFile).toHaveBeenCalledTimes(2)
  })

  it('stops on first psql error', async () => {
    vi.mocked(getMaintenanceState).mockResolvedValue({ enabled: true, message: '' })
    vi.mocked(getMigrationHealth)
      .mockResolvedValueOnce({
        status: 'warning',
        migrationsDir: '/tmp/migrations',
        totalFiles: 1,
        appliedCount: 0,
        pendingCount: 1,
        unverifiedCount: 0,
        latestAppliedId: null,
        latestFile: null,
        probes: [{ id: '047', file: '047_tbl_setting.sql', label: 'Setting', status: 'pending' }],
      })
      .mockResolvedValueOnce({
        status: 'warning',
        migrationsDir: '/tmp/migrations',
        totalFiles: 1,
        appliedCount: 0,
        pendingCount: 1,
        unverifiedCount: 0,
        latestAppliedId: null,
        latestFile: null,
        probes: [{ id: '047', file: '047_tbl_setting.sql', label: 'Setting', status: 'pending' }],
      })

    vi.mocked(runPsqlSqlFile).mockRejectedValueOnce(new Error('syntax error'))

    const result = await runPendingMigrations(pool, dbUrl)
    expect(result.applied).toHaveLength(0)
    expect(result.stoppedAt?.file).toBe('047_tbl_setting.sql')
  })

  it('throws when nothing pending', async () => {
    vi.mocked(getMaintenanceState).mockResolvedValue({ enabled: true, message: '' })
    vi.mocked(getMigrationHealth).mockResolvedValue({
      status: 'ok',
      migrationsDir: '/tmp/migrations',
      totalFiles: 0,
      appliedCount: 0,
      pendingCount: 0,
      unverifiedCount: 0,
      latestAppliedId: null,
      latestFile: null,
      probes: [],
    })

    await expect(runPendingMigrations(pool, dbUrl)).rejects.toBeInstanceOf(HealthMigrateError)
  })
})
