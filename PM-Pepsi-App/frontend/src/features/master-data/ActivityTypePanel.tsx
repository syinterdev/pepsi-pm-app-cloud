import type { ActivityTypeItem } from '@/api/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MasterDataPanelEmpty,
  MasterDataPanelError,
  MasterDataPanelSkeleton,
} from '@/features/master-data/master-data-panel-ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { fetchMasterData } from '@/lib/api-public'
import {
  createActivityType,
  deleteActivityType,
  importActivityTypes,
  parseActivityTypeCsv,
  parseActivityTypeFile,
  updateActivityType,
} from '@/lib/master-data-api'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type FormState = { mat: string; matdescrip: string; matcheck: string }

const emptyForm: FormState = { mat: '', matdescrip: '', matcheck: 'Y' }

type FormMode = 'create' | 'edit' | 'delete'

export function ActivityTypePanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'activitytype'],
    queryFn: () => fetchMasterData('activitytype'),
    placeholderData: keepPreviousData,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editing, setEditing] = useState<ActivityTypeItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formErrorSummary, setFormErrorSummary] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'activitytype'] })

  const closeFormDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormMode('create')
    setForm(emptyForm)
    setFormErrors({})
    setFormErrorSummary(null)
  }

  const closeImportDialog = () => {
    setImportOpen(false)
    setImportText('')
    setImportFile(null)
  }

  const validateForm = () => {
    if (formMode === 'delete') {
      setFormErrors({})
      setFormErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof FormState, string>> = {}

    const mat = form.mat.trim()
    const desc = form.matdescrip.trim()
    const checkRaw = form.matcheck.trim()

    if (!mat) next.mat = t('activityType.matRequired')
    if (!desc) next.matdescrip = t('activityType.descRequired')

    if (checkRaw) {
      const upper = checkRaw.toUpperCase()
      if (upper !== 'Y' && upper !== 'N') next.matcheck = t('activityType.checkYn')
    }

    setFormErrors(next)
    const first = Object.values(next).find(Boolean) ?? null
    setFormErrorSummary(first)
    return Object.keys(next).length === 0
  }

  const formMut = useMutation({
    mutationFn: async () => {
      if (!validateForm()) throw new Error('Please fix validation errors and try again.')

      if (formMode === 'edit' && editing) {
        const check = (form.matcheck || '').trim().toUpperCase()
        return updateActivityType(editing.mat, {
          matdescrip: form.matdescrip,
          matcheck: check || 'Y',
        })
      }
      if (formMode === 'delete' && editing) {
        await deleteActivityType(editing.mat)
        return null
      }
      const check = (form.matcheck || '').trim().toUpperCase()
      return createActivityType({
        mat: form.mat.trim(),
        matdescrip: form.matdescrip.trim(),
        matcheck: check || 'Y',
      })
    },
    onSuccess: () => {
      invalidate()
      closeFormDialog()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error('Select a file or paste CSV text before importing.')
      }

      const rows = importFile
        ? await parseActivityTypeFile(importFile)
        : parseActivityTypeCsv(importText)
      if (rows.length === 0) throw new Error('No rows found. Expected: mat,description,check')
      return importActivityTypes(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImportDialog()
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormMode('create')
    setFormErrors({})
    setFormErrorSummary(null)
    setDialogOpen(true)
  }

  const openEdit = (row: ActivityTypeItem) => {
    setEditing(row)
    setForm({
      mat: row.mat,
      matdescrip: row.matdescrip,
      matcheck: row.matcheck,
    })
    setFormMode('edit')
    setFormErrors({})
    setFormErrorSummary(null)
    setDialogOpen(true)
  }

  const openDelete = (row: ActivityTypeItem) => {
    setEditing(row)
    setForm({
      mat: row.mat,
      matdescrip: row.matdescrip,
      matcheck: row.matcheck,
    })
    setFormMode('delete')
    setFormErrors({})
    setFormErrorSummary(null)
    setDialogOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is ActivityTypeItem => 'mat' in r && typeof r.mat === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {t('activityType.badge')}
        </Badge>
        <span className="text-xs text-app-muted">{t('rowCount', { count: rows.length })}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('activityType.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('activityType.import')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <MasterDataPanelEmpty description={t('activityType.emptyHint')} />
      ) : (
        <div className="app-table-shell overflow-x-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{t('activityType.mat')}</TableHead>
                <TableHead>{t('activityType.description')}</TableHead>
                <TableHead>{t('activityType.check')}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.mat}>
                  <TableCell className="font-mono text-body-sm">{row.mat}</TableCell>
                  <TableCell>{row.matdescrip}</TableCell>
                  <TableCell>{row.matcheck}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(row)}
                        aria-label={t('aria.edit')}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          openDelete(row)
                        }}
                        aria-label={t('aria.delete')}
                      >
                        <Trash2 className="size-4 text-form-error" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create'
                ? t('activityType.dialogCreate')
                : formMode === 'edit'
                  ? t('activityType.dialogEdit')
                  : t('activityType.dialogDelete')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="mat">{t('activityType.mat')}</Label>
              <Input
                id="mat"
                value={form.mat}
                disabled={formMode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, mat: e.target.value }))}
              />
              {formErrors.mat ? (
                <p className="mt-1 text-xs text-form-error">{formErrors.mat}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="matdescrip">{t('activityType.description')}</Label>
              <Input
                id="matdescrip"
                value={form.matdescrip}
                disabled={formMode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, matdescrip: e.target.value }))}
              />
              {formErrors.matdescrip ? (
                <p className="mt-1 text-xs text-form-error">{formErrors.matdescrip}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="matcheck">{t('activityType.check')}</Label>
              <Input
                id="matcheck"
                value={form.matcheck}
                disabled={formMode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, matcheck: e.target.value }))}
              />
              {formErrors.matcheck ? (
                <p className="mt-1 text-xs text-form-error">{formErrors.matcheck}</p>
              ) : null}
            </div>
          </div>
          {formMode === 'delete' ? (
            <p className="text-body-sm text-form-error">
              {t('activityType.confirmDelete', { mat: form.mat })}
            </p>
          ) : null}
          {formErrorSummary && formMode !== 'delete' ? (
            <p className="text-body-sm text-form-error">{formErrorSummary}</p>
          ) : null}
          {formMut.isError ? (
            <p className="text-body-sm text-form-error">{(formMut.error as Error).message}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeFormDialog}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant={formMode === 'delete' ? 'destructive' : 'default'}
              disabled={!form.mat.trim() || formMut.isPending}
              onClick={() => formMut.mutate()}
            >
              {formMode === 'create'
                ? t('actions.add')
                : formMode === 'edit'
                  ? t('actions.save')
                  : t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!open) closeImportDialog()
          else setImportOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('activityType.dialogImport')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="activitytype-import-file">{t('activityType.pickFile')}</Label>
              <Input
                id="activitytype-import-file"
                type="file"
                accept=".csv,.xls,.xlsx,.xlsm,.xlsb"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Textarea
            rows={8}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={'PM01,Preventive Maintenance,Y\nCM01,Corrective Maintenance,Y'}
          />
          {importMut.isSuccess ? (
            <p className="app-tone-success-strong text-body-sm">
              {t('activityType.importResult', {
                inserted: importMut.data.inserted,
                updated: importMut.data.updated,
                skipped: importMut.data.skipped,
              })}
            </p>
          ) : null}
          {importMut.isError ? (
            <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeImportDialog}>
              {t('actions.close')}
            </Button>
            <Button
              type="button"
              disabled={importMut.isPending}
              onClick={() => importMut.mutate()}
            >
              {t('actions.import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
