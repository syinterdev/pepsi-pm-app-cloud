import { fetchApi } from '@/lib/fetch-api'
import { z } from 'zod'

const boardKioskStatusSchema = z.object({
  enabled: z.boolean(),
  tokenRequired: z.boolean(),
})

const boardKioskAdminSchema = z.object({
  enabled: z.boolean(),
  hasToken: z.boolean(),
})

const boardKioskRotateSchema = z.object({
  token: z.string(),
  enabled: z.boolean(),
  boardPath: z.literal('/board'),
})

export type BoardKioskStatus = z.infer<typeof boardKioskStatusSchema>
export type BoardKioskAdmin = z.infer<typeof boardKioskAdminSchema>

export async function fetchBoardKioskStatus(): Promise<BoardKioskStatus> {
  const json = await fetchApi<unknown>('/api/v1/board/kiosk-status')
  return boardKioskStatusSchema.parse(json)
}

export async function fetchAdminBoardKiosk(): Promise<BoardKioskAdmin> {
  const json = await fetchApi<unknown>('/api/v1/admin/board-kiosk')
  return boardKioskAdminSchema.parse(json)
}

export async function patchAdminBoardKiosk(body: { enabled: boolean }): Promise<BoardKioskAdmin> {
  const json = await fetchApi<unknown>('/api/v1/admin/board-kiosk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return boardKioskAdminSchema.parse(json)
}

export async function rotateAdminBoardKioskToken(): Promise<z.infer<typeof boardKioskRotateSchema>> {
  const json = await fetchApi<unknown>('/api/v1/admin/board-kiosk/rotate-token', {
    method: 'POST',
  })
  return boardKioskRotateSchema.parse(json)
}

export async function clearAdminBoardKioskToken(): Promise<BoardKioskAdmin> {
  const json = await fetchApi<unknown>('/api/v1/admin/board-kiosk/token', { method: 'DELETE' })
  return boardKioskAdminSchema.parse(json)
}
