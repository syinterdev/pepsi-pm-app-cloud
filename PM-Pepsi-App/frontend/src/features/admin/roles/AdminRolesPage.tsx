import type { AdminRole } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  deleteAdminRole,
  fetchAdminRolesMatrix,
  setAdminRolePermissions,
  simulateAdminRole,
} from '@/lib/admin-roles-api'
import { clearRbacPreview, getRbacPreviewSnapshot, setRbacPreview } from '@/lib/rbac-preview'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EyeOff, Plus, RefreshCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CreateRoleDialog } from './CreateRoleDialog'
import { EditRoleLabelsDialog } from './EditRoleLabelsDialog'
import { PermissionMatrix } from './PermissionMatrix'
import { RoleNavPreview } from './RoleNavPreview'
import { RolePortalPreview } from './RolePortalPreview'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { useAppLocale } from '@/providers/I18nProvider'

const MATRIX_KEY = ['admin', 'roles', 'matrix'] as const

function invalidateMatrix(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: MATRIX_KEY })
}

export function AdminRolesPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { locale } = useAppLocale()
  const qc = useQueryClient()
  const canRead = usePermission('admin.roles.read')
  const canWrite = usePermission('admin.roles.write')
  const [createOpen, setCreateOpen] = useState(false)
  const [editLabelsRole, setEditLabelsRole] = useState<AdminRole | null>(null)
  const [deleteRole, setDeleteRole] = useState<AdminRole | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [previewRoleCode, setPreviewRoleCode] = useState<string | null>(
    () => getRbacPreviewSnapshot()?.roleCode ?? null,
  )

  const q = useQuery({
    queryKey: MATRIX_KEY,
    queryFn: fetchAdminRolesMatrix,
    enabled: canRead || canWrite,
    placeholderData: keepPreviousData,
  })

  const permMut = useMutation({
    mutationFn: ({
      roleCode,
      grants,
    }: {
      roleCode: string
      grants: Record<string, boolean>
    }) => setAdminRolePermissions(roleCode, grants),
    onSuccess: (_data, { roleCode, grants }) => {
      invalidateMatrix(qc)
      const preview = getRbacPreviewSnapshot()
      if (preview?.roleCode === roleCode) {
        const next = new Set(preview.permissions)
        for (const [permCode, granted] of Object.entries(grants)) {
          if (granted) next.add(permCode)
          else next.delete(permCode)
        }
        setRbacPreview({ ...preview, permissions: [...next] })
      }
    },
    onError: () => toast.error(t('roles.savePermsFailed')),
    onSettled: () => setPending(null),
  })

  const deleteMut = useMutation({
    mutationFn: (code: string) => deleteAdminRole(code),
    onSuccess: () => {
      toast.success(t('roles.roleDeleted'))
      invalidateMatrix(qc)
    },
    onError: (e: Error) => toast.error(e.message || t('roles.deleteFailed')),
  })

  const matrix = q.data

  const previewRoleLabel = useMemo(() => {
    if (!previewRoleCode || !matrix) return previewRoleCode
    const role = matrix.roles.find((r) => r.roleCode === previewRoleCode)
    if (!role) return previewRoleCode
    return resolveRoleDisplayLabel(
      { roleNameTh: role.roleName, roleNameEn: role.roleNameEn, userst: role.roleCode },
      locale,
    )
  }, [previewRoleCode, matrix, locale])

  const permByGroup = useMemo(() => {
    if (!matrix) return new Map<string, string[]>()
    const m = new Map<string, string[]>()
    for (const g of matrix.groups) {
      m.set(
        g.group,
        g.permissions.map((p) => p.permCode),
      )
    }
    return m
  }, [matrix])

  const handleToggle = useCallback(
    (roleCode: string, permCode: string, granted: boolean) => {
      if (!canWrite) return
      setPending(`${roleCode}:${permCode}`)
      permMut.mutate({ roleCode, grants: { [permCode]: granted } })
    },
    [canWrite, permMut],
  )

  const handleToggleGroup = useCallback(
    (roleCode: string, group: string, grant: boolean) => {
      if (!canWrite) return
      const codes = permByGroup.get(group)
      if (!codes?.length) return
      const grants = Object.fromEntries(codes.map((c) => [c, grant]))
      setPending(`${roleCode}:group:${group}`)
      permMut.mutate({ roleCode, grants })
    },
    [canWrite, permByGroup, permMut],
  )

  const handleSimulate = useCallback(async (role: AdminRole) => {
    try {
      const sim = await simulateAdminRole(role.roleCode)
      setRbacPreview({
        roleCode: sim.roleCode,
        roleNameTh: role.roleName,
        roleNameEn: role.roleNameEn,
        permissions: sim.permissions,
      })
      setPreviewRoleCode(sim.roleCode)
      toast.info(t('roles.simulateInfo', { role: sim.roleCode, count: sim.permissions.length }))
    } catch {
      toast.error(t('roles.simulateFailed'))
    }
  }, [t])

  const handleStopSimulate = useCallback(() => {
    clearRbacPreview()
    setPreviewRoleCode(null)
    toast.success(t('roles.simulateStopped'))
  }, [t])

  const handleDeleteRole = useCallback((role: AdminRole) => {
    setDeleteRole(role)
  }, [])

  if (!canRead && !canWrite) {
    return (
      <AdminPageRoot tourTarget="admin-roles">
        <AdminAccessDenied permission="admin.roles.read" />
      </AdminPageRoot>
    )
  }

  return (
    <AdminPageShell
      tourTarget="admin-roles"
      title={t('roles.title')}
      description={t('roles.description')}
      hints={hintsFromT(t, 'roles.hints')}
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
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />
            {t('shared.refresh')}
          </Button>
          {canWrite ? (
            <Button type="button" className="admin-toolbar-btn" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              {t('roles.createRole')}
            </Button>
          ) : null}
          {previewRoleCode ? (
            <Button type="button" variant="outline" className="admin-toolbar-btn" onClick={handleStopSimulate}>
              <EyeOff className="mr-1 size-4" />
              {t('roles.stopSimulate', { role: previewRoleLabel ?? previewRoleCode })}
            </Button>
          ) : null}
        </>
      }
    >
        <RoleNavPreview />
        <RolePortalPreview />
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-base">{t('roles.matrixTitle')}</CardTitle>
          <CardDescription>{t('roles.matrixDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading && !matrix ? (
            <div className="overflow-x-auto rounded-card border border-app" aria-busy="true">
              <Table>
                <TableHeader>
                  <TableRow className="bg-app-subtle">
                    <TableHead className="sticky left-0 z-20 min-w-[220px] bg-app-subtle">
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                    {Array.from({ length: 3 }, (_, i) => (
                      <TableHead key={i} className="align-top">
                        <div className="mx-auto flex w-24 flex-col items-center gap-1">
                          <Skeleton className="size-3 rounded-full" />
                          <Skeleton className="h-4 w-8" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeletonRows rows={14} columns={4} />
                </TableBody>
              </Table>
            </div>
          ) : q.isError ? (
            <QueryLoadErrorState
              title={t('roles.matrixLoadFailed')}
              error={q.error}
              description={(q.error as Error).message || t('roles.matrixLoadHint')}
              action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
            />
          ) : matrix ? (
            <PermissionMatrix
              data={matrix}
              canWrite={canWrite}
              pending={pending}
              previewRoleCode={previewRoleCode}
              onToggle={handleToggle}
              onToggleGroup={handleToggleGroup}
              onSimulate={handleSimulate}
              onStopSimulate={handleStopSimulate}
              onDeleteRole={handleDeleteRole}
              onEditRoleLabels={canWrite ? (role) => setEditLabelsRole(role) : undefined}
            />
          ) : null}
        </CardContent>
      </Card>

      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => invalidateMatrix(qc)}
      />

      <EditRoleLabelsDialog
        role={editLabelsRole}
        open={editLabelsRole != null}
        onOpenChange={(open) => !open && setEditLabelsRole(null)}
        onSaved={() => invalidateMatrix(qc)}
      />

      {deleteRole ? (
        <ConfirmPhraseDialog
          open
          onOpenChange={(open) => !open && setDeleteRole(null)}
          tone="danger"
          title={t('roles.deleteRoleTitle', { code: deleteRole.roleCode })}
          description={t('roles.deleteRoleDesc')}
          phrase={deleteRole.roleCode}
          phraseLabel={t('roles.deleteRolePhrase', { code: deleteRole.roleCode })}
          confirmLabel={t('roles.deleteRoleConfirm')}
          loading={deleteMut.isPending}
          onConfirm={() => {
            deleteMut.mutate(deleteRole.roleCode, {
              onSuccess: () => setDeleteRole(null),
            })
          }}
        />
      ) : null}
    </AdminPageShell>
  )
}
