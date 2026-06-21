import { useEffect, useRef } from 'react'
import { toastError } from '@/lib/app-toast'

/** Normalize React Query / fetch errors for inline + toast copy */
export function queryErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return ''
}

export type QueryLoadErrorToastInput = {
  isError: boolean
  error: unknown
  data: unknown
}

export type UseQueryLoadErrorToastOptions = {
  enabled?: boolean
  /** Skip toast when stale/cached data is still shown (default true) */
  onlyWithoutData?: boolean
}

/**
 * Sonner toast when a list/query load fails — pair with inline EmptyState / banner.
 * Dedupes identical title+detail until the error clears.
 */
export function useQueryLoadErrorToast(
  query: QueryLoadErrorToastInput,
  title: string,
  options?: UseQueryLoadErrorToastOptions,
) {
  const lastKey = useRef<string | null>(null)
  const enabled = options?.enabled ?? true
  const onlyWithoutData = options?.onlyWithoutData ?? true

  useEffect(() => {
    if (!enabled) return
    if (!query.isError) {
      lastKey.current = null
      return
    }
    if (onlyWithoutData && query.data != null) return

    const detail = queryErrorMessage(query.error)
    const key = `${title}::${detail}`
    if (lastKey.current === key) return
    lastKey.current = key
    toastError(title, detail || undefined)
  }, [enabled, onlyWithoutData, query.isError, query.error, query.data, title])
}
