import { getAuthToken } from '@/features/auth/login-api'
import { getApiBaseUrl } from '@/lib/api-client'
import { useEffect, useRef, useState } from 'react'

/** `<img>` ที่โหลดผ่าน fetch + Bearer (หรือ cookie) — ไม่เกิด 401 ใน console */
export function AuthenticatedImage({
  path,
  alt,
  className,
  onLoad,
  onUnavailable,
}: {
  path: string
  alt: string
  className?: string
  onLoad?: () => void
  onUnavailable?: () => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const onLoadRef = useRef(onLoad)
  const onUnavailableRef = useRef(onUnavailable)
  onLoadRef.current = onLoad
  onUnavailableRef.current = onUnavailable

  useEffect(() => {
    let cancelled = false
    let blobUrl: string | null = null
    setSrc(null)

    const token = getAuthToken()
    const p = path.startsWith('/') ? path : `/${path}`
    const base = getApiBaseUrl()
    const url = base ? `${base}${p}` : p

    void (async () => {
      try {
        const res = await fetch(url, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) {
          if (!cancelled) onUnavailableRef.current?.()
          return
        }
        const blob = await res.blob()
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        setSrc(blobUrl)
      } catch {
        if (!cancelled) onUnavailableRef.current?.()
      }
    })()

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [path])

  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onLoad={() => onLoadRef.current?.()}
    />
  )
}
