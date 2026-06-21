import type { Pool } from 'pg'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { clearPermissionCache } from '../lib/has-permission.js'
import { authBearer, legacyRbacPool, TEST_SESSION_SECRET } from '../test/admin-api-harness.js'

const mockGetRoleMatrix = vi.fn()
const mockSetRolePermissions = vi.fn()
const mockDeleteRole = vi.fn()
const mockSimulate = vi.fn()
const mockCreateRole = vi.fn()

vi.mock('../services/admin-roles.js', () => ({
  isRbacSchemaMissing: () => false,
  listRoles: vi.fn(async () => []),
  getRoleMatrix: (...args: unknown[]) => mockGetRoleMatrix(...args),
  listPermissionsGrouped: vi.fn(async () => ({ groups: [] })),
  createRole: (...args: unknown[]) => mockCreateRole(...args),
  updateRole: vi.fn(),
  deleteRole: (...args: unknown[]) => mockDeleteRole(...args),
  setRolePermissions: (...args: unknown[]) => mockSetRolePermissions(...args),
  simulateRolePermissions: (...args: unknown[]) => mockSimulate(...args),
}))

function buildApp(pool: Pool) {
  return createApp({
    pool,
    sessionSecret: TEST_SESSION_SECRET,
    databaseUrl: 'postgresql://localhost:5432/pm_test',
  })
}

describe('admin roles API (supertest)', () => {
  let app: ReturnType<typeof buildApp>

  beforeEach(() => {
    clearPermissionCache()
    app = buildApp(legacyRbacPool())
    mockGetRoleMatrix.mockResolvedValue({
      roles: [
        {
          roleCode: 'A',
          roleName: 'Admin',
          roleNameEn: 'Administrator',
          roleColor: '#000',
          isSystem: true,
          description: null,
          userCount: 1,
          permissionCount: 10,
        },
        {
          roleCode: 'OPS',
          roleName: 'Ops',
          roleNameEn: 'Operations',
          roleColor: '#0af',
          isSystem: false,
          description: null,
          userCount: 0,
          permissionCount: 0,
        },
      ],
      groups: [],
    })
    mockSetRolePermissions.mockResolvedValue({ updated: 1 })
    mockSimulate.mockResolvedValue(['planning.read', 'confirmation.read'])
    mockDeleteRole.mockImplementation(async (_pool: Pool, code: string) => {
      if (code.toUpperCase() === 'A') throw new Error('SYSTEM_ROLE')
      if (code.toUpperCase() === 'U') throw new Error('ROLE_IN_USE')
    })
    mockCreateRole.mockResolvedValue({
      roleCode: 'OPS',
      roleName: 'Ops',
      roleNameEn: 'Operations',
      roleColor: '#0af',
      isSystem: false,
      description: null,
      userCount: 0,
      permissionCount: 0,
    })
  })

  it('GET matrix requires auth', async () => {
    const res = await request(app).get('/api/v1/admin/roles/matrix')
    expect(res.status).toBe(401)
  })

  it('GET matrix returns roles for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/roles/matrix')
      .set('Authorization', authBearer('A'))
    expect(res.status).toBe(200)
    expect(res.body.roles).toHaveLength(2)
  })

  it('PUT permissions persists grants via service', async () => {
    const res = await request(app)
      .put('/api/v1/admin/roles/U/permissions')
      .set('Authorization', authBearer('A'))
      .send({ grants: { 'planning.assign': true } })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(mockSetRolePermissions).toHaveBeenCalledWith(
      expect.anything(),
      'U',
      { 'planning.assign': true },
    )
  })

  it('POST simulate returns permission list', async () => {
    const res = await request(app)
      .post('/api/v1/admin/roles/W/simulate')
      .set('Authorization', authBearer('A'))
    expect(res.status).toBe(200)
    expect(res.body.roleCode).toBe('W')
    expect(res.body.permissions).toContain('confirmation.read')
  })

  it('DELETE blocks system role', async () => {
    const res = await request(app)
      .delete('/api/v1/admin/roles/A')
      .set('Authorization', authBearer('A'))
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('SYSTEM_ROLE')
  })

  it('DELETE blocks role in use', async () => {
    const res = await request(app)
      .delete('/api/v1/admin/roles/U')
      .set('Authorization', authBearer('A'))
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('ROLE_IN_USE')
  })

  it('POST create custom role', async () => {
    const res = await request(app)
      .post('/api/v1/admin/roles')
      .set('Authorization', authBearer('A'))
      .send({
        roleCode: 'OPS',
        roleName: 'Operations',
        roleNameEn: 'Operations',
        roleColor: '#003366',
      })
    expect(res.status).toBe(201)
    expect(res.body.roleCode).toBe('OPS')
    expect(res.body.isSystem).toBe(false)
  })
})
