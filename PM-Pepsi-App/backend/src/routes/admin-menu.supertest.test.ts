import type { Pool } from 'pg'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { clearPermissionCache } from '../lib/has-permission.js'
import { authBearer, legacyRbacPool, TEST_SESSION_SECRET } from '../test/admin-api-harness.js'

const mockListMenu = vi.fn()
const mockGetNavShell = vi.fn()
const mockSetNavShell = vi.fn()

vi.mock('../services/admin-menu.js', () => ({
  listAdminMenu: (...args: unknown[]) => mockListMenu(...args),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  deleteMenu: vi.fn(),
  reorderMenu: vi.fn(),
}))

vi.mock('../services/admin-menu-layout.js', () => ({
  getNavShellMode: (...args: unknown[]) => mockGetNavShell(...args),
  setNavShellMode: (...args: unknown[]) => mockSetNavShell(...args),
}))

vi.mock('../services/admin-menu-sync.js', () => ({
  syncMenuFromPhpSeed: vi.fn(),
}))

function buildApp(pool: Pool) {
  return createApp({
    pool,
    sessionSecret: TEST_SESSION_SECRET,
    databaseUrl: 'postgresql://localhost:5432/pm_test',
  })
}

describe('admin menu API (supertest)', () => {
  let app: ReturnType<typeof buildApp>

  beforeEach(() => {
    clearPermissionCache()
    app = buildApp(legacyRbacPool())
    mockListMenu.mockResolvedValue([])
    mockGetNavShell.mockResolvedValue('sidebar')
    mockSetNavShell.mockResolvedValue('navbar')
  })

  it('GET layout returns navShellMode', async () => {
    const res = await request(app)
      .get('/api/v1/admin/menu/layout')
      .set('Authorization', authBearer('A'))
    expect(res.status).toBe(200)
    expect(res.body.navShellMode).toBe('sidebar')
  })

  it('PUT layout persists mode', async () => {
    const res = await request(app)
      .put('/api/v1/admin/menu/layout')
      .set('Authorization', authBearer('A'))
      .send({ navShellMode: 'navbar' })
    expect(res.status).toBe(200)
    expect(res.body.navShellMode).toBe('navbar')
    expect(mockSetNavShell).toHaveBeenCalledWith(expect.anything(), 'navbar')
  })
})
