import { z } from 'zod'
import { fetchApi } from '@/lib/fetch-api'
import type { BoardPeriodId } from '@/lib/board-period'

export const boardActivityKindSchema = z.enum(['assigned', 'closed'])

export const boardActivityItemSchema = z.object({
  id: z.string(),
  kind: boardActivityKindSchema,
  occurredAt: z.string(),
  wkorder: z.string(),
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string().nullable(),
  hasImage: z.boolean(),
  label: z.string(),
})

export const boardActivityResponseSchema = z.object({
  period: z.enum(['today', '7d', 'week']),
  range: z.object({ from: z.string(), to: z.string() }),
  timezone: z.string(),
  limit: z.number().int(),
  items: z.array(boardActivityItemSchema),
})

export type BoardActivityItem = z.infer<typeof boardActivityItemSchema>
export type BoardActivityResponse = z.infer<typeof boardActivityResponseSchema>

export async function fetchBoardActivity(opts: {
  period: BoardPeriodId
  limit?: number
  team?: 'A' | 'B' | 'EE' | 'UT'
}): Promise<BoardActivityResponse> {
  const qs = new URLSearchParams()
  qs.set('period', opts.period)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  if (opts.team) qs.set('team', opts.team)
  const json = await fetchApi<unknown>(`/api/v1/board/activity?${qs}`)
  return boardActivityResponseSchema.parse(json)
}

/** ป้ายช่างแบบ feed — `PAC010 (Narit)` */
export function formatBoardActivityPersonLabel(item: BoardActivityItem): string {
  if (item.displayName?.trim()) {
    const first = item.displayName.trim().split(/\s+/)[0]
    return first ? `${item.wkctr} (${first})` : item.wkctr
  }
  return item.wkctr
}

export function formatBoardActivityTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}
