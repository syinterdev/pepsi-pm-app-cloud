import type { NavShellMode } from '@/api/schemas'
import { MenuNavLayoutPreview } from '@/components/layout/SidebarNavPreview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNavLayout, patchNavLayout } from '@/lib/admin-menu-api'
import { NAV_SHELL_MODE_LABELS } from '@/lib/nav-shell-mode'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutTemplate } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const LAYOUT_KEY = ['admin', 'menu', 'layout'] as const

export function MenuNavLayoutCard({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation('admin')
  const qc = useQueryClient()
  const { refetch: refetchPublic } = usePublicSettings()

  const layoutQ = useQuery({
    queryKey: LAYOUT_KEY,
    queryFn: fetchNavLayout,
  })

  const patchMut = useMutation({
    mutationFn: (mode: NavShellMode) => patchNavLayout(mode),
    onSuccess: (data) => {
      toast.success(
        t('menu.layoutSaved', { mode: NAV_SHELL_MODE_LABELS[data.navShellMode] }),
      )
      void qc.invalidateQueries({ queryKey: LAYOUT_KEY })
      void refetchPublic()
    },
    onError: () => toast.error(t('menu.layoutSaveFailed')),
  })

  const current = layoutQ.data?.navShellMode ?? 'sidebar'

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LayoutTemplate className="size-4" />
          {t('menu.layoutTitle')}
        </CardTitle>
        <CardDescription>{t('menu.layoutDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {layoutQ.isLoading ? (
          <Skeleton className="h-10 w-full max-w-md" />
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="nav-shell-mode" className="shrink-0 text-caption">
              Shell mode
            </Label>
            <select
              id="nav-shell-mode"
              className="h-9 max-w-md flex-1 rounded-button border border-app bg-[var(--app-surface)] px-2 text-body-sm disabled:opacity-50"
              value={current}
              disabled={!canWrite || patchMut.isPending}
              onChange={(e) => {
                const mode = e.target.value as NavShellMode
                if (mode === current) return
                patchMut.mutate(mode)
              }}
            >
              {(Object.keys(NAV_SHELL_MODE_LABELS) as NavShellMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {NAV_SHELL_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
            {patchMut.isPending ? (
              <span className="text-xs text-app-muted">{t('menu.savingLayout')}</span>
            ) : null}
          </div>
        )}
        {!layoutQ.isLoading ? (
          <div className="space-y-2 border-t border-app pt-4">
            <p className="text-body-sm font-medium text-app">{t('menu.layoutPreviewTitle')}</p>
            <p className="text-caption text-app-muted">{t('menu.layoutPreviewDesc')}</p>
            <MenuNavLayoutPreview mode={current} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
