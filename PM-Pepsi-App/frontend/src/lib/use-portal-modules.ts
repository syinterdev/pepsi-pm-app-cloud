import { fetchPortalModules } from '@/lib/portal-api'
import { isPortalEnabled } from '@/lib/portal-enabled'
import { useQuery } from '@tanstack/react-query'

/** จำนวน module ที่ user เห็นบน portal — ใช้โชว์ลิงก์กลับ Portal ใน topbar */
export function usePortalModules() {
  const enabled = isPortalEnabled()
  return useQuery({
    queryKey: ['portal-modules'],
    queryFn: fetchPortalModules,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}

export function useShowPortalLink(): boolean {
  const q = usePortalModules()
  if (!isPortalEnabled()) return false
  return (q.data?.modules.length ?? 0) > 1
}
