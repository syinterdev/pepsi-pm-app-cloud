import type { ActivityTypeItem } from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import {
  isPmMasterProcessFileName,
  parsePmMasterProcessWorkbook,
  pmMasterRowsToTasklistImport,
} from '@/lib/pm-master-process'
import { z } from 'zod'

const activityTypeItemSchema = z.object({
  id: z.string(),
  mat: z.string(),
  matdescrip: z.string(),
  matcheck: z.string(),
})

const departmentItemSchema = z.object({
  id: z.string(),
  iddepartment: z.string(),
  department: z.string(),
})

const equipmentItemSchema = z.object({
  id: z.string(),
  equipment: z.string(),
  equdescrip: z.string(),
  equipmentsub: z.string(),
  functionalloc: z.string(),
  equl: z.string(),
  equ1: z.string(),
  equea: z.string(),
})

const functionalItemSchema = z.object({
  id: z.string(),
  functionalloc: z.string(),
  funldescrip: z.string(),
  functionallocsub: z.string(),
})

const reasonItemSchema = z.object({
  id: z.string(),
  reasoncode: z.string(),
  reasonname: z.string(),
})

const workStatusItemSchema = z.object({
  id: z.string(),
  syst: z.string(),
  wkstreason: z.string(),
  wkstcolor: z.string(),
})

const workTypeItemSchema = z.object({
  id: z.string(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
})

const zbItemSchema = z.object({
  id: z.string(),
  wkzb: z.string(),
  zbdescrip: z.string(),
})

const lineProductItemSchema = z.object({
  id: z.string(),
  productline: z.string(),
  prolinedescrip: z.string(),
})

const zoneItemSchema = z.object({
  id: z.string(),
  idzone: z.string(),
  zone: z.string(),
  zonedescrip: z.string(),
  idproductline: z.string(),
  productline: z.string(),
})

const machineItemSchema = z.object({
  id: z.string(),
  machine: z.string(),
  idzone: z.string(),
  zone: z.string(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
})

const materialItemSchema = z.object({
  id: z.string(),
  idmaterial: z.number(),
  wkorder: z.string(),
  matdoc: z.string(),
  entrydate: z.string(),
  matpo: z.string(),
  pstngdate: z.string(),
  docdate: z.string(),
  materialdesc: z.string(),
  matquantity: z.number(),
  matbun: z.string(),
  amountinlc: z.number(),
  crcy: z.string(),
  mvt: z.string(),
  costctr: z.string(),
  mattime: z.string(),
  matyr: z.string(),
  material: z.string(),
})

const levelItemSchema = z.object({
  id: z.string(),
  idwklevel: z.string(),
  wklevel: z.string(),
})

const positionItemSchema = z.object({
  id: z.string(),
  idposition: z.string(),
  position: z.string(),
})

const groupItemSchema = z.object({
  id: z.string(),
  idwkctrgroup: z.number(),
  wkctrgroup: z.string(),
  wkctrdescription: z.string(),
})

const tasklistItemSchema = z.object({
  id: z.string(),
  idtasklist: z.number(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
  idzone: z.string(),
  zone: z.string(),
  idmachine: z.string(),
  mntplan: z.string(),
  tasklist: z.string(),
  legacy: z.string(),
  machine: z.string(),
  pmlist: z.string(),
  pmday: z.number(),
  machinestatus: z.number(),
  pmmin: z.number(),
  pmman: z.number(),
  manhour: z.number(),
  mat: z.string(),
  runhr: z.number(),
  mpoint: z.string(),
  bcprunhr: z.number(),
  gls: z.string(),
  ment: z.string(),
  freqhour: z.number(),
  plan: z.string(),
})

const lineSchdulItemSchema = z.object({
  id: z.string(),
  idline: z.number(),
  idproductline: z.string(),
  productline: z.string(),
  lineday: z.number(),
  uptime: z.number(),
  linereason: z.string(),
})

const importResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
})

const equipmentImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

const functionalImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

const tasklistImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

const lineSchdulImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export type ActivityTypeInput = {
  mat: string
  matdescrip?: string
  matcheck?: string
}

export async function createActivityType(body: ActivityTypeInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/activitytype', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return activityTypeItemSchema.parse(
    (json as { item: unknown }).item,
  ) as ActivityTypeItem
}

export async function updateActivityType(
  mat: string,
  body: { matdescrip?: string; matcheck?: string },
) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/activitytype/${encodeURIComponent(mat)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return activityTypeItemSchema.parse(
    (json as { item: unknown }).item,
  ) as ActivityTypeItem
}

export async function deleteActivityType(mat: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/activitytype/${encodeURIComponent(mat)}`,
    { method: 'DELETE' },
  )
}

export async function importActivityTypes(rows: ActivityTypeInput[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/activitytype/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return importResultSchema.parse(json)
}

/** แปลงข้อความ CSV (mat,description,check) แบบ M_activitytype import */
export function parseActivityTypeCsv(text: string): ActivityTypeInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: ActivityTypeInput[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /^mat\b/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0]) continue
    rows.push({
      mat: parts[0],
      matdescrip: parts[1] ?? '',
      matcheck: parts[2] ?? '',
    })
  }
  return rows
}

function normalizeHeader(v: unknown) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_-]+/g, '')
}

function parseActivityTypeSheetRows(values: unknown[][]): ActivityTypeInput[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))

  if (raw.length === 0) return []

  const header0 = raw[0].map(normalizeHeader)
  const hasHeader =
    header0.includes('mat') ||
    header0.includes('matdescrip') ||
    header0.includes('description') ||
    header0.includes('matcheck') ||
    header0.includes('check')

  const idx = {
    mat: -1,
    matdescrip: -1,
    matcheck: -1,
  }

  if (hasHeader) {
    for (let i = 0; i < header0.length; i++) {
      const h = header0[i]
      if (idx.mat === -1 && (h === 'mat' || h === 'code')) idx.mat = i
      if (
        idx.matdescrip === -1 &&
        (h === 'matdescrip' || h === 'description' || h === 'descrip')
      ) {
        idx.matdescrip = i
      }
      if (idx.matcheck === -1 && (h === 'matcheck' || h === 'check' || h === 'active')) {
        idx.matcheck = i
      }
    }
  }

  const startRow = hasHeader ? 1 : 0
  const rows: ActivityTypeInput[] = []
  for (let r = startRow; r < raw.length; r++) {
    const row = raw[r]
    const mat = hasHeader ? (row[idx.mat] ?? '') : (row[0] ?? '')
    if (!mat) continue
    const matdescrip = hasHeader ? (row[idx.matdescrip] ?? '') : (row[1] ?? '')
    const matcheck = hasHeader ? (row[idx.matcheck] ?? '') : (row[2] ?? '')
    rows.push({ mat, matdescrip, matcheck })
  }

  return rows
}

export async function parseActivityTypeFile(file: File): Promise<ActivityTypeInput[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) {
    const text = await file.text()
    return parseActivityTypeCsv(text)
  }

  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsm') ||
    name.endsWith('.xlsb')
  ) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const firstSheetName = wb.SheetNames[0]
    const ws = wb.Sheets[firstSheetName]
    const values = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as unknown[][]
    const afterTwoRows = values.slice(2)
    return parseActivityTypeSheetRows(afterTwoRows)
  }

  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type DepartmentInput = {
  iddepartment: string
  department: string
}

export async function createDepartment(body: DepartmentInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/department', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return departmentItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function updateDepartment(
  iddepartment: string,
  body: { department?: string },
) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/department/${encodeURIComponent(iddepartment)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return departmentItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function deleteDepartment(iddepartment: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/department/${encodeURIComponent(iddepartment)}`,
    { method: 'DELETE' },
  )
}

export type EquipmentInput = {
  equipment: string
  equdescrip: string
  equipmentsub?: string
  functionalloc?: string
  equl?: string
  equ1?: string
  equea?: string
}

export async function createEquipment(body: EquipmentInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/equipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return equipmentItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function updateEquipment(
  equipment: string,
  body: Omit<EquipmentInput, 'equipment'>,
) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/equipment/${encodeURIComponent(equipment)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return equipmentItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function deleteEquipment(equipment: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/equipment/${encodeURIComponent(equipment)}`,
    { method: 'DELETE' },
  )
}

export async function importEquipments(rows: EquipmentInput[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/equipment/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return equipmentImportResultSchema.parse(json)
}

export function parseEquipmentCsv(text: string): EquipmentInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: EquipmentInput[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /^equipment\b/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0] || !parts[1]) continue
    rows.push({
      equipment: parts[0],
      equdescrip: parts[1],
      equipmentsub: parts[2] ?? '',
      functionalloc: parts[3] ?? '',
      equl: parts[4] ?? '',
      equ1: parts[5] ?? '',
      equea: parts[6] ?? '',
    })
  }
  return rows
}

function parseEquipmentSheetRows(values: unknown[][]): EquipmentInput[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))

  if (raw.length === 0) return []

  const header0 = raw[0].map(normalizeHeader)
  const hasHeader = header0.includes('equipment') || header0.includes('equdescrip') || header0.includes('description')

  const idx = {
    equipment: -1,
    equdescrip: -1,
    equipmentsub: -1,
    functionalloc: -1,
    equl: -1,
    equ1: -1,
    equea: -1,
  }

  if (hasHeader) {
    for (let i = 0; i < header0.length; i++) {
      const h = header0[i]
      if (idx.equipment === -1 && h === 'equipment') idx.equipment = i
      if (idx.equdescrip === -1 && (h === 'equdescrip' || h === 'description')) idx.equdescrip = i
      if (idx.equipmentsub === -1 && h === 'equipmentsub') idx.equipmentsub = i
      if (idx.functionalloc === -1 && (h === 'functionalloc' || h === 'functionalloc.')) idx.functionalloc = i
      if (idx.equl === -1 && h === 'equl') idx.equl = i
      if (idx.equ1 === -1 && h === 'equ1') idx.equ1 = i
      if (idx.equea === -1 && h === 'equea') idx.equea = i
    }
  }

  const startRow = hasHeader ? 1 : 0
  const rows: EquipmentInput[] = []
  for (let r = startRow; r < raw.length; r++) {
    const row = raw[r]
    const equipment = hasHeader ? (row[idx.equipment] ?? '') : (row[0] ?? '')
    const equdescrip = hasHeader ? (row[idx.equdescrip] ?? '') : (row[1] ?? '')
    if (!equipment || !equdescrip) continue
    const equipmentsub = hasHeader ? (row[idx.equipmentsub] ?? '') : (row[2] ?? '')
    const functionalloc = hasHeader ? (row[idx.functionalloc] ?? '') : (row[3] ?? '')
    const equl = hasHeader ? (row[idx.equl] ?? '') : (row[4] ?? '')
    const equ1 = hasHeader ? (row[idx.equ1] ?? '') : (row[5] ?? '')
    const equea = hasHeader ? (row[idx.equea] ?? '') : (row[6] ?? '')
    rows.push({
      equipment,
      equdescrip,
      equipmentsub,
      functionalloc,
      equl,
      equ1,
      equea,
    })
  }

  return rows
}

export async function parseEquipmentFile(file: File): Promise<EquipmentInput[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) {
    const text = await file.text()
    return parseEquipmentCsv(text)
  }

  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsm') ||
    name.endsWith('.xlsb')
  ) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const firstSheetName = wb.SheetNames[0]
    const ws = wb.Sheets[firstSheetName]
    const values = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as unknown[][]
    const afterTwoRows = values.slice(2)
    return parseEquipmentSheetRows(afterTwoRows)
  }

  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type FunctionalInput = {
  functionalloc: string
  funldescrip: string
  functionallocsub?: string
}

export async function createFunctional(body: FunctionalInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/functional', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return functionalItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function updateFunctional(
  functionalloc: string,
  body: { funldescrip: string; functionallocsub?: string },
) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/functional/${encodeURIComponent(functionalloc)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return functionalItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function deleteFunctional(functionalloc: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/functional/${encodeURIComponent(functionalloc)}`,
    { method: 'DELETE' },
  )
}

export async function importFunctionals(rows: FunctionalInput[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/functional/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return functionalImportResultSchema.parse(json)
}

export function parseFunctionalCsv(text: string): FunctionalInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: FunctionalInput[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /^functionalloc\b/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0] || !parts[1]) continue
    rows.push({
      functionalloc: parts[0],
      funldescrip: parts[1],
      functionallocsub: parts[2] ?? '',
    })
  }
  return rows
}

function parseFunctionalSheetRows(values: unknown[][]): FunctionalInput[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))

  if (raw.length === 0) return []

  const header0 = raw[0].map(normalizeHeader)
  const hasHeader =
    header0.includes('functionalloc') ||
    header0.includes('funldescrip') ||
    header0.includes('description')

  const idx = {
    functionalloc: -1,
    funldescrip: -1,
    functionallocsub: -1,
  }

  if (hasHeader) {
    for (let i = 0; i < header0.length; i++) {
      const h = header0[i]
      if (idx.functionalloc === -1 && h === 'functionalloc') idx.functionalloc = i
      if (
        idx.funldescrip === -1 &&
        (h === 'funldescrip' || h === 'description')
      ) {
        idx.funldescrip = i
      }
      if (idx.functionallocsub === -1 && h === 'functionallocsub') idx.functionallocsub = i
    }
  }

  const startRow = hasHeader ? 1 : 0
  const rows: FunctionalInput[] = []
  for (let r = startRow; r < raw.length; r++) {
    const row = raw[r]
    const functionalloc = hasHeader ? (row[idx.functionalloc] ?? '') : (row[0] ?? '')
    const funldescrip = hasHeader ? (row[idx.funldescrip] ?? '') : (row[1] ?? '')
    if (!functionalloc || !funldescrip) continue
    const functionallocsub = hasHeader ? (row[idx.functionallocsub] ?? '') : (row[2] ?? '')
    rows.push({
      functionalloc,
      funldescrip,
      functionallocsub,
    })
  }

  return rows
}

export async function parseFunctionalFile(file: File): Promise<FunctionalInput[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) {
    const text = await file.text()
    return parseFunctionalCsv(text)
  }

  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsm') ||
    name.endsWith('.xlsb')
  ) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const firstSheetName = wb.SheetNames[0]
    const ws = wb.Sheets[firstSheetName]
    const values = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as unknown[][]
    const afterTwoRows = values.slice(2)
    return parseFunctionalSheetRows(afterTwoRows)
  }

  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type ReasonInput = {
  reasoncode: string
  reasonname: string
}

export async function createReason(body: ReasonInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/reason', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return reasonItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function updateReason(reasoncode: string, body: { reasonname: string }) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/reason/${encodeURIComponent(reasoncode)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return reasonItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function deleteReason(reasoncode: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/reason/${encodeURIComponent(reasoncode)}`,
    { method: 'DELETE' },
  )
}

export type WorkStatusInput = {
  syst: string
  wkstreason: string
  wkstcolor: string
}

export async function createWorkStatus(body: WorkStatusInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/workstatus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return workStatusItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function updateWorkStatus(
  syst: string,
  body: { wkstreason: string; wkstcolor: string },
) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/workstatus/${encodeURIComponent(syst)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return workStatusItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function deleteWorkStatus(syst: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/workstatus/${encodeURIComponent(syst)}`,
    { method: 'DELETE' },
  )
}

export type WorkTypeInput = {
  idwkctrtype: string
  wkctrtype: string
}

export async function createWorkType(body: WorkTypeInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/worktype', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return workTypeItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function updateWorkType(idwkctrtype: string, body: { wkctrtype: string }) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/worktype/${encodeURIComponent(idwkctrtype)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return workTypeItemSchema.parse(
    (json as { item: unknown }).item,
  )
}

export async function deleteWorkType(idwkctrtype: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/worktype/${encodeURIComponent(idwkctrtype)}`,
    { method: 'DELETE' },
  )
}

export type ZbInput = { wkzb: string; zbdescrip: string }

export async function createZb(body: ZbInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/zb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return zbItemSchema.parse((json as { item: unknown }).item)
}

export async function updateZb(wkzb: string, body: { zbdescrip: string }) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/zb/${encodeURIComponent(wkzb)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return zbItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteZb(wkzb: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/zb/${encodeURIComponent(wkzb)}`,
    { method: 'DELETE' },
  )
}

export type LevelInput = { idwklevel: string; wklevel: string }

export async function createLevel(body: LevelInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return levelItemSchema.parse((json as { item: unknown }).item)
}

export async function updateLevel(idwklevel: string, body: { wklevel: string }) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/level/${encodeURIComponent(idwklevel)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return levelItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteLevel(idwklevel: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/level/${encodeURIComponent(idwklevel)}`,
    { method: 'DELETE' },
  )
}

export type PositionInput = { idposition: string; position: string }

export async function createPosition(body: PositionInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return positionItemSchema.parse((json as { item: unknown }).item)
}

export async function updatePosition(idposition: string, body: { position: string }) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/position/${encodeURIComponent(idposition)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return positionItemSchema.parse((json as { item: unknown }).item)
}

export async function deletePosition(idposition: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/position/${encodeURIComponent(idposition)}`,
    { method: 'DELETE' },
  )
}

export type GroupInput = { wkctrgroup: string; wkctrdescription?: string }

export async function createGroup(body: GroupInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return groupItemSchema.parse((json as { item: unknown }).item)
}

export async function updateGroup(
  idwkctrgroup: number,
  body: { wkctrgroup?: string; wkctrdescription?: string },
) {
  const json = await fetchApi<unknown>(`/api/v1/master-data/group/${idwkctrgroup}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return groupItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteGroup(idwkctrgroup: number) {
  await fetchApi<unknown>(`/api/v1/master-data/group/${idwkctrgroup}`, { method: 'DELETE' })
}

export type TasklistInput = {
  idwkctrtype: string
  idzone: string
  idmachine?: string
  mntplan: string
  tasklist: string
  legacy: string
  machine: string
  pmlist: string
  pmday?: number
  machinestatus?: number
  pmmin?: number
  pmman?: number
  manhour?: number
  mat?: string
  runhr?: number
  mpoint?: string
  bcprunhr?: number
  gls?: string
  ment?: string
  freqhour?: number
  plan?: string
}

export async function createTasklist(body: TasklistInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/tasklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return tasklistItemSchema.parse((json as { item: unknown }).item)
}

export async function updateTasklist(idtasklist: number, body: Partial<TasklistInput>) {
  const json = await fetchApi<unknown>(`/api/v1/master-data/tasklist/${idtasklist}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return tasklistItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteTasklist(idtasklist: number) {
  await fetchApi<unknown>(`/api/v1/master-data/tasklist/${idtasklist}`, { method: 'DELETE' })
}

export type TasklistImportRow = {
  wkctrtype: string
  zone: string
  machineList: string
  mntplan: string
  tasklist: string
  legacy: string
  machine: string
  pmlist: string
  pmday?: number
  machinestatus?: number
  pmmin?: number
  pmman?: number
  manhour?: number
  mat?: string
  runhr?: number
  mpoint?: string
  bcprunhr?: number
  gls?: string
  ment?: string
  freqhour?: number
  plan?: string
}

export async function importTasklists(rows: TasklistImportRow[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/tasklist/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return tasklistImportResultSchema.parse(json)
}

function toNum(v: unknown): number | undefined {
  if (v == null) return undefined
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : undefined
}

export function parseTasklistCsv(text: string): TasklistImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: TasklistImportRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /wkctrtype|type/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0] || !parts[1] || !parts[2] || !parts[3] || !parts[4] || !parts[5] || !parts[6] || !parts[7]) {
      continue
    }
    rows.push({
      wkctrtype: parts[0],
      zone: parts[1],
      machineList: parts[2],
      mntplan: parts[3],
      tasklist: parts[4],
      legacy: parts[5],
      machine: parts[6],
      pmlist: parts[7],
      pmday: toNum(parts[8]),
      machinestatus: toNum(parts[9]),
      pmmin: toNum(parts[10]),
      pmman: toNum(parts[11]),
      manhour: toNum(parts[12]),
      mat: parts[13] ?? '',
      runhr: toNum(parts[14]),
      mpoint: parts[15] ?? '',
      bcprunhr: toNum(parts[16]),
      gls: parts[17] ?? '',
      ment: parts[18] ?? '',
      freqhour: toNum(parts[19]),
      plan: parts[20] ?? '',
    })
  }
  return rows
}

function parseTasklistSheetRows(values: unknown[][]): TasklistImportRow[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))
  const rows: TasklistImportRow[] = []
  for (const row of raw) {
    const wkctrtype = String(row[0] ?? '').trim()
    const zone = String(row[1] ?? '').trim()
    const machineList = String(row[2] ?? '').trim()
    const mntplan = String(row[3] ?? '').trim()
    const tasklist = String(row[4] ?? '').trim()
    const legacy = String(row[5] ?? '').trim()
    const machine = String(row[6] ?? '').trim()
    const pmlist = String(row[7] ?? '').trim()
    if (!wkctrtype || !zone || !machineList || !mntplan || !tasklist || !legacy || !machine || !pmlist) continue
    rows.push({
      wkctrtype,
      zone,
      machineList,
      mntplan,
      tasklist,
      legacy,
      machine,
      pmlist,
      pmday: toNum(row[8]),
      machinestatus: toNum(row[9]),
      pmmin: toNum(row[10]),
      pmman: toNum(row[11]),
      manhour: toNum(row[12]),
      mat: String(row[13] ?? '').trim(),
      runhr: toNum(row[14]),
      mpoint: String(row[15] ?? '').trim(),
      bcprunhr: toNum(row[16]),
      gls: String(row[17] ?? '').trim(),
      ment: String(row[18] ?? '').trim(),
      freqhour: toNum(row[19]),
      plan: String(row[20] ?? '').trim(),
    })
  }
  return rows
}

export async function parseTasklistFile(file: File): Promise<TasklistImportRow[]> {
  const name = (file.name || '').toLowerCase()
  if (isPmMasterProcessFileName(file.name)) {
    const parsed = await parsePmMasterProcessWorkbook(file)
    const discipline = name.includes('packing')
      ? 'PK'
      : name.includes('process me') || name.includes(' me 20')
        ? 'ME'
        : 'EE'
    return pmMasterRowsToTasklistImport(parsed.rows, discipline)
  }
  if (name.endsWith('.csv')) return parseTasklistCsv(await file.text())
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as unknown[][]
    return parseTasklistSheetRows(values.slice(2))
  }
  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type LineSchdulInput = {
  idproductline: string
  lineday: number
  uptime?: number
  linereason?: string
}

export async function createLineSchdul(body: LineSchdulInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/lineschdul', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return lineSchdulItemSchema.parse((json as { item: unknown }).item)
}

export async function updateLineSchdul(idline: number, body: Partial<LineSchdulInput>) {
  const json = await fetchApi<unknown>(`/api/v1/master-data/lineschdul/${idline}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return lineSchdulItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteLineSchdul(idline: number) {
  await fetchApi<unknown>(`/api/v1/master-data/lineschdul/${idline}`, { method: 'DELETE' })
}

export type LineSchdulImportRow = {
  productline: string
  lineday: number
  uptime?: number
  linereason?: string
}

export async function importLineSchduls(rows: LineSchdulImportRow[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/lineschdul/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return lineSchdulImportResultSchema.parse(json)
}

export function formatEpochSecondsToDdMmYyyy(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return ''
  const d = new Date(sec * 1000)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${dd}.${mm}.${yyyy}`
}

function parseDdMmYyyyToEpochSeconds(v: string): number | null {
  const s = v.trim()
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s)
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null
  const dt = new Date(yyyy, mm - 1, dd)
  if (!Number.isFinite(dt.getTime())) return null
  return Math.floor(dt.getTime() / 1000)
}

export function parseLineSchdulCsv(text: string): LineSchdulImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: LineSchdulImportRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /productline|lineday|uptime/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    const productline = parts[0] ?? ''
    const dateText = parts[1] ?? ''
    if (!productline.trim() || !dateText.trim()) continue
    const lineday = parseDdMmYyyyToEpochSeconds(dateText)
    if (!lineday) continue
    const uptime = parts[2] != null && parts[2].trim() !== '' ? Number(parts[2]) : undefined
    const linereason = parts[3] ?? ''
    rows.push({
      productline: productline.trim(),
      lineday,
      uptime: uptime != null && Number.isFinite(uptime) ? uptime : undefined,
      linereason: linereason.trim(),
    })
  }
  return rows
}

function parseLineSchdulSheetRows(
  values: unknown[][],
  toEpochSeconds: (cell: unknown) => number | null,
): LineSchdulImportRow[] {
  const raw = values
    .map((r) => r.map((c) => c ?? ''))
    .filter((r) => r.some((c) => String(c).trim() !== ''))
  const rows: LineSchdulImportRow[] = []
  for (const row of raw) {
    const productline = String(row[0] ?? '').trim()
    const lineday = toEpochSeconds(row[1])
    if (!productline || !lineday) continue
    const uptime = row[2] != null && String(row[2]).trim() !== '' ? Number(String(row[2]).trim()) : undefined
    const linereason = String(row[3] ?? '').trim()
    rows.push({
      productline,
      lineday,
      uptime: uptime != null && Number.isFinite(uptime) ? uptime : undefined,
      linereason,
    })
  }
  return rows
}

export async function parseLineSchdulFile(file: File): Promise<LineSchdulImportRow[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) return parseLineSchdulCsv(await file.text())
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as unknown[][]
    const toEpochSeconds = (cell: unknown): number | null => {
      if (cell == null) return null
      if (typeof cell === 'number' && Number.isFinite(cell)) {
        const parsed = (XLSX as unknown as { SSF: { parse_date_code: (n: number) => { y: number; m: number; d: number } | null } }).SSF.parse_date_code(cell)
        if (!parsed) return null
        const dt = new Date(parsed.y, parsed.m - 1, parsed.d)
        return Number.isFinite(dt.getTime()) ? Math.floor(dt.getTime() / 1000) : null
      }
      const s = String(cell).trim()
      if (!s) return null
      const ddmmyyyy = parseDdMmYyyyToEpochSeconds(s)
      if (ddmmyyyy) return ddmmyyyy
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
      if (m) {
        const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
        return Number.isFinite(dt.getTime()) ? Math.floor(dt.getTime() / 1000) : null
      }
      return null
    }
    return parseLineSchdulSheetRows(values.slice(2), toEpochSeconds)
  }
  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type LineProductInput = { productline: string; prolinedescrip: string }

export async function createLineProduct(body: LineProductInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/lineproduct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return lineProductItemSchema.parse((json as { item: unknown }).item)
}

export async function updateLineProduct(productline: string, body: { prolinedescrip: string }) {
  const json = await fetchApi<unknown>(
    `/api/v1/master-data/lineproduct/${encodeURIComponent(productline)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return lineProductItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteLineProduct(productline: string) {
  await fetchApi<unknown>(
    `/api/v1/master-data/lineproduct/${encodeURIComponent(productline)}`,
    { method: 'DELETE' },
  )
}

export async function importLineProducts(rows: LineProductInput[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/lineproduct/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return z
    .object({ inserted: z.number(), updated: z.number(), skipped: z.number(), failed: z.number() })
    .parse(json)
}

export function parseLineProductCsv(text: string): LineProductInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: LineProductInput[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /^productline\b/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0]) continue
    rows.push({ productline: parts[0], prolinedescrip: parts[1] ?? '' })
  }
  return rows
}

function parseLineProductSheetRows(values: unknown[][]): LineProductInput[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))
  if (raw.length === 0) return []
  const header0 = raw[0].map(normalizeHeader)
  const hasHeader = header0.includes('productline') || header0.includes('prolinedescrip') || header0.includes('description')
  const idx = { productline: -1, prolinedescrip: -1 }
  if (hasHeader) {
    for (let i = 0; i < header0.length; i++) {
      const h = header0[i]
      if (idx.productline === -1 && (h === 'productline' || h === 'code')) idx.productline = i
      if (idx.prolinedescrip === -1 && (h === 'prolinedescrip' || h === 'description' || h === 'descrip')) idx.prolinedescrip = i
    }
  }
  const startRow = hasHeader ? 1 : 0
  const rows: LineProductInput[] = []
  for (let r = startRow; r < raw.length; r++) {
    const row = raw[r]
    const productline = hasHeader ? (row[idx.productline] ?? '') : (row[0] ?? '')
    if (!productline) continue
    const prolinedescrip = hasHeader ? (row[idx.prolinedescrip] ?? '') : (row[1] ?? '')
    rows.push({ productline, prolinedescrip })
  }
  return rows
}

export async function parseLineProductFile(file: File): Promise<LineProductInput[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) return parseLineProductCsv(await file.text())
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as unknown[][]
    return parseLineProductSheetRows(values.slice(2))
  }
  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type ZoneInput = { idzone: string; zone: string; zonedescrip?: string; idproductline?: string }

export async function createZone(body: ZoneInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/zone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return zoneItemSchema.parse((json as { item: unknown }).item)
}

export async function updateZone(
  idzone: string,
  body: { zone?: string; zonedescrip?: string; idproductline?: string },
) {
  const json = await fetchApi<unknown>(`/api/v1/master-data/zone/${encodeURIComponent(idzone)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return zoneItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteZone(idzone: string) {
  await fetchApi<unknown>(`/api/v1/master-data/zone/${encodeURIComponent(idzone)}`, { method: 'DELETE' })
}

export type ZoneImportRow = { zone: string; zonedescrip?: string; productline?: string }

export async function importZones(rows: ZoneImportRow[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/zone/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return functionalImportResultSchema.parse(json)
}

export function parseZoneCsv(text: string): ZoneImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: ZoneImportRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /zone/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0]) continue
    rows.push({
      zone: parts[0],
      zonedescrip: parts[1] ?? '',
      productline: parts[2] ?? '',
    })
  }
  return rows
}

function parseZoneSheetRows(values: unknown[][]): ZoneImportRow[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))
  const rows: ZoneImportRow[] = []
  for (const row of raw) {
    const zone = String(row[0] ?? '').trim()
    if (!zone) continue
    rows.push({
      zone,
      zonedescrip: String(row[1] ?? '').trim(),
      productline: String(row[2] ?? '').trim(),
    })
  }
  return rows
}

export async function parseZoneFile(file: File): Promise<ZoneImportRow[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) return parseZoneCsv(await file.text())
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as unknown[][]
    return parseZoneSheetRows(values.slice(2))
  }
  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type MachineInput = { machine: string; idzone?: string; idwkctrtype?: string }
export type MachineImportRow = { machine: string; zone?: string; wkctrtype?: string }

export async function createMachine(body: MachineInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/machine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return machineItemSchema.parse((json as { item: unknown }).item)
}

export async function updateMachine(machine: string, body: { idzone?: string; idwkctrtype?: string }) {
  const json = await fetchApi<unknown>(`/api/v1/master-data/machine/${encodeURIComponent(machine)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return machineItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteMachine(machine: string) {
  await fetchApi<unknown>(`/api/v1/master-data/machine/${encodeURIComponent(machine)}`, { method: 'DELETE' })
}

export async function importMachines(rows: MachineImportRow[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/machine/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return z
    .object({ inserted: z.number(), updated: z.number(), skipped: z.number(), failed: z.number() })
    .parse(json)
}

export function parseMachineCsv(text: string): MachineImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: MachineImportRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /^machine\b/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    if (!parts[0]) continue
    rows.push({ machine: parts[0], zone: parts[1] ?? '', wkctrtype: parts[2] ?? '' })
  }
  return rows
}

function parseMachineSheetRows(values: unknown[][]): MachineImportRow[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))
  if (raw.length === 0) return []
  const header0 = raw[0].map(normalizeHeader)
  const hasHeader = header0.includes('machine') || header0.includes('zone') || header0.includes('wkctrtype') || header0.includes('type')
  const idx = { machine: -1, zone: -1, wkctrtype: -1 }
  if (hasHeader) {
    for (let i = 0; i < header0.length; i++) {
      const h = header0[i]
      if (idx.machine === -1 && h === 'machine') idx.machine = i
      if (idx.zone === -1 && h === 'zone') idx.zone = i
      if (idx.wkctrtype === -1 && (h === 'wkctrtype' || h === 'type')) idx.wkctrtype = i
    }
  }
  const startRow = hasHeader ? 1 : 0
  const rows: MachineImportRow[] = []
  for (let r = startRow; r < raw.length; r++) {
    const row = raw[r]
    const machine = hasHeader ? (row[idx.machine] ?? '') : (row[0] ?? '')
    if (!machine) continue
    const zone = hasHeader ? (row[idx.zone] ?? '') : (row[1] ?? '')
    const wkctrtype = hasHeader ? (row[idx.wkctrtype] ?? '') : (row[2] ?? '')
    rows.push({ machine, zone, wkctrtype })
  }
  return rows
}

export async function parseMachineFile(file: File): Promise<MachineImportRow[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) return parseMachineCsv(await file.text())
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as unknown[][]
    return parseMachineSheetRows(values.slice(2))
  }
  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}

export type MaterialInput = {
  wkorder: string
  matdoc?: string
  entrydate?: string
  matpo?: string
  pstngdate: string
  docdate?: string
  materialdesc: string
  matquantity?: number
  matbun?: string
  amountinlc: number
  crcy?: string
  mvt: string
  costctr?: string
  mattime?: string
  matyr?: string
  material?: string
}

export async function createMaterial(body: MaterialInput) {
  const json = await fetchApi<unknown>('/api/v1/master-data/material', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return materialItemSchema.parse((json as { item: unknown }).item)
}

export async function updateMaterial(idmaterial: number, body: Partial<MaterialInput>) {
  const json = await fetchApi<unknown>(`/api/v1/master-data/material/${idmaterial}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return materialItemSchema.parse((json as { item: unknown }).item)
}

export async function deleteMaterial(idmaterial: number) {
  await fetchApi<unknown>(`/api/v1/master-data/material/${idmaterial}`, { method: 'DELETE' })
}

export async function importMaterials(rows: MaterialInput[]) {
  const json = await fetchApi<unknown>('/api/v1/master-data/material/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  return z
    .object({ inserted: z.number(), updated: z.number(), skipped: z.number(), failed: z.number() })
    .parse(json)
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

export function formatIsoDateToDdMmYyyy(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso
  return `${m[3]}.${m[2]}.${m[1]}`
}

export function parseDdMmYyyyToIso(v: string): string | null {
  const s = v.trim()
  if (!s) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (iso) return s
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  if (!Number.isFinite(d) || !Number.isFinite(mo) || !Number.isFinite(y)) return null
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return `${y}-${pad2(mo)}-${pad2(d)}`
}

function parseExcelCellToIsoDate(cell: unknown, XLSX: any): string | null {
  if (cell == null) return null
  if (typeof cell === 'number') {
    const dc = XLSX?.SSF?.parse_date_code?.(cell)
    if (!dc || !dc.y || !dc.m || !dc.d) return null
    return `${dc.y}-${pad2(dc.m)}-${pad2(dc.d)}`
  }
  return parseDdMmYyyyToIso(String(cell))
}

export function parseMaterialCsv(text: string): MaterialInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: MaterialInput[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && /^wkorder\b/i.test(line)) continue
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''))
    const wkorder = parts[0] ?? ''
    const pstngdate = parseDdMmYyyyToIso(parts[4] ?? '') ?? (parts[4] ?? '')
    const materialdesc = parts[6] ?? ''
    const amountinlc = Number(parts[9] ?? NaN)
    const mvt = parts[11] ?? ''
    if (!wkorder || !pstngdate || !materialdesc || !Number.isFinite(amountinlc) || !mvt) continue
    rows.push({
      wkorder,
      matdoc: parts[1] ?? '',
      entrydate: parseDdMmYyyyToIso(parts[2] ?? '') ?? undefined,
      matpo: parts[3] ?? '',
      pstngdate,
      docdate: parseDdMmYyyyToIso(parts[5] ?? '') ?? undefined,
      materialdesc,
      matquantity: Number.isFinite(Number(parts[7])) ? Number(parts[7]) : undefined,
      matbun: parts[8] ?? '',
      amountinlc,
      crcy: parts[10] ?? '',
      mvt,
      costctr: parts[12] ?? '',
      mattime: '',
      matyr: parts[13] ?? '',
      material: parts[14] ?? '',
    })
  }
  return rows
}

function parseMaterialSheetRows(values: unknown[][], XLSX: any): MaterialInput[] {
  const raw = values
    .map((r) => r.map((c) => (c ?? '').toString().trim()))
    .filter((r) => r.some((c) => c !== ''))
  if (raw.length === 0) return []
  const rows: MaterialInput[] = []
  for (let r = 0; r < values.length; r++) {
    const row = values[r] ?? []
    const wkorder = String(row[0] ?? '').trim()
    const pstngdate = parseExcelCellToIsoDate(row[4], XLSX)
    const materialdesc = String(row[6] ?? '').trim()
    const amountinlc = Number(row[9])
    const mvt = String(row[11] ?? '').trim()
    if (!wkorder || !pstngdate || !materialdesc || !Number.isFinite(amountinlc) || !mvt) continue
    const entrydate = parseExcelCellToIsoDate(row[2], XLSX) ?? undefined
    const docdate = parseExcelCellToIsoDate(row[5], XLSX) ?? undefined
    rows.push({
      wkorder,
      matdoc: String(row[1] ?? '').trim(),
      entrydate,
      matpo: String(row[3] ?? '').trim(),
      pstngdate,
      docdate,
      materialdesc,
      matquantity: Number.isFinite(Number(row[7])) ? Number(row[7]) : undefined,
      matbun: String(row[8] ?? '').trim(),
      amountinlc,
      crcy: String(row[10] ?? '').trim(),
      mvt,
      costctr: String(row[12] ?? '').trim(),
      mattime: '',
      matyr: String(row[13] ?? '').trim(),
      material: String(row[14] ?? '').trim(),
    })
  }
  return rows
}

export async function parseMaterialFile(file: File): Promise<MaterialInput[]> {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv')) return parseMaterialCsv(await file.text())
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const values = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) as unknown[][]
    return parseMaterialSheetRows(values.slice(2), XLSX)
  }
  throw new Error('Invalid file type. Supported: .csv, .xls, .xlsx, .xlsm, .xlsb')
}
