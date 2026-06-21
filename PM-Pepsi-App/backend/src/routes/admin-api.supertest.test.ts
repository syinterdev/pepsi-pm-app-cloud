import type { Pool } from 'pg'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { clearPermissionCache } from '../lib/has-permission.js'
import { authBearer, legacyRbacPool, TEST_SESSION_SECRET } from '../test/admin-api-harness.js'

const mockListPersonnel = vi.fn()
const mockGetBranding = vi.fn()
const mockClearLogo = vi.fn()
const mockListBackup = vi.fn()
const mockRunRestore = vi.fn()

vi.mock('../services/personnel-admin.js', () => ({
  listPersonnelAdmin: (...args: unknown[]) => mockListPersonnel(...args),
}))

vi.mock('../services/admin-branding.js', () => ({
  BRANDING_DEFAULTS: {
    appName: 'PM Pepsi',
    footerText: '© S.Y. Interactive Development Limited',
    primaryColor: '#003366',
    accentColor: '#F7941D',
    successColor: '#7AC943',
    warningColor: '#F7941D',
    dangerColor: '#FF3B30',
    infoColor: '#4DA6FF',
    themeMode: 'system',
    fontFamily: 'sarabun',
    fontSizePreset: 'comfortable',
    fontSizeBasePx: null,
    fontColor: null,
    fontHeadingColor: null,
    fontMutedColor: null,
  },
  getAdminBranding: (...args: unknown[]) => mockGetBranding(...args),
  patchAdminBranding: vi.fn(),
  resetBrandingDefaults: vi.fn(),
  setBrandingLogo: vi.fn(),
  setBrandingFavicon: vi.fn(),
  clearBrandingLogo: (...args: unknown[]) => mockClearLogo(...args),
  clearBrandingFavicon: vi.fn(),
  clearBrandingLoginBackground: vi.fn(),
  setBrandingLoginBackground: vi.fn(),
  getBrandingLoginBackground: vi.fn(),
}))

vi.mock('../services/admin-backup.js', () => ({
  listBackupHistory: (...args: unknown[]) => mockListBackup(...args),
  getBackupSettings: vi.fn(async () => ({
    scheduleCron: '0 2 * * *',
    retentionDays: 30,
    targetDir: '/backup',
    enabled: true,
  })),
  getLastSuccessfulBackup: vi.fn(async () => null),
  patchBackupSettings: vi.fn(),
  deleteBackupRecord: vi.fn(),
  getBackupById: vi.fn(),
  hasRunningBackup: vi.fn(async () => false),
  runBackupJob: vi.fn(),
  isBackupTableMissing: () => false,
}))

vi.mock('../services/admin-backup-restore.js', () => ({
  runRestoreFromGzipFile: (...args: unknown[]) => mockRunRestore(...args),
}))

vi.mock('../services/pg-dump-backup.js', () => ({
  isPgDumpAvailable: vi.fn(async () => true),
  isPsqlAvailable: vi.fn(async () => true),
  resolvePgDumpBin: () => 'pg_dump',
  resolvePsqlBin: () => 'psql',
}))

function buildApp(pool: Pool) {
  return createApp({
    pool,
    sessionSecret: TEST_SESSION_SECRET,
    databaseUrl: 'postgresql://localhost:5432/pm_test',
  })
}

describe('admin API (supertest)', () => {
  let pool: Pool
  let app: ReturnType<typeof buildApp>

  beforeEach(() => {
    clearPermissionCache()
    pool = legacyRbacPool()
    app = buildApp(pool)
    mockListPersonnel.mockResolvedValue({
      items: [
        {
          idwkctr: 'WC001',
          titlewkctr: null,
          namewkctr: 'Test',
          surnamewkctr: 'User',
          titlewkctreng: null,
          namewkctreng: null,
          surnamewkctreng: null,
          startwork: null,
          wkctrdate: null,
          iddepartment: null,
          department: null,
          idposition: null,
          position: null,
          wkctr: 'WC001',
          plnt: null,
          cat: null,
          resp: null,
          idwkctrgroup: null,
          wkctrgroup: null,
          idwkctrtype: null,
          wkctrtype: null,
          idwklevel: null,
          wklevel: null,
          wkctrtel: null,
          wkctrmail: null,
          labourcost: 0,
          userst: 'A',
          userrole: 'admin',
          workstatus: null,
          imgmember: null,
          imgmemberMime: '',
          imgmemberBytes: 0,
          hasImage: false,
        },
      ],
      totalRows: 1,
    })
    mockGetBranding.mockResolvedValue({
      appName: 'PM Test',
      footerText: '© Test',
      primaryColor: '#003366',
      accentColor: '#F7941D',
      successColor: '#7AC943',
      warningColor: '#F7941D',
      dangerColor: '#FF3B30',
      infoColor: '#4DA6FF',
      themeMode: 'system',
      logoMime: null,
      hasLogo: false,
      hasFavicon: false,
      hasLoginBackground: false,
      fontFamily: 'sarabun',
      fontSizePreset: 'comfortable',
      fontSizeBasePx: null,
      fontColor: null,
      fontHeadingColor: null,
      fontMutedColor: null,
      logoNavHeightPx: 32,
      logoLoginHeightPx: 56,
      faviconSizePx: 32,
    })
    mockClearLogo.mockResolvedValue(undefined)
    mockListBackup.mockResolvedValue({ items: [], total: 0 })
    mockRunRestore.mockResolvedValue({ durationMs: 100 })
  })

  describe('GET /api/v1/admin/users', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/admin/users')
      expect(res.status).toBe(401)
    })

    it('returns 403 for planner without admin.users.read', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', authBearer('U'))
      expect(res.status).toBe(403)
    })

    it('returns 200 for admin legacy role A', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', authBearer('A'))
      expect(res.status).toBe(200)
      expect(res.body.totalRows).toBe(1)
      expect(mockListPersonnel).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/v1/admin/branding/logo', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete('/api/v1/admin/branding/logo')
      expect(res.status).toBe(401)
    })

    it('returns 200 and resets logo for admin', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/branding/logo')
        .set('Authorization', authBearer('A'))
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(mockClearLogo).toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/admin/backup', () => {
    it('returns backup list for admin.backup.read', async () => {
      const res = await request(app)
        .get('/api/v1/admin/backup')
        .set('Authorization', authBearer('A'))
      expect(res.status).toBe(200)
      expect(res.body.items).toEqual([])
      expect(mockListBackup).toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/admin/backup/restore', () => {
    it('rejects missing confirmPhrase', async () => {
      const res = await request(app)
        .post('/api/v1/admin/backup/restore')
        .set('Authorization', authBearer('A'))
        .field('confirmPhrase', 'WRONG')
      expect(res.status).toBe(400)
      expect(mockRunRestore).not.toHaveBeenCalled()
    })

    it('rejects upload without file', async () => {
      const res = await request(app)
        .post('/api/v1/admin/backup/restore')
        .set('Authorization', authBearer('A'))
        .field('confirmPhrase', 'RESTORE')
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/ไฟล์/)
    })
  })
})
