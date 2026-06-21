import { PepsiBrandMark } from '@/components/brand/PepsiBrandMark'
import { publicLogoUrl } from '@/lib/settings-api'
import { cn } from '@/lib/utils'

export type AppTopbarBrandProps = {
  appTitle: string
  hasLogo: boolean
  /** แสดงเมนูใน header (admin layout) */
  showHeaderNav?: boolean
}

export function AppTopbarBrand({ appTitle, hasLogo, showHeaderNav }: AppTopbarBrandProps) {
  const logoVisibleFrom = showHeaderNav ? 'sm' : 'md'

  return (
    <div className="app-topbar-brand flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div className="app-topbar-brand__mark relative flex shrink-0 items-center justify-center">
        {hasLogo ? (
          <>
            <img
              src={publicLogoUrl()}
              alt="PepsiCo"
              className={cn(
                'app-topbar-brand__logo',
                logoVisibleFrom === 'sm' ? 'hidden sm:block' : 'hidden md:block',
              )}
            />
            <PepsiBrandMark
              size="md"
              className={cn(
                logoVisibleFrom === 'sm' ? 'sm:hidden' : 'md:hidden',
              )}
            />
          </>
        ) : (
          <PepsiBrandMark
            size="lg"
            className={cn(logoVisibleFrom === 'sm' ? 'hidden sm:inline-flex' : 'hidden md:inline-flex')}
          />
        )}
      </div>

      <div
        className={cn(
          'app-topbar-brand__divider hidden shrink-0',
          logoVisibleFrom === 'sm' ? 'sm:block' : 'md:block',
        )}
        aria-hidden
      />

      <div className="min-w-0 leading-none">
        <span
          className={cn(
            'app-topbar-brand-title block truncate',
            showHeaderNav ? 'hidden sm:block' : 'block',
          )}
        >
          {appTitle}
        </span>
        <span
          className={cn(
            'app-topbar-brand-tagline mt-0.5 block truncate',
            showHeaderNav ? 'hidden sm:block' : 'block md:hidden',
          )}
        >
          PM / CM
        </span>
        {!showHeaderNav ? (
          <span className="app-topbar-brand-tagline mt-0.5 hidden truncate md:block">
            Preventive Maintenance
          </span>
        ) : null}
      </div>
    </div>
  )
}
