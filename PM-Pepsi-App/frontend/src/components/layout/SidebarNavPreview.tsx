import type { AuthUser } from '@/api/schemas'
import type { NavShellMode } from '@/api/schemas'
import { PepsiStripe } from '@/components/brand/PepsiStripe'
import { SidebarBrandZone } from '@/components/layout/SidebarBrandZone'
import { SidebarFooter } from '@/components/layout/SidebarFooter'
import type { NavEntry } from '@/components/layout/nav-config'
import { NavMenuList } from '@/components/layout/NavMenuList'
import { cn } from '@/lib/utils'
import { CalendarDays, ClipboardList, Home, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Shared mock nav — matches `/dev/ui` · Admin menu layout preview (U4g.8) */
export const SIDEBAR_PREVIEW_MOCK_NAV: NavEntry[] = [
  { kind: 'heading', label: 'WORK' },
  { kind: 'item', to: '/planning', label: 'Planning', icon: Wrench, menuright: 'A' },
  { kind: 'item', to: '/plan-calendar', label: 'Calendar', icon: CalendarDays, menuright: 'A:U:W' },
  { kind: 'item', to: '/backlog', label: 'Backlog', icon: ClipboardList, menuright: 'A:U:W' },
  { kind: 'heading', label: 'CONFIRM' },
  { kind: 'item', to: '/work-orders', label: 'Work orders', icon: ClipboardList, menuright: 'A:U:W' },
  { kind: 'item', to: '/confirmation', label: 'Export', icon: Home, menuright: 'A:U:W' },
  { kind: 'heading', label: 'ADMIN' },
  { kind: 'item', to: '/master-plan', label: 'Master Plan', icon: Wrench, menuright: 'A' },
  { kind: 'item', to: '/', label: 'Dashboard', icon: Home, menuright: 'A:U:W', end: true },
]

export const SIDEBAR_PREVIEW_MOCK_USER: AuthUser = {
  idwkctr: 'PAC010',
  username: 'somchai',
  wkctr: 'PAC010',
  userst: 'W',
  sysstatus: 'ACTIVE',
  fullnameTh: 'สมชาย ใจดี',
  roleNameTh: 'ช่างซ่อมบำรุง',
  roleNameEn: 'Maintenance technician',
  accountType: 'workcenter',
}

export type SidebarNavPreviewPanelProps = {
  expanded: boolean
  appTitle?: string
  /** `.macos-admin` token remap — same components as main app */
  admin?: boolean
  drawer?: boolean
  showPortalLink?: boolean
  className?: string
  heightClass?: string
}

/** Isolated sidebar chrome — same building blocks as `AppNavShell` / `SidebarPanel` */
export function SidebarNavPreviewPanel({
  expanded,
  appTitle = 'PM Maintenance',
  admin = false,
  drawer = false,
  showPortalLink = false,
  className,
  heightClass = 'h-[22rem]',
}: SidebarNavPreviewPanelProps) {
  const collapsed = !expanded
  const width = expanded ? 'w-60' : 'w-14'

  const panel = (
    <aside
      className={cn(
        'app-sidebar macos-sidebar flex shrink-0 flex-col overflow-hidden',
        heightClass,
        width,
        !expanded && 'app-sidebar--collapsed',
        drawer && 'app-sidebar--drawer',
        className,
      )}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-pinned={expanded ? 'true' : 'false'}
      aria-label="Sidebar preview"
    >
      <PepsiStripe variant="sidebar" />
      <SidebarBrandZone
        appTitle={appTitle}
        hasLogo={false}
        expanded={expanded}
        showPortalLink={showPortalLink}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-2">
        <NavMenuList
          entries={SIDEBAR_PREVIEW_MOCK_NAV}
          variant="sidebar"
          collapsed={collapsed}
        />
      </div>

      <SidebarFooter
        authUser={SIDEBAR_PREVIEW_MOCK_USER}
        loggedIn
        expanded={expanded}
        pinned={expanded}
        showPin={expanded}
        showPortalLink={showPortalLink}
        onTogglePin={() => undefined}
        onLogout={() => undefined}
        onLogin={() => undefined}
      />
    </aside>
  )

  if (admin) {
    return (
      <div className="macos-admin inline-flex rounded-card border border-app bg-[var(--admin-bg)] p-2">
        {panel}
      </div>
    )
  }

  return panel
}

export function SidebarPreviewFrame({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-body-sm font-medium text-app">{label}</p>
        <p className="text-caption text-app-muted">{hint}</p>
      </div>
      <div className="overflow-x-auto rounded-card border border-dashed border-app bg-app-subtle/50 p-3">
        {children}
      </div>
    </div>
  )
}

/** Admin → Menu layout card — live preview for selected `navShellMode` */
export function MenuNavLayoutPreview({ mode }: { mode: NavShellMode }) {
  const { t } = useTranslation('admin')
  const modeHint =
    mode === 'navbar'
      ? t('menu.layoutPreviewNavbarHint')
      : mode === 'hamburger'
        ? t('menu.layoutPreviewHamburgerHint')
        : t('menu.layoutPreviewSidebarHint')

  return (
    <div className="app-theme-corporate space-y-3">
      {mode === 'navbar' ? (
        <div className="overflow-x-auto rounded-card border border-dashed border-app bg-[var(--app-bg)] p-2">
          <div className="app-surface macos-topbar flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5">
            <NavMenuList entries={SIDEBAR_PREVIEW_MOCK_NAV} variant="navbar" />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-4 overflow-x-auto rounded-card border border-dashed border-app bg-[var(--app-bg)] p-3">
          <SidebarNavPreviewPanel expanded showPortalLink />
          {mode === 'hamburger' ? <SidebarNavPreviewPanel expanded={false} /> : null}
        </div>
      )}
      <p className="text-caption text-app-muted">{modeHint}</p>
      <div className="overflow-x-auto rounded-card border border-dashed border-app bg-app-subtle/40 p-2">
        <p className="mb-2 text-caption font-medium text-app-muted">
          {t('menu.layoutPreviewAdminLabel')}
        </p>
        <SidebarNavPreviewPanel expanded admin appTitle="Admin Console" heightClass="h-[18rem]" />
      </div>
    </div>
  )
}
