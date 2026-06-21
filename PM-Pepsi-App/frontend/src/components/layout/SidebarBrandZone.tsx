import { PepsiBrandMark } from '@/components/brand/PepsiBrandMark'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { publicLogoUrl } from '@/lib/settings-api'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export type SidebarBrandZoneProps = {
  appTitle: string
  hasLogo: boolean
  expanded: boolean
  /** แสดง chip PM เมื่อ user มี >1 module (portal hub) */
  showPortalLink?: boolean
}

export function SidebarBrandZone({
  appTitle,
  hasLogo,
  expanded,
  showPortalLink = false,
}: SidebarBrandZoneProps) {
  const { t } = useTranslation('portal')
  const collapsed = !expanded

  const mark = (
    <div className="app-sidebar-brand__mark flex shrink-0 items-center justify-center">
      {hasLogo ? (
        <img src={publicLogoUrl()} alt="" className="app-sidebar-brand__logo object-contain" />
      ) : (
        <PepsiBrandMark size={collapsed ? 'lg' : 'xl'} />
      )}
    </div>
  )

  return (
    <div
      className={cn(
        'app-sidebar-brand',
        expanded ? 'app-sidebar-brand--expanded' : 'app-sidebar-brand--collapsed',
      )}
    >
      {collapsed ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>{mark}</TooltipTrigger>
            <TooltipContent side="right">{appTitle}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        mark
      )}

      <div
        className={cn(
          'app-sidebar-brand__title-block',
          collapsed && 'app-sidebar-brand__title-block--collapsed',
        )}
        aria-hidden={collapsed}
      >
        <span className="app-sidebar-brand__title min-w-0 truncate">{appTitle}</span>
        {showPortalLink ? (
          <span className="app-sidebar-brand__module-chip app-tone-info-badge">{t('moduleChipPm')}</span>
        ) : null}
      </div>
    </div>
  )
}
