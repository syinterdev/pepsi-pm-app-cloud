import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

const sizeClass = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-11',
  xl: 'size-14',
} as const

export type ProfileAvatarProps = {
  displayName: string
  /** idwkctr สำหรับโหลดรูปจาก /api/v1/personnel/:id/image */
  idwkctr?: string
  hasImage?: boolean
  imgMember?: string | null
  className?: string
  size?: keyof typeof sizeClass
  /** topbar = วงแหวน Pepsi gradient · popover = วงใหญ่ในเมนูโปรไฟล์ */
  variant?: 'default' | 'topbar' | 'popover'
}

function InitialAvatar({
  initial,
  size,
  className,
}: {
  initial: string
  size: keyof typeof sizeClass
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-pepsi-blue)] to-[color-mix(in_srgb,var(--brand-pepsi-blue)_55%,#001a3d)] font-semibold text-white shadow-inner',
        sizeClass[size],
        size === 'sm' ? 'text-xs' : size === 'xl' ? 'text-lg' : 'text-body-sm',
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  )
}

/** รูปโปรไฟล์ workcenter หรือตัวอักษรย่อ */
export function ProfileAvatar({
  displayName,
  idwkctr,
  hasImage,
  imgMember,
  className,
  size = 'md',
  variant = 'default',
}: ProfileAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'
  const showPhoto = Boolean(idwkctr && (hasImage || imgMember) && !imgFailed)
  const imagePath = useMemo(() => {
    if (!idwkctr) return ''
    const ver = imgMember ?? (hasImage ? 1 : undefined)
    const v = ver != null ? `?v=${encodeURIComponent(String(ver))}` : ''
    return `/api/v1/personnel/${encodeURIComponent(idwkctr)}/image${v}`
  }, [hasImage, idwkctr, imgMember])
  const ringed = variant === 'topbar' || variant === 'popover'

  const photoClass = cn(
    'shrink-0 rounded-full object-cover',
    sizeClass[size],
    ringed
      ? 'border-2 border-[var(--app-surface)] shadow-sm'
      : 'ring-2 ring-[color-mix(in_srgb,var(--app-border)_70%,transparent)]',
    className,
  )

  const inner =
    showPhoto && imagePath && !imgFailed ? (
      <>
        {!imgLoaded ? (
          <InitialAvatar
            initial={initial}
            size={size}
            className={cn(
              ringed && 'border-2 border-[var(--app-surface)] shadow-sm',
              className,
            )}
          />
        ) : null}
        <AuthenticatedImage
          path={imagePath}
          alt={displayName.trim() || idwkctr!}
          className={photoClass}
          onLoad={() => setImgLoaded(true)}
          onUnavailable={() => setImgFailed(true)}
        />
      </>
    ) : (
      <InitialAvatar
        initial={initial}
        size={size}
        className={cn(
          ringed && 'border-2 border-[var(--app-surface)] shadow-sm',
          className,
        )}
      />
    )

  if (ringed) {
    return (
      <span
        className={cn(
          'profile-avatar-ring inline-flex shrink-0 rounded-full p-[2px]',
          variant === 'popover' && 'profile-avatar-ring--popover',
          variant === 'topbar' && 'profile-avatar-ring--topbar',
        )}
      >
        {inner}
      </span>
    )
  }

  return inner
}
