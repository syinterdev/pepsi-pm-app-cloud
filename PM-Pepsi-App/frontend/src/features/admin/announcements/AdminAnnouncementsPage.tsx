import type { AnnouncementItem, CreateAnnouncementBody } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  patchAnnouncement,
} from '@/lib/admin-announcement-api'
import { fetchAdminSettings, patchAdminSettings } from '@/lib/admin-settings-api'
import { usePermission } from '@/lib/use-permission'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2, Megaphone, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

type FormState = {
  level: CreateAnnouncementBody['level']
  title: string
  body: string
  startsAt: string
  endsAt: string
  dismissable: boolean
  active: boolean
}

const emptyForm = (): FormState => ({
  level: 'info',
  title: '',
  body: '',
  startsAt: '',
  endsAt: '',
  dismissable: true,
  active: true,
})

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string): string | undefined {
  if (!value.trim()) return undefined
  return new Date(value).toISOString()
}

function levelBadge(level: AnnouncementItem['level']) {
  const map: Record<AnnouncementItem['level'], string> = {
    info: 'app-tone-info-progress',
    warn: 'app-tone-warning-fill',
    error: 'border-transparent bg-destructive text-destructive-foreground',
    maintenance: 'bg-[var(--admin-primary)] text-white',
  }
  return <Badge className={map[level]}>{level}</Badge>
}

export function AdminAnnouncementsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const { refetch: refetchPublic } = usePublicSettings()
  const canRead = usePermission('admin.announcement.read')
  const canWrite = usePermission('admin.announcement.write')
  const canSettings = usePermission('admin.settings.write')

  const listQ = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: fetchAnnouncements,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const settingsQ = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: fetchAdminSettings,
    enabled: canSettings,
    placeholderData: keepPreviousData,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null)
  const [editing, setEditing] = useState<AnnouncementItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const openCreate = () => {
    setEditing(null)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    setForm({ ...emptyForm(), startsAt: localNow })
    setDialogOpen(true)
  }

  const openEdit = (row: AnnouncementItem) => {
    setEditing(row)
    setForm({
      level: row.level,
      title: row.title,
      body: row.body ?? '',
      startsAt: toLocalInput(row.startsAt),
      endsAt: toLocalInput(row.endsAt),
      dismissable: row.dismissable,
      active: row.active,
    })
    setDialogOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: CreateAnnouncementBody = {
        level: form.level,
        title: form.title.trim(),
        body: form.body.trim() || null,
        startsAt: fromLocalInput(form.startsAt),
        endsAt: form.endsAt.trim() ? fromLocalInput(form.endsAt) : null,
        dismissable: form.dismissable,
        active: form.active,
      }
      if (editing) {
        return patchAnnouncement(editing.id, body)
      }
      return createAnnouncement(body)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'announcements'] })
      void qc.invalidateQueries({ queryKey: ['announcements', 'active'] })
      setDialogOpen(false)
      toast.success(editing ? t('announcements.updated') : t('announcements.created'))
    },
    onError: (e: Error) => toast.error(e.message || t('announcements.saveFailed')),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'announcements'] })
      void qc.invalidateQueries({ queryKey: ['announcements', 'active'] })
      toast.success(t('announcements.deleted'))
    },
    onError: (e: Error) => toast.error(e.message || t('announcements.deleteFailed')),
  })

  const [maintMessage, setMaintMessage] = useState('')

  useEffect(() => {
    if (settingsQ.data?.maintenanceMessage != null) {
      setMaintMessage(settingsQ.data.maintenanceMessage)
    }
  }, [settingsQ.data?.maintenanceMessage])

  const maintenanceMut = useMutation({
    mutationFn: (payload: { enabled?: boolean; message?: string }) =>
      patchAdminSettings({
        maintenanceEnabled: payload.enabled ?? settingsQ.data?.maintenanceEnabled ?? false,
        maintenanceMessage: payload.message ?? maintMessage,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      void qc.invalidateQueries({ queryKey: ['settings', 'public'] })
      refetchPublic()
      toast.success(t('announcements.maintenanceUpdated'))
    },
    onError: (e: Error) => toast.error(e.message || t('announcements.updateFailed')),
  })

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-announcements">
        <AdminAccessDenied permission="admin.announcement.read" />
      </AdminPageRoot>
    )
  }

  const maintenanceOn = settingsQ.data?.maintenanceEnabled ?? false

  return (
    <AdminPageShell
      tourTarget="admin-announcements"
      title={t('announcements.title')}
      description={t('announcements.pageDescription')}
      hints={hintsFromT(t, 'announcements.hints')}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={() => void listQ.refetch()}
            disabled={listQ.isFetching}
          >
            <RefreshCcw className={`mr-1 size-3.5 ${listQ.isFetching ? 'animate-spin' : ''}`} aria-hidden />{t('shared.refresh')}</Button>
          {canWrite ? (
            <Button type="button" className="admin-toolbar-btn" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              {t('announcements.newBtn')}
            </Button>
          ) : null}
        </>
      }
    >
        {canSettings ? (
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-base">{t('announcements.maintenanceCardTitle')}</CardTitle>
              <CardDescription>
                {t('announcements.maintenanceCardDesc')}{' '}
                <Link to="/admin/settings" className="text-blue-600 underline">
                  {t('announcements.systemSettings')}
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={maintenanceOn}
                  disabled={maintenanceMut.isPending || settingsQ.isLoading}
                  onChange={(e) => maintenanceMut.mutate({ enabled: e.target.checked })}
                />
                <span className="font-medium">
                  {maintenanceOn ? t('announcements.maintenanceOn') : t('announcements.maintenanceOff')}
                </span>
                {maintenanceMut.isPending ? (
                  <Loader2 className="size-4 animate-spin text-app-muted" />
                ) : null}
              </label>
              <div className="space-y-1">
                <Label htmlFor="maint-msg">{t('announcements.bannerMessage')}</Label>
                <Textarea
                  id="maint-msg"
                  rows={2}
                  value={maintMessage}
                  disabled={maintenanceMut.isPending}
                  onChange={(e) => setMaintMessage(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={maintenanceMut.isPending}
                onClick={() => maintenanceMut.mutate({ message: maintMessage })}
              >
                {t('announcements.saveMessage')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4" />
              {t('announcements.listTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listQ.isLoading && !listQ.data ? (
              <Skeleton className="m-4 h-40" />
            ) : listQ.isError ? (
              <EmptyState
                icon={AlertCircle}
                className="m-4"
                title={t('announcements.listLoadFailed')}
                description={(listQ.error as Error).message}
                action={{ label: tc('actions.retry'), onClick: () => void listQ.refetch() }}
              />
            ) : (
              <div className="app-table-shell overflow-x-auto">
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('announcements.colLevel')}</TableHead>
                    <TableHead>{t('announcements.colTitle')}</TableHead>
                    <TableHead>{t('announcements.colSchedule')}</TableHead>
                    <TableHead>{t('announcements.colStatus')}</TableHead>
                    <TableHead className="text-right">{t('announcements.colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listQ.data?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-caption">
                        {t('announcements.emptyList')}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {(listQ.data?.items ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{levelBadge(row.level)}</TableCell>
                      <TableCell className="max-w-xs truncate">{row.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(row.startsAt).toLocaleString('th-TH')}
                        {row.endsAt
                          ? ` → ${new Date(row.endsAt).toLocaleString('th-TH')}`
                          : ''}
                      </TableCell>
                      <TableCell>
                        {row.active ? (
                          <Badge className="app-tone-success-fill">{t('announcements.activeBadge')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('announcements.inactiveBadge')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canWrite ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={t('announcements.editAria')}
                              onClick={() => openEdit(row)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={t('announcements.deleteAria')}
                              disabled={deleteMut.isPending}
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="size-4 text-form-error" />
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('announcements.dialogEdit') : t('announcements.dialogNew')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="ann-level">{t('announcements.levelLabel')}</Label>
              <select
                id="ann-level"
                className="flex h-9 w-full rounded-button border border-input bg-transparent px-3 text-body-sm"
                value={form.level ?? 'info'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    level: e.target.value as FormState['level'],
                  })
                }
              >
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ann-title">{t('announcements.titleLabel')}</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ann-body">{t('announcements.bodyLabel')}</Label>
              <Textarea
                id="ann-body"
                rows={4}
                value={form.body}
                placeholder={t('announcements.bodyPlaceholderFull')}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ann-start">{t('announcements.annStart')}</Label>
                <Input
                  id="ann-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ann-end">{t('announcements.annEnd')}</Label>
                <Input
                  id="ann-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={form.dismissable}
                onChange={(e) => setForm({ ...form, dismissable: e.target.checked })}
              />
              {t('announcements.dismissibleLabel')}
            </label>
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              {t('announcements.activeLabel')}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!form.title.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {tc('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget ? (
        <ConfirmPhraseDialog
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          tone="danger"
          title={t('announcements.deleteTitle')}
          description={deleteTarget.title}
          phrase="DELETE"
          confirmLabel={t('announcements.deleteConfirm')}
          loading={deleteMut.isPending}
          onConfirm={() => {
            deleteMut.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }}
        />
      ) : null}
    </AdminPageShell>
  )
}
