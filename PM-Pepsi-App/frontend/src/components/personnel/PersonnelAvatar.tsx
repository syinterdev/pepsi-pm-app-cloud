import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

function initialsFromName(...parts: (string | null | undefined)[]): string {
  const name = parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ')
  if (!name) return '?'
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const SIZE_CLASS = {
  sm: 'size-10 text-body-sm',
  md: 'size-11 text-body-sm',
  lg: 'size-24 text-2xl',
} as const

export type PersonnelAvatarProps = {
  idwkctr: string
  displayName?: string | null
  hasImage?: boolean
  /** cache-bust หลังอัปโหลด */
  ver?: number | string
  size?: keyof typeof SIZE_CLASS
  className?: string
}

/** รูปช่าง — lazy load · ตัวอักษรย่อเมื่อไม่มีรูปหรือโหลดไม่สำเร็จ */
export function PersonnelAvatar({
  idwkctr,
  displayName,
  hasImage = false,
  ver,
  size = 'sm',
  className,
}: PersonnelAvatarProps) {
  const [failed, setFailed] = useState(false)
  const initial = useMemo(
    () => initialsFromName(displayName, idwkctr),
    [displayName, idwkctr],
  )
  const dim = SIZE_CLASS[size]
  const label = displayName?.trim() || idwkctr
  const showPhoto = Boolean(hasImage && !failed)

  if (showPhoto) {
    const v = ver != null ? `?v=${encodeURIComponent(String(ver))}` : ''
    const path = `/api/v1/personnel/${encodeURIComponent(idwkctr)}/image${v}`
    return (
      <AuthenticatedImage
        path={path}
        alt={label}
        className={cn(
          dim,
          'shrink-0 rounded-full object-cover ring-1 ring-app',
          size === 'lg' && 'ring-2 shadow-sm',
          className,
        )}
        onUnavailable={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      className={cn(
        dim,
        'flex shrink-0 items-center justify-center rounded-full bg-app-muted font-semibold text-app ring-1 ring-dashed ring-app',
        className,
      )}
      title={label}
      aria-hidden
    >
      {initial}
    </span>
  )
}
