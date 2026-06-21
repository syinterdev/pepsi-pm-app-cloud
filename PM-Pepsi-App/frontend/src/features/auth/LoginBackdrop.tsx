import { publicLoginBackgroundUrl } from '@/lib/settings-api'

type LoginBackdropProps = {
  hasLoginBackground: boolean
  brandingCacheKey: number
}

/** พื้นหลังเต็มจอ + overlay อ่านข้อความง่าย */
export function LoginBackdrop({ hasLoginBackground, brandingCacheKey }: LoginBackdropProps) {
  if (!hasLoginBackground) {
    return <div className="login-page__fallback liquid-glass-bg absolute inset-0" aria-hidden />
  }

  const src = publicLoginBackgroundUrl(brandingCacheKey)

  return (
    <>
      <img
        key={src}
        src={src}
        alt=""
        className="login-page__wallpaper"
        decoding="async"
        fetchPriority="high"
        aria-hidden
      />
      <div className="login-page__overlay" aria-hidden />
    </>
  )
}
