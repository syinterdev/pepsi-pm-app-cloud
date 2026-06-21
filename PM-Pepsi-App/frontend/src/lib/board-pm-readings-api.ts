import { boardPmReadingsResponseSchema } from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import type { BoardPeriodId } from '@/lib/board-period'

export type BoardPmReadingsResponse = ReturnType<typeof boardPmReadingsResponseSchema.parse>

export async function fetchBoardPmReadings(opts: {
  period: BoardPeriodId
  limit?: number
  team?: 'A' | 'B' | 'EE' | 'UT'
}): Promise<BoardPmReadingsResponse> {
  const qs = new URLSearchParams()
  qs.set('period', opts.period)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  if (opts.team) qs.set('team', opts.team)
  const json = await fetchApi<unknown>(`/api/v1/board/pm-readings?${qs}`)
  return boardPmReadingsResponseSchema.parse(json)
}
