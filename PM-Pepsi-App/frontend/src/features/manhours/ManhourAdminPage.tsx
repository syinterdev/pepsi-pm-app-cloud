/**
 * Admin CRUD + import
 */
import type { ManhourImportResponse, ManhourItem } from '@/api/schemas'
import { hintsFromT } from '@/lib/i18n-hints'
import { arrayLength } from '@/lib/coerce-array'
import { AppCard } from '@/components/layout/AppCard'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getStoredAuthUser } from '@/features/auth/login-api'
import { formatManhourDate } from '@/features/manhours/format-manhour-date'
import {
  deleteManhour,
  fetchManhourList,
  postManhourImport,
  upsertManhour,
} from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Download, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type FormMode = 'create' | 'edit' | 'delete'

type FormState = {
  mode: FormMode
  idmanhour: number | null
  idwkctr: string
  stworkday: string
  workday: string
  wh: string
  ot1: string
  ot15: string
  ot1hol: string
  ot2: string
  ot3: string
}

const emptyForm: FormState = {
  mode: 'create',
  idmanhour: null,
  idwkctr: '',
  stworkday: '',
  workday: '',
  wh: '0',
  ot1: '0',
  ot15: '0',
  ot1hol: '0',
  ot2: '0',
  ot3: '0',
}

function fromItem(row: ManhourItem): FormState {
  return {
    mode: 'edit',
    idmanhour: row.idmanhour,
    idwkctr: row.idwkctr,
    stworkday: row.startDate ?? '',
    workday: row.endDate ?? '',
    wh: String(row.wh),
    ot1: String(row.ot1),
    ot15: String(row.ot15),
    ot1hol: String(row.ot1hol),
    ot2: String(row.ot2),
    ot3: String(row.ot3),
  }
}

function parseHour(s: string): number {
  const n = Number(s.trim())
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function ImportResultBlock({ data }: { data: ManhourImportResponse }) {
  const { t } = useTranslation('manhours')
  return (
    <AppCard pad="compact">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-body-sm font-medium text-app">
          {t('admin.importResult', { fileName: data.fileName })}
        </p>
        <Badge variant="outline">{t('admin.importTotal', { count: data.totalRows })}</Badge>
        <Badge variant="secondary">+{data.inserted}</Badge>
        <Badge variant="secondary">↻{data.updated}</Badge>
        {data.errors > 0 ? (
          <Badge variant="destructive">
            {t('admin.importErrors', { count: data.errors })}
          </Badge>
        ) : null}
      </div>
      {arrayLength(data.rows) > 0 ? (
        <div className="mt-3 app-table-shell overflow-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">{t('admin.importColRow')}</TableHead>
                <TableHead className="w-24">{t('admin.importColStatus')}</TableHead>
                <TableHead>{t('admin.colHr')}</TableHead>
                <TableHead>{t('admin.importColMessage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={`${r.rowNo}-${r.idwkctr}-${r.action}`}>
                  <TableCell className="text-center tabular-nums">{r.rowNo}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.action === 'inserted' || r.action === 'updated'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.idwkctr}</TableCell>
                  <TableCell className="text-xs text-app-muted">{r.message ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </AppCard>
  )
}

export function ManhourAdminPage() {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const authUser = getStoredAuthUser()
  const canAdmin = usePermission('manhours.admin') || authUser?.userst === 'A'

  const [search, setSearch] = useState('')
  const [submittedQ, setSubmittedQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ManhourImportResponse | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!canAdmin) {
      toast.error(t('admin.adminOnlyToast'))
      navigate('/manhours', { replace: true })
    }
  }, [canAdmin, navigate, t])

  const listQ = useQuery({
    queryKey: ['manhours', 'admin', 'list', submittedQ],
    queryFn: () => fetchManhourList({ q: submittedQ || undefined, limit: 500 }),
    enabled: canAdmin,
    placeholderData: keepPreviousData,
  })

  const saveMut = useMutation({
    mutationFn: async (state: FormState) => {
      const body = {
        idwkctr: state.idwkctr.trim(),
        stworkday: state.stworkday,
        workday: state.workday,
        wh: parseHour(state.wh),
        ot1: parseHour(state.ot1),
        ot15: parseHour(state.ot15),
        ot1hol: parseHour(state.ot1hol),
        ot2: parseHour(state.ot2),
        ot3: parseHour(state.ot3),
      }
      if (state.mode === 'edit' && state.idmanhour != null) {
        return upsertManhour(body, state.idmanhour)
      }
      return upsertManhour(body)
    },
    onSuccess: (_d, state) => {
      toast.success(
        state.mode === 'edit'
          ? t('admin.toastUpdated', { id: state.idmanhour })
          : t('admin.toastAdded', { hrId: state.idwkctr }),
      )
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['manhours'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : String(err))
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteManhour(id),
    onSuccess: () => {
      toast.success(t('admin.toastDeleted'))
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['manhours'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : String(err))
    },
  })

  function openCreate() {
    setForm({ ...emptyForm, mode: 'create' })
    setFormOpen(true)
  }

  function openEdit(row: ManhourItem) {
    setForm(fromItem(row))
    setFormOpen(true)
  }

  function openDelete(row: ManhourItem) {
    setForm({ ...fromItem(row), mode: 'delete' })
    setFormOpen(true)
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setSubmittedQ(search.trim())
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.mode === 'delete') {
      if (form.idmanhour != null) deleteMut.mutate(form.idmanhour)
      return
    }
    if (!form.idwkctr.trim()) {
      toast.error(t('admin.validationHr'))
      return
    }
    if (!form.stworkday || !form.workday) {
      toast.error(t('admin.validationDates'))
      return
    }
    saveMut.mutate(form)
  }

  function onPickImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setImportResult(null)
    postManhourImport(file)
      .then((res) => {
        setImportResult(res)
        toast.success(
          t('admin.toastImportSummary', {
            inserted: res.inserted,
            updated: res.updated,
            errors: res.errors,
          }),
        )
        qc.invalidateQueries({ queryKey: ['manhours'] })
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setImporting(false))
  }

  if (!canAdmin) {
    return (
      <AppPageShell title={t('admin.title')} description={t('admin.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('admin.noAccess')}
          description={
            <>
              {tc('rbac.requiresPermission')}{' '}
              <code className="text-xs">manhours.admin</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  const items = listQ.data?.items ?? []
  const totalRows = listQ.data?.totalRows ?? 0

  return (
    <AppPageShell
      title={t('admin.title')}
      description={t('admin.description')}
      hints={hintsFromT(t, 'admin.hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs">
            {t('admin.badgeRows', { count: totalRows })}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/manhours">{t('admin.navSummary')}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast.message(t('admin.fileFormatHint'))}
          >
            <Download className="mr-1 size-4" aria-hidden />
            {t('admin.fileFormat')}
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            className="hidden"
            onChange={onPickImport}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="mr-1 size-4" aria-hidden />
            {importing ? t('admin.importing') : t('admin.import')}
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" aria-hidden />
            {t('admin.add')}
          </Button>
        </>
      }
    >
        <AppPageSection index={0}>
        <AppPageSectionCard
          icon={Upload}
          title={t('admin.sectionTitle')}
          description={t('admin.sectionDesc')}
        >
        <form
          onSubmit={onSearch}
          className="mb-4 flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[12rem] flex-1 space-y-1">
            <Label htmlFor="mh-search">{t('admin.searchLabel')}</Label>
            <Input
              id="mh-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.searchPlaceholder')}
            />
          </div>
          <Button type="submit">{tc('actions.search')}</Button>
        </form>

        {importResult ? <ImportResultBlock data={importResult} /> : null}

        {listQ.isError && !listQ.data ? (
          <QueryLoadErrorState
            title={t('admin.tableLoadFailed')}
            error={listQ.error}
            action={{ label: tc('actions.retry'), onClick: () => void listQ.refetch() }}
          />
        ) : (
          <div
            className="app-table-shell overflow-x-auto"
            aria-busy={listQ.isLoading && !listQ.data ? true : undefined}
          >
            <Table embedded stickyHeader zebra>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.colDateRange')}</TableHead>
                  <TableHead>{t('admin.colHr')}</TableHead>
                  <TableHead>{t('admin.colName')}</TableHead>
                  <TableHead className="text-right">WH</TableHead>
                  <TableHead className="text-right">OT1</TableHead>
                  <TableHead className="text-right">{t('admin.colTotal')}</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQ.isLoading && !listQ.data ? (
                  <TableSkeletonRows rows={10} columns={7} />
                ) : items.length ? (
                  items.map((row) => (
                    <TableRow key={row.idmanhour}>
                      <TableCell>
                        {formatManhourDate(row.startDate, row.stworkday)} –{' '}
                        {formatManhourDate(row.endDate, row.workday)}
                      </TableCell>
                      <TableCell className="font-mono text-body-sm">{row.idwkctr}</TableCell>
                      <TableCell>{row.displayName?.trim() || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.wh}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.ot1}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="mr-1 size-3.5" />
                            {t('admin.edit')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openDelete(row)}
                          >
                            <Trash2 className="mr-1 size-3.5" />
                            {t('admin.delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        className="border-0 bg-transparent py-10"
                        title={t('admin.empty')}
                        description={t('admin.emptyHint')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        </AppPageSectionCard>
        </AppPageSection>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>
                {form.mode === 'create'
                  ? t('admin.dialogAdd')
                  : form.mode === 'edit'
                    ? t('admin.dialogEdit')
                    : t('admin.dialogDelete')}
              </DialogTitle>
              <DialogDescription>
                {form.mode === 'delete'
                  ? t('admin.dialogDeleteConfirm', {
                      id: form.idmanhour,
                      hrId: form.idwkctr,
                    })
                  : t('admin.dialogFormDesc')}
              </DialogDescription>
            </DialogHeader>

            {form.mode === 'delete' ? (
              <p className="py-4 text-body-sm text-app">
                {t('admin.dialogDateRange', {
                  from: formatManhourDate(form.stworkday),
                  to: formatManhourDate(form.workday),
                })}
              </p>
            ) : (
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="mh-idwkctr">{t('admin.formHr')}</Label>
                  <Input
                    id="mh-idwkctr"
                    value={form.idwkctr}
                    onChange={(e) => setForm((f) => ({ ...f, idwkctr: e.target.value }))}
                    disabled={form.mode === 'edit'}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('admin.formStartDate')}</Label>
                  <DatePicker
                    value={form.stworkday}
                    onChange={(v) => setForm((f) => ({ ...f, stworkday: v }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('admin.formEndDate')}</Label>
                  <DatePicker
                    value={form.workday}
                    onChange={(v) => setForm((f) => ({ ...f, workday: v }))}
                  />
                </div>
                {(
                  [
                    ['wh', 'WH'],
                    ['ot1', 'OT1'],
                    ['ot15', 'OT1.5'],
                    ['ot1hol', 'OT1HOL'],
                    ['ot2', 'OT2'],
                    ['ot3', 'OT3'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`mh-${key}`}>{label}</Label>
                    <Input
                      id={`mh-${key}`}
                      type="number"
                      min={0}
                      step="0.5"
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {tc('actions.cancel')}
              </Button>
              <Button
                type="submit"
                variant={form.mode === 'delete' ? 'destructive' : 'default'}
                disabled={saveMut.isPending || deleteMut.isPending}
              >
                {form.mode === 'delete'
                  ? t('admin.formDelete')
                  : form.mode === 'edit'
                    ? t('admin.formSaveEdit')
                    : t('admin.formSaveAdd')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  )
}
