import type { Pool } from 'pg'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { legacyRbacPool, TEST_SESSION_SECRET } from '../test/admin-api-harness.js'

const mockGetPersonnelImage = vi.fn()
const mockGetBoardKioskStatus = vi.fn()
const mockIsBoardKioskRequestAllowed = vi.fn()

vi.mock('../services/personnel-admin.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/personnel-admin.js')>()
  return {
    ...actual,
    getPersonnelImage: (...args: unknown[]) => mockGetPersonnelImage(...args),
  }
})

vi.mock('../services/board-kiosk.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/board-kiosk.js')>()
  return {
    ...actual,
    getBoardKioskStatus: (...args: unknown[]) => mockGetBoardKioskStatus(...args),
    isBoardKioskRequestAllowed: (...args: unknown[]) => mockIsBoardKioskRequestAllowed(...args),
  }
})

function buildApp(pool: Pool) {
  return createApp({
    pool,
    sessionSecret: TEST_SESSION_SECRET,
    databaseUrl: 'postgresql://localhost:5432/pm_test',
  })
}

describe('GET /api/v1/board/personnel/:idwkctr/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBoardKioskStatus.mockResolvedValue({ enabled: true, tokenRequired: true })
    mockIsBoardKioskRequestAllowed.mockResolvedValue(true)
  })

  it('returns WebP with short cache when kiosk token is valid', async () => {
    const webp = Buffer.from([0x52, 0x49, 0x46, 0x46])
    mockGetPersonnelImage.mockResolvedValue({
      data: webp,
      mime: 'image/webp',
      bytes: webp.length,
      fileName: 'PAC010.webp',
    })

    const app = buildApp(legacyRbacPool())

    const res = await request(app)
      .get('/api/v1/board/personnel/PAC010/avatar')
      .set('X-Board-Kiosk-Token', 'kiosk-secret')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/webp')
    expect(res.headers['cache-control']).toBe('private, max-age=120')
    expect(res.body).toEqual(webp)
    expect(mockGetPersonnelImage).toHaveBeenCalled()
  })

  it('accepts kiosk_token query param for img tags', async () => {
    mockGetPersonnelImage.mockResolvedValue(null)

    const app = buildApp(legacyRbacPool())

    const res = await request(app)
      .get('/api/v1/board/personnel/NOIMG/avatar?kiosk_token=from-query')

    expect(res.status).toBe(404)
    expect(mockIsBoardKioskRequestAllowed).toHaveBeenCalled()
  })

  it('rejects without session or kiosk token', async () => {
    mockIsBoardKioskRequestAllowed.mockResolvedValue(false)

    const app = buildApp(legacyRbacPool())

    const res = await request(app).get('/api/v1/board/personnel/PAC010/avatar')

    expect(res.status).toBe(401)
    expect(mockGetPersonnelImage).not.toHaveBeenCalled()
  })
})
