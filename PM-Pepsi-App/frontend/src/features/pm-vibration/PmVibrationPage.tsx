/**
 * PM ค่าวัด — กระแสไฟฟ้า 3 เฟส (R/S/T) และ Vibration (Dst/dB)
 * คู่กับ WO modal แท็บ Task · เอกสารลูกค้า WO 4001565681
 */
import { PmCustomerTrendPanel } from '@/components/pm-vibration/PmCustomerTrendPanel'
import { PmTechnicianGuide } from '@/components/pm-vibration/PmTechnicianGuide'
import { arrayLength } from '@/lib/coerce-array'
import { hintsFromT } from '@/lib/i18n-hints'
import { PmVibrationStatusBanner } from '@/components/pm-vibration/PmVibrationStatusBanner'
import {
  WorkOrderPmSapPrintForm,
  type SapPrintCompletion,
  type SapPrintCurrentRow,
  type SapPrintVibrationRow,
} from '@/components/pm-vibration/WorkOrderPmSapPrintForm'
import { WorkOrderPmSapPage2Form } from '@/components/pm-vibration/WorkOrderPmSapPage2Form'
import { AppPageSection, AppPageShell } from '@/components/layout/AppPageShell'
import { AppCard } from '@/components/layout/AppCard'
import { WorkOrderPmMeasurementBlock } from '@/components/scheduling/WorkOrderPmMeasurementBlock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchPmReadingsImportTemplateXlsx,
  fetchWorkOrderModalDetail,
  fetchWorkOrderPmReadingsXlsx,
  postPmReadingsBatch,
  postPmReadingsImport,
  postWorkOrdersSearch,
} from '@/lib/api-public'
import type { WorkOrderTaskListItemApi } from '@/api/schemas'
import { useMutation, useQuery } from '@tanstack/react-query'
import { usePermission } from '@/lib/use-permission'
import {
  Download,
  FileSpreadsheet,
  LineChart,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useRef, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  findMeasureTask,
  matchesPmTask,
  parsePmTaskFocusFromSearchParams,
  pmTaskAnchorId,
} from '@/lib/pm-vibration-deep-link'
import { limitsFromLastReading, parseOptionalDbLimit } from '@/lib/pm-vibration-limits'

type DraftRow = {
  key: string
  machine: string
  pmlist: string
  kind: 'current_3phase' | 'vibration_dst_db'
  measuredAtLocal: string
  v1: string
  v2: string
  v3: string
  warningLimit: string
  alarmLimit: string
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function nowLocalInputValue(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function emptyRow(partial?: Partial<DraftRow>): DraftRow {
  return {
    key: crypto.randomUUID(),
    machine: '',
    pmlist: '',
    kind: 'current_3phase',
    measuredAtLocal: nowLocalInputValue(),
    v1: '',
    v2: '',
    v3: '',
    warningLimit: '',
    alarmLimit: '',
    ...partial,
  }
}

function isCurrentTask(item: WorkOrderTaskListItemApi): boolean {
  return item.measurementKind === 'current_3phase'
}

function isVibrationTask(item: WorkOrderTaskListItemApi): boolean {
  return item.measurementKind === 'vibration_dst_db'
}

const EMPTY_WO_HEADER = {
  wkorder: '',
  printMetaLine: '',
  functionalLocation: '',
  equipment: '',
  descriptionLine1: '',
  descriptionLine2: '',
  workCentre: '',
  startDate: '',
  endDate: '',
  activityType: '',
  revision: '',
  priority: '',
  man: '—',
  machineRunStatus: '—',
  techId: '',
  sysCond: '—',
  description: '',
  permitStatus: '',
  headerShortText: '',
  objectList: '',
  operationNumber: '',
  operationWorkCentre: '',
  operationText: '',
  unloadingPoint: '',
  operationLongText: [] as { lineNo: number; machine: string; pmlist: string }[],
}

export function PmVibrationPage() {
  const { t } = useTranslation('pmVibration')
  const [searchParams] = useSearchParams()
  const canWrite = usePermission('confirmation.write')
  const fileRef = useRef<HTMLInputElement>(null)

  const [searchQ, setSearchQ] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [wkorderLabel, setWkorderLabel] = useState('')
  const [searchHits, setSearchHits] = useState<
    { id: string; wkorder: string; label: string }[]
  >([])
  const [draftRows, setDraftRows] = useState<DraftRow[]>([emptyRow()])
  const [paperRows, setPaperRows] = useState<SapPrintCurrentRow[]>([])
  const [paperVibrationRows, setPaperVibrationRows] = useState<SapPrintVibrationRow[]>([])
  const [paperVibrationWarn, setPaperVibrationWarn] = useState('')
  const [paperVibrationAlarm, setPaperVibrationAlarm] = useState('')
  const [paperMeasuredAt, setPaperMeasuredAt] = useState(nowLocalInputValue())
  const [paperCompletion, setPaperCompletion] = useState<SapPrintCompletion>({
    completionDate: '',
    timeStart: '',
    timeEnd: '',
    completed: '',
    completedBy: '',
  })
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    const wk = searchParams.get('wkorder')?.trim()
    if (wk) {
      setOrderId(wk)
      setWkorderLabel(wk)
      setSearchQ(wk)
    }
  }, [searchParams])

  const modalQ = useQuery({
    queryKey: ['work-order', 'modal-detail', orderId, 'pm-vibration'],
    queryFn: () => fetchWorkOrderModalDetail(orderId!),
    enabled: Boolean(orderId),
  })

  const measureTasks = useMemo(() => {
    const items = modalQ.data?.taskList.items ?? []
    return items.filter(
      (i) => i.measurementKind === 'current_3phase' || i.measurementKind === 'vibration_dst_db',
    )
  }, [modalQ.data?.taskList.items])

  const currentTasks = useMemo(
    () => measureTasks.filter(isCurrentTask),
    [measureTasks],
  )

  const vibrationTasks = useMemo(
    () => measureTasks.filter(isVibrationTask),
    [measureTasks],
  )

  const deepLinkFocusParams = useMemo(
    () => parsePmTaskFocusFromSearchParams(searchParams),
    [searchParams],
  )

  const deepLinkTask = useMemo(() => {
    if (!deepLinkFocusParams || measureTasks.length === 0) return null
    return (
      findMeasureTask(measureTasks, deepLinkFocusParams.machine, deepLinkFocusParams.pmlist) ??
      null
    )
  }, [deepLinkFocusParams, measureTasks])

  const deepLinkScrolledRef = useRef(false)
  const deepLinkNotFoundRef = useRef(false)

  useEffect(() => {
    deepLinkScrolledRef.current = false
    deepLinkNotFoundRef.current = false
  }, [orderId, deepLinkFocusParams?.machine, deepLinkFocusParams?.pmlist])

  useEffect(() => {
    if (!deepLinkTask || deepLinkScrolledRef.current || modalQ.isLoading) return
    deepLinkScrolledRef.current = true
    const id = pmTaskAnchorId(deepLinkTask.machine, deepLinkTask.pmlist)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [deepLinkTask, modalQ.isLoading])

  useEffect(() => {
    if (
      !deepLinkFocusParams ||
      deepLinkTask ||
      deepLinkNotFoundRef.current ||
      modalQ.isLoading ||
      !modalQ.data
    ) {
      return
    }
    deepLinkNotFoundRef.current = true
    toast.message(
      t('deepLinkTaskNotFound', {
        machine: deepLinkFocusParams.machine || '—',
        pmlist: deepLinkFocusParams.pmlist || '—',
      }),
    )
  }, [deepLinkFocusParams, deepLinkTask, modalQ.isLoading, modalQ.data, t])

  const searchMut = useMutation({
    mutationFn: async (q: string) => {
      const items = await postWorkOrdersSearch({
        q,
        activity: [],
        wktype: [],
        status: [],
        wkctr: [],
        team: [],
        functionalloc: [],
        equipment: [],
      })
      return items.slice(0, 12).map((row) => ({
        id: row.id,
        wkorder: row.wkorder,
        label: `${row.wkorder} · ${row.equdescrip || row.operationshorttext || '—'}`,
      }))
    },
    onSuccess: (hits) => {
      setSearchHits(hits)
      if (hits.length === 0) toast.message(t('noWoFound'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const paperSaveMut = useMutation({
    mutationFn: () => {
      if (!orderId) throw new Error(t('selectWoFirst'))
      const rows = paperRows.filter((row) => row.v1.trim() || row.v2.trim() || row.v3.trim())
      if (rows.length === 0) throw new Error(t('valuesRequired'))
      const items = rows.map((row) => {
        const n1 = Number(row.v1)
        const n2 = Number(row.v2)
        const n3 = Number(row.v3)
        if (![n1, n2, n3].every((n) => Number.isFinite(n))) {
          throw new Error(t('valuesRequired'))
        }
        return {
          machine: row.machine.trim(),
          pmlist: row.pmlist.trim(),
          kind: 'current_3phase' as const,
          measuredAt: paperMeasuredAt
            ? new Date(paperMeasuredAt).toISOString()
            : undefined,
          v1: n1,
          v2: n2,
          v3: n3,
          warningLimit: null,
          alarmLimit: null,
        }
      })
      return postPmReadingsBatch({ orderId, items })
    },
    onSuccess: (res) => {
      if (res.imported > 0) toast.success(t('savedPaperCurrent', { count: res.imported }))
      if (res.failed > 0) toast.error(t('failedRows', { count: res.failed }))
      void modalQ.refetch()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const paperVibrationSaveMut = useMutation({
    mutationFn: () => {
      if (!orderId) throw new Error(t('selectWoFirst'))
      const rows = paperVibrationRows.filter((row) => row.v1.trim() || row.v2.trim())
      if (rows.length === 0) throw new Error(t('valuesRequiredDstDb'))
      const items = rows.map((row) => {
        const n1 = Number(row.v1)
        const n2 = Number(row.v2)
        if (![n1, n2].every((n) => Number.isFinite(n))) {
          throw new Error(t('valuesRequiredDstDb'))
        }
        return {
          machine: row.machine.trim(),
          pmlist: row.pmlist.trim(),
          kind: 'vibration_dst_db' as const,
          measuredAt: paperMeasuredAt
            ? new Date(paperMeasuredAt).toISOString()
            : undefined,
          v1: n1,
          v2: n2,
          v3: null,
          warningLimit: parseOptionalDbLimit(paperVibrationWarn),
          alarmLimit: parseOptionalDbLimit(paperVibrationAlarm),
        }
      })
      return postPmReadingsBatch({ orderId, items })
    },
    onSuccess: (res) => {
      if (res.imported > 0) toast.success(t('savedPaperVibration', { count: res.imported }))
      if (res.failed > 0) toast.error(t('failedRows', { count: res.failed }))
      void modalQ.refetch()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const batchMut = useMutation({
    mutationFn: () => {
      if (!orderId) throw new Error(t('selectWoFirst'))
      const items = draftRows.map((row) => {
        const n1 = Number(row.v1)
        const n2 = Number(row.v2)
        const n3 = Number(row.v3)
        if (![n1, n2, n3].every((n) => Number.isFinite(n))) {
          throw new Error(t('valuesRequired'))
        }
        const measuredAt = row.measuredAtLocal
          ? new Date(row.measuredAtLocal).toISOString()
          : undefined
        return {
          machine: row.machine.trim(),
          pmlist: row.pmlist.trim(),
          kind: row.kind,
          measuredAt,
          v1: n1,
          v2: n2,
          v3: n3,
          warningLimit: row.warningLimit.trim() ? Number(row.warningLimit) : null,
          alarmLimit: row.alarmLimit.trim() ? Number(row.alarmLimit) : null,
        }
      })
      return postPmReadingsBatch({ orderId, items })
    },
    onSuccess: (res) => {
      if (res.imported > 0) toast.success(t('savedRows', { count: res.imported }))
      if (res.failed > 0) {
        toast.error(t('failedRows', { count: res.failed }))
      }
      void modalQ.refetch()
      setDraftRows([emptyRow()])
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = searchQ.trim()
    if (!q) return
    searchMut.mutate(q)
  }

  const selectWo = (hit: { id: string; wkorder: string }) => {
    setOrderId(hit.id)
    setWkorderLabel(hit.wkorder)
    setSearchHits([])
    setDraftRows([emptyRow()])
    setPaperRows([])
    setPaperVibrationRows([])
    setPaperVibrationWarn('')
    setPaperVibrationAlarm('')
    setPaperMeasuredAt(nowLocalInputValue())
    setPaperCompletion({
      completionDate: '',
      timeStart: '',
      timeEnd: '',
      completed: '',
      completedBy: '',
    })
  }

  useEffect(() => {
    if (arrayLength(modalQ.data?.taskList?.items) === 0) return
    setPaperRows(
      currentTasks.map((task) => ({
        key: `${task.machine}-${task.pmlist}`,
        machine: task.machine,
        pmlist: task.pmlist,
        v1: '',
        v2: '',
        v3: '',
      })),
    )
  }, [modalQ.data, currentTasks])

  useEffect(() => {
    if (arrayLength(modalQ.data?.taskList?.items) === 0) return
    setPaperVibrationRows(
      vibrationTasks.map((task) => ({
        key: `${task.machine}-${task.pmlist}`,
        machine: task.machine,
        pmlist: task.pmlist,
        v1: '',
        v2: '',
      })),
    )
  }, [modalQ.data, vibrationTasks])

  useEffect(() => {
    const readings = modalQ.data?.pmExecution.readings ?? []
    if (readings.length === 0 || paperVibrationRows.length === 0) return
    setPaperVibrationRows((rows) =>
      rows.map((row) => {
        if (row.v1.trim()) return row
        const latest = readings
          .filter(
            (r) =>
              r.kind === 'vibration_dst_db' &&
              r.machine === row.machine &&
              r.pmlist === row.pmlist,
          )
          .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0]
        if (!latest) return row
        return {
          ...row,
          v1: String(latest.v1),
          v2: String(latest.v2),
        }
      }),
    )
  }, [modalQ.data?.pmExecution.readings, paperVibrationRows.length])

  useEffect(() => {
    const readings = modalQ.data?.pmExecution.readings ?? []
    const vibrationReadings = readings
      .filter((r) => r.kind === 'vibration_dst_db')
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
    const { warning, alarm } = limitsFromLastReading(vibrationReadings)
    setPaperVibrationWarn(warning)
    setPaperVibrationAlarm(alarm)
  }, [orderId, modalQ.data?.pmExecution.readings])

  useEffect(() => {
    const readings = modalQ.data?.pmExecution.readings ?? []
    if (readings.length === 0 || paperRows.length === 0) return
    setPaperRows((rows) =>
      rows.map((row) => {
        if (row.v1.trim()) return row
        const latest = readings
          .filter(
            (r) =>
              r.kind === 'current_3phase' &&
              r.machine === row.machine &&
              r.pmlist === row.pmlist,
          )
          .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0]
        if (!latest) return row
        return {
          ...row,
          v1: String(latest.v1),
          v2: String(latest.v2),
          v3: String(latest.v3),
        }
      }),
    )
  }, [modalQ.data?.pmExecution.readings, paperRows.length])

  useEffect(() => {
    if (arrayLength(modalQ.data?.taskList?.items) === 0) return
    if (measureTasks.length > 0) {
      setDraftRows([emptyRow()])
      return
    }
    setDraftRows((rows) => {
      if (rows.some((r) => r.v1.trim() !== '')) return rows
      const items = modalQ.data!.taskList.items
      const measure = items.filter(
        (i) => i.measurementKind === 'current_3phase' || i.measurementKind === 'vibration_dst_db',
      )
      const targets = measure.length > 0 ? measure : items
      if (targets.length === 0) return rows
      return targets.map((first) =>
        emptyRow({
          machine: first.machine,
          pmlist: first.pmlist,
          kind:
            first.measurementKind === 'current_3phase'
              ? 'current_3phase'
              : first.measurementKind === 'vibration_dst_db'
                ? 'vibration_dst_db'
                : 'current_3phase',
        }),
      )
    })
  }, [modalQ.data, measureTasks.length])

  const fillAllMeasureTasks = () => {
    const items = modalQ.data?.taskList?.items ?? []
    if (items.length === 0) return
    const measure = items.filter(
      (i) => i.measurementKind === 'current_3phase' || i.measurementKind === 'vibration_dst_db',
    )
    const targets = measure.length > 0 ? measure : items
    setDraftRows(
      targets.map((task) =>
        emptyRow({
          machine: task.machine,
          pmlist: task.pmlist,
          kind:
            task.measurementKind === 'current_3phase'
              ? 'current_3phase'
              : task.measurementKind === 'vibration_dst_db'
                ? 'vibration_dst_db'
                : 'current_3phase',
        }),
      ),
    )
  }

  const fillFromTask = (task: WorkOrderTaskListItemApi) => {
    setDraftRows((rows) =>
      rows.length === 1 && !rows[0]?.v1
        ? [
            emptyRow({
              machine: task.machine,
              pmlist: task.pmlist,
              kind: task.measurementKind === 'current_3phase' ? 'current_3phase' : 'vibration_dst_db',
            }),
          ]
        : rows,
    )
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    try {
      const res = await postPmReadingsImport(file, wkorderLabel || undefined)
      if (res.imported > 0) toast.success(t('importedRows', { count: res.imported }))
      if (res.failed > 0) toast.warning(t('importFailedRows', { count: res.failed }))
      if (orderId) void modalQ.refetch()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const importErrors = batchMut.data?.errors ?? []
  const manualSaveEnabled = Boolean(orderId) && canWrite
  const woHeader = modalQ.data?.woHeader ?? EMPTY_WO_HEADER
  const formHint = !orderId
    ? t('selectWoToEnable')
    : !canWrite
      ? t('noWritePermission')
      : undefined

  const genericBulkTable = (
    <table className="w-full min-w-[720px] text-left text-xs">
      <thead className="text-app-muted">
        <tr>
          <th className="px-1 py-1">{t('machine')}</th>
          <th className="px-1 py-1">{t('pmlist')}</th>
          <th className="px-1 py-1">{t('kind')}</th>
          <th className="px-1 py-1">{t('measuredAt')}</th>
          <th className="px-1 py-1">{t('phaseR')}</th>
          <th className="px-1 py-1">{t('phaseS')}</th>
          <th className="px-1 py-1">{t('phaseT')}</th>
          <th className="px-1 py-1">{t('warningLimit')}</th>
          <th className="px-1 py-1">{t('alarmLimit')}</th>
          <th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {draftRows.map((row) => (
          <tr key={row.key} className="border-t border-app/50">
            <td className="px-1 py-1">
              <Input
                className="h-8 text-xs"
                value={row.machine}
                disabled={!canWrite}
                onChange={(e) =>
                  setDraftRows((rows) =>
                    rows.map((r) => (r.key === row.key ? { ...r, machine: e.target.value } : r)),
                  )
                }
              />
            </td>
            <td className="px-1 py-1">
              <Input
                className="h-8 text-xs"
                value={row.pmlist}
                disabled={!canWrite}
                onChange={(e) =>
                  setDraftRows((rows) =>
                    rows.map((r) => (r.key === row.key ? { ...r, pmlist: e.target.value } : r)),
                  )
                }
              />
            </td>
            <td className="px-1 py-1">
              <select
                className="h-8 w-full rounded-button border border-app bg-[var(--app-surface)] px-1 text-xs disabled:opacity-60"
                value={row.kind}
                disabled={!canWrite}
                onChange={(e) =>
                  setDraftRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key
                        ? { ...r, kind: e.target.value as DraftRow['kind'] }
                        : r,
                    ),
                  )
                }
              >
                <option value="current_3phase">{t('kindCurrent')}</option>
                <option value="vibration_dst_db">{t('kindVibration')}</option>
              </select>
            </td>
            <td className="px-1 py-1">
              <Input
                type="datetime-local"
                className="h-8 text-xs"
                value={row.measuredAtLocal}
                disabled={!canWrite}
                onChange={(e) =>
                  setDraftRows((rows) =>
                    rows.map((r) =>
                      r.key === row.key ? { ...r, measuredAtLocal: e.target.value } : r,
                    ),
                  )
                }
              />
            </td>
            {(['v1', 'v2', 'v3', 'warningLimit', 'alarmLimit'] as const).map((field) => (
              <td key={field} className="px-1 py-1">
                <Input
                  inputMode="decimal"
                  className="h-8 text-xs tabular-nums"
                  value={row[field]}
                  disabled={!canWrite}
                  placeholder={field.startsWith('v') ? '0' : ''}
                  onChange={(e) =>
                    setDraftRows((rows) =>
                      rows.map((r) =>
                        r.key === row.key ? { ...r, [field]: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
            ))}
            <td className="px-1 py-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={!canWrite || draftRows.length <= 1}
                onClick={() => setDraftRows((rows) => rows.filter((r) => r.key !== row.key))}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <AppPageShell
      title={t('title')}
      description={t('description')}
      eyebrow={t('eyebrow')}
      hints={hintsFromT(t, 'hints')}
    >
      <AppPageSection index={0}>
        <AppCard className="p-4">
          <form className="flex flex-wrap items-end gap-3" onSubmit={onSearch}>
            <div className="min-w-[16rem] flex-1">
              <Label htmlFor="wo-search">{t('searchLabel')}</Label>
              <Input
                id="wo-search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </div>
            <Button type="submit" disabled={searchMut.isPending}>
              <Search className="size-4" aria-hidden />
              {t('search')}
            </Button>
          </form>
          {searchHits.length > 0 ? (
            <ul className="mt-3 space-y-1 rounded-card border border-app p-2">
              {searchHits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="w-full rounded-button px-3 py-2 text-left text-body-sm hover:bg-app-subtle/60"
                    onClick={() => selectWo(hit)}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {orderId ? (
            <p className="mt-3 text-body-sm text-app-muted">
              {t('selectedWo')}{' '}
              <span className="font-mono font-semibold text-app">{wkorderLabel || orderId}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-7"
                onClick={() => {
                  setOrderId(null)
                  setWkorderLabel('')
                }}
              >
                {t('changeWo')}
              </Button>
            </p>
          ) : null}
        </AppCard>
      </AppPageSection>

      <AppPageSection index={1}>
        <PmVibrationStatusBanner
          orderId={orderId}
          wkorderLabel={wkorderLabel}
          canWrite={canWrite}
          loading={Boolean(orderId) && modalQ.isLoading}
          dataReadiness={modalQ.data?.dataReadiness}
        />
      </AppPageSection>

      <AppPageSection index={2}>
        <PmTechnicianGuide />
      </AppPageSection>

      <AppPageSection index={3}>
        {orderId && modalQ.isLoading ? (
          <Skeleton className="mb-3 h-[42rem] w-full rounded-card" />
        ) : null}
        <WorkOrderPmSapPrintForm
          header={woHeader}
          currentRows={paperRows}
          vibrationRows={paperVibrationRows}
          vibrationWarningLimit={paperVibrationWarn}
          vibrationAlarmLimit={paperVibrationAlarm}
          measuredAtLocal={paperMeasuredAt}
          completion={paperCompletion}
          canWrite={manualSaveEnabled}
          saving={paperSaveMut.isPending}
          savingVibration={paperVibrationSaveMut.isPending}
          selectWoHint={formHint}
          onCurrentRowChange={(key, field, value) =>
            setPaperRows((rows) =>
              rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
            )
          }
          onVibrationRowChange={(key, field, value) =>
            setPaperVibrationRows((rows) =>
              rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
            )
          }
          onVibrationLimitsChange={(field, value) => {
            if (field === 'warning') setPaperVibrationWarn(value)
            else setPaperVibrationAlarm(value)
          }}
          onMeasuredAtChange={setPaperMeasuredAt}
          onCompletionChange={(patch) => setPaperCompletion((prev) => ({ ...prev, ...patch }))}
          onSave={() => paperSaveMut.mutate()}
          onSaveVibration={() => paperVibrationSaveMut.mutate()}
        />
      </AppPageSection>

      <AppPageSection index={4}>
        <WorkOrderPmSapPage2Form
          orderId={orderId}
          wkorder={wkorderLabel}
          pmExecution={modalQ.data?.pmExecution}
          page2Form={modalQ.data?.page2Form}
          canWrite={canWrite}
          onSaved={() => void modalQ.refetch()}
        />
      </AppPageSection>

      <AppPageSection index={5}>
        <PmCustomerTrendPanel
          kind="current_3phase"
          orderId={orderId}
          tasks={currentTasks}
          pmExecution={modalQ.data?.pmExecution}
          canWrite={canWrite}
          focusTask={deepLinkTask?.measurementKind === 'current_3phase' ? deepLinkFocusParams : null}
          onSaved={() => void modalQ.refetch()}
        />
      </AppPageSection>

      <AppPageSection index={6}>
        <PmCustomerTrendPanel
          kind="vibration_dst_db"
          orderId={orderId}
          tasks={vibrationTasks}
          pmExecution={modalQ.data?.pmExecution}
          canWrite={canWrite}
          focusTask={deepLinkTask?.measurementKind === 'vibration_dst_db' ? deepLinkFocusParams : null}
          onSaved={() => void modalQ.refetch()}
        />
      </AppPageSection>

      <AppPageSection index={7}>
        {measureTasks.length > 0 ? (
          <details className="rounded-card border border-app/50 bg-[var(--app-surface)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-app-muted hover:text-app">
              {t('manualEntryAdvanced')}
            </summary>
            <div className="space-y-3 border-t border-app/40 px-4 pb-4 pt-3">
              <p className="text-body-sm text-app-muted">{t('manualEntryAdvancedHint')}</p>
              {formHint ? (
                <div
                  className="app-tone-warning-callout rounded-card border px-3 py-2 text-body-sm"
                  role="status"
                >
                  {formHint}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canWrite}
                  onClick={() => setDraftRows((r) => [...r, emptyRow()])}
                >
                  <Plus className="size-4" aria-hidden />
                  {t('addRow')}
                </Button>
              </div>
              <div className="overflow-x-auto">{genericBulkTable}</div>
              <Button
                type="button"
                disabled={!manualSaveEnabled || batchMut.isPending}
                onClick={() => batchMut.mutate()}
              >
                {batchMut.isPending ? t('saving') : t('saveBatch')}
              </Button>
              {importErrors.length > 0 ? (
                <ul className="app-tone-danger-callout rounded-card border p-3 text-xs">
                  {importErrors.map((err) => (
                    <li key={`${err.rowNo}-${err.message}`}>
                      {t('rowError', { rowNo: err.rowNo, message: err.message })}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        ) : (
          <AppCard className="space-y-3 p-4">
            {formHint ? (
              <div
                className="app-tone-warning-callout rounded-card border px-3 py-2 text-body-sm"
                role="status"
              >
                {formHint}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-app">{t('manualEntryTitle')}</h2>
                <p className="mt-1 text-body-sm text-app-muted">{t('manualEntryHint')}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canWrite}
                onClick={() => setDraftRows((r) => [...r, emptyRow()])}
              >
                <Plus className="size-4" aria-hidden />
                {t('addRow')}
              </Button>
            </div>
            <div className="overflow-x-auto">{genericBulkTable}</div>
            <Button
              type="button"
              disabled={!manualSaveEnabled || batchMut.isPending}
              onClick={() => batchMut.mutate()}
            >
              {batchMut.isPending ? t('saving') : t('saveBatch')}
            </Button>
            {importErrors.length > 0 ? (
              <ul className="app-tone-danger-callout rounded-card border p-3 text-xs">
                {importErrors.map((err) => (
                  <li key={`${err.rowNo}-${err.message}`}>
                    {t('rowError', { rowNo: err.rowNo, message: err.message })}
                  </li>
                ))}
              </ul>
            ) : null}
          </AppCard>
        )}
      </AppPageSection>

      <AppPageSection index={8}>
        <details className="rounded-card border border-app/50 bg-[var(--app-surface)]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-app-muted hover:text-app">
            {t('importOptionalTitle')}
          </summary>
          <div className="space-y-3 border-t border-app/40 px-4 pb-4 pt-3">
            <p className="text-body-sm text-app-muted">{t('importOptionalHint')}</p>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-app">
                  <FileSpreadsheet className="app-tone-success-icon size-5" aria-hidden />
                  {t('importTitle')}
                </h2>
                <p className="mt-1 text-body-sm text-app-muted">{t('importHint')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const blob = await fetchPmReadingsImportTemplateXlsx()
                      downloadBlob(blob, 'PM_Measurements_Template.xlsx')
                    } catch (e) {
                      toast.error((e as Error).message)
                    }
                  }}
                >
                  <Download className="size-4" aria-hidden />
                  {t('templateBtn')}
                </Button>
                {canWrite ? (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => void onImportFile(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={importing}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="size-4" aria-hidden />
                      {importing ? t('importing') : t('uploadExcel')}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            {!canWrite ? (
              <p className="text-body-sm text-app-muted">{t('readOnly')}</p>
            ) : null}
          </div>
        </details>
      </AppPageSection>

      {orderId && !modalQ.isLoading && modalQ.isError ? (
        <AppPageSection index={9}>
          <p className="text-body-sm text-form-error">{(modalQ.error as Error).message}</p>
        </AppPageSection>
      ) : null}

      {orderId && modalQ.data ? (
        <AppPageSection index={9}>
          <AppCard className="space-y-4 p-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-app">
                <LineChart className="size-5 text-[var(--app-accent)]" aria-hidden />
                {t('perTaskTitle')}
              </h2>
              <p className="mt-1 text-body-sm text-app-muted">{t('perTaskHint')}</p>
            </div>
            {measureTasks.length === 0 ? (
              <p className="text-body-sm text-app-muted">{t('noTasks')}</p>
            ) : (
              <>
                {currentTasks.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-app">{t('currentSection')}</h3>
                    {currentTasks.map((item, idx) => {
                      const highlighted = deepLinkTask
                        ? matchesPmTask(item, deepLinkTask.machine, deepLinkTask.pmlist)
                        : false
                      return (
                        <WorkOrderPmMeasurementBlock
                          key={`current-${item.machine}-${item.pmlist}-${idx}`}
                          orderId={orderId!}
                          anchorId={pmTaskAnchorId(item.machine, item.pmlist)}
                          highlighted={highlighted}
                          item={{
                            ...item,
                            measurementKind: item.measurementKind ?? 'none',
                            mpoint: item.mpoint ?? '',
                            measurementTitle: item.measurementTitle ?? '',
                            axisLabels: item.axisLabels ?? [
                              t('phaseR'),
                              t('phaseS'),
                              t('phaseT'),
                            ],
                            unit: item.unit ?? 'A',
                          }}
                          pmExecution={modalQ.data.pmExecution}
                          onSaved={() => void modalQ.refetch()}
                        />
                      )
                    })}
                  </div>
                ) : null}
                {vibrationTasks.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-app">{t('vibrationSection')}</h3>
                    <p className="text-body-sm text-app-muted">{t('vibrationFromTask')} Dst / dB</p>
                    {vibrationTasks.map((item, idx) => {
                      const highlighted = deepLinkTask
                        ? matchesPmTask(item, deepLinkTask.machine, deepLinkTask.pmlist)
                        : false
                      return (
                        <WorkOrderPmMeasurementBlock
                          key={`vibration-${item.machine}-${item.pmlist}-${idx}`}
                          orderId={orderId!}
                          anchorId={pmTaskAnchorId(item.machine, item.pmlist)}
                          highlighted={highlighted}
                          item={{
                            ...item,
                            measurementKind: item.measurementKind ?? 'none',
                            mpoint: item.mpoint ?? '',
                            measurementTitle: item.measurementTitle ?? '',
                            axisLabels: [t('dstDistortion'), t('db'), ''],
                            unit: '',
                          }}
                          pmExecution={modalQ.data.pmExecution}
                          onSaved={() => void modalQ.refetch()}
                        />
                      )
                    })}
                  </div>
                ) : null}
              </>
            )}
            {modalQ.data.pmExecution.readings.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={async () => {
                  try {
                    const blob = await fetchWorkOrderPmReadingsXlsx(orderId)
                    downloadBlob(blob, `PM_Readings_${wkorderLabel || orderId}.xlsx`)
                  } catch (e) {
                    toast.error((e as Error).message)
                  }
                }}
              >
                <Download className="size-4" aria-hidden />
                {t('exportWo')}
              </Button>
            ) : null}
          </AppCard>
        </AppPageSection>
      ) : (
        <AppPageSection index={9}>
          <AppCard className="p-4">
            <h2 className="font-semibold text-app">{t('perTaskTitle')}</h2>
            <p className="mt-2 text-body-sm text-app-muted">{t('emptyState')}</p>
          </AppCard>
        </AppPageSection>
      )}
    </AppPageShell>
  )
}
