import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { SidebarDensity } from '@/lib/sidebar-prefs'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

export type SidebarMobileDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuTriggerRef: RefObject<HTMLButtonElement | null>
  /** Tailwind responsive hide — e.g. `lg:hidden` (sidebar) or `md:hidden` (navbar) */
  responsiveHideClass?: string
  drawerWidthClass?: string
  sidebarDensity?: SidebarDensity
  children: ReactNode
}

/** U4g.7 — mobile nav drawer via Radix Sheet (focus trap · Esc · overlay blur) */
export function SidebarMobileDrawer({
  open,
  onOpenChange,
  menuTriggerRef,
  responsiveHideClass,
  drawerWidthClass = 'w-[min(100vw,18rem)] max-w-[min(100vw,18rem)]',
  sidebarDensity = 'comfortable',
  children,
}: SidebarMobileDrawerProps) {
  const { t } = useTranslation()
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="sidebar-mobile-drawer"
        side="left"
        hideClose
        overlayClassName={cn(
          'app-sidebar-sheet-overlay z-[60] bg-black/40 backdrop-blur-sm',
          responsiveHideClass,
        )}
        className={cn(
          'app-sidebar-sheet app-sidebar macos-sidebar app-sidebar--drawer',
          'z-[60] min-h-0 gap-0 border-0 border-r border-[var(--app-sidebar-border)] p-0',
          'overscroll-contain shadow-none',
          drawerWidthClass,
          'pb-[env(safe-area-inset-bottom,0px)]',
          responsiveHideClass,
        )}
        aria-label={t('nav.mainMenu')}
        data-sidebar-density={sidebarDensity}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          closeRef.current?.focus()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          menuTriggerRef.current?.focus()
        }}
      >
        <SheetTitle className="sr-only">{t('nav.mainMenu')}</SheetTitle>
        <div className="flex h-12 shrink-0 items-center justify-end border-b border-[var(--app-sidebar-border)] px-2 pt-[env(safe-area-inset-top,0px)]">
          <Button
            ref={closeRef}
            type="button"
            size="icon"
            variant="ghost"
            className="text-[var(--app-sidebar-fg)] hover:bg-[var(--app-sidebar-hover)]"
            onClick={() => onOpenChange(false)}
            aria-label={t('actions.closeMenu')}
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
