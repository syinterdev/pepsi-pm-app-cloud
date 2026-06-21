import {
  blockedIpItemSchema,
  createBlockedIpBodySchema,
  securityOverviewResponseSchema,
  type BlockedIpItem,
  type CreateBlockedIpBody,
  type SecurityOverviewResponse,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchSecurityOverview(
  days = 30,
  limit = 50,
): Promise<SecurityOverviewResponse> {
  const qs = new URLSearchParams({
    days: String(days),
    limit: String(limit),
    offset: '0',
  })
  const json = await fetchApi<unknown>(`/api/v1/admin/security?${qs}`)
  return securityOverviewResponseSchema.parse(json)
}

export async function blockIpAddress(body: CreateBlockedIpBody): Promise<BlockedIpItem> {
  const json = await fetchApi<unknown>('/api/v1/admin/security/blocked-ips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createBlockedIpBodySchema.parse(body)),
  })
  return blockedIpItemSchema.parse(json)
}

export async function unblockIpAddress(id: number): Promise<void> {
  await fetchApi<unknown>(`/api/v1/admin/security/blocked-ips/${id}`, { method: 'DELETE' })
}
