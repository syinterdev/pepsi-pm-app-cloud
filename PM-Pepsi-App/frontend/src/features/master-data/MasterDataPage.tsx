import { CanPermission } from '@/components/auth/CanPermission'
import { hintsFromT } from '@/lib/i18n-hints'
import { AppCard } from '@/components/layout/AppCard'
import { AppPageShell } from '@/components/layout/AppPageShell'
import {
  type DepartmentItem,
  type EquipmentItem,
  type FunctionalItem,
  type GroupItem,
  type LevelItem,
  type LineSchdulItem,
  type LineProductItem,
  type MasterDataItem,
  type MachineItem,
  type MaterialItem,
  type PositionItem,
  type ReasonItem,
  type TasklistItem,
  type WorkStatusItem,
  type WorkTypeItem,
  type ZbItem,
  type ZoneItem,
} from '@/api/schemas'
import { ActivityTypePanel } from '@/features/master-data/ActivityTypePanel'
import {
  MasterDataConfirmDelete,
  MasterDataEntityDialogTitle,
  MasterDataFormDialogFooter,
  MasterDataImportDialogFooter,
  MasterDataImportDialogTitle,
  MasterDataImportResult,
} from '@/features/master-data/master-data-dialog-i18n'
import { mdField, mdMaxLen, mdNumber, mdRequired } from '@/features/master-data/master-data-form-i18n'
import {
  MasterDataPanelEmpty,
  MasterDataPanelError,
  MasterDataPanelSkeleton,
} from '@/features/master-data/master-data-panel-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useTranslation } from 'react-i18next'
import { useMasterDataPermissions } from '@/lib/master-data-permissions'
import {
  createDepartment,
  deleteDepartment,
  createEquipment,
  deleteEquipment,
  importEquipments,
  parseEquipmentCsv,
  parseEquipmentFile,
  createFunctional,
  deleteFunctional,
  importFunctionals,
  parseFunctionalCsv,
  parseFunctionalFile,
  createLineProduct,
  createLevel,
  deleteLineProduct,
  deleteLevel,
  importLineProducts,
  parseLineProductCsv,
  parseLineProductFile,
  createMachine,
  deleteMachine,
  importMachines,
  parseMachineCsv,
  parseMachineFile,
  createMaterial,
  deleteMaterial,
  formatIsoDateToDdMmYyyy,
  importMaterials,
  parseDdMmYyyyToIso,
  parseMaterialCsv,
  parseMaterialFile,
  createPosition,
  createGroup,
  createTasklist,
  createReason,
  deleteGroup,
  deleteTasklist,
  deletePosition,
  deleteReason,
  createWorkStatus,
  deleteWorkStatus,
  createWorkType,
  deleteWorkType,
  importZones,
  parseZoneCsv,
  parseZoneFile,
  createZb,
  deleteZb,
  createZone,
  deleteZone,
  updateDepartment,
  updateEquipment,
  updateFunctional,
  updateLineProduct,
  updateLevel,
  updateMachine,
  updateMaterial,
  updatePosition,
  updateReason,
  updateGroup,
  updateTasklist,
  updateWorkStatus,
  updateWorkType,
  updateZb,
  updateZone,
  importTasklists,
  parseTasklistCsv,
  parseTasklistFile,
  createLineSchdul,
  deleteLineSchdul,
  formatEpochSecondsToDdMmYyyy,
  importLineSchduls,
  parseLineSchdulCsv,
  parseLineSchdulFile,
  updateLineSchdul,
} from '@/lib/master-data-api'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

const TAB_IDS = [
  'equipment',
  'functional',
  'machine',
  'material',
  'zone',
  'department',
  'tasklist',
  'worktype',
  'zb',
  'level',
  'position',
  'activitytype',
  'workstatus',
  'reason',
  'group',
  'lineproduct',
  'lineschdul',
] as const

const tabs = TAB_IDS.map((id) => ({
  id,
  legacy: `M_${id}` as string,
  backend: true as const,
}))

type DepartmentFormState = { iddepartment: string; department: string }
type DepartmentFormMode = 'create' | 'edit' | 'delete'

const emptyDepartmentForm: DepartmentFormState = { iddepartment: '', department: '' }

type EquipmentFormState = {
  equipment: string
  equdescrip: string
  equipmentsub: string
  functionalloc: string
  equl: string
  equ1: string
  equea: string
}

type EquipmentFormMode = 'create' | 'edit' | 'delete'

const emptyEquipmentForm: EquipmentFormState = {
  equipment: '',
  equdescrip: '',
  equipmentsub: '',
  functionalloc: '',
  equl: '',
  equ1: '',
  equea: '',
}

type FunctionalFormState = {
  functionalloc: string
  funldescrip: string
  functionallocsub: string
}

type FunctionalFormMode = 'create' | 'edit' | 'delete'

const emptyFunctionalForm: FunctionalFormState = {
  functionalloc: '',
  funldescrip: '',
  functionallocsub: '',
}

type ReasonFormState = { reasoncode: string; reasonname: string }
type ReasonFormMode = 'create' | 'edit' | 'delete'
const emptyReasonForm: ReasonFormState = { reasoncode: '', reasonname: '' }

type WorkTypeFormState = { idwkctrtype: string; wkctrtype: string }
type WorkTypeFormMode = 'create' | 'edit' | 'delete'
const emptyWorkTypeForm: WorkTypeFormState = { idwkctrtype: '', wkctrtype: '' }

type ZbFormState = { wkzb: string; zbdescrip: string }
type ZbFormMode = 'create' | 'edit' | 'delete'
const emptyZbForm: ZbFormState = { wkzb: '', zbdescrip: '' }

type LevelFormState = { idwklevel: string; wklevel: string }
type LevelFormMode = 'create' | 'edit' | 'delete'
const emptyLevelForm: LevelFormState = { idwklevel: '', wklevel: '' }

type PositionFormState = { idposition: string; position: string }
type PositionFormMode = 'create' | 'edit' | 'delete'
const emptyPositionForm: PositionFormState = { idposition: '', position: '' }

type GroupFormState = { wkctrgroup: string; wkctrdescription: string }
type GroupFormMode = 'create' | 'edit' | 'delete'
const emptyGroupForm: GroupFormState = { wkctrgroup: '', wkctrdescription: '' }

type TasklistFormState = {
  idwkctrtype: string
  idzone: string
  idmachine: string
  mntplan: string
  tasklist: string
  legacy: string
  machine: string
  pmlist: string
  pmday: string
  machinestatus: string
  pmmin: string
  pmman: string
  manhour: string
  mat: string
  runhr: string
  mpoint: string
  bcprunhr: string
  gls: string
  ment: string
  freqhour: string
  plan: string
}
type TasklistFormMode = 'create' | 'edit' | 'delete'
const emptyTasklistForm: TasklistFormState = {
  idwkctrtype: '',
  idzone: '',
  idmachine: '',
  mntplan: '',
  tasklist: '',
  legacy: '',
  machine: '',
  pmlist: '',
  pmday: '',
  machinestatus: '',
  pmmin: '',
  pmman: '',
  manhour: '',
  mat: '',
  runhr: '',
  mpoint: '',
  bcprunhr: '',
  gls: '',
  ment: '',
  freqhour: '',
  plan: '',
}

type WorkStatusFormState = { syst: string; wkstreason: string; wkstcolor: string }
type WorkStatusFormMode = 'create' | 'edit' | 'delete'
const emptyWorkStatusForm: WorkStatusFormState = { syst: '', wkstreason: '', wkstcolor: '' }

type LineProductFormState = { productline: string; prolinedescrip: string }
type LineProductFormMode = 'create' | 'edit' | 'delete'
const emptyLineProductForm: LineProductFormState = { productline: '', prolinedescrip: '' }

type LineSchdulFormState = {
  idproductline: string
  lineday: string
  uptime: string
  linereason: string
}
type LineSchdulFormMode = 'create' | 'edit' | 'delete'
const emptyLineSchdulForm: LineSchdulFormState = {
  idproductline: '',
  lineday: '',
  uptime: '',
  linereason: '',
}

type ZoneFormState = { idzone: string; zone: string; zonedescrip: string; idproductline: string }
type ZoneFormMode = 'create' | 'edit' | 'delete'
const emptyZoneForm: ZoneFormState = { idzone: '', zone: '', zonedescrip: '', idproductline: '' }

type MachineFormState = { machine: string; idzone: string; idwkctrtype: string }
type MachineFormMode = 'create' | 'edit' | 'delete'
const emptyMachineForm: MachineFormState = { machine: '', idzone: '', idwkctrtype: '' }

type MaterialFormState = {
  wkorder: string
  pstngdate: string
  materialdesc: string
  amountinlc: string
  mvt: string
  material: string
  matquantity: string
  crcy: string
}
type MaterialFormMode = 'create' | 'edit' | 'delete'
const emptyMaterialForm: MaterialFormState = {
  wkorder: '',
  pstngdate: '',
  materialdesc: '',
  amountinlc: '',
  mvt: '',
  material: '',
  matquantity: '',
  crcy: '',
}

function DepartmentPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'department'],
    queryFn: () => fetchMasterData('department'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DepartmentFormMode>('create')
  const [editing, setEditing] = useState<DepartmentItem | null>(null)
  const [form, setForm] = useState<DepartmentFormState>(emptyDepartmentForm)
  const [errors, setErrors] = useState<Partial<Record<keyof DepartmentFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'department'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyDepartmentForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof DepartmentFormState, string>> = {}
    const iddepartment = form.iddepartment.trim()
    const department = form.department.trim()

    if (!iddepartment) next.iddepartment = mdRequired(t, 'iddepartment')
    else if (iddepartment.length > 64) next.iddepartment = mdMaxLen(t, 'iddepartment', 64)

    if (!department) next.department = mdRequired(t, 'department')
    else if (department.length > 2000) next.department = mdMaxLen(t, 'department', 2000)

    setErrors(next)
    const first = Object.values(next).find(Boolean) ?? null
    setErrorSummary(first)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateDepartment(editing.iddepartment, { department: form.department.trim() })
      }
      if (mode === 'delete' && editing) {
        await deleteDepartment(editing.iddepartment)
        return null
      }
      return createDepartment({
        iddepartment: form.iddepartment.trim(),
        department: form.department.trim(),
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyDepartmentForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: DepartmentItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ iddepartment: row.iddepartment, department: row.department })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: DepartmentItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ iddepartment: row.iddepartment, department: row.department })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is DepartmentItem => 'iddepartment' in r && typeof (r as { iddepartment: unknown }).iddepartment === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <MasterDataPanelEmpty description={t('emptyHints.department')} />
      ) : (
        <div className="app-table-shell overflow-x-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{mdField(t, 'iddepartment')}</TableHead>
                <TableHead>{mdField(t, 'department')}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.iddepartment}>
                  <TableCell className="font-mono text-body-sm">{row.iddepartment}</TableCell>
                  <TableCell>{row.department}</TableCell>
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
                        onClick={() => openDelete(row)}
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
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="department" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="iddepartment">{mdField(t, 'iddepartment')}</Label>
              <Input
                id="iddepartment"
                value={form.iddepartment}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, iddepartment: e.target.value }))}
              />
              {errors.iddepartment ? (
                <p className="mt-1 text-xs text-form-error">{errors.iddepartment}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="department">{mdField(t, 'department')}</Label>
              <Input
                id="department"
                value={form.department}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
              {errors.department ? (
                <p className="mt-1 text-xs text-form-error">{errors.department}</p>
              ) : null}
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="department" name={form.iddepartment} /> : null}
          {errorSummary && mode !== 'delete' ? (
            <p className="text-body-sm text-form-error">{errorSummary}</p>
          ) : null}
          {mut.isError ? (
            <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p>
          ) : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.iddepartment.trim()}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EquipmentPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'equipment'],
    queryFn: () => fetchMasterData('equipment'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<EquipmentFormMode>('create')
  const [editing, setEditing] = useState<EquipmentItem | null>(null)
  const [form, setForm] = useState<EquipmentFormState>(emptyEquipmentForm)
  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'equipment'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyEquipmentForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof EquipmentFormState, string>> = {}
    const equipment = form.equipment.trim()
    const equdescrip = form.equdescrip.trim()

    if (!equipment) next.equipment = mdRequired(t, 'equipment')
    else if (equipment.length > 64) next.equipment = mdMaxLen(t, 'equipment', 64)

    if (!equdescrip) next.equdescrip = mdRequired(t, 'equdescrip')
    else if (equdescrip.length > 2000) next.equdescrip = mdMaxLen(t, 'equdescrip', 2000)

    setErrors(next)
    const first = Object.values(next).find(Boolean) ?? null
    setErrorSummary(first)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateEquipment(editing.equipment, {
          equdescrip: form.equdescrip.trim(),
          equipmentsub: form.equipmentsub.trim(),
          functionalloc: form.functionalloc.trim(),
          equl: form.equl.trim(),
          equ1: form.equ1.trim(),
          equea: form.equea.trim(),
        })
      }
      if (mode === 'delete' && editing) {
        await deleteEquipment(editing.equipment)
        return null
      }
      return createEquipment({
        equipment: form.equipment.trim(),
        equdescrip: form.equdescrip.trim(),
        equipmentsub: form.equipmentsub.trim(),
        functionalloc: form.functionalloc.trim(),
        equl: form.equl.trim(),
        equ1: form.equ1.trim(),
        equea: form.equea.trim(),
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }

      const rows = importFile ? await parseEquipmentFile(importFile) : parseEquipmentCsv(importText)
      if (rows.length === 0) {
        throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.equipment') }))
      }
      return importEquipments(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyEquipmentForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: EquipmentItem) => {
    setMode('edit')
    setEditing(row)
    setForm({
      equipment: row.equipment,
      equdescrip: row.equdescrip,
      equipmentsub: row.equipmentsub,
      functionalloc: row.functionalloc,
      equl: row.equl,
      equ1: row.equ1,
      equea: row.equea,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: EquipmentItem) => {
    setMode('delete')
    setEditing(row)
    setForm({
      equipment: row.equipment,
      equdescrip: row.equdescrip,
      equipmentsub: row.equipmentsub,
      functionalloc: row.functionalloc,
      equl: row.equl,
      equ1: row.equ1,
      equea: row.equea,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is EquipmentItem => 'equipment' in r && typeof (r as { equipment: unknown }).equipment === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('actions.importFile')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <MasterDataPanelEmpty description={t('emptyHints.equipment')} />
      ) : (
        <div className="app-table-shell overflow-x-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{mdField(t, 'equipment')}</TableHead>
                <TableHead>{mdField(t, 'description')}</TableHead>
                <TableHead>{mdField(t, 'equipmentsub')}</TableHead>
                <TableHead>{mdField(t, 'functionalloc')}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.equipment}>
                  <TableCell className="font-mono text-body-sm">{row.equipment}</TableCell>
                  <TableCell>{row.equdescrip}</TableCell>
                  <TableCell>{row.equipmentsub}</TableCell>
                  <TableCell>{row.functionalloc}</TableCell>
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
                        onClick={() => openDelete(row)}
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
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="equipment" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="equipment">{mdField(t, 'equipment')}</Label>
              <Input
                id="equipment"
                value={form.equipment}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
              />
              {errors.equipment ? <p className="mt-1 text-xs text-form-error">{errors.equipment}</p> : null}
            </div>
            <div>
              <Label htmlFor="equdescrip">{mdField(t, 'equdescrip')}</Label>
              <Input
                id="equdescrip"
                value={form.equdescrip}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, equdescrip: e.target.value }))}
              />
              {errors.equdescrip ? <p className="mt-1 text-xs text-form-error">{errors.equdescrip}</p> : null}
            </div>
            <div>
              <Label htmlFor="equipmentsub">{mdField(t, 'equipmentsub')}</Label>
              <Input
                id="equipmentsub"
                value={form.equipmentsub}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, equipmentsub: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="functionalloc">{mdField(t, 'functionalloc')}</Label>
              <Input
                id="functionalloc"
                value={form.functionalloc}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, functionalloc: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="equl">{mdField(t, 'equl')}</Label>
                <Input
                  id="equl"
                  value={form.equl}
                  disabled={mode === 'delete'}
                  onChange={(e) => setForm((f) => ({ ...f, equl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="equ1">{mdField(t, 'equ1')}</Label>
                <Input
                  id="equ1"
                  value={form.equ1}
                  disabled={mode === 'delete'}
                  onChange={(e) => setForm((f) => ({ ...f, equ1: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="equea">{mdField(t, 'equea')}</Label>
                <Input
                  id="equea"
                  value={form.equea}
                  disabled={mode === 'delete'}
                  onChange={(e) => setForm((f) => ({ ...f, equea: e.target.value }))}
                />
              </div>
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="equipment" name={form.equipment} /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.equipment.trim()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(next) => {
          if (!next) closeImport()
          else setImportOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="equipment" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.equipment.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="equipment-import-file">{t('import.selectFile')}</Label>
              <Input
                id="equipment-import-file"
                type="file"
                accept=".csv,.xls,.xlsx,.xlsm,.xlsb"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="text-xs text-app-muted">{t('entities.equipment.pasteColumns')}</div>
          </div>
          <Textarea
            rows={8}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={'EQ0001,Sample Equipment,,,L,1,EA'}
          />
          {importMut.isSuccess ? (
            <MasterDataImportResult
              inserted={importMut.data.inserted}
              updated={importMut.data.updated}
              failed={importMut.data.failed}
              skipped={importMut.data.skipped}
            />
          ) : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter
            onClose={closeImport}
            onImport={() => importMut.mutate()}
            pending={importMut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FunctionalPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'functional'],
    queryFn: () => fetchMasterData('functional'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<FunctionalFormMode>('create')
  const [editing, setEditing] = useState<FunctionalItem | null>(null)
  const [form, setForm] = useState<FunctionalFormState>(emptyFunctionalForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FunctionalFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'functional'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyFunctionalForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof FunctionalFormState, string>> = {}
    const functionalloc = form.functionalloc.trim()
    const funldescrip = form.funldescrip.trim()

    if (!functionalloc) next.functionalloc = mdRequired(t, 'functionalloc')
    else if (functionalloc.length > 64) next.functionalloc = mdMaxLen(t, 'functionalloc', 64)

    if (!funldescrip) next.funldescrip = mdRequired(t, 'funldescrip')
    else if (funldescrip.length > 2000) next.funldescrip = mdMaxLen(t, 'funldescrip', 2000)

    if (form.functionallocsub.trim().length > 64) {
      next.functionallocsub = mdMaxLen(t, 'functionallocsub', 64)
    }

    setErrors(next)
    const first = Object.values(next).find(Boolean) ?? null
    setErrorSummary(first)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateFunctional(editing.functionalloc, {
          funldescrip: form.funldescrip.trim(),
          functionallocsub: form.functionallocsub.trim(),
        })
      }
      if (mode === 'delete' && editing) {
        await deleteFunctional(editing.functionalloc)
        return null
      }
      return createFunctional({
        functionalloc: form.functionalloc.trim(),
        funldescrip: form.funldescrip.trim(),
        functionallocsub: form.functionallocsub.trim(),
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }

      const rows = importFile
        ? await parseFunctionalFile(importFile)
        : parseFunctionalCsv(importText)
      if (rows.length === 0) {
        throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.functional') }))
      }
      return importFunctionals(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyFunctionalForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: FunctionalItem) => {
    setMode('edit')
    setEditing(row)
    setForm({
      functionalloc: row.functionalloc,
      funldescrip: row.funldescrip,
      functionallocsub: row.functionallocsub,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: FunctionalItem) => {
    setMode('delete')
    setEditing(row)
    setForm({
      functionalloc: row.functionalloc,
      funldescrip: row.funldescrip,
      functionallocsub: row.functionallocsub,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is FunctionalItem =>
      'functionalloc' in r && typeof (r as { functionalloc: unknown }).functionalloc === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('actions.importFile')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <MasterDataPanelEmpty description={t('emptyHints.functional')} />
      ) : (
        <div className="app-table-shell overflow-x-auto">
          <Table embedded stickyHeader zebra>
            <TableHeader>
              <TableRow>
                <TableHead>{mdField(t, 'functionalloc')}</TableHead>
                <TableHead>{mdField(t, 'description')}</TableHead>
                <TableHead>{mdField(t, 'functionallocsub')}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.functionalloc}>
                  <TableCell className="font-mono text-body-sm">{row.functionalloc}</TableCell>
                  <TableCell>{row.funldescrip}</TableCell>
                  <TableCell>{row.functionallocsub}</TableCell>
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
                        onClick={() => openDelete(row)}
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
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="functional" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="functionalloc">{mdField(t, 'functionalloc')}</Label>
              <Input
                id="functionalloc"
                value={form.functionalloc}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, functionalloc: e.target.value }))}
              />
              {errors.functionalloc ? (
                <p className="mt-1 text-xs text-form-error">{errors.functionalloc}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="funldescrip">{mdField(t, 'funldescrip')}</Label>
              <Input
                id="funldescrip"
                value={form.funldescrip}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, funldescrip: e.target.value }))}
              />
              {errors.funldescrip ? (
                <p className="mt-1 text-xs text-form-error">{errors.funldescrip}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="functionallocsub">{mdField(t, 'functionallocsub')}</Label>
              <Input
                id="functionallocsub"
                value={form.functionallocsub}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, functionallocsub: e.target.value }))}
              />
              {errors.functionallocsub ? (
                <p className="mt-1 text-xs text-form-error">{errors.functionallocsub}</p>
              ) : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="functional" name={form.functionalloc} />
          ) : null}
          {errorSummary && mode !== 'delete' ? (
            <p className="text-body-sm text-form-error">{errorSummary}</p>
          ) : null}
          {mut.isError ? (
            <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p>
          ) : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.functionalloc.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(next) => {
          if (!next) closeImport()
          else setImportOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="functional" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.functional.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="functional-import-file">{t('import.selectFile')}</Label>
              <Input
                id="functional-import-file"
                type="file"
                accept=".csv,.xls,.xlsx,.xlsm,.xlsb"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="text-xs text-app-muted">{t('entities.functional.pasteColumns')}</div>
          </div>
          <Textarea
            rows={8}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={'7151-PL01,Product line 01,'}
          />
          {importMut.isSuccess ? (
            <MasterDataImportResult
              inserted={importMut.data.inserted}
              updated={importMut.data.updated}
              failed={importMut.data.failed}
              skipped={importMut.data.skipped}
            />
          ) : null}
          {importMut.isError ? (
            <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p>
          ) : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReasonPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'reason'],
    queryFn: () => fetchMasterData('reason'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ReasonFormMode>('create')
  const [editing, setEditing] = useState<ReasonItem | null>(null)
  const [form, setForm] = useState<ReasonFormState>(emptyReasonForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ReasonFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'reason'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyReasonForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof ReasonFormState, string>> = {}
    const reasoncode = form.reasoncode.trim()
    const reasonname = form.reasonname.trim()

    if (!reasoncode) next.reasoncode = mdRequired(t, 'reasoncode')
    else if (reasoncode.length > 64) next.reasoncode = mdMaxLen(t, 'reasoncode', 64)

    if (!reasonname) next.reasonname = mdRequired(t, 'reasonname')
    else if (reasonname.length > 2000) next.reasonname = mdMaxLen(t, 'reasonname', 2000)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateReason(editing.reasoncode, { reasonname: form.reasonname.trim() })
      }
      if (mode === 'delete' && editing) {
        await deleteReason(editing.reasoncode)
        return null
      }
      return createReason({ reasoncode: form.reasoncode.trim(), reasonname: form.reasonname.trim() })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyReasonForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: ReasonItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ reasoncode: row.reasoncode, reasonname: row.reasonname })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: ReasonItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ reasoncode: row.reasoncode, reasonname: row.reasonname })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is ReasonItem => 'reasoncode' in r && typeof (r as { reasoncode: unknown }).reasoncode === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'reasoncode')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.reasoncode}>
                <TableCell className="font-mono text-body-sm">{row.reasoncode}</TableCell>
                <TableCell>{row.reasonname}</TableCell>
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
                      onClick={() => openDelete(row)}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="reason" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reasoncode">{mdField(t, 'reasoncode')}</Label>
              <Input
                id="reasoncode"
                value={form.reasoncode}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, reasoncode: e.target.value }))}
              />
              {errors.reasoncode ? <p className="mt-1 text-xs text-form-error">{errors.reasoncode}</p> : null}
            </div>
            <div>
              <Label htmlFor="reasonname">{mdField(t, 'reasonname')}</Label>
              <Input
                id="reasonname"
                value={form.reasonname}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, reasonname: e.target.value }))}
              />
              {errors.reasonname ? <p className="mt-1 text-xs text-form-error">{errors.reasonname}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="reason" name={form.reasoncode} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.reasoncode.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WorkTypePanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'worktype'],
    queryFn: () => fetchMasterData('worktype'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<WorkTypeFormMode>('create')
  const [editing, setEditing] = useState<WorkTypeItem | null>(null)
  const [form, setForm] = useState<WorkTypeFormState>(emptyWorkTypeForm)
  const [errors, setErrors] = useState<Partial<Record<keyof WorkTypeFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'worktype'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyWorkTypeForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof WorkTypeFormState, string>> = {}
    const idwkctrtype = form.idwkctrtype.trim()
    const wkctrtype = form.wkctrtype.trim()

    if (!idwkctrtype) next.idwkctrtype = mdRequired(t, 'code')
    else if (idwkctrtype.length > 64) next.idwkctrtype = mdMaxLen(t, 'code', 64)

    if (!wkctrtype) next.wkctrtype = mdRequired(t, 'wkctrtype')
    else if (wkctrtype.length > 2000) next.wkctrtype = mdMaxLen(t, 'wkctrtype', 2000)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateWorkType(editing.idwkctrtype, { wkctrtype: form.wkctrtype.trim() })
      }
      if (mode === 'delete' && editing) {
        await deleteWorkType(editing.idwkctrtype)
        return null
      }
      return createWorkType({ idwkctrtype: form.idwkctrtype.trim(), wkctrtype: form.wkctrtype.trim() })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyWorkTypeForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: WorkTypeItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ idwkctrtype: row.idwkctrtype, wkctrtype: row.wkctrtype })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: WorkTypeItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ idwkctrtype: row.idwkctrtype, wkctrtype: row.wkctrtype })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is WorkTypeItem => 'idwkctrtype' in r && typeof (r as { idwkctrtype: unknown }).idwkctrtype === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'typeStatusCode')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idwkctrtype}>
                <TableCell className="font-mono text-body-sm">{row.idwkctrtype}</TableCell>
                <TableCell>{row.wkctrtype}</TableCell>
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
                      onClick={() => openDelete(row)}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="worktype" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="idwkctrtype">{mdField(t, 'code')}</Label>
              <Input
                id="idwkctrtype"
                value={form.idwkctrtype}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, idwkctrtype: e.target.value }))}
              />
              {errors.idwkctrtype ? <p className="mt-1 text-xs text-form-error">{errors.idwkctrtype}</p> : null}
            </div>
            <div>
              <Label htmlFor="wkctrtype">{mdField(t, 'wkctrtype')}</Label>
              <Input
                id="wkctrtype"
                value={form.wkctrtype}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, wkctrtype: e.target.value }))}
              />
              {errors.wkctrtype ? <p className="mt-1 text-xs text-form-error">{errors.wkctrtype}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="worktype" name={form.idwkctrtype} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.idwkctrtype.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ZbPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'zb'],
    queryFn: () => fetchMasterData('zb'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ZbFormMode>('create')
  const [editing, setEditing] = useState<ZbItem | null>(null)
  const [form, setForm] = useState<ZbFormState>(emptyZbForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ZbFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'zb'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyZbForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof ZbFormState, string>> = {}
    const wkzb = form.wkzb.trim()
    const zbdescrip = form.zbdescrip.trim()

    if (!wkzb) next.wkzb = mdRequired(t, 'wkzb')
    else if (wkzb.length > 32) next.wkzb = mdMaxLen(t, 'wkzb', 32)

    if (!zbdescrip) next.zbdescrip = mdRequired(t, 'zbdescrip')
    else if (zbdescrip.length > 2000) next.zbdescrip = mdMaxLen(t, 'zbdescrip', 2000)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateZb(editing.wkzb, { zbdescrip: form.zbdescrip.trim() })
      }
      if (mode === 'delete' && editing) {
        await deleteZb(editing.wkzb)
        return null
      }
      return createZb({ wkzb: form.wkzb.trim(), zbdescrip: form.zbdescrip.trim() })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyZbForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: ZbItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ wkzb: row.wkzb, zbdescrip: row.zbdescrip })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: ZbItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ wkzb: row.wkzb, zbdescrip: row.zbdescrip })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows =
    q.data?.filter(
      (r): r is ZbItem => 'wkzb' in r && typeof (r as { wkzb: unknown }).wkzb === 'string',
    ) ?? []

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'wkzb')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.wkzb}>
                <TableCell className="font-mono text-body-sm">{row.wkzb}</TableCell>
                <TableCell>{row.zbdescrip}</TableCell>
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
                      onClick={() => openDelete(row)}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="zb" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="wkzb">{mdField(t, 'wkzb')}</Label>
              <Input
                id="wkzb"
                value={form.wkzb}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, wkzb: e.target.value }))}
              />
              {errors.wkzb ? <p className="mt-1 text-xs text-form-error">{errors.wkzb}</p> : null}
            </div>
            <div>
              <Label htmlFor="zbdescrip">{mdField(t, 'zbdescrip')}</Label>
              <Input
                id="zbdescrip"
                value={form.zbdescrip}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, zbdescrip: e.target.value }))}
              />
              {errors.zbdescrip ? <p className="mt-1 text-xs text-form-error">{errors.zbdescrip}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="zb" name={form.wkzb} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.wkzb.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LevelPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'level'],
    queryFn: () => fetchMasterData('level'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<LevelFormMode>('create')
  const [editing, setEditing] = useState<LevelItem | null>(null)
  const [form, setForm] = useState<LevelFormState>(emptyLevelForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LevelFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'level'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyLevelForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof LevelFormState, string>> = {}
    const idwklevel = form.idwklevel.trim()
    const wklevel = form.wklevel.trim()

    if (!idwklevel) next.idwklevel = mdRequired(t, 'idwklevel')
    else if (idwklevel.length > 64) next.idwklevel = mdMaxLen(t, 'idwklevel', 64)

    if (!wklevel) next.wklevel = mdRequired(t, 'wklevel')
    else if (wklevel.length > 2000) next.wklevel = mdMaxLen(t, 'wklevel', 2000)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateLevel(editing.idwklevel, { wklevel: form.wklevel.trim() })
      }
      if (mode === 'delete' && editing) {
        await deleteLevel(editing.idwklevel)
        return null
      }
      return createLevel({ idwklevel: form.idwklevel.trim(), wklevel: form.wklevel.trim() })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyLevelForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: LevelItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ idwklevel: row.idwklevel, wklevel: row.wklevel })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: LevelItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ idwklevel: row.idwklevel, wklevel: row.wklevel })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is LevelItem => 'idwklevel' in r && typeof (r as { idwklevel: unknown }).idwklevel === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'idwklevel')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idwklevel}>
                <TableCell className="font-mono text-body-sm">{row.idwklevel}</TableCell>
                <TableCell>{row.wklevel}</TableCell>
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
                      onClick={() => openDelete(row)}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="level" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="idwklevel">{mdField(t, 'idwklevel')}</Label>
              <Input
                id="idwklevel"
                value={form.idwklevel}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, idwklevel: e.target.value }))}
              />
              {errors.idwklevel ? <p className="mt-1 text-xs text-form-error">{errors.idwklevel}</p> : null}
            </div>
            <div>
              <Label htmlFor="wklevel">{mdField(t, 'wklevel')}</Label>
              <Input
                id="wklevel"
                value={form.wklevel}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, wklevel: e.target.value }))}
              />
              {errors.wklevel ? <p className="mt-1 text-xs text-form-error">{errors.wklevel}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="level" name={form.idwklevel} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.idwklevel.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PositionPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'position'],
    queryFn: () => fetchMasterData('position'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PositionFormMode>('create')
  const [editing, setEditing] = useState<PositionItem | null>(null)
  const [form, setForm] = useState<PositionFormState>(emptyPositionForm)
  const [errors, setErrors] = useState<Partial<Record<keyof PositionFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'position'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyPositionForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof PositionFormState, string>> = {}
    const idposition = form.idposition.trim()
    const position = form.position.trim()

    if (!idposition) next.idposition = mdRequired(t, 'idposition')
    else if (idposition.length > 64) next.idposition = mdMaxLen(t, 'idposition', 64)

    if (!position) next.position = mdRequired(t, 'position')
    else if (position.length > 2000) next.position = mdMaxLen(t, 'position', 2000)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updatePosition(editing.idposition, { position: form.position.trim() })
      }
      if (mode === 'delete' && editing) {
        await deletePosition(editing.idposition)
        return null
      }
      return createPosition({ idposition: form.idposition.trim(), position: form.position.trim() })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyPositionForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: PositionItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ idposition: row.idposition, position: row.position })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: PositionItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ idposition: row.idposition, position: row.position })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is PositionItem => 'idposition' in r && typeof (r as { idposition: unknown }).idposition === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'idposition')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idposition}>
                <TableCell className="font-mono text-body-sm">{row.idposition}</TableCell>
                <TableCell>{row.position}</TableCell>
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
                      onClick={() => openDelete(row)}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="position" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="idposition">{mdField(t, 'idposition')}</Label>
              <Input
                id="idposition"
                value={form.idposition}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, idposition: e.target.value }))}
              />
              {errors.idposition ? <p className="mt-1 text-xs text-form-error">{errors.idposition}</p> : null}
            </div>
            <div>
              <Label htmlFor="position">{mdField(t, 'position')}</Label>
              <Input
                id="position"
                value={form.position}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              />
              {errors.position ? <p className="mt-1 text-xs text-form-error">{errors.position}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="position" name={form.idposition} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.idposition.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'group'],
    queryFn: () => fetchMasterData('group'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<GroupFormMode>('create')
  const [editing, setEditing] = useState<GroupItem | null>(null)
  const [form, setForm] = useState<GroupFormState>(emptyGroupForm)
  const [errors, setErrors] = useState<Partial<Record<keyof GroupFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'group'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyGroupForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof GroupFormState, string>> = {}
    const wkctrgroup = form.wkctrgroup.trim()
    const wkctrdescription = form.wkctrdescription.trim()
    if (!wkctrgroup) next.wkctrgroup = mdRequired(t, 'wkctrgroup')
    else if (wkctrgroup.length > 64) next.wkctrgroup = mdMaxLen(t, 'wkctrgroup', 64)
    if (wkctrdescription.length > 2000) next.wkctrdescription = mdMaxLen(t, 'wkctrdescription', 2000)
    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateGroup(editing.idwkctrgroup, {
          wkctrgroup: form.wkctrgroup.trim(),
          wkctrdescription: form.wkctrdescription.trim(),
        })
      }
      if (mode === 'delete' && editing) {
        await deleteGroup(editing.idwkctrgroup)
        return null
      }
      return createGroup({
        wkctrgroup: form.wkctrgroup.trim(),
        wkctrdescription: form.wkctrdescription.trim(),
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyGroupForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: GroupItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ wkctrgroup: row.wkctrgroup, wkctrdescription: row.wkctrdescription })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: GroupItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ wkctrgroup: row.wkctrgroup, wkctrdescription: row.wkctrdescription })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is GroupItem => 'idwkctrgroup' in r && typeof (r as { idwkctrgroup: unknown }).idwkctrgroup === 'number',
  ) ?? []

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-app-muted">
        {t('groupWkctr.note')}{' '}
        <strong className="font-medium text-app">{t('groupWkctr.notPmTeam')}</strong>{' '}
        {t('groupWkctr.noteSuffix')}
      </p>
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'wkctrgroup')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idwkctrgroup}>
                <TableCell className="font-mono text-body-sm">{row.wkctrgroup}</TableCell>
                <TableCell>{row.wkctrdescription}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}>
                      <Trash2 className="size-4 text-form-error" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="group" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="wkctrgroup">{mdField(t, 'wkctrgroup')}</Label>
              <Input id="wkctrgroup" value={form.wkctrgroup} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, wkctrgroup: e.target.value }))} />
              {errors.wkctrgroup ? <p className="mt-1 text-xs text-form-error">{errors.wkctrgroup}</p> : null}
            </div>
            <div>
              <Label htmlFor="wkctrdescription">{mdField(t, 'wkctrdescription')}</Label>
              <Input id="wkctrdescription" value={form.wkctrdescription} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, wkctrdescription: e.target.value }))} />
              {errors.wkctrdescription ? <p className="mt-1 text-xs text-form-error">{errors.wkctrdescription}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="group" name={form.wkctrgroup} /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.wkctrgroup.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TasklistPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const scrollToIdRef = useRef<number | null>(null)

  const q = useQuery({
    queryKey: ['master-data', 'tasklist'],
    queryFn: () => fetchMasterData('tasklist'),
    placeholderData: keepPreviousData,
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<TasklistFormMode>('create')
  const [editing, setEditing] = useState<TasklistItem | null>(null)
  const [form, setForm] = useState<TasklistFormState>(emptyTasklistForm)
  const [errors, setErrors] = useState<Partial<Record<keyof TasklistFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyTasklistForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const numOrUndef = (v: string) => {
    const s = v.trim()
    if (!s) return undefined
    const n = Number(s)
    return Number.isFinite(n) ? n : undefined
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof TasklistFormState, string>> = {}
    if (!form.idwkctrtype.trim()) next.idwkctrtype = mdRequired(t, 'idwkctrtype')
    else if (form.idwkctrtype.trim().length > 64) next.idwkctrtype = mdMaxLen(t, 'idwkctrtype', 64)
    if (!form.idzone.trim()) next.idzone = mdRequired(t, 'idzone')
    else if (form.idzone.trim().length > 64) next.idzone = mdMaxLen(t, 'idzone', 64)
    if (form.idmachine.trim() && form.idmachine.trim().length > 64) next.idmachine = mdMaxLen(t, 'idmachine', 64)
    if (!form.mntplan.trim()) next.mntplan = mdRequired(t, 'mntplan')
    if (!form.tasklist.trim()) next.tasklist = mdRequired(t, 'tasklist')
    if (!form.legacy.trim()) next.legacy = mdRequired(t, 'legacy')
    if (!form.machine.trim()) next.machine = mdRequired(t, 'machine')
    if (!form.pmlist.trim()) next.pmlist = mdRequired(t, 'pmlist')

    const nums: Array<keyof TasklistFormState> = [
      'pmday',
      'machinestatus',
      'pmmin',
      'pmman',
      'manhour',
      'runhr',
      'bcprunhr',
      'freqhour',
    ]
    for (const k of nums) {
      const v = form[k].trim()
      if (v && !Number.isFinite(Number(v))) next[k] = mdNumber(t, k)
    }

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      const payload = {
        idwkctrtype: form.idwkctrtype.trim(),
        idzone: form.idzone.trim(),
        idmachine: form.idmachine.trim() || undefined,
        mntplan: form.mntplan.trim(),
        tasklist: form.tasklist.trim(),
        legacy: form.legacy.trim(),
        machine: form.machine.trim(),
        pmlist: form.pmlist.trim(),
        pmday: numOrUndef(form.pmday),
        machinestatus: numOrUndef(form.machinestatus),
        pmmin: numOrUndef(form.pmmin),
        pmman: numOrUndef(form.pmman),
        manhour: numOrUndef(form.manhour),
        mat: form.mat.trim() || undefined,
        runhr: numOrUndef(form.runhr),
        mpoint: form.mpoint.trim() || undefined,
        bcprunhr: numOrUndef(form.bcprunhr),
        gls: form.gls.trim() || undefined,
        ment: form.ment.trim() || undefined,
        freqhour: numOrUndef(form.freqhour),
        plan: form.plan.trim() || undefined,
      }
      if (mode === 'edit' && editing) {
        return updateTasklist(editing.idtasklist, payload)
      }
      if (mode === 'delete' && editing) {
        await deleteTasklist(editing.idtasklist)
        return null
      }
      return createTasklist(payload)
    },
    onSuccess: async (saved) => {
      await qc.refetchQueries({ queryKey: ['master-data', 'tasklist'] })
      if (mode === 'edit' && saved && typeof saved === 'object' && 'idtasklist' in saved) {
        const row = saved as TasklistItem
        scrollToIdRef.current = row.idtasklist
        openEdit(row)
        toast.success(t('toast.tasklistSaved'))
        return
      }
      if (mode === 'delete') {
        close()
        toast.success(t('toast.tasklistDeleted'))
        return
      }
      close()
      toast.success(t('toast.tasklistAdded'))
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }
      const rows = importFile ? await parseTasklistFile(importFile) : parseTasklistCsv(importText)
      if (rows.length === 0) {
        throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.tasklist') }))
      }
      return importTasklists(rows)
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ['master-data', 'tasklist'] })
      closeImport()
      toast.success(t('toast.tasklistImported'))
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyTasklistForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: TasklistItem) => {
    setMode('edit')
    setEditing(row)
    setForm({
      idwkctrtype: row.idwkctrtype,
      idzone: row.idzone,
      idmachine: row.idmachine,
      mntplan: row.mntplan,
      tasklist: row.tasklist,
      legacy: row.legacy,
      machine: row.machine,
      pmlist: row.pmlist,
      pmday: String(row.pmday ?? ''),
      machinestatus: String(row.machinestatus ?? ''),
      pmmin: String(row.pmmin ?? ''),
      pmman: String(row.pmman ?? ''),
      manhour: String(row.manhour ?? ''),
      mat: row.mat ?? '',
      runhr: String(row.runhr ?? ''),
      mpoint: row.mpoint ?? '',
      bcprunhr: String(row.bcprunhr ?? ''),
      gls: row.gls ?? '',
      ment: row.ment ?? '',
      freqhour: String(row.freqhour ?? ''),
      plan: row.plan ?? '',
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: TasklistItem) => {
    setMode('delete')
    setEditing(row)
    setForm({
      idwkctrtype: row.idwkctrtype,
      idzone: row.idzone,
      idmachine: row.idmachine,
      mntplan: row.mntplan,
      tasklist: row.tasklist,
      legacy: row.legacy,
      machine: row.machine,
      pmlist: row.pmlist,
      pmday: String(row.pmday ?? ''),
      machinestatus: String(row.machinestatus ?? ''),
      pmmin: String(row.pmmin ?? ''),
      pmman: String(row.pmman ?? ''),
      manhour: String(row.manhour ?? ''),
      mat: row.mat ?? '',
      runhr: String(row.runhr ?? ''),
      mpoint: row.mpoint ?? '',
      bcprunhr: String(row.bcprunhr ?? ''),
      gls: row.gls ?? '',
      ment: row.ment ?? '',
      freqhour: String(row.freqhour ?? ''),
      plan: row.plan ?? '',
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is TasklistItem => 'idtasklist' in r && typeof (r as { idtasklist: unknown }).idtasklist === 'number',
  ) ?? []

  useEffect(() => {
    const id = scrollToIdRef.current
    if (id == null || !tableWrapRef.current) return
    const el = tableWrapRef.current.querySelector(`[data-tasklist-id="${id}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    scrollToIdRef.current = null
  }, [q.dataUpdatedAt, rows.length])

  const formFields = useMemo(
    (): Array<[keyof TasklistFormState, string, boolean]> => [
      ['idwkctrtype', mdField(t, 'idwkctrtype'), true],
      ['idzone', mdField(t, 'idzone'), true],
      ['idmachine', mdField(t, 'idmachine'), false],
      ['mntplan', mdField(t, 'mntplan'), true],
      ['tasklist', mdField(t, 'tasklist'), true],
      ['legacy', mdField(t, 'legacy'), true],
      ['machine', mdField(t, 'machine'), true],
      ['pmlist', mdField(t, 'pmlist'), true],
      ['pmday', mdField(t, 'pmday'), false],
      ['machinestatus', mdField(t, 'machinestatus'), false],
      ['pmmin', mdField(t, 'pmmin'), false],
      ['pmman', mdField(t, 'pmman'), false],
      ['manhour', mdField(t, 'manhour'), false],
      ['mat', mdField(t, 'mat'), false],
      ['runhr', mdField(t, 'runhr'), false],
      ['mpoint', mdField(t, 'mpoint'), false],
      ['bcprunhr', mdField(t, 'bcprunhr'), false],
      ['gls', mdField(t, 'gls'), false],
      ['ment', mdField(t, 'ment'), false],
      ['freqhour', mdField(t, 'freqhour'), false],
      ['plan', mdField(t, 'plan'), false],
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('actions.importFile')}
        </Button>
      </div>

      <div ref={tableWrapRef} className="app-table-shell max-h-[min(70vh,720px)] overflow-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'tasklist')}</TableHead>
              <TableHead>{mdField(t, 'mntplan')}</TableHead>
              <TableHead>{mdField(t, 'pmlist')}</TableHead>
              <TableHead>{mdField(t, 'columnType')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.idtasklist}
                data-tasklist-id={row.idtasklist}
                className={
                  open && editing?.idtasklist === row.idtasklist
                    ? 'app-tone-warning-highlight-row'
                    : undefined
                }
              >
                <TableCell className="font-mono text-body-sm">{row.tasklist}</TableCell>
                <TableCell>{row.mntplan}</TableCell>
                <TableCell>{row.pmlist}</TableCell>
                <TableCell>{row.wkctrtype || row.idwkctrtype}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}>
                      <Trash2 className="size-4 text-form-error" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="tasklist" mode={mode} />
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {formFields.map(([k, label, lockOnEdit]) => (
              <div key={k}>
                <Label htmlFor={String(k)}>{label}</Label>
                <Input
                  id={String(k)}
                  value={form[k]}
                  disabled={mode === 'delete' || (mode !== 'create' && lockOnEdit)}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                />
                {errors[k] ? <p className="mt-1 text-xs text-form-error">{errors[k]}</p> : null}
              </div>
            ))}
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="tasklist" name={form.tasklist} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.tasklist.trim()}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(next) => (next ? setImportOpen(true) : closeImport())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="tasklist" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.tasklist.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="tasklist-import-file">{t('import.selectFile')}</Label>
              <Input id="tasklist-import-file" type="file" accept=".csv,.xls,.xlsx,.xlsm,.xlsb" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="text-xs text-app-muted">{t('entities.tasklist.pasteColumns')}</div>
          </div>
 <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'TYPE 01,ZONE 01,MACHINE-01,PLAN-01,TASK-01,LEGACY-01,M/C,PM-01,7,0,10,2,1,ACT,80,MP,0,GLS,MENT,0,PLAN'} />
          {importMut.isSuccess ? <MasterDataImportResult inserted={importMut.data.inserted} updated={importMut.data.updated} failed={importMut.data.failed} /> : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WorkStatusPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'workstatus'],
    queryFn: () => fetchMasterData('workstatus'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<WorkStatusFormMode>('create')
  const [editing, setEditing] = useState<WorkStatusItem | null>(null)
  const [form, setForm] = useState<WorkStatusFormState>(emptyWorkStatusForm)
  const [errors, setErrors] = useState<Partial<Record<keyof WorkStatusFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'workstatus'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyWorkStatusForm)
    setErrors({})
    setErrorSummary(null)
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }

    const next: Partial<Record<keyof WorkStatusFormState, string>> = {}
    const syst = form.syst.trim()
    const wkstreason = form.wkstreason.trim()
    const wkstcolor = form.wkstcolor.trim()

    if (!syst) next.syst = mdRequired(t, 'syst')
    else if (syst.length > 32) next.syst = mdMaxLen(t, 'syst', 32)

    if (!wkstreason) next.wkstreason = mdRequired(t, 'wkstreason')
    else if (wkstreason.length > 2000) next.wkstreason = mdMaxLen(t, 'wkstreason', 2000)

    if (!wkstcolor) next.wkstcolor = mdRequired(t, 'wkstcolor')
    else if (wkstcolor.length > 32) next.wkstcolor = mdMaxLen(t, 'wkstcolor', 32)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateWorkStatus(editing.syst, {
          wkstreason: form.wkstreason.trim(),
          wkstcolor: form.wkstcolor.trim(),
        })
      }
      if (mode === 'delete' && editing) {
        await deleteWorkStatus(editing.syst)
        return null
      }
      return createWorkStatus({
        syst: form.syst.trim(),
        wkstreason: form.wkstreason.trim(),
        wkstcolor: form.wkstcolor.trim(),
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyWorkStatusForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openEdit = (row: WorkStatusItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ syst: row.syst, wkstreason: row.wkstreason, wkstcolor: row.wkstcolor })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  const openDelete = (row: WorkStatusItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ syst: row.syst, wkstreason: row.wkstreason, wkstcolor: row.wkstcolor })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is WorkStatusItem => 'syst' in r && typeof (r as { syst: unknown }).syst === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="mr-1 size-4" />
        {t('actions.add')}
      </Button>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'syst')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead>{mdField(t, 'wkstcolor')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.syst}>
                <TableCell className="font-mono text-body-sm">{row.syst}</TableCell>
                <TableCell>{row.wkstreason}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-10 rounded border border-app" style={{ backgroundColor: row.wkstcolor }} />
                    <span className="font-mono text-xs text-app-muted">{row.wkstcolor}</span>
                  </div>
                </TableCell>
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
                      onClick={() => openDelete(row)}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="workstatus" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="syst">{mdField(t, 'syst')}</Label>
              <Input
                id="syst"
                value={form.syst}
                disabled={mode !== 'create'}
                onChange={(e) => setForm((f) => ({ ...f, syst: e.target.value }))}
              />
              {errors.syst ? <p className="mt-1 text-xs text-form-error">{errors.syst}</p> : null}
            </div>
            <div>
              <Label htmlFor="wkstreason">{mdField(t, 'wkstreason')}</Label>
              <Input
                id="wkstreason"
                value={form.wkstreason}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, wkstreason: e.target.value }))}
              />
              {errors.wkstreason ? <p className="mt-1 text-xs text-form-error">{errors.wkstreason}</p> : null}
            </div>
            <div>
              <Label htmlFor="wkstcolor">{mdField(t, 'wkstcolor')}</Label>
              <Input
                id="wkstcolor"
                value={form.wkstcolor}
                disabled={mode === 'delete'}
                onChange={(e) => setForm((f) => ({ ...f, wkstcolor: e.target.value }))}
              />
              {errors.wkstcolor ? <p className="mt-1 text-xs text-form-error">{errors.wkstcolor}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? (
            <MasterDataConfirmDelete entity="workstatus" name={form.syst} />
          ) : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.syst.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LineProductPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'lineproduct'],
    queryFn: () => fetchMasterData('lineproduct'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<LineProductFormMode>('create')
  const [editing, setEditing] = useState<LineProductItem | null>(null)
  const [form, setForm] = useState<LineProductFormState>(emptyLineProductForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LineProductFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'lineproduct'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyLineProductForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof LineProductFormState, string>> = {}
    const productline = form.productline.trim()
    const prolinedescrip = form.prolinedescrip.trim()
    if (!productline) next.productline = mdRequired(t, 'productline')
    else if (productline.length > 64) next.productline = mdMaxLen(t, 'productline', 64)
    if (!prolinedescrip) next.prolinedescrip = mdRequired(t, 'prolinedescrip')
    else if (prolinedescrip.length > 2000) next.prolinedescrip = mdMaxLen(t, 'prolinedescrip', 2000)
    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateLineProduct(editing.productline, { prolinedescrip: form.prolinedescrip.trim() })
      }
      if (mode === 'delete' && editing) {
        await deleteLineProduct(editing.productline)
        return null
      }
      return createLineProduct({ productline: form.productline.trim(), prolinedescrip: form.prolinedescrip.trim() })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }
      const rows = importFile ? await parseLineProductFile(importFile) : parseLineProductCsv(importText)
      if (rows.length === 0) throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.lineproduct') }))
      return importLineProducts(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyLineProductForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: LineProductItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ productline: row.productline, prolinedescrip: row.prolinedescrip })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: LineProductItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ productline: row.productline, prolinedescrip: row.prolinedescrip })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows = q.data?.filter(
    (r): r is LineProductItem =>
      'productline' in r && typeof (r as { productline: unknown }).productline === 'string',
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('actions.importFile')}
        </Button>
      </div>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'productline')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.productline}>
                <TableCell className="font-mono text-body-sm">{row.productline}</TableCell>
                <TableCell>{row.prolinedescrip}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}>
                      <Trash2 className="size-4 text-form-error" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="lineproduct" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="productline">{mdField(t, 'productline')}</Label>
              <Input id="productline" value={form.productline} disabled={mode !== 'create'} onChange={(e) => setForm((f) => ({ ...f, productline: e.target.value }))} />
              {errors.productline ? <p className="mt-1 text-xs text-form-error">{errors.productline}</p> : null}
            </div>
            <div>
              <Label htmlFor="prolinedescrip">{mdField(t, 'prolinedescrip')}</Label>
              <Input id="prolinedescrip" value={form.prolinedescrip} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, prolinedescrip: e.target.value }))} />
              {errors.prolinedescrip ? <p className="mt-1 text-xs text-form-error">{errors.prolinedescrip}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="lineproduct" name={form.productline} /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.productline.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(next) => (next ? setImportOpen(true) : closeImport())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="lineproduct" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.lineproduct.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="lineproduct-import-file">{t('import.selectFile')}</Label>
              <Input id="lineproduct-import-file" type="file" accept=".csv,.xls,.xlsx,.xlsm,.xlsb" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="text-xs text-app-muted">{t('entities.lineproduct.pasteColumns')}</div>
          </div>
          <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'PL01,Product line 01'} />
          {importMut.isSuccess ? <MasterDataImportResult inserted={importMut.data.inserted} updated={importMut.data.updated} failed={importMut.data.failed} /> : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LineSchdulPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'lineschdul'],
    queryFn: () => fetchMasterData('lineschdul'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<LineSchdulFormMode>('create')
  const [editing, setEditing] = useState<LineSchdulItem | null>(null)
  const [form, setForm] = useState<LineSchdulFormState>(emptyLineSchdulForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LineSchdulFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'lineschdul'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyLineSchdulForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const parseDayToEpoch = (v: string): number | null => {
    const s = v.trim()
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s)
    if (!m) return null
    const dd = Number(m[1])
    const mm = Number(m[2])
    const yyyy = Number(m[3])
    const dt = new Date(yyyy, mm - 1, dd)
    return Number.isFinite(dt.getTime()) ? Math.floor(dt.getTime() / 1000) : null
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof LineSchdulFormState, string>> = {}
    const idproductline = form.idproductline.trim()
    const linedayText = form.lineday.trim()
    const uptimeText = form.uptime.trim()
    const linereason = form.linereason.trim()

    if (!idproductline) next.idproductline = mdRequired(t, 'idproductline')
    else if (idproductline.length > 64) next.idproductline = mdMaxLen(t, 'idproductline', 64)

    const lineday = parseDayToEpoch(linedayText)
    if (!linedayText) next.lineday = mdRequired(t, 'lineday')
    else if (!lineday) next.lineday = t('validation.invalidDate')

    if (uptimeText && !Number.isFinite(Number(uptimeText))) next.uptime = mdNumber(t, 'uptime')
    if (linereason.length > 2000) next.linereason = mdMaxLen(t, 'linereason', 2000)

    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      const lineday = parseDayToEpoch(form.lineday.trim())
      if (!lineday) throw new Error(t('validation.invalidDate'))
      const uptime = form.uptime.trim() ? Number(form.uptime.trim()) : undefined
      const payload = {
        idproductline: form.idproductline.trim(),
        lineday,
        uptime: uptime != null && Number.isFinite(uptime) ? uptime : undefined,
        linereason: form.linereason.trim(),
      }
      if (mode === 'edit' && editing) {
        return updateLineSchdul(editing.idline, payload)
      }
      if (mode === 'delete' && editing) {
        await deleteLineSchdul(editing.idline)
        return null
      }
      return createLineSchdul(payload)
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }
      const rows = importFile ? await parseLineSchdulFile(importFile) : parseLineSchdulCsv(importText)
      if (rows.length === 0) throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.lineschdul') }))
      return importLineSchduls(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyLineSchdulForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: LineSchdulItem) => {
    setMode('edit')
    setEditing(row)
    setForm({
      idproductline: row.idproductline,
      lineday: formatEpochSecondsToDdMmYyyy(row.lineday),
      uptime: row.uptime ? String(row.uptime) : '',
      linereason: row.linereason ?? '',
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: LineSchdulItem) => {
    setMode('delete')
    setEditing(row)
    setForm({
      idproductline: row.idproductline,
      lineday: formatEpochSecondsToDdMmYyyy(row.lineday),
      uptime: row.uptime ? String(row.uptime) : '',
      linereason: row.linereason ?? '',
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const rows =
    q.data?.filter(
      (r): r is LineSchdulItem => 'idline' in r && typeof (r as { idline: unknown }).idline === 'number',
    ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('actions.importFile')}
        </Button>
      </div>

      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'dateColumn')}</TableHead>
              <TableHead>{mdField(t, 'idproductline')}</TableHead>
              <TableHead>{mdField(t, 'uptime')}</TableHead>
              <TableHead>{mdField(t, 'linereason')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idline}>
                <TableCell className="font-mono text-body-sm">{formatEpochSecondsToDdMmYyyy(row.lineday)}</TableCell>
                <TableCell>{row.productline || row.idproductline}</TableCell>
                <TableCell className="font-mono text-body-sm">{row.uptime || ''}</TableCell>
                <TableCell>{row.linereason}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}>
                      <Trash2 className="size-4 text-form-error" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="lineschdul" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="idproductline">{mdField(t, 'idproductline')}</Label>
              <Input id="idproductline" value={form.idproductline} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, idproductline: e.target.value }))} />
              {errors.idproductline ? <p className="mt-1 text-xs text-form-error">{errors.idproductline}</p> : null}
            </div>
            <div>
              <Label htmlFor="lineday">{mdField(t, 'lineday')}</Label>
              <Input id="lineday" value={form.lineday} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, lineday: e.target.value }))} />
              {errors.lineday ? <p className="mt-1 text-xs text-form-error">{errors.lineday}</p> : null}
            </div>
            <div>
              <Label htmlFor="uptime">{mdField(t, 'uptime')}</Label>
              <Input id="uptime" value={form.uptime} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, uptime: e.target.value }))} />
              {errors.uptime ? <p className="mt-1 text-xs text-form-error">{errors.uptime}</p> : null}
            </div>
            <div>
              <Label htmlFor="linereason">{mdField(t, 'linereason')}</Label>
              <Input id="linereason" value={form.linereason} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, linereason: e.target.value }))} />
              {errors.linereason ? <p className="mt-1 text-xs text-form-error">{errors.linereason}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="lineschdul" /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.idproductline.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(next) => (next ? setImportOpen(true) : closeImport())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="lineschdul" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.lineschdul.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="lineschdul-import-file">{t('import.selectFile')}</Label>
              <Input id="lineschdul-import-file" type="file" accept=".csv,.xls,.xlsx,.xlsm,.xlsb" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="text-xs text-app-muted">{t('entities.lineschdul.pasteColumns')}</div>
          </div>
          <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'PL01,18.05.2026,4,Close'} />
          {importMut.isSuccess ? <MasterDataImportResult inserted={importMut.data.inserted} updated={importMut.data.updated} failed={importMut.data.failed} /> : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ZonePanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'zone'],
    queryFn: () => fetchMasterData('zone'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ZoneFormMode>('create')
  const [editing, setEditing] = useState<ZoneItem | null>(null)
  const [form, setForm] = useState<ZoneFormState>(emptyZoneForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ZoneFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'zone'] })

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyZoneForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof ZoneFormState, string>> = {}
    const idzone = form.idzone.trim()
    const zone = form.zone.trim()
    if (!idzone) next.idzone = mdRequired(t, 'idzone')
    else if (idzone.length > 64) next.idzone = mdMaxLen(t, 'idzone', 64)
    if (!zone) next.zone = mdRequired(t, 'zone')
    else if (zone.length > 2000) next.zone = mdMaxLen(t, 'zone', 2000)
    if (form.zonedescrip.trim().length > 2000) next.zonedescrip = mdMaxLen(t, 'zonedescrip', 2000)
    if (form.idproductline.trim().length > 64) next.idproductline = mdMaxLen(t, 'lineProduct', 64)
    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateZone(editing.idzone, {
          zone: form.zone.trim(),
          zonedescrip: form.zonedescrip.trim(),
          idproductline: form.idproductline.trim() || undefined,
        })
      }
      if (mode === 'delete' && editing) {
        await deleteZone(editing.idzone)
        return null
      }
      return createZone({
        idzone: form.idzone.trim(),
        zone: form.zone.trim(),
        zonedescrip: form.zonedescrip.trim(),
        idproductline: form.idproductline.trim() || undefined,
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }
      const rows = importFile ? await parseZoneFile(importFile) : parseZoneCsv(importText)
      if (rows.length === 0) {
        throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.zone') }))
      }
      return importZones(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyZoneForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: ZoneItem) => {
    setMode('edit')
    setEditing(row)
    setForm({
      idzone: row.idzone,
      zone: row.zone,
      zonedescrip: row.zonedescrip,
      idproductline: row.idproductline,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: ZoneItem) => {
    setMode('delete')
    setEditing(row)
    setForm({
      idzone: row.idzone,
      zone: row.zone,
      zonedescrip: row.zonedescrip,
      idproductline: row.idproductline,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />
  const rows = q.data?.filter((r): r is ZoneItem => 'idzone' in r && typeof (r as { idzone: unknown }).idzone === 'string') ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t('actions.add')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" />
          {t('actions.importFile')}
        </Button>
      </div>
      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'idzone')}</TableHead>
              <TableHead>{mdField(t, 'zoneColumn')}</TableHead>
              <TableHead>{mdField(t, 'description')}</TableHead>
              <TableHead>{mdField(t, 'lineProduct')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idzone}>
                <TableCell className="font-mono text-body-sm">{row.idzone}</TableCell>
                <TableCell>{row.zone}</TableCell>
                <TableCell>{row.zonedescrip}</TableCell>
                <TableCell>{row.productline || row.idproductline}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}>
                      <Trash2 className="size-4 text-form-error" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="zone" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="idzone">{mdField(t, 'idzone')}</Label>
              <Input id="idzone" value={form.idzone} disabled={mode !== 'create'} onChange={(e) => setForm((f) => ({ ...f, idzone: e.target.value }))} />
              {errors.idzone ? <p className="mt-1 text-xs text-form-error">{errors.idzone}</p> : null}
            </div>
            <div>
              <Label htmlFor="zone">{mdField(t, 'zone')}</Label>
              <Input id="zone" value={form.zone} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} />
              {errors.zone ? <p className="mt-1 text-xs text-form-error">{errors.zone}</p> : null}
            </div>
            <div>
              <Label htmlFor="zonedescrip">{mdField(t, 'zonedescrip')}</Label>
              <Input id="zonedescrip" value={form.zonedescrip} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, zonedescrip: e.target.value }))} />
              {errors.zonedescrip ? <p className="mt-1 text-xs text-form-error">{errors.zonedescrip}</p> : null}
            </div>
            <div>
              <Label htmlFor="idproductline">{mdField(t, 'lineProduct')}</Label>
              <Input id="idproductline" value={form.idproductline} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, idproductline: e.target.value }))} />
              {errors.idproductline ? <p className="mt-1 text-xs text-form-error">{errors.idproductline}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="zone" name={form.idzone} /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.idzone.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(next) => (next ? setImportOpen(true) : closeImport())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="zone" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.zone.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="zone-import-file">{t('import.selectFile')}</Label>
              <Input id="zone-import-file" type="file" accept=".csv,.xls,.xlsx,.xlsm,.xlsb" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="text-xs text-app-muted">{t('entities.zone.pasteColumns')}</div>
          </div>
          <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'ZONE 01,Zone description,PL01'} />
          {importMut.isSuccess ? <MasterDataImportResult inserted={importMut.data.inserted} updated={importMut.data.updated} failed={importMut.data.failed} /> : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MachinePanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'machine'],
    queryFn: () => fetchMasterData('machine'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<MachineFormMode>('create')
  const [editing, setEditing] = useState<MachineItem | null>(null)
  const [form, setForm] = useState<MachineFormState>(emptyMachineForm)
  const [errors, setErrors] = useState<Partial<Record<keyof MachineFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'machine'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyMachineForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof MachineFormState, string>> = {}
    const machine = form.machine.trim()
    if (!machine) next.machine = mdRequired(t, 'machineName')
    else if (machine.length > 64) next.machine = mdMaxLen(t, 'machineName', 64)
    if (form.idzone.trim().length > 64) next.idzone = mdMaxLen(t, 'idzone', 64)
    if (form.idwkctrtype.trim().length > 64) next.idwkctrtype = mdMaxLen(t, 'idwkctrtype', 64)
    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      if (mode === 'edit' && editing) {
        return updateMachine(editing.machine, {
          idzone: form.idzone.trim() || undefined,
          idwkctrtype: form.idwkctrtype.trim() || undefined,
        })
      }
      if (mode === 'delete' && editing) {
        await deleteMachine(editing.machine)
        return null
      }
      return createMachine({
        machine: form.machine.trim(),
        idzone: form.idzone.trim() || undefined,
        idwkctrtype: form.idwkctrtype.trim() || undefined,
      })
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }
      const rows = importFile ? await parseMachineFile(importFile) : parseMachineCsv(importText)
      if (rows.length === 0) throw new Error(t('importErrors.noRows', { columns: t('importErrors.columns.machine') }))
      return importMachines(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyMachineForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: MachineItem) => {
    setMode('edit')
    setEditing(row)
    setForm({ machine: row.machine, idzone: row.idzone, idwkctrtype: row.idwkctrtype })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: MachineItem) => {
    setMode('delete')
    setEditing(row)
    setForm({ machine: row.machine, idzone: row.idzone, idwkctrtype: row.idwkctrtype })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />
  const rows = q.data?.filter((r): r is MachineItem => 'machine' in r && typeof (r as { machine: unknown }).machine === 'string') ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}><Plus className="mr-1 size-4" />{t('actions.add')}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="mr-1 size-4" />
          {t('actions.importFile')}</Button>
      </div>
      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'machineColumn')}</TableHead>
              <TableHead>{mdField(t, 'zoneColumn')}</TableHead>
              <TableHead>{mdField(t, 'columnType')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.machine}>
                <TableCell className="font-mono text-body-sm">{row.machine}</TableCell>
                <TableCell>{row.zone || row.idzone}</TableCell>
                <TableCell>{row.wkctrtype || row.idwkctrtype}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}><Pencil className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}><Trash2 className="size-4 text-form-error" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="machine" mode={mode} />
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="machine">{mdField(t, 'machineName')}</Label>
              <Input id="machine" value={form.machine} disabled={mode !== 'create'} onChange={(e) => setForm((f) => ({ ...f, machine: e.target.value }))} />
              {errors.machine ? <p className="mt-1 text-xs text-form-error">{errors.machine}</p> : null}
            </div>
            <div>
              <Label htmlFor="idzone">{mdField(t, 'idzone')}</Label>
              <Input id="idzone" value={form.idzone} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, idzone: e.target.value }))} />
              {errors.idzone ? <p className="mt-1 text-xs text-form-error">{errors.idzone}</p> : null}
            </div>
            <div>
              <Label htmlFor="idwkctrtype">{mdField(t, 'idwkctrtype')}</Label>
              <Input id="idwkctrtype" value={form.idwkctrtype} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, idwkctrtype: e.target.value }))} />
              {errors.idwkctrtype ? <p className="mt-1 text-xs text-form-error">{errors.idwkctrtype}</p> : null}
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="machine" name={form.machine} /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={!form.machine.trim() || mut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(next) => (next ? setImportOpen(true) : closeImport())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="machine" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.machine.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="machine-import-file">{t('import.selectFile')}</Label>
              <Input id="machine-import-file" type="file" accept=".csv,.xls,.xlsx,.xlsm,.xlsb" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="text-xs text-app-muted">{t('entities.machine.pasteColumns')}</div>
          </div>
          <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'MACHINE-01,ZONE 01,Type 01'} />
          {importMut.isSuccess ? <MasterDataImportResult inserted={importMut.data.inserted} updated={importMut.data.updated} failed={importMut.data.failed} /> : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MaterialPanel() {
  const { t } = useTranslation('masterData')
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['master-data', 'material'],
    queryFn: () => fetchMasterData('material'),
  })

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<MaterialFormMode>('create')
  const [editing, setEditing] = useState<MaterialItem | null>(null)
  const [form, setForm] = useState<MaterialFormState>(emptyMaterialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof MaterialFormState, string>>>({})
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data', 'material'] })

  const close = () => {
    setOpen(false)
    setMode('create')
    setEditing(null)
    setForm(emptyMaterialForm)
    setErrors({})
    setErrorSummary(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
  }

  const validate = () => {
    if (mode === 'delete') {
      setErrors({})
      setErrorSummary(null)
      return true
    }
    const next: Partial<Record<keyof MaterialFormState, string>> = {}
    if (!form.wkorder.trim()) next.wkorder = mdRequired(t, 'wkorder')
    const pstngIso = parseDdMmYyyyToIso(form.pstngdate)
    if (!pstngIso) next.pstngdate = t('validation.postingDateRequired')
    if (!form.materialdesc.trim()) next.materialdesc = mdRequired(t, 'materialdesc')
    const amount = Number(form.amountinlc)
    if (!Number.isFinite(amount)) next.amountinlc = mdNumber(t, 'amountinlc')
    if (!form.mvt.trim()) next.mvt = mdRequired(t, 'mvt')
    setErrors(next)
    setErrorSummary(Object.values(next).find(Boolean) ?? null)
    return Object.keys(next).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error(t('validation.fixErrors'))
      const pstngdate = parseDdMmYyyyToIso(form.pstngdate) as string
      const body = {
        wkorder: form.wkorder.trim(),
        pstngdate,
        materialdesc: form.materialdesc.trim(),
        amountinlc: Number(form.amountinlc),
        mvt: form.mvt.trim(),
        material: form.material.trim(),
        matquantity: form.matquantity.trim() ? Number(form.matquantity) : undefined,
        crcy: form.crcy.trim(),
      }
      if (mode === 'edit' && editing) {
        return updateMaterial(editing.idmaterial, body)
      }
      if (mode === 'delete' && editing) {
        await deleteMaterial(editing.idmaterial)
        return null
      }
      return createMaterial(body)
    },
    onSuccess: () => {
      invalidate()
      close()
    },
  })

  const importMut = useMutation({
    mutationFn: async () => {
      if (!importFile && !importText.trim()) {
        throw new Error(t('importErrors.pickFile'))
      }
      const rows = importFile ? await parseMaterialFile(importFile) : parseMaterialCsv(importText)
      if (rows.length === 0) {
        throw new Error(t('importErrors.noRowsRequired', { columns: t('importErrors.columns.material') }))
      }
      return importMaterials(rows)
    },
    onSuccess: () => {
      invalidate()
      closeImport()
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyMaterialForm)
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openEdit = (row: MaterialItem) => {
    setMode('edit')
    setEditing(row)
    setForm({
      wkorder: row.wkorder,
      pstngdate: formatIsoDateToDdMmYyyy(row.pstngdate),
      materialdesc: row.materialdesc,
      amountinlc: String(row.amountinlc),
      mvt: row.mvt,
      material: row.material,
      matquantity: row.matquantity ? String(row.matquantity) : '',
      crcy: row.crcy,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }
  const openDelete = (row: MaterialItem) => {
    setMode('delete')
    setEditing(row)
    setForm({
      wkorder: row.wkorder,
      pstngdate: formatIsoDateToDdMmYyyy(row.pstngdate),
      materialdesc: row.materialdesc,
      amountinlc: String(row.amountinlc),
      mvt: row.mvt,
      material: row.material,
      matquantity: row.matquantity ? String(row.matquantity) : '',
      crcy: row.crcy,
    })
    setErrors({})
    setErrorSummary(null)
    setOpen(true)
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />
  const rows = q.data?.filter(
    (r): r is MaterialItem => 'idmaterial' in r && typeof (r as { idmaterial: unknown }).idmaterial === 'number',
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openCreate}><Plus className="mr-1 size-4" />{t('actions.add')}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="mr-1 size-4" />
          {t('actions.importFile')}</Button>
      </div>
      <div className="app-table-shell overflow-x-auto">
        <Table embedded stickyHeader zebra>
          <TableHeader>
            <TableRow>
              <TableHead>{mdField(t, 'wkorder')}</TableHead>
              <TableHead>{mdField(t, 'postingDateColumn')}</TableHead>
              <TableHead>{mdField(t, 'materialDescColumn')}</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>{mdField(t, 'mvt')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.idmaterial}>
                <TableCell className="font-mono text-body-sm">{row.wkorder}</TableCell>
                <TableCell>{formatIsoDateToDdMmYyyy(row.pstngdate)}</TableCell>
                <TableCell>{row.materialdesc}</TableCell>
                <TableCell className="text-right">{row.amountinlc}</TableCell>
                <TableCell>{row.mvt}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t('aria.edit')}><Pencil className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => openDelete(row)} aria-label={t('aria.delete')}><Trash2 className="size-4 text-form-error" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <MasterDataEntityDialogTitle entity="material" mode={mode} />
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="wkorder">{mdField(t, 'wkorder')}</Label>
              <Input id="wkorder" value={form.wkorder} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, wkorder: e.target.value }))} />
              {errors.wkorder ? <p className="mt-1 text-xs text-form-error">{errors.wkorder}</p> : null}
            </div>
            <div>
              <Label htmlFor="pstngdate">{mdField(t, 'pstngdate')}</Label>
              <Input id="pstngdate" value={form.pstngdate} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, pstngdate: e.target.value }))} />
              {errors.pstngdate ? <p className="mt-1 text-xs text-form-error">{errors.pstngdate}</p> : null}
            </div>
            <div>
              <Label htmlFor="mvt">{mdField(t, 'mvt')}</Label>
              <Input id="mvt" value={form.mvt} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, mvt: e.target.value }))} />
              {errors.mvt ? <p className="mt-1 text-xs text-form-error">{errors.mvt}</p> : null}
            </div>
            <div className="col-span-2">
              <Label htmlFor="materialdesc">{mdField(t, 'materialdesc')}</Label>
              <Input id="materialdesc" value={form.materialdesc} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, materialdesc: e.target.value }))} />
              {errors.materialdesc ? <p className="mt-1 text-xs text-form-error">{errors.materialdesc}</p> : null}
            </div>
            <div>
              <Label htmlFor="amountinlc">{mdField(t, 'amountinlc')}</Label>
              <Input id="amountinlc" value={form.amountinlc} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, amountinlc: e.target.value }))} />
              {errors.amountinlc ? <p className="mt-1 text-xs text-form-error">{errors.amountinlc}</p> : null}
            </div>
            <div>
              <Label htmlFor="crcy">{mdField(t, 'crcy')}</Label>
              <Input id="crcy" value={form.crcy} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, crcy: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="matquantity">{mdField(t, 'matquantity')}</Label>
              <Input id="matquantity" value={form.matquantity} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, matquantity: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="material">{mdField(t, 'material')}</Label>
              <Input id="material" value={form.material} disabled={mode === 'delete'} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} />
            </div>
          </div>
          {mode === 'delete' ? <MasterDataConfirmDelete entity="material" /> : null}
          {errorSummary && mode !== 'delete' ? <p className="text-body-sm text-form-error">{errorSummary}</p> : null}
          {mut.isError ? <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p> : null}
          <MasterDataFormDialogFooter
            mode={mode}
            onCancel={close}
            onSubmit={() => mut.mutate()}
            pending={mut.isPending}
            disabled={mut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(next) => (next ? setImportOpen(true) : closeImport())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MasterDataImportDialogTitle entity="material" />
          </DialogHeader>
          <p className="text-xs text-app-muted">{t('entities.material.importDesc')}</p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="material-import-file">{t('import.selectFile')}</Label>
              <Input id="material-import-file" type="file" accept=".csv,.xls,.xlsx,.xlsm,.xlsb" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="text-xs text-app-muted">{t('entities.material.pasteColumns')}</div>
          </div>
          <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'4000001,,, ,18.05.2026,,Material desc,1,EA,100,THB,2610,,2026,MAT01'} />
          {importMut.isSuccess ? <MasterDataImportResult inserted={importMut.data.inserted} updated={importMut.data.updated} failed={importMut.data.failed} /> : null}
          {importMut.isError ? <p className="text-body-sm text-form-error">{(importMut.error as Error).message}</p> : null}
          <MasterDataImportDialogFooter onClose={closeImport} onImport={() => importMut.mutate()} pending={importMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GenericMasterTable({
  rows,
}: {
  rows: Extract<MasterDataItem, { code: string }>[]
}) {
  const { t } = useTranslation('masterData')

  return (
    <div className="app-table-shell overflow-x-auto">
      <Table embedded stickyHeader zebra>
        <TableHeader>
          <TableRow>
            <TableHead>{t('genericTable.code')}</TableHead>
            <TableHead>{t('genericTable.nameTh')}</TableHead>
            <TableHead>{t('genericTable.plant')}</TableHead>
            <TableHead>{t('genericTable.active')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-body-sm">{row.code}</TableCell>
              <TableCell>{row.nameTh}</TableCell>
              <TableCell>{row.plant}</TableCell>
              <TableCell>{row.active ? t('genericTable.yes') : t('genericTable.no')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const PM_MASTER_ENTITY_TO_DISCIPLINE: Record<string, string> = {
  'pm-master-ee': 'EE',
  'pm-master-me': 'ME',
  'pm-master-pk': 'PK',
}

function MasterTable({ entity }: { entity: string }) {
  const enableGenericQuery =
    entity !== 'activitytype' &&
    entity !== 'department' &&
    entity !== 'equipment' &&
    entity !== 'functional' &&
    entity !== 'reason' &&
    entity !== 'workstatus' &&
    entity !== 'worktype' &&
    entity !== 'zb' &&
    entity !== 'level' &&
    entity !== 'position' &&
    entity !== 'group' &&
    entity !== 'tasklist' &&
    entity !== 'lineproduct' &&
    entity !== 'lineschdul' &&
    entity !== 'zone' &&
    entity !== 'machine' &&
    entity !== 'material'
  const q = useQuery({
    queryKey: ['master-data', entity],
    queryFn: () => fetchMasterData(entity),
    enabled: enableGenericQuery,
    placeholderData: keepPreviousData,
  })

  if (entity === 'activitytype') {
    return <ActivityTypePanel />
  }

  if (entity === 'department') {
    return <DepartmentPanel />
  }

  if (entity === 'equipment') {
    return <EquipmentPanel />
  }

  if (entity === 'functional') {
    return <FunctionalPanel />
  }

  if (entity === 'reason') {
    return <ReasonPanel />
  }

  if (entity === 'workstatus') {
    return <WorkStatusPanel />
  }

  if (entity === 'worktype') {
    return <WorkTypePanel />
  }

  if (entity === 'zb') {
    return <ZbPanel />
  }

  if (entity === 'level') {
    return <LevelPanel />
  }

  if (entity === 'position') {
    return <PositionPanel />
  }

  if (entity === 'group') {
    return <GroupPanel />
  }

  if (entity === 'tasklist') {
    return <TasklistPanel />
  }

  if (entity === 'lineproduct') {
    return <LineProductPanel />
  }

  if (entity === 'lineschdul') {
    return <LineSchdulPanel />
  }

  if (entity === 'zone') {
    return <ZonePanel />
  }

  if (entity === 'machine') {
    return <MachinePanel />
  }

  if (entity === 'material') {
    return <MaterialPanel />
  }

  if (q.isLoading && !q.data) return <MasterDataPanelSkeleton />
  if (q.isError) return <MasterDataPanelError error={q.error} onRetry={() => void q.refetch()} />

  const items = q.data ?? []
  if (items.length === 0) {
    return <MasterDataPanelEmpty />
  }

  const generic = items.filter((r): r is Extract<MasterDataItem, { code: string }> => 'code' in r)
  return <GenericMasterTable rows={generic} />
}

export function MasterDataPage() {
  const { t } = useTranslation('masterData')
  const { canRead, canWrite } = useMasterDataPermissions()
  const tabsLocalized = tabs.map((tab) => ({
    ...tab,
    label: t(`tabs.${tab.id}` as 'tabs.equipment'),
  }))
  const [searchParams, setSearchParams] = useSearchParams()
  const entityFromUrl = searchParams.get('entity')?.trim() ?? ''
  const redirectDiscipline = PM_MASTER_ENTITY_TO_DISCIPLINE[entityFromUrl]
  const [tab, setTab] = useState<string>('activitytype')

  useEffect(() => {
    if (!entityFromUrl) return
    if (!tabsLocalized.some((row) => row.id === entityFromUrl)) return
    setTab((prev) => (prev === entityFromUrl ? prev : entityFromUrl))
  }, [entityFromUrl, tabsLocalized])

  if (redirectDiscipline) {
    return <Navigate to={`/master-plan?discipline=${redirectDiscipline}`} replace />
  }

  const pageHints = hintsFromT(t, 'referencePage.hints')

  if (!canRead) {
    return (
      <AppPageShell
        title={t('referencePage.title')}
        description={t('referencePage.description')}
        hints={pageHints}
      >
        <EmptyState
          icon={AlertCircle}
          title={t('page.noAccess')}
          description={
            <>
              {t('page.noAccessDesc')}{' '}
              <code className="text-xs">master-data.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  const currentTab =
    (tabsLocalized.find((row) => row.id === tab) ?? tabsLocalized[0])?.id ?? 'activitytype'

  return (
    <AppPageShell
      title={t('referencePage.title')}
      description={t('referencePage.description')}
      hints={pageHints}
      headerActions={
        <>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {t('referencePage.tabCount', { count: tabsLocalized.length })}
          </Badge>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/master-plan">{t('referencePage.openMasterPlan')}</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/admin/master">{t('page.masterHub')}</Link>
          </Button>
          <CanPermission permission="iw37n.read">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/iw37n">IW37N</Link>
            </Button>
          </CanPermission>
        </>
      }
      stack={false}
    >
      {!canWrite ? (
        <AppCard pad="compact" className="app-tone-warning-callout mb-4 border text-body-sm">
          {t('page.readOnly')} <code className="text-xs">master-data.write</code>
        </AppCard>
      ) : null}
      <Tabs
        value={currentTab}
        onValueChange={(v) => {
          setTab(v)
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              next.set('entity', v)
              return next
            },
            { replace: true },
          )
        }}
      >
        <TabsList className="mb-4 flex h-auto max-w-full flex-wrap justify-start gap-1 rounded-lg border border-app/60 bg-app-subtle/40 p-1 shadow-sm">
          {tabsLocalized.map((row) => (
            <TabsTrigger
              key={row.id}
              value={row.id}
              className="text-xs data-[state=active]:shadow-sm sm:text-body-sm"
            >
              {row.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabsLocalized.map((row) => (
          <TabsContent key={row.id} value={row.id}>
            <AppCard pad="default">
              <MasterTable entity={row.id} />
            </AppCard>
          </TabsContent>
        ))}
      </Tabs>
    </AppPageShell>
  )
}
