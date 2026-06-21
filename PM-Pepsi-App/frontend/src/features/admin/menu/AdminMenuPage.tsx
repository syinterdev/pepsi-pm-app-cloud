import type { AdminMenuRow } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import type { NavLinkEntry } from '@/components/layout/nav-config'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  assignMenuonOrder,
  deleteAdminMenuItem,
  fetchAdminMenuList,
  reorderAdminMenu,
  syncAdminMenuFromPhp,
} from '@/lib/admin-menu-api'
import {
  permissionsForRoleFromMatrix,
  previewNavForRole,
} from '@/lib/admin-menu-preview'
import { fetchAdminRolesMatrix } from '@/lib/admin-roles-api'
import { i18n } from '@/i18n'
import { formatRolePreviewOption } from '@/lib/role-display'
import { useAuthUser, usePermission } from '@/lib/use-permission'
import { useAppLocale } from '@/providers/I18nProvider'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Download, Loader2, Menu, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MenuEditDialog } from './MenuEditDialog'
import { MenuNavLayoutCard } from './MenuNavLayoutCard'
import { MenuTreeNode } from './MenuTreeNode'
import { MENU_ROLE_BITS } from './menu-form-utils'

const MENU_KEY = ['admin', 'menu'] as const

function MenuPreviewPanel({
  rows,
  previewRole,
  previewRoleLabel,
  previewPermissions,
}: {
  rows: AdminMenuRow[]
  previewRole: string
  previewRoleLabel: string
  previewPermissions?: string[]
}) {
  const { t } = useTranslation('admin')
  const entries = useMemo(
    () => previewNavForRole(rows, previewRole, previewPermissions),
    [rows, previewRole, previewPermissions],
  )

  return (
    <div className="rounded-card bg-[var(--admin-text)] p-3 text-body-sm text-[var(--admin-surface)]">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-muted">
        Preview · role {previewRoleLabel}
        {previewPermissions ? (
          <span className="ml-1 font-normal normal-case text-app-muted">
            {t('menu.previewPerms', { count: previewPermissions.length })}
          </span>
        ) : (
          <span className="ml-1 font-normal normal-case text-app-muted">
            {t('menu.menurightNote')}
          </span>
        )}
      </p>
      <nav className="space-y-1">
        {entries.map((entry, i) => {
          if (entry.kind === 'heading') {
            return (
              <p key={`h-${i}`} className="px-2 pt-3 pb-1 text-eyebrow text-app-muted">
                {entry.label}
              </p>
            )
          }
          const item = entry as NavLinkEntry
          const Icon = item.icon
          return (
            <div
              key={`${item.to}-${i}`}
              className="flex items-center gap-2 rounded-button px-2 py-2 text-[color-mix(in_srgb,var(--admin-surface)_88%,transparent)]"
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              <span className="truncate">{item.label}</span>
            </div>
          )
        })}
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-app-muted">{t('menu.noMenuForRole')}</p>
        ) : null}
      </nav>
    </div>
  )
}

export function AdminMenuPage() {
  const { t } = useTranslation('admin')
  const { t: tp } = useTranslation('personnel')
  const { t: tc } = useTranslation('common')
  const { locale } = useAppLocale()
  const qc = useQueryClient()
  const authUser = useAuthUser()
  const canRead = usePermission('admin.menu.read')
  const canWrite = usePermission('admin.menu.write')
  const canRolesRead = usePermission('admin.roles.read')
  const [localRows, setLocalRows] = useState<AdminMenuRow[] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminMenuRow | null>(null)
  const [previewRole, setPreviewRole] = useState(() => authUser?.userst?.trim().toUpperCase() || 'A')
  const [syncOpen, setSyncOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)

  const q = useQuery({
    queryKey: MENU_KEY,
    queryFn: fetchAdminMenuList,
    enabled: canRead || canWrite,
    placeholderData: keepPreviousData,
  })

  const rolesMatrixQ = useQuery({
    queryKey: ['admin', 'roles', 'matrix'],
    queryFn: fetchAdminRolesMatrix,
    enabled: (canRead || canWrite) && canRolesRead,
    staleTime: 60_000,
  })

  const roleOptions = useMemo(() => {
    const fromMatrix = rolesMatrixQ.data?.roles.map((r) => r.roleCode) ?? []
    if (fromMatrix.length > 0) return fromMatrix
    return [...MENU_ROLE_BITS]
  }, [rolesMatrixQ.data])

  const roleOptionLabel = useCallback(
    (code: string) => {
      const role = rolesMatrixQ.data?.roles.find((r) => r.roleCode === code)
      if (role) {
        return formatRolePreviewOption(code, locale, {
          roleNameTh: role.roleName,
          roleNameEn: role.roleNameEn,
        })
      }
      const userstKey = `personnel:admin.userst.${code}`
      if (i18n.exists(userstKey)) {
        return tp(`admin.userst.${code}`).replace(/\s*—\s*/, ' - ')
      }
      return code
    },
    [rolesMatrixQ.data, locale, tp],
  )

  const previewRoleLabel = useMemo(
    () => roleOptionLabel(previewRole),
    [previewRole, roleOptionLabel],
  )

  useEffect(() => {
    if (roleOptions.length === 0) return
    if (roleOptions.includes(previewRole)) return
    const fallback =
      (authUser?.userst?.trim().toUpperCase() &&
        roleOptions.find((c) => c === authUser.userst.trim().toUpperCase())) ||
      roleOptions[0]
    setPreviewRole(fallback)
  }, [roleOptions, previewRole, authUser?.userst])

  const previewPermissions = useMemo(() => {
    if (!rolesMatrixQ.data || !canRolesRead) return undefined
    return permissionsForRoleFromMatrix(rolesMatrixQ.data, previewRole)
  }, [rolesMatrixQ.data, previewRole, canRolesRead])

  useEffect(() => {
    if (q.data) setLocalRows(q.data)
  }, [q.data])

  const rows = localRows ?? q.data ?? []

  const reorderMut = useMutation({
    mutationFn: reorderAdminMenu,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MENU_KEY })
      void qc.invalidateQueries({ queryKey: ['nav-menu'] })
      toast.success(t('menu.reordered'))
    },
    onError: () => {
      toast.error(t('menu.reorderFailed'))
      if (q.data) setLocalRows(q.data)
    },
  })

  const syncMut = useMutation({
    mutationFn: syncAdminMenuFromPhp,
    onSuccess: (res) => {
      toast.success(t('menu.synced', { count: res.statements }))
      setSyncOpen(false)
      invalidateAll()
    },
    onError: (e: Error) => {
      toast.error(e.message || t('menu.syncFailed'))
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteAdminMenuItem,
    onSuccess: () => {
      setDeleteTarget(null)
      toast.success(t('menu.deleted'))
      void qc.invalidateQueries({ queryKey: MENU_KEY })
      void qc.invalidateQueries({ queryKey: ['nav-menu'] })
    },
    onError: () => toast.error(t('menu.deleteFailed')),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sortableIds = useMemo(() => rows.map((r) => r.idmenu), [rows])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!canWrite) return
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = sortableIds.indexOf(Number(active.id))
      const newIndex = sortableIds.indexOf(Number(over.id))
      if (oldIndex < 0 || newIndex < 0) return
      const reordered = arrayMove(rows, oldIndex, newIndex)
      setLocalRows(reordered)
      reorderMut.mutate(assignMenuonOrder(reordered))
    },
    [canWrite, rows, sortableIds, reorderMut],
  )

  const invalidateAll = useCallback(() => {
    void qc.invalidateQueries({ queryKey: MENU_KEY })
    void qc.invalidateQueries({ queryKey: ['nav-menu'] })
  }, [qc])

  if (!canRead && !canWrite) {
    return (
      <AdminPageRoot tourTarget="admin-menu">
        <AdminAccessDenied permission="admin.menu.read" />
      </AdminPageRoot>
    )
  }

  return (
    <AdminPageShell
      tourTarget="admin-menu"
      title={t('menu.title')}
      description={t('menu.description')}
      hints={hintsFromT(t, 'menu.hints')}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />{t('shared.refresh')}</Button>
          {canWrite ? (
            <Button type="button" variant="outline" className="admin-toolbar-btn" onClick={() => setSyncOpen(true)}>
              <Download className="mr-1 size-4" />
              {t('menu.syncFromPhp')}
            </Button>
          ) : null}
        </>
      }
    >
      <MenuNavLayoutCard canWrite={canWrite} />

      <div className="flex flex-wrap items-center gap-2">
        {canWrite ? (
          <Button
            type="button"
            onClick={() => {
              setEditRow(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" />
            {t('menu.addMenu')}
          </Button>
        ) : null}
        <label className="flex flex-col gap-1 text-caption sm:flex-row sm:items-center">
          <span>{t('menu.previewRoleLabel')}</span>
          <select
            className="h-9 max-w-xs rounded-button border border-app px-2 text-body-sm"
            value={previewRole}
            onChange={(e) => setPreviewRole(e.target.value)}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {roleOptionLabel(r)}
              </option>
            ))}
          </select>
          {!canRolesRead ? (
            <span className="text-xs text-app-muted">{t('menu.rolesReadHint')}</span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Menu className="size-4" />
              {t('menu.listTitle')}
            </CardTitle>
            <CardDescription>
              {t('menu.listDesc')}
              {reorderMut.isPending ? t('menu.listDescSaving') : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {q.isLoading && rows.length === 0 ? (
              <Skeleton className="h-48 w-full" />
            ) : q.isError ? (
              <EmptyState
                icon={AlertCircle}
                title={t('menu.loadFailed')}
                description={(q.error as Error).message}
                action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
              />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {rows.map((item) => (
                      <MenuTreeNode
                        key={item.idmenu}
                        item={item}
                        canWrite={canWrite}
                        onEdit={() => {
                          setEditRow(item)
                          setDialogOpen(true)
                        }}
                        onDelete={() =>
                          setDeleteTarget({ id: item.idmenu, title: item.menutitle })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base">{t('menu.sidebarPreviewTitle')}</CardTitle>
            <CardDescription>{t('menu.sidebarPreviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <MenuPreviewPanel
              rows={rows}
              previewRole={previewRole}
              previewRoleLabel={previewRoleLabel}
              previewPermissions={previewPermissions}
            />
          </CardContent>
        </Card>
      </div>

      <MenuEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editRow}
        onSaved={invalidateAll}
      />

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !deleteMut.isPending) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('menu.deleteMenuAria')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? t('menu.deleteConfirm', { title: deleteTarget.title })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMut.isPending || !deleteTarget}
              onClick={(e) => {
                e.preventDefault()
                if (!deleteTarget) return
                deleteMut.mutate(deleteTarget.id)
              }}
            >
              {deleteMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="mr-2 size-4" aria-hidden />
              )}
              {t('menu.deleteMenuAria')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {syncOpen ? (
        <ConfirmPhraseDialog
          open
          onOpenChange={(open) => !open && setSyncOpen(false)}
          tone="danger"
          title={t('menu.syncTitle')}
          description={t('menu.syncDesc')}
          phrase="SYNC_MENU"
          phraseLabel={t('menu.syncPhrase')}
          confirmLabel={t('menu.syncConfirm')}
          loading={syncMut.isPending}
          onConfirm={() => syncMut.mutate()}
        />
      ) : null}
    </AdminPageShell>
  )
}
