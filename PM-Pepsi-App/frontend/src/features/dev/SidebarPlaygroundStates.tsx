import { MenuNavLayoutPreview, SidebarNavPreviewPanel, SidebarPreviewFrame } from '@/components/layout/SidebarNavPreview'

/** U4g.0 — isolated sidebar states for `/dev/ui` (light/dark via ThemeToggle) */
export function SidebarPlaygroundStates() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SidebarPreviewFrame
        label="Expanded (w-60)"
        hint="Footer: avatar · role badge · portal · pin · logout"
      >
        <SidebarNavPreviewPanel expanded showPortalLink />
      </SidebarPreviewFrame>

      <SidebarPreviewFrame
        label="Collapsed rail (w-14)"
        hint="Collapsed footer: avatar + logout icon · tooltips"
      >
        <SidebarNavPreviewPanel expanded={false} />
      </SidebarPreviewFrame>

      <SidebarPreviewFrame
        label="Admin shell"
        hint=".macos-admin .macos-sidebar — --sb-menu-* maps to --admin-*"
      >
        <SidebarNavPreviewPanel expanded admin appTitle="Admin Console" />
      </SidebarPreviewFrame>

      <SidebarPreviewFrame
        label="Mobile drawer chrome"
        hint="app-sidebar-sheet · Sheet side=left · bg-black/40 overlay · safe-area"
      >
        <SidebarNavPreviewPanel expanded drawer />
      </SidebarPreviewFrame>

      <div className="space-y-2 lg:col-span-2">
        <div>
          <p className="text-body-sm font-medium text-app">Menu layout preview (U4g.8)</p>
          <p className="text-caption text-app-muted">Same component as Admin → Menu · MenuNavLayoutCard</p>
        </div>
        <div className="rounded-card border border-dashed border-app bg-app-subtle/50 p-3">
          <MenuNavLayoutPreview mode="sidebar" />
        </div>
      </div>
    </div>
  )
}
