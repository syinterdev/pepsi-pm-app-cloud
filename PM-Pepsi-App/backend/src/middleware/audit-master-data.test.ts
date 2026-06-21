import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { auditMasterDataMutations } from './audit-master-data.js'

function mockRes(statusCode = 201) {
  const listeners: Record<string, Array<() => void>> = {}
  return {
    statusCode,
    on(event: string, fn: () => void) {
      listeners[event] = listeners[event] ?? []
      listeners[event].push(fn)
      return this
    },
    emit(event: string) {
      for (const fn of listeners[event] ?? []) fn()
    },
  } as unknown as Response
}

describe('auditMasterDataMutations', () => {
  it('audits successful POST create', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: '1' }] })
    const pool = { query } as never
    const req = {
      method: 'POST',
      path: '/activitytype',
      baseUrl: '/api/v1/master-data',
      params: {},
      body: { mat: 'PM01' },
      authUser: { idwkctr: 'A1', userst: 'A' },
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request
    const res = mockRes(201)

    const next = vi.fn()
    auditMasterDataMutations(pool)(req, res, next)
    expect(next).toHaveBeenCalled()
    res.emit('finish')
    await Promise.resolve()

    expect(query).toHaveBeenCalled()
    const sql = String(query.mock.calls[0][0])
    expect(sql).toContain('tbl_audit_log')
    const params = query.mock.calls[0][1] as unknown[]
    expect(params[2]).toBe('master-data.create')
  })

  it('audits successful PUT update with resource id', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: '1' }] })
    const pool = { query } as never
    const req = {
      method: 'PUT',
      path: '/activitytype/PM01',
      baseUrl: '/api/v1/master-data',
      params: { mat: 'PM01' },
      body: { matdescrip: 'Updated' },
      authUser: { idwkctr: 'A1', userst: 'A' },
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request
    const res = mockRes(200)

    auditMasterDataMutations(pool)(req, res, vi.fn())
    res.emit('finish')
    await Promise.resolve()

    const params = query.mock.calls[0][1] as unknown[]
    expect(params[2]).toBe('master-data.update')
    expect(params[3]).toBe('activitytype')
    expect(params[4]).toBe('PM01')
  })
})
