import { fetchPublicHealth } from '@/lib/health-api'
import { useQuery } from '@tanstack/react-query'

const WEB_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'

export function useAppVersion() {
  const health = useQuery({
    queryKey: ['health', 'public'],
    queryFn: fetchPublicHealth,
    staleTime: 10 * 60_000,
    retry: 1,
  })

  const apiVersion = health.data?.apiVersion ?? null

  return {
    webVersion: WEB_VERSION,
    apiVersion,
    label:
      apiVersion && apiVersion !== WEB_VERSION
        ? `เวอร์ชัน ${WEB_VERSION} · API ${apiVersion}`
        : `เวอร์ชัน ${WEB_VERSION}`,
    isLoading: health.isLoading,
  }
}
