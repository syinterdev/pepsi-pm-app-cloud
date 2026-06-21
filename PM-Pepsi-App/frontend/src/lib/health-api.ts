import { fetchApi } from '@/lib/fetch-api'
import { z } from 'zod'

export const publicHealthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  time: z.string(),
  db: z.enum(['ok', 'error']),
  apiVersion: z.string().optional(),
  webVersion: z.string().optional(),
})

export type PublicHealthResponse = z.infer<typeof publicHealthResponseSchema>

export async function fetchPublicHealth(): Promise<PublicHealthResponse> {
  const json = await fetchApi<unknown>('/api/v1/health')
  return publicHealthResponseSchema.parse(json)
}
