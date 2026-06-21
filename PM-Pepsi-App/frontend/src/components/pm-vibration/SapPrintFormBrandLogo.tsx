import { PepsiBrandMark } from '@/components/brand/PepsiBrandMark'
import { usePublicSettings } from '@/lib/settings-context'
import { publicLogoUrl } from '@/lib/settings-api'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

/** Same logo asset as app topbar / sidebar (uploaded branding or PepsiBrandMark fallback). */
export function SapPrintFormBrandLogo({ className }: Props) {
  const { settings, brandingCacheKey } = usePublicSettings()
  const hasLogo = Boolean(settings?.hasLogo)

  return (
    <div className={cn('sap-wo-print__logo', className)}>
      {hasLogo ? (
        <img
          src={publicLogoUrl(brandingCacheKey)}
          alt=""
          className="sap-wo-print__brand-logo"
        />
      ) : (
        <PepsiBrandMark size="md" className="sap-wo-print__brand-mark" />
      )}
    </div>
  )
}
