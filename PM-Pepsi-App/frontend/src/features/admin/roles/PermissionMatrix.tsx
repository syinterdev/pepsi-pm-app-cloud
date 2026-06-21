import type { AdminRole, AdminRoleMatrixResponse } from '@/api/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { resolveRoleDisplayLabel } from '@/lib/role-display'
import { useAppLocale } from '@/providers/I18nProvider'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type PermissionMatrixProps = {
  data: AdminRoleMatrixResponse
  canWrite: boolean
  pending: string | null
  previewRoleCode: string | null
  onToggle: (roleCode: string, permCode: string, granted: boolean) => void
  onToggleGroup: (roleCode: string, group: string, grant: boolean) => void
  onSimulate: (role: AdminRole) => void
  onStopSimulate: () => void
  onDeleteRole: (role: AdminRole) => void
}

function RoleHeaderCell({
  role,
  canWrite,
  previewRoleCode,
  onSimulate,
  onStopSimulate,
  onDelete,
  onEditLabels,
}: {
  role: AdminRole
  canWrite: boolean
  previewRoleCode: string | null
  onSimulate: () => void
  onStopSimulate: () => void
  onDelete: () => void
  onEditLabels?: () => void
}) {
  const { t } = useTranslation('admin')
  const { locale } = useAppLocale()
  const simulating = previewRoleCode === role.roleCode
  const displayName = resolveRoleDisplayLabel(
    { roleNameTh: role.roleName, roleNameEn: role.roleNameEn, userst: role.roleCode },
    locale,
  )
  return (
    <div className="min-w-[7rem] space-y-1 text-center">
      <div
        className="mx-auto size-3 rounded-full border border-app"
        style={{ backgroundColor: role.roleColor }}
        title={role.roleColor}
      />
      <div className="font-semibold text-app">{role.roleCode}</div>
      <p className="text-badge leading-tight text-app-muted" title={role.roleNameEn}>
        {displayName}
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {role.isSystem ? (
          <Badge variant="secondary" className="px-1 py-0 text-badge">
            {t('shared.system')}
          </Badge>
        ) : null}
        <Badge variant="outline" className="px-1 py-0 text-badge">
          {t('shared.usersCount', { count: role.userCount })}
        </Badge>
      </div>
      <div className="flex justify-center gap-1 pt-1">
        {onEditLabels ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-7"
            aria-label={t('roles.editLabelsAria')}
            onClick={onEditLabels}
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon"
          variant={simulating ? 'default' : 'outline'}
          className="size-7"
          aria-label={simulating ? t('roles.stopSimulateMenu') : t('roles.simulateMenu')}
          onClick={simulating ? onStopSimulate : onSimulate}
        >
          {simulating ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
        {canWrite && !role.isSystem && role.userCount === 0 ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="app-tone-danger-btn-ghost size-7"
            aria-label={t('roles.deleteRoleAria')}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function PermissionMatrix({
  data,
  canWrite,
  pending,
  previewRoleCode,
  onToggle,
  onToggleGroup,
  onSimulate,
  onStopSimulate,
  onDeleteRole,
  onEditRoleLabels,
}: {
  data: AdminRoleMatrixResponse
  canWrite: boolean
  pending: string | null
  previewRoleCode: string | null
  onToggle: (roleCode: string, permCode: string, granted: boolean) => void
  onToggleGroup: (roleCode: string, group: string, grant: boolean) => void
  onSimulate: (role: AdminRole) => void
  onStopSimulate: () => void
  onDeleteRole: (role: AdminRole) => void
  onEditRoleLabels?: (role: AdminRole) => void
}) {
  const { t } = useTranslation('admin')

  return (
    <div className="overflow-x-auto rounded-card border border-app">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-subtle">
            <TableHead className="sticky left-0 z-20 min-w-[220px] bg-app-subtle">
              {t('roles.permColumn')}
            </TableHead>
            {data.roles.map((role) => (
              <TableHead key={role.roleCode} className="align-top">
                <RoleHeaderCell
                  role={role}
                  canWrite={canWrite}
                  previewRoleCode={previewRoleCode}
                  onSimulate={() => onSimulate(role)}
                  onStopSimulate={onStopSimulate}
                  onDelete={() => onDeleteRole(role)}
                  onEditLabels={
                    canWrite && onEditRoleLabels ? () => onEditRoleLabels(role) : undefined
                  }
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.groups.flatMap((g) => [
            <TableRow key={`group-${g.group}`} className="bg-app-muted/80">
              <TableCell
                colSpan={1 + data.roles.length}
                className="sticky left-0 z-10 bg-app-muted/80 py-2 font-semibold text-app"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {t(`roles.permGroups.${g.group}`, { defaultValue: g.group })}
                  </span>
                  {canWrite ? (
                    <div className="flex flex-wrap gap-1">
                      {data.roles.map((role) => (
                        <Button
                          key={`${g.group}-${role.roleCode}-all`}
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={pending !== null}
                          onClick={() => onToggleGroup(role.roleCode, g.group, true)}
                        >
                          {t('roles.grantGroup', { role: role.roleCode })}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>,
            ...g.permissions.map((perm) => (
              <TableRow key={perm.permCode}>
                <TableCell className="admin-table-sticky sticky left-0 z-10 bg-[var(--admin-surface)]">
                  <div className="font-mono text-xs text-app">{perm.permCode}</div>
                  <p className="text-body-sm text-app">{perm.permName}</p>
                  {perm.description ? (
                    <p className="text-xs text-app-muted">{perm.description}</p>
                  ) : null}
                </TableCell>
                {data.roles.map((role) => {
                  const granted = perm.grants[role.roleCode] ?? false
                  const cellKey = `${role.roleCode}:${perm.permCode}`
                  const busy =
                    pending === cellKey || pending === `${role.roleCode}:group:${g.group}`
                  return (
                    <TableCell key={cellKey} className="text-center">
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer accent-[var(--admin-primary)] disabled:cursor-not-allowed"
                        checked={granted}
                        disabled={!canWrite || busy}
                        aria-label={`${role.roleCode} — ${perm.permCode}`}
                        onChange={() => onToggle(role.roleCode, perm.permCode, !granted)}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            )),
          ])}
        </TableBody>
      </Table>
    </div>
  )
}