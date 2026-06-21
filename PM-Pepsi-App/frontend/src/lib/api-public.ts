import {
  backlogEventsResponseSchema,
  backlogFilterDetailResponseSchema,
  backlogFilterOptionsResponseSchema,
  backlogManhourResponseSchema,
  backlogManhourSearchBodySchema,
  backlogSearchBodySchema,
  calendarEventsResponseSchema,
  calendarFilterOptionsResponseSchema,
  calendarSearchBodySchema,
  dashboardSummarySchema,
  iw37nBatchesResponseSchema,
  iw37nBatchRowsResponseSchema,
  iw37nItemResponseSchema,
  iw37nItemsResponseSchema,
  iw37nImportPreviewResponseSchema,
  iw37nImportResponseSchema,
  integrationJobsResponseSchema,
  integrationRunResponseSchema,
  integrationStatusResponseSchema,
  manhourImportResponseSchema,
  manhourItemSchema,
  manhourHrListResponseSchema,
  manhourListResponseSchema,
  manhourOkResponseSchema,
  activityLogListResponseSchema,
  appNotificationsResponseSchema,
  auditHubResponseSchema,
  kpiResponseSchema,
  summaryWeeklyResponseSchema,
  manhourChartBreakdownResponseSchema,
  manhourChartPerformanceResponseSchema,
  manhourHrConfirmReportResponseSchema,
  manhourZbByPersonResponseSchema,
  engUtilizationDailyResponseSchema,
  worktimeSummaryOverallResponseSchema,
  manhoursResponseSchema,
  masterDataResponseSchema,
  masterDataMetaResponseSchema,
  personnelAdminItemSchema,
  personnelAdminListResponseSchema,
  personnelAdminOkSchema,
  personnelConfirmListResponseSchema,
  personnelDashboardResponseSchema,
  personnelImageUploadResponseSchema,
  personnelImportResponseSchema,
  personnelWorkstatusOptionsResponseSchema,
  personnelResponseSchema,
  planningAckResponseSchema,
  planningAssignBodySchema,
  planningAssignResponseSchema,
  planningResponseSchema,
  confirmationByWorkOrderResponseSchema,
  personnelClosesResponseSchema,
  confirmationCommentBodySchema,
  confirmationCommentResponseSchema,
  confirmationCommentsResponseSchema,
  confirmationImageDataResponseSchema,
  confirmationImagesResponseSchema,
  confirmationImportPreviewResponseSchema,
  confirmationImportResponseSchema,
  confirmationMassCloseBodySchema,
  confirmationMassCloseResponseSchema,
  massConfirmExportSummarySchema,
  qcApproveBatchResponseSchema,
  confirmationExportResponseSchema,
  confirmationPreviewResponseSchema,
  confirmQcPendingItemSchema,
  confirmQcSnapshotSchema,
  userLogResponseSchema,
  workcentersResponseSchema,
  usersResponseSchema,
  movePlanReasonsResponseSchema,
  movePlanRequestSchema,
  movePlanResponseSchema,
  workOrderFilterOptionsResponseSchema,
  workOrderDetailSchema,
  workOrderListItemSchema,
  workOrderModalDetailSchema,
  woPmNoteBodySchema,
  woPmNoteResponseSchema,
  woPmPage2BodySchema,
  woPmPage2ResponseSchema,
  pmReadingBatchBodySchema,
  pmReadingImportResultSchema,
  woPmReadingBodySchema,
  woPmReadingResponseSchema,
  workOrderPlanningBatchBodySchema,
  workOrderPlanningBatchResponseSchema,
  workOrderPlanningOkResponseSchema,
  workOrderPlanningUpsertBodySchema,
  workOrderFilterDetailResponseSchema,
  workOrderSearchBodySchema,
  workOrderSearchResponseSchema,
  workOrderSuggestionsResponseSchema,
  workOrderTeamBulkBodySchema,
  workOrderTeamBulkResponseSchema,
  workOrderTeamPatchResponseSchema,
  workOrderTeamPatchSchema,
  workOrdersResponseSchema,
  worktimeMeResponseSchema,
  worktimePlanningResponseSchema,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import { getAuthToken } from '@/features/auth/login-api'
import { getApiBaseUrl } from '@/lib/api-client'
import { z } from 'zod'

export type WorkOrderListItem = z.infer<typeof workOrderListItemSchema>
export async function fetchDashboardSummary(opts?: { team?: 'A' | 'B' | 'EE' | 'UT' }) {
  const qs = new URLSearchParams()
  if (opts?.team) qs.set('team', opts.team)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/dashboard/summary${suffix}`)
  return dashboardSummarySchema.parse(json)
}

export async function fetchWorkOrders(params?: { q?: string; status?: string }) {
  const sp = new URLSearchParams()
  if (params?.q) sp.set('q', params.q)
  if (params?.status) sp.set('status', params.status)
  const qs = sp.toString()
  const path = qs ? `/api/v1/work-orders?${qs}` : '/api/v1/work-orders'
  const json = await fetchApi<unknown>(path)
  return workOrdersResponseSchema.parse(json).items
}

export async function fetchWorkOrderDetail(id: string) {
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}`)
  return workOrderDetailSchema.parse(json).item
}

export async function fetchWorkOrderModalDetail(id: string, date?: string) {
  const sp = new URLSearchParams()
  if (date) sp.set('date', date)
  const qs = sp.toString()
  const path = qs
    ? `/api/v1/work-orders/${encodeURIComponent(id)}/modal-detail?${qs}`
    : `/api/v1/work-orders/${encodeURIComponent(id)}/modal-detail`
  const json = await fetchApi<unknown>(path)
  return workOrderModalDetailSchema.parse(json)
}

export async function putWorkOrderPmNote(id: string, body: z.infer<typeof woPmNoteBodySchema>) {
  const payload = woPmNoteBodySchema.parse(body)
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}/pm-note`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return woPmNoteResponseSchema.parse(json)
}

export async function putWorkOrderPmPage2(id: string, body: z.infer<typeof woPmPage2BodySchema>) {
  const payload = woPmPage2BodySchema.parse(body)
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}/pm-page2`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return woPmPage2ResponseSchema.parse(json)
}

export async function fetchWorkOrderPmReadingsXlsx(orderId: string): Promise<Blob> {
  const base = getApiBaseUrl()
  const p = `/api/v1/work-orders/${encodeURIComponent(orderId)}/pm-readings/export.xlsx`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.blob()
}

export async function fetchPmReadingsExportXlsx(opts: {
  from: string
  to: string
  team?: 'A' | 'B' | 'EE' | 'UT'
}): Promise<Blob> {
  const base = getApiBaseUrl()
  const qs = new URLSearchParams({ from: opts.from, to: opts.to })
  if (opts.team) qs.set('team', opts.team)
  const p = `/api/v1/pm-readings/export.xlsx?${qs}`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.blob()
}

export async function fetchPmReadingsImportTemplateXlsx(): Promise<Blob> {
  const base = getApiBaseUrl()
  const p = '/api/v1/pm-readings/import-template.xlsx'
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.blob()
}

export async function postPmReadingsBatch(body: z.infer<typeof pmReadingBatchBodySchema>) {
  const payload = pmReadingBatchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/pm-readings/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return pmReadingImportResultSchema.parse(json)
}

export async function postPmReadingsImport(file: File, wkorder?: string) {
  const base = getApiBaseUrl()
  const p = '/api/v1/pm-readings/import'
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const fd = new FormData()
  fd.append('file', file)
  if (wkorder?.trim()) fd.append('wkorder', wkorder.trim())
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return pmReadingImportResultSchema.parse(json)
}

export async function postWorkOrderPmReading(
  id: string,
  body: z.infer<typeof woPmReadingBodySchema>,
) {
  const payload = woPmReadingBodySchema.parse(body)
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}/pm-readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return woPmReadingResponseSchema.parse(json)
}

export async function putWorkOrderPlanning(id: string, body: z.infer<typeof workOrderPlanningUpsertBodySchema>) {
  const payload = workOrderPlanningUpsertBodySchema.parse(body)
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}/planning`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return workOrderPlanningOkResponseSchema.parse(json)
}

/**
 * Multi-assign batch — เพิ่มช่างหลายคนในคลิกเดียว
 * - dedupe + กรอง not-found ที่ backend อีกชั้น
 * - คืนรายชื่อที่เพิ่ม / ที่ข้าม / ที่ไม่พบ เพื่อ frontend แสดง toast ละเอียด
 */
export async function postWorkOrderPlanningBatch(
  id: string,
  body: z.infer<typeof workOrderPlanningBatchBodySchema>,
) {
  const payload = workOrderPlanningBatchBodySchema.parse(body)
  const json = await fetchApi<unknown>(
    `/api/v1/work-orders/${encodeURIComponent(id)}/planning/batch`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return workOrderPlanningBatchResponseSchema.parse(json)
}

export async function deleteWorkOrderPlanning(id: string) {
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}/planning`, {
    method: 'DELETE',
  })
  return workOrderPlanningOkResponseSchema.parse(json)
}

/** ลบ assignment เฉพาะคู่ (idiw37, wkctr) */
export async function deleteWorkOrderPlanningAssignee(id: string, wkctr: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/work-orders/${encodeURIComponent(id)}/planning/${encodeURIComponent(wkctr)}`,
    { method: 'DELETE' },
  )
  return workOrderPlanningOkResponseSchema.parse(json)
}

export async function fetchWorkOrderFilterOptions() {
  const json = await fetchApi<unknown>('/api/v1/work-orders/filter-options')
  return workOrderFilterOptionsResponseSchema.parse(json)
}

export type WorkOrderSearchInput = z.infer<typeof workOrderSearchBodySchema>
export async function postWorkOrdersSearch(body: WorkOrderSearchInput) {
  const payload = workOrderSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/work-orders/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return workOrderSearchResponseSchema.parse(json).items
}

export async function postWorkOrderFilterDetail(body: WorkOrderSearchInput) {
  const payload = workOrderSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/work-orders/filter-detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return workOrderFilterDetailResponseSchema.parse(json)
}

export async function putWorkOrderTeam(id: string, team: z.infer<typeof workOrderTeamPatchSchema>['team']) {
  const payload = workOrderTeamPatchSchema.parse({ team })
  const json = await fetchApi<unknown>(`/api/v1/work-orders/${encodeURIComponent(id)}/team`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return workOrderTeamPatchResponseSchema.parse(json)
}

/** Phase 3 — ตั้ง Team A/B/EE/UT หลาย `idiw37n` ครั้งเดียว (สูงสุด 100 รายการ) */
export async function patchWorkOrderTeamBatch(
  body: z.infer<typeof workOrderTeamBulkBodySchema>,
) {
  const payload = workOrderTeamBulkBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/work-orders/team/batch', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return workOrderTeamBulkResponseSchema.parse(json)
}

export async function fetchMovePlanReasons() {
  const json = await fetchApi<unknown>('/api/v1/scheduling/move-reasons')
  return movePlanReasonsResponseSchema.parse(json).items
}

export async function postMovePlan(body: z.infer<typeof movePlanRequestSchema>) {
  const payload = movePlanRequestSchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/scheduling/move-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return movePlanResponseSchema.parse(json)
}

export async function fetchWorkOrderSuggestions(q: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/work-orders/suggestions?${new URLSearchParams({ q })}`,
  )
  return workOrderSuggestionsResponseSchema.parse(json).items
}

export type BacklogSearchInput = z.infer<typeof backlogSearchBodySchema>

export async function fetchCalendarEvents(year: number, month: number) {
  const json = await fetchApi<unknown>(
    `/api/v1/calendar/events?year=${year}&month=${month}`,
  )
  return calendarEventsResponseSchema.parse(json)
}

export async function fetchCalendarFilterOptions() {
  const json = await fetchApi<unknown>('/api/v1/calendar/filter-options')
  return calendarFilterOptionsResponseSchema.parse(json)
}

export type CalendarSearchInput = z.infer<typeof calendarSearchBodySchema>
export async function postCalendarEvents(body: CalendarSearchInput) {
  const payload = calendarSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/calendar/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return calendarEventsResponseSchema.parse(json)
}

export async function postCalendarFilterDetail(body: CalendarSearchInput) {
  const payload = calendarSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/calendar/filter-detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return workOrderFilterDetailResponseSchema.parse(json)
}

/** Plan calendar events from view_planwork by idwkctr */
export async function fetchPlanCalendarEvents(year: number, month: number) {
  const json = await fetchApi<unknown>(
    `/api/v1/plan-calendar/events?year=${year}&month=${month}`,
  )
  return calendarEventsResponseSchema.parse(json)
}

export async function fetchBacklogFilterOptions() {
  const json = await fetchApi<unknown>('/api/v1/backlog/filter-options')
  return backlogFilterOptionsResponseSchema.parse(json)
}

export async function postBacklogEvents(body: BacklogSearchInput) {
  const payload = backlogSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/backlog/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return backlogEventsResponseSchema.parse(json)
}

export async function postBacklogFilterDetail(body: BacklogSearchInput) {
  const payload = backlogSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/backlog/filter-detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return backlogFilterDetailResponseSchema.parse(json)
}

export type BacklogManhourInput = z.infer<typeof backlogManhourSearchBodySchema>
export async function postBacklogManhourSummary(body: BacklogManhourInput) {
  const payload = backlogManhourSearchBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/backlog/manhour-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return backlogManhourResponseSchema.parse(json)
}

export async function fetchIw37nBatches() {
  const json = await fetchApi<unknown>('/api/v1/iw37n/batches')
  return iw37nBatchesResponseSchema.parse(json).items
}

export async function fetchIntegrationStatus() {
  const json = await fetchApi<unknown>('/api/v1/integration/status')
  return integrationStatusResponseSchema.parse(json)
}

export async function postIntegrationJobsRun() {
  const json = await fetchApi<unknown>('/api/v1/integration/jobs/run', { method: 'POST' })
  return integrationRunResponseSchema.parse(json)
}

export async function fetchIntegrationJobs(limit = 50) {
  const json = await fetchApi<unknown>(
    `/api/v1/integration/jobs?limit=${encodeURIComponent(String(limit))}`,
  )
  return integrationJobsResponseSchema.parse(json).items
}

export async function postIw37nImportPreview(file: File) {
  const form = new FormData()
  form.append('file', file)
  const json = await fetchApi<unknown>('/api/v1/iw37n/import/preview', {
    method: 'POST',
    body: form,
  })
  return iw37nImportPreviewResponseSchema.parse(json)
}

export async function postIw37nImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  const json = await fetchApi<unknown>('/api/v1/iw37n/import', {
    method: 'POST',
    body: form,
  })
  return iw37nImportResponseSchema.parse(json)
}

export async function fetchIw37nBatchRows(batchId: string, opts?: { limit?: number; offset?: number }) {
  const sp = new URLSearchParams()
  if (typeof opts?.limit === 'number') sp.set('limit', String(opts.limit))
  if (typeof opts?.offset === 'number') sp.set('offset', String(opts.offset))
  const qs = sp.toString()
  const path = qs
    ? `/api/v1/iw37n/batches/${encodeURIComponent(batchId)}/rows?${qs}`
    : `/api/v1/iw37n/batches/${encodeURIComponent(batchId)}/rows`
  const json = await fetchApi<unknown>(path)
  return iw37nBatchRowsResponseSchema.parse(json)
}

export async function fetchIw37nBatchCsv(batchId: string): Promise<Blob> {
  const base = getApiBaseUrl()
  const p = `/api/v1/iw37n/batches/${encodeURIComponent(batchId)}/export.csv`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.blob()
}

export async function fetchIw37nItems(params?: { q?: string; limit?: number; offset?: number }) {
  const sp = new URLSearchParams()
  if (params?.q) sp.set('q', params.q)
  if (typeof params?.limit === 'number') sp.set('limit', String(params.limit))
  if (typeof params?.offset === 'number') sp.set('offset', String(params.offset))
  const qs = sp.toString()
  const path = qs ? `/api/v1/iw37n/items?${qs}` : '/api/v1/iw37n/items'
  const json = await fetchApi<unknown>(path)
  return iw37nItemsResponseSchema.parse(json).items
}

export async function fetchIw37nItem(id: number) {
  const json = await fetchApi<unknown>(`/api/v1/iw37n/items/${encodeURIComponent(String(id))}`)
  return iw37nItemResponseSchema.parse(json).item
}

export async function putIw37nItem(id: number, body: any) {
  const json = await fetchApi<unknown>(`/api/v1/iw37n/items/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return iw37nItemResponseSchema.parse(json).item
}

export async function fetchMasterData(entity: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/${encodeURIComponent(entity)}`,
  )
  return masterDataResponseSchema.parse(json).items
}

export async function fetchMasterDataMeta(entity: string): Promise<{
  entity: string
  count: number
  lastUpdatedAt: string | null
}> {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/${encodeURIComponent(entity)}/meta`,
  )
  return masterDataMetaResponseSchema.parse(json)
}

/**
 * รวม lookup ทั้ง 5 ตัวที่ใช้ในฟอร์ม Admin Personnel
 * ส่งคู่ขนานเพื่อให้ TanStack Query cache ง่าย
 */
export type PersonnelLookupOption = { value: string; label: string }
export type PersonnelLookups = {
  departments: PersonnelLookupOption[]
  positions: PersonnelLookupOption[]
  groups: PersonnelLookupOption[]
  workTypes: PersonnelLookupOption[]
  levels: PersonnelLookupOption[]
}

export async function fetchPersonnelLookups(): Promise<PersonnelLookups> {
  const [department, position, group, worktype, level] = await Promise.all([
    fetchMasterData('department'),
    fetchMasterData('position'),
    fetchMasterData('group'),
    fetchMasterData('worktype'),
    fetchMasterData('level'),
  ])

  const opt = (value: string, label: string): PersonnelLookupOption => ({
    value,
    label: label.trim() ? label : value,
  })

  return {
    departments: department
      .filter((d): d is typeof d & { iddepartment: string; department: string } =>
        'iddepartment' in d && 'department' in d,
      )
      .map((d) => opt(d.iddepartment, `${d.iddepartment} — ${d.department}`)),
    positions: position
      .filter((p): p is typeof p & { idposition: string; position: string } =>
        'idposition' in p && 'position' in p,
      )
      .map((p) => opt(p.idposition, `${p.idposition} — ${p.position}`)),
    groups: group
      .filter(
        (g): g is typeof g & {
          idwkctrgroup: number
          wkctrgroup: string
          wkctrdescription: string
        } =>
          'idwkctrgroup' in g && 'wkctrgroup' in g && 'wkctrdescription' in g,
      )
      .map((g) =>
        opt(
          String(g.idwkctrgroup),
          `${g.wkctrgroup}${g.wkctrdescription ? ` — ${g.wkctrdescription}` : ''}`,
        ),
      ),
    workTypes: worktype
      .filter((t): t is typeof t & { idwkctrtype: string; wkctrtype: string } =>
        'idwkctrtype' in t && 'wkctrtype' in t,
      )
      .map((t) => opt(t.idwkctrtype, `${t.idwkctrtype} — ${t.wkctrtype}`)),
    levels: level
      .filter((l): l is typeof l & { idwklevel: string; wklevel: string } =>
        'idwklevel' in l && 'wklevel' in l,
      )
      .map((l) => opt(l.idwklevel, `${l.idwklevel} — ${l.wklevel}`)),
  }
}

export async function fetchPlanning(params?: { status?: 'open' | 'closed' }) {
  const sp = new URLSearchParams()
  if (params?.status) sp.set('status', params.status)
  const qs = sp.toString()
  const json = await fetchApi<unknown>(qs ? `/api/v1/planning/orders?${qs}` : '/api/v1/planning/orders')
  return planningResponseSchema.parse(json).items
}

export type PlanningAssignInput = z.infer<typeof planningAssignBodySchema>
export async function postPlanningAssign(body: PlanningAssignInput) {
  const payload = planningAssignBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/planning/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return planningAssignResponseSchema.parse(json)
}

export async function postPlanningOrderAck(idiw37: number) {
  const json = await fetchApi<unknown>(`/api/v1/planning/orders/${idiw37}/ack`, {
    method: 'POST',
  })
  return planningAckResponseSchema.parse(json)
}

export async function fetchManhours() {
  const json = await fetchApi<unknown>('/api/v1/manhours/summary')
  return manhoursResponseSchema.parse(json).weeks
}

export async function fetchManhourChartPerformance(opts: {
  from?: string
  to?: string
  idwkctr?: string
} = {}) {
  const qs = new URLSearchParams()
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  if (opts.idwkctr) qs.set('idwkctr', opts.idwkctr)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/manhours/chart/performance${suffix}`)
  return manhourChartPerformanceResponseSchema.parse(json)
}

export async function fetchManhourChartBreakdown(opts: {
  from?: string
  to?: string
  idwkctr?: string
} = {}) {
  const qs = new URLSearchParams()
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  if (opts.idwkctr) qs.set('idwkctr', opts.idwkctr)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/manhours/chart/breakdown${suffix}`)
  return manhourChartBreakdownResponseSchema.parse(json)
}

export async function fetchManhourHrConfirmReport(opts: {
  period: 'month' | 'week'
  month?: string
  week?: string
  from?: string
  to?: string
}) {
  const qs = new URLSearchParams()
  qs.set('period', opts.period)
  if (opts.period === 'month' && opts.month) qs.set('month', opts.month)
  if (opts.period === 'week' && opts.week) qs.set('week', opts.week)
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  const json = await fetchApi<unknown>(`/api/v1/manhours/chart/hr-confirm?${qs.toString()}`)
  return manhourHrConfirmReportResponseSchema.parse(json)
}

export async function fetchManhourZbByPerson(opts: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams()
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/manhours/chart/zb-by-person${suffix}`)
  return manhourZbByPersonResponseSchema.parse(json)
}

export async function fetchManhourHr(
  opts: {
    q?: string
    wkctr?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {},
) {
  const qs = new URLSearchParams()
  if (opts.q) qs.set('q', opts.q)
  if (opts.wkctr) qs.set('wkctr', opts.wkctr)
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  if (opts.offset != null) qs.set('offset', String(opts.offset))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/manhours/hr${suffix}`)
  return manhourHrListResponseSchema.parse(json)
}

export async function fetchManhourList(
  opts: {
    q?: string
    idwkctr?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {},
) {
  const qs = new URLSearchParams()
  if (opts.q) qs.set('q', opts.q)
  if (opts.idwkctr) qs.set('idwkctr', opts.idwkctr)
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  if (opts.offset != null) qs.set('offset', String(opts.offset))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/manhours${suffix}`)
  return manhourListResponseSchema.parse(json)
}

export async function fetchManhourOne(idmanhour: number) {
  const json = await fetchApi<unknown>(`/api/v1/manhours/${idmanhour}`)
  return manhourItemSchema.parse(json)
}

export async function upsertManhour(
  body: {
    idwkctr: string
    stworkday: string | number
    workday: string | number
    wh?: number
    ot1?: number
    ot15?: number
    ot1hol?: number
    ot2?: number
    ot3?: number
  },
  idmanhour?: number,
) {
  const json = await fetchApi<unknown>(
    idmanhour ? `/api/v1/manhours/${idmanhour}` : '/api/v1/manhours',
    {
      method: idmanhour ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return manhourOkResponseSchema.parse(json)
}

export async function deleteManhour(idmanhour: number) {
  const json = await fetchApi<unknown>(`/api/v1/manhours/${idmanhour}`, {
    method: 'DELETE',
  })
  return manhourOkResponseSchema.parse(json)
}

export async function postManhourImport(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const json = await fetchApi<unknown>('/api/v1/manhours/import', {
    method: 'POST',
    body: fd,
  })
  return manhourImportResponseSchema.parse(json)
}

export async function fetchWorktimeMe(opts: { from?: string; to?: string; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/worktime/me${suffix}`)
  return worktimeMeResponseSchema.parse(json)
}

export async function fetchWorktimeSummaryOverall(opts: {
  year?: number
  month?: number
  week?: string
  from?: string
  to?: string
} = {}) {
  const qs = new URLSearchParams()
  if (opts.year != null) qs.set('year', String(opts.year))
  if (opts.month != null) qs.set('month', String(opts.month))
  if (opts.week) qs.set('week', opts.week)
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/worktime/summary-overall${suffix}`)
  return worktimeSummaryOverallResponseSchema.parse(json)
}

export async function fetchEngUtilizationDaily(opts: {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  week?: string
  month?: string
  year?: number
  from?: string
  to?: string
} = {}) {
  const qs = new URLSearchParams()
  if (opts.period) qs.set('period', opts.period)
  if (opts.week) qs.set('week', opts.week)
  if (opts.month) qs.set('month', opts.month)
  if (opts.year != null) qs.set('year', String(opts.year))
  if (opts.from) qs.set('from', opts.from)
  if (opts.to) qs.set('to', opts.to)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/worktime/eng-utilization/summary${suffix}`)
  return engUtilizationDailyResponseSchema.parse(json)
}

/** Work assignment table (tbplangingwork) */
export async function fetchWorktimePlanning(opts: { idwkctr?: string; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (opts.idwkctr) qs.set('idwkctr', opts.idwkctr)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/worktime/planning${suffix}`)
  return worktimePlanningResponseSchema.parse(json)
}

export async function fetchPersonnel(tab: 'all' | 'pending') {
  const json = await fetchApi<unknown>(
    `/api/v1/personnel/technicians?tab=${tab === 'pending' ? 'pending' : 'all'}`,
  )
  return personnelResponseSchema.parse(json).items
}

export async function fetchPersonnelDashboard() {
  const json = await fetchApi<unknown>('/api/v1/personnel/me/dashboard')
  return personnelDashboardResponseSchema.parse(json)
}

/** Admin CRUD personnel — list + upsert + delete + import + image */
export async function fetchPersonnelAdminList(
  opts: {
    q?: string
    limit?: number
    offset?: number
    /** 'all' | 'active' | 'inactive' | <workstatus code> */
    status?: string
  } = {},
) {
  const qs = new URLSearchParams()
  if (opts.q) qs.set('q', opts.q)
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  if (opts.offset != null) qs.set('offset', String(opts.offset))
  if (opts.status && opts.status !== 'all') qs.set('status', opts.status)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/personnel/admin${suffix}`)
  return personnelAdminListResponseSchema.parse(json)
}

/**
 * Lookup ตัวเลือก workstatus สำหรับ Admin form/filter
 */
export async function fetchPersonnelWorkstatusOptions() {
  const json = await fetchApi<unknown>(
    '/api/v1/personnel/admin/workstatus-options',
  )
  return personnelWorkstatusOptionsResponseSchema.parse(json).items
}

export async function fetchPersonnelAdminOne(idwkctr: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/personnel/admin/${encodeURIComponent(idwkctr)}`,
  )
  return personnelAdminItemSchema.parse(json)
}

export async function upsertPersonnelAdmin(body: Record<string, unknown>) {
  const json = await fetchApi<unknown>('/api/v1/personnel/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return personnelAdminOkSchema.parse(json)
}

export async function deletePersonnelAdmin(idwkctr: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/personnel/admin/${encodeURIComponent(idwkctr)}`,
    { method: 'DELETE' },
  )
  return personnelAdminOkSchema.parse(json)
}

export async function postPersonnelAdminImport(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const json = await fetchApi<unknown>('/api/v1/personnel/admin/import', {
    method: 'POST',
    body: fd,
  })
  return personnelImportResponseSchema.parse(json)
}

export async function postPersonnelAdminImage(idwkctr: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const json = await fetchApi<unknown>(
    `/api/v1/personnel/admin/${encodeURIComponent(idwkctr)}/image`,
    { method: 'POST', body: fd },
  )
  return personnelImageUploadResponseSchema.parse(json)
}

export async function deletePersonnelAdminImage(idwkctr: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/personnel/admin/${encodeURIComponent(idwkctr)}/image`,
    { method: 'DELETE' },
  )
  return personnelAdminOkSchema.parse(json)
}

/** URL สำหรับใช้ใน `<img src=...>` — ภาพอยู่ใน DB และส่งเป็น binary WebP */
export function personnelImageUrl(idwkctr: string, ver?: number | string) {
  const v = ver != null ? `?v=${encodeURIComponent(String(ver))}` : ''
  const path = `/api/v1/personnel/${encodeURIComponent(idwkctr)}/image${v}`
  const base = getApiBaseUrl()
  return base ? `${base}${path}` : path
}

/** Personnel Confirmation dashboard (Admin) */
export async function fetchPersonnelConfirm(opts: {
  q?: string
  status?: 'all' | 'not_started' | 'in_progress' | 'done' | 'qc_pending'
  syst?: string[]
  limit?: number
  offset?: number
} = {}) {
  const qs = new URLSearchParams()
  if (opts.q) qs.set('q', opts.q)
  if (opts.status && opts.status !== 'all') qs.set('status', opts.status)
  if (opts.syst && opts.syst.length > 0) qs.set('syst', opts.syst.join(','))
  if (opts.limit != null) qs.set('limit', String(opts.limit))
  if (opts.offset != null) qs.set('offset', String(opts.offset))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const json = await fetchApi<unknown>(`/api/v1/personnel/admin/confirm${suffix}`)
  return personnelConfirmListResponseSchema.parse(json)
}

export type ReportsQuery = {
  from?: string
  to?: string
  weeksBack?: number
  team?: 'A' | 'B' | 'EE' | 'UT'
}

function reportsQueryString(opts?: ReportsQuery): string {
  const qs = new URLSearchParams()
  if (opts?.from) qs.set('from', opts.from)
  if (opts?.to) qs.set('to', opts.to)
  if (opts?.weeksBack != null) qs.set('weeksBack', String(opts.weeksBack))
  if (opts?.team) qs.set('team', opts.team)
  const suffix = qs.toString()
  return suffix ? `?${suffix}` : ''
}

export async function fetchKpi(opts?: ReportsQuery) {
  const json = await fetchApi<unknown>(`/api/v1/reports/kpi${reportsQueryString(opts)}`)
  return kpiResponseSchema.parse(json)
}

export async function fetchAuditHub() {
  const json = await fetchApi<unknown>('/api/v1/reports/audit-hub')
  return auditHubResponseSchema.parse(json)
}

export async function fetchSummaryWeekly(opts?: ReportsQuery) {
  const json = await fetchApi<unknown>(
    `/api/v1/reports/summary-weekly${reportsQueryString(opts)}`,
  )
  return summaryWeeklyResponseSchema.parse(json)
}

export type ActivityLogQuery = ReportsQuery & {
  q?: string
  limit?: number
  offset?: number
}

export async function fetchActivityLog(opts?: ActivityLogQuery) {
  const qs = new URLSearchParams()
  if (opts?.from) qs.set('from', opts.from)
  if (opts?.to) qs.set('to', opts.to)
  if (opts?.q) qs.set('q', opts.q)
  if (opts?.limit != null) qs.set('limit', String(opts.limit))
  if (opts?.offset != null) qs.set('offset', String(opts.offset))
  const suffix = qs.toString()
  const json = await fetchApi<unknown>(
    `/api/v1/reports/activity-log${suffix ? `?${suffix}` : ''}`,
  )
  return activityLogListResponseSchema.parse(json)
}

export async function fetchUsers() {
  const json = await fetchApi<unknown>('/api/v1/users')
  return usersResponseSchema.parse(json).items
}

export async function fetchUserLog(params?: { limit?: number; offset?: number }) {
  const sp = new URLSearchParams()
  if (typeof params?.limit === 'number') sp.set('limit', String(params.limit))
  if (typeof params?.offset === 'number') sp.set('offset', String(params.offset))
  const qs = sp.toString()
  const path = qs ? `/api/v1/user-log?${qs}` : '/api/v1/user-log'
  const json = await fetchApi<unknown>(path)
  return userLogResponseSchema.parse(json).items
}

export async function fetchWorkcenters() {
  const json = await fetchApi<unknown>('/api/v1/workcenters')
  return workcentersResponseSchema.parse(json).items
}

export async function fetchConfirmationByWorkOrder(wkorder: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/confirmation/by-wkorder/${encodeURIComponent(wkorder)}`,
  )
  return confirmationByWorkOrderResponseSchema.parse(json)
}

export async function fetchConfirmationExport() {
  const json = await fetchApi<unknown>('/api/v1/confirmation/export')
  return confirmationExportResponseSchema.parse(json)
}

export type ConfirmationPreviewStatus = 'pending' | 'rejected' | 'all'

export async function fetchConfirmationPreview(status: ConfirmationPreviewStatus = 'pending') {
  const qs = status === 'pending' ? '' : `?status=${encodeURIComponent(status)}`
  const json = await fetchApi<unknown>(`/api/v1/confirmation/preview${qs}`)
  return confirmationPreviewResponseSchema.parse(json)
}

function confirmExportQuery(idiw37n?: number[]): string {
  if (!idiw37n?.length) return ''
  return `?idiw37n=${encodeURIComponent(idiw37n.join(','))}`
}

export async function fetchConfirmationExportXlsx(idiw37n?: number[]): Promise<Blob> {
  const base = getApiBaseUrl()
  const p = `/api/v1/confirmation/export.xlsx${confirmExportQuery(idiw37n)}`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.blob()
}

/** SAP outbound CSV — same columns as export.xlsx template */
export async function fetchConfirmationExportCsv(idiw37n?: number[]): Promise<Blob> {
  const base = getApiBaseUrl()
  const p = `/api/v1/confirmation/export.csv${confirmExportQuery(idiw37n)}`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.blob()
}

export function confirmationSapCsvFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const min = pad(now.getMinutes())
  const s = pad(now.getSeconds())
  return `CONFIRM_OUT_${y}${m}${d}_${h}${min}${s}.csv`
}

export async function postConfirmationClose(body: {
  idiw37: number
  wkctr: string
  startD: string
  startT: string
  endD: string
  endT: string
}) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${body.idiw37}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wkctr: body.wkctr,
      startD: body.startD,
      startT: body.startT,
      endD: body.endD,
      endT: body.endT,
    }),
  })
  const ok = z.object({ ok: z.literal(true) }).safeParse(json)
  if (!ok.success) throw new Error('Unexpected response')
  return ok.data
}

/** Mass Confirm — สูงสุด 44 WO ต่อ batch (SAP) */
export async function postConfirmationMassClose(
  body: z.infer<typeof confirmationMassCloseBodySchema>,
) {
  const payload = confirmationMassCloseBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/confirmation/closes/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return confirmationMassCloseResponseSchema.parse(json)
}

export async function fetchMassConfirmExportSummary(idiw37n: number[]) {
  const json = await fetchApi<unknown>('/api/v1/confirmation/export/mass-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idiw37n }),
  })
  return massConfirmExportSummarySchema.parse(json)
}

export async function postConfirmQcApproveBatch(idiw37n: number[]) {
  const json = await fetchApi<unknown>('/api/v1/confirmation/qc/approve-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idiw37n }),
  })
  return qcApproveBatchResponseSchema.parse(json)
}

export async function deleteConfirmationClose(idclose: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/close/${idclose}`, {
    method: 'DELETE',
  })
  const ok = z.object({ ok: z.literal(true) }).safeParse(json)
  if (!ok.success) throw new Error('Unexpected response')
  return ok.data
}

export async function fetchPersonnelCloses(idiw37: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/personnel-closes`)
  return personnelClosesResponseSchema.parse(json).items
}

export async function postPersonnelClose(body: {
  idiw37: number
  wkctr: string
  startD: string
  startT: string
  endD: string
  endT: string
}) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${body.idiw37}/personnel-close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wkctr: body.wkctr,
      startD: body.startD,
      startT: body.startT,
      endD: body.endD,
      endT: body.endT,
    }),
  })
  const ok = z.object({ ok: z.literal(true) }).safeParse(json)
  if (!ok.success) throw new Error('Unexpected response')
  return ok.data
}

export async function deletePersonnelClose(idwrkclose: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/personnel-close/${idwrkclose}`, {
    method: 'DELETE',
  })
  const ok = z.object({ ok: z.literal(true) }).safeParse(json)
  if (!ok.success) throw new Error('Unexpected response')
  return ok.data
}

export async function postConfirmationImportPreview(file: File) {
  const form = new FormData()
  form.append('file', file)
  const json = await fetchApi<unknown>('/api/v1/confirmation/import/preview', {
    method: 'POST',
    body: form,
  })
  return confirmationImportPreviewResponseSchema.parse(json)
}

export async function postConfirmationImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  const json = await fetchApi<unknown>('/api/v1/confirmation/import', {
    method: 'POST',
    body: form,
  })
  return confirmationImportResponseSchema.parse(json)
}

export async function fetchConfirmationComments(idiw37: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/comments`)
  return confirmationCommentsResponseSchema.parse(json).items
}

export async function postConfirmationComment(idiw37: number, comdetail: string) {
  const payload = confirmationCommentBodySchema.parse({ comdetail })
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return confirmationCommentResponseSchema.parse(json).item
}

export async function putConfirmationComment(idcom: number, comdetail: string) {
  const payload = confirmationCommentBodySchema.parse({ comdetail })
  const json = await fetchApi<unknown>(`/api/v1/confirmation/comments/${idcom}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return confirmationCommentResponseSchema.parse(json).item
}

export async function deleteConfirmationComment(idcom: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/comments/${idcom}`, {
    method: 'DELETE',
  })
  const ok = z.object({ ok: z.literal(true) }).safeParse(json)
  if (!ok.success) throw new Error('Unexpected response')
  return ok.data
}

export async function fetchConfirmationImages(idiw37: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/images`)
  return confirmationImagesResponseSchema.parse(json).items
}

export type ConfirmationImagePhase = 'before' | 'after'

export async function postConfirmationImage(
  idiw37: number,
  file: File,
  opts: { phase: ConfirmationImagePhase; caption?: string },
) {
  const form = new FormData()
  form.append('file', file)
  form.append('phase', opts.phase)
  if (opts.caption?.trim()) form.append('caption', opts.caption.trim())
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/images`, {
    method: 'POST',
    body: form,
  })
  return confirmationImagesResponseSchema.parse(json).items[0]
}

export async function deleteConfirmationImage(idcimg: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/images/${idcimg}`, {
    method: 'DELETE',
  })
  const ok = z.object({ ok: z.literal(true) }).safeParse(json)
  if (!ok.success) throw new Error('Unexpected response')
  return ok.data
}

export async function fetchConfirmationImageData(idcimg: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/images/${idcimg}/data`)
  return confirmationImageDataResponseSchema.parse(json)
}

export async function fetchConfirmQc(idiw37: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/qc`)
  return z.object({ qc: confirmQcSnapshotSchema }).parse(json).qc
}

export async function fetchConfirmQcPending(limit = 50) {
  const json = await fetchApi<unknown>(
    `/api/v1/confirmation/qc/pending?limit=${encodeURIComponent(String(limit))}`,
  )
  return z.object({ items: z.array(confirmQcPendingItemSchema) }).parse(json).items
}

export async function postConfirmQcApprove(idiw37: number) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/qc/approve`, {
    method: 'POST',
  })
  return z.object({ qc: confirmQcSnapshotSchema }).parse(json).qc
}

export async function postConfirmQcReject(idiw37: number, note?: string) {
  const json = await fetchApi<unknown>(`/api/v1/confirmation/${idiw37}/qc/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: note ?? '' }),
  })
  return z.object({ qc: confirmQcSnapshotSchema }).parse(json).qc
}

export async function fetchNotifications() {
  const json = await fetchApi<unknown>('/api/v1/notifications')
  return appNotificationsResponseSchema.parse(json)
}

export async function markNotificationRead(id: number) {
  const json = await fetchApi<unknown>(`/api/v1/notifications/${id}/read`, { method: 'POST' })
  return z.object({ ok: z.boolean() }).parse(json)
}

export async function markAllNotificationsRead() {
  const json = await fetchApi<unknown>('/api/v1/notifications/read-all', { method: 'POST' })
  return z.object({ ok: z.literal(true), count: z.number().int().nonnegative() }).parse(json)
}
