import type { TelegramGroupItem, TelegramLinkType, TelegramNotifyKind } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminKpiCard } from '@/components/admin/AdminKpiCard'
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid'
import { AdminPageSection, AdminPageShell } from '@/components/admin/AdminPageShell'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  createTelegramGroup,
  deleteTelegramGroup,
  fetchTelegramGroups,
  fetchTelegramLinkStatus,
  fetchTelegramSummary,
  patchTelegramGroup,
  testTelegramGroup,
} from '@/lib/admin-telegram-api'
import { APP_INTERACTIVE_MOTION } from '@/lib/app-motion'
import { usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  formToTelegramGroupBody,
  TelegramGroupDialog,
  type TelegramGroupFormState,
} from './TelegramGroupDialog'
import { TelegramHelpPanel } from './TelegramHelpPanel'

const emptyForm = (): TelegramGroupFormState => ({
  code: '',
  name: '',
  notifyKind: 'ack_to_planner',
  linkType: 'none',
  linkRef: '',
  telegramChatId: '',
  enabled: true,
  note: '',
  memberWkctrsText: '',
})

type TestFeedback = {
  ok: boolean
  detail: string
}

export function AdminTelegramPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const canRead = usePermission('admin.telegram.read')
  const canWrite = usePermission('admin.telegram.write')
  const canSettings = usePermission('admin.settings.read')

  const publicUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const summaryQ = useQuery({
    queryKey: ['admin', 'telegram', 'summary'],
    queryFn: fetchTelegramSummary,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const groupsQ = useQuery({
    queryKey: ['admin', 'telegram', 'groups'],
    queryFn: fetchTelegramGroups,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const linkQ = useQuery({
    queryKey: ['admin', 'telegram', 'link-status'],
    queryFn: fetchTelegramLinkStatus,
    enabled: canRead,
    placeholderData: keepPreviousData,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TelegramGroupItem | null>(null)
  const [editing, setEditing] = useState<TelegramGroupItem | null>(null)
  const [form, setForm] = useState<TelegramGroupFormState>(emptyForm)
  const [showLinkTable, setShowLinkTable] = useState(false)
  const [testFeedback, setTestFeedback] = useState<Record<number, TestFeedback>>({})

  const wkctrGroupOptions = summaryQ.data?.wkctrGroups ?? []
  const pmTeamOptions = summaryQ.data?.pmTeams ?? ['A', 'B', 'EE', 'UT']

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (row: TelegramGroupItem) => {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      notifyKind: row.notifyKind,
      linkType: row.linkType,
      linkRef: row.linkRef ?? '',
      telegramChatId: row.telegramChatId ?? '',
      enabled: row.enabled,
      note: row.note ?? '',
      memberWkctrsText: (row.memberWkctrs ?? []).join(', '),
    })
    setDialogOpen(true)
  }

  const invalidateAll = async () => {
    await qc.invalidateQueries({ queryKey: ['admin', 'telegram'] })
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = formToTelegramGroupBody(form)
      if (editing) return patchTelegramGroup(editing.id, body)
      return createTelegramGroup(body)
    },
    onSuccess: async () => {
      await invalidateAll()
      toast.success(editing ? t('telegram.updated') : t('telegram.created'))
      setDialogOpen(false)
    },
    onError: (err) => toast.error((err as Error).message || t('telegram.saveFailed')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTelegramGroup(id),
    onSuccess: async () => {
      await invalidateAll()
      toast.success(t('telegram.deleted'))
      setDeleteTarget(null)
    },
    onError: (err) => toast.error((err as Error).message || t('telegram.deleteFailed')),
  })

  const testMut = useMutation({
    mutationFn: (id: number) => testTelegramGroup(id),
    onSuccess: (res, id) => {
      if (res.ok) {
        const detail = res.message?.trim() || t('telegram.testOk')
        setTestFeedback((prev) => ({ ...prev, [id]: { ok: true, detail } }))
        toast.success(t('telegram.testOk'))
      } else {
        const detail = res.error?.trim() || t('telegram.testFailed')
        setTestFeedback((prev) => ({ ...prev, [id]: { ok: false, detail } }))
        toast.error(detail)
      }
    },
    onError: (err, id) => {
      const detail = (err as Error).message || t('telegram.testFailed')
      setTestFeedback((prev) => ({ ...prev, [id]: { ok: false, detail } }))
      toast.error(detail)
    },
  })

  const notifyKindLabel = useMemo(
    () =>
      (kind: TelegramNotifyKind) =>
        t(`telegram.notifyKinds.${kind}`, { defaultValue: kind }),
    [t],
  )

  const linkTypeLabel = useMemo(
    () =>
      (lt: TelegramLinkType) =>
        t(`telegram.linkTypes.${lt}`, { defaultValue: lt }),
    [t],
  )

  if (!canRead) {
    return (
      <AdminPageRoot tourTarget="admin-telegram">
        <AdminAccessDenied permission="admin.telegram.read" />
      </AdminPageRoot>
    )
  }

  const schemaMissing =
    summaryQ.error &&
    String((summaryQ.error as Error).message).includes('SCHEMA_MISSING')

  const isRefreshing =
    summaryQ.isFetching || groupsQ.isFetching || linkQ.isFetching

  let sectionIndex = 0

  return (
    <AdminPageShell
      tourTarget="admin-telegram"
      title={t('telegram.title')}
      description={t('telegram.description')}
      hints={hintsFromT(t, 'telegram.hints')}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={() => void invalidateAll()}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={`mr-1 size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden
            />
            {t('shared.refresh')}
          </Button>
          {canWrite ? (
            <Button type="button" className="admin-toolbar-btn" onClick={openCreate}>
              <Plus className="mr-1 size-4" aria-hidden />
              {t('telegram.addGroup')}
            </Button>
          ) : null}
        </>
      }
    >
      {schemaMissing ? (
        <AdminPageSection index={sectionIndex++}>
          <Card className="admin-card app-tone-warning-review border">
            <CardHeader>
              <CardTitle className="app-tone-warning-strong flex items-center gap-2 text-base">
                <AlertCircle className="size-5" aria-hidden />
                {t('telegram.schemaMissingTitle')}
              </CardTitle>
              <CardDescription className="app-tone-warning-label">
                {t('telegram.schemaMissingHint')}
              </CardDescription>
            </CardHeader>
          </Card>
        </AdminPageSection>
      ) : null}

      <AdminPageSection index={sectionIndex++}>
        {summaryQ.isLoading && !summaryQ.data ? (
          <AdminKpiGrid className="sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-card" />
            ))}
          </AdminKpiGrid>
        ) : summaryQ.isError && !summaryQ.data ? (
          <QueryLoadErrorState
            title={t('telegram.summaryLoadFailed')}
            error={summaryQ.error}
            description={(summaryQ.error as Error).message}
            action={{ label: tc('actions.retry'), onClick: () => void summaryQ.refetch() }}
          />
        ) : summaryQ.data ? (
          <>
            <AdminKpiGrid className="sm:grid-cols-2 lg:grid-cols-3">
              <AdminKpiCard
                icon={Bot}
                label={t('telegram.summary.bot')}
                tone={summaryQ.data.botConfigured ? 'success' : 'warning'}
                value={
                  summaryQ.data.botConfigured ? (
                    <Badge className="app-tone-success-fill">
                      {t('telegram.summary.configured')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t('telegram.summary.notConfigured')}</Badge>
                  )
                }
                hint={
                  summaryQ.data.notifyEnabled
                    ? t('telegram.summary.notifyOn')
                    : t('telegram.summary.notifyOff')
                }
              />
              <AdminKpiCard
                icon={MessageSquare}
                label={t('telegram.summary.groups')}
                value={
                  <span className="tabular-nums">
                    {summaryQ.data.enabledGroups}/{summaryQ.data.totalGroups}
                  </span>
                }
              />
              <AdminKpiCard
                icon={Users}
                label={t('telegram.summary.linkedTech')}
                value={
                  <span className="tabular-nums">
                    {summaryQ.data.linkedTechnicians}/{summaryQ.data.activeTechnicians}
                  </span>
                }
                hint={
                  <Link to="/admin/users" className="font-medium text-[var(--app-accent)] underline">
                    {t('telegram.manageUsersLink')}
                  </Link>
                }
              />
            </AdminKpiGrid>

            {!summaryQ.data.botConfigured ? (
              <EmptyState
                icon={Bot}
                className="mt-4"
                title={t('telegram.botEmptyTitle')}
                description={t('telegram.botEmptyDesc')}
                action={
                  canSettings
                    ? {
                        label: t('telegram.botEmptyAction'),
                        onClick: () => navigate('/admin/settings'),
                      }
                    : undefined
                }
              />
            ) : null}

            <div className="mt-4">
              <TelegramHelpPanel publicUrl={publicUrl} />
            </div>
          </>
        ) : null}
      </AdminPageSection>

      <AdminPageSection index={sectionIndex++}>
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4" aria-hidden />
              {t('telegram.groupsTitle')}
            </CardTitle>
            <CardDescription>{t('telegram.groupsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {groupsQ.isLoading && !groupsQ.data ? (
              <div className="app-table-shell overflow-x-auto p-4">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('telegram.col.code')}</TableHead>
                      <TableHead>{t('telegram.col.name')}</TableHead>
                      <TableHead>{t('telegram.col.kind')}</TableHead>
                      <TableHead>{t('telegram.col.link')}</TableHead>
                      <TableHead>{t('telegram.col.chatId')}</TableHead>
                      <TableHead>{t('telegram.col.enabled')}</TableHead>
                      <TableHead className="text-right">{t('telegram.col.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeletonRows rows={5} columns={7} />
                  </TableBody>
                </Table>
              </div>
            ) : groupsQ.isError ? (
              <div className="p-4">
                <QueryLoadErrorState
                  title={t('telegram.groupsLoadFailed')}
                  error={groupsQ.error}
                  description={(groupsQ.error as Error).message}
                  action={{ label: tc('actions.retry'), onClick: () => void groupsQ.refetch() }}
                />
              </div>
            ) : !groupsQ.data?.length ? (
              <div className="p-4">
                <EmptyState
                  icon={MessageSquare}
                  title={t('telegram.emptyTitle')}
                  description={t('telegram.emptyDesc')}
                  action={
                    canWrite
                      ? { label: t('telegram.addGroup'), onClick: openCreate }
                      : {
                          label: t('telegram.emptyReadOnlyAction'),
                          onClick: () => navigate('/admin/users'),
                        }
                  }
                />
              </div>
            ) : (
              <div className="app-table-shell overflow-x-auto">
                <Table embedded stickyHeader zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('telegram.col.code')}</TableHead>
                      <TableHead>{t('telegram.col.name')}</TableHead>
                      <TableHead>{t('telegram.col.kind')}</TableHead>
                      <TableHead>{t('telegram.col.link')}</TableHead>
                      <TableHead>{t('telegram.col.chatId')}</TableHead>
                      <TableHead>{t('telegram.col.enabled')}</TableHead>
                      <TableHead className="min-w-[10rem] text-right">
                        {t('telegram.col.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupsQ.data.map((row) => {
                      const feedback = testFeedback[row.id]
                      const testing = testMut.isPending && testMut.variables === row.id
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-body-sm">{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-caption">
                            {notifyKindLabel(row.notifyKind)}
                          </TableCell>
                          <TableCell className="max-w-[14rem] text-caption">
                            {linkTypeLabel(row.linkType)}
                            {row.linkRef ? ` · ${row.linkRef}` : ''}
                            {row.memberWkctrs?.length
                              ? ` (${row.memberWkctrs.length} wkctr)`
                              : ''}
                          </TableCell>
                          <TableCell className="font-mono text-caption">
                            {row.telegramChatId || '—'}
                          </TableCell>
                          <TableCell>
                            {row.enabled ? (
                              <Badge className="app-tone-success-fill">
                                {t('telegram.enabledYes')}
                              </Badge>
                            ) : (
                              <Badge variant="outline">{t('telegram.enabledNo')}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canWrite ? (
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={testMut.isPending}
                                    onClick={() => testMut.mutate(row.id)}
                                    title={t('telegram.testSend')}
                                    className={cn(APP_INTERACTIVE_MOTION)}
                                  >
                                    {testing ? (
                                      <Loader2 className="size-4 animate-spin" aria-hidden />
                                    ) : (
                                      <Send className="size-4" aria-hidden />
                                    )}
                                    <span className="sr-only sm:not-sr-only sm:ml-1">
                                      {t('telegram.testSend')}
                                    </span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEdit(row)}
                                    title={t('telegram.editGroup')}
                                  >
                                    <Pencil className="size-4" aria-hidden />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeleteTarget(row)}
                                    title={t('telegram.deleteTitle')}
                                  >
                                    <Trash2 className="size-4 text-form-error" aria-hidden />
                                  </Button>
                                </div>
                                {feedback ? (
                                  <p
                                    className={cn(
                                      'flex max-w-[14rem] items-start gap-1 text-left text-[11px] leading-snug',
                                      feedback.ok ? 'text-[var(--app-success)]' : 'text-form-error',
                                    )}
                                    role="status"
                                  >
                                    {feedback.ok ? (
                                      <CheckCircle2 className="mt-0.5 size-3 shrink-0" aria-hidden />
                                    ) : (
                                      <XCircle className="mt-0.5 size-3 shrink-0" aria-hidden />
                                    )}
                                    <span>{feedback.detail}</span>
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </AdminPageSection>

      {linkQ.data ? (
        <AdminPageSection index={sectionIndex++}>
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-base">{t('telegram.linkStatusTitle')}</CardTitle>
              <CardDescription>
                {t('telegram.linkStatusDesc', {
                  linked: linkQ.data.linked,
                  unlinked: linkQ.data.unlinked,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLinkTable((v) => !v)}
              >
                {showLinkTable ? t('telegram.hideLinkTable') : t('telegram.showLinkTable')}
              </Button>
              {showLinkTable ? (
                <div className="app-table-shell mt-3 max-h-64 overflow-auto">
                  <Table embedded stickyHeader zebra>
                    <TableHeader>
                      <TableRow>
                        <TableHead>wkctr</TableHead>
                        <TableHead>{t('telegram.col.name')}</TableHead>
                        <TableHead>chat_id</TableHead>
                        <TableHead>@username</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkQ.data.items.map((item) => (
                        <TableRow
                          key={item.wkctr}
                          className={!item.telegramChatId ? 'opacity-60' : undefined}
                        >
                          <TableCell className="font-mono">{item.wkctr}</TableCell>
                          <TableCell>{item.displayName || '—'}</TableCell>
                          <TableCell className="font-mono text-caption">
                            {item.telegramChatId || '—'}
                          </TableCell>
                          <TableCell>
                            {item.telegramUsername ? `@${item.telegramUsername}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </AdminPageSection>
      ) : null}

      <TelegramGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        wkctrGroupOptions={wkctrGroupOptions}
        pmTeamOptions={pmTeamOptions}
        saving={saveMut.isPending}
        onSave={() => saveMut.mutate()}
        notifyKindLabel={notifyKindLabel}
        linkTypeLabel={linkTypeLabel}
      />

      {deleteTarget ? (
        <ConfirmPhraseDialog
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          tone="danger"
          title={t('telegram.deleteTitle')}
          description={deleteTarget.name}
          phrase="DELETE"
          confirmLabel={t('telegram.deleteConfirm')}
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        />
      ) : null}
    </AdminPageShell>
  )
}
