import type { Pool } from 'pg'
import type {
  activityTypeItemSchema,
  departmentItemSchema,
  equipmentItemSchema,
  functionalItemSchema,
  reasonItemSchema,
  workStatusItemSchema,
  workTypeItemSchema,
  zbItemSchema,
  lineProductItemSchema,
  zoneItemSchema,
  machineItemSchema,
  materialItemSchema,
  levelItemSchema,
  positionItemSchema,
  groupItemSchema,
  tasklistItemSchema,
  lineSchdulItemSchema,
} from '../schemas/master-data.js'
import type { z } from 'zod'
import { isAuditTableMissing } from '../lib/audit-log.js'

export type ActivityTypeItem = z.infer<typeof activityTypeItemSchema>
export type DepartmentItem = z.infer<typeof departmentItemSchema>
export type EquipmentItem = z.infer<typeof equipmentItemSchema>
export type FunctionalItem = z.infer<typeof functionalItemSchema>
export type ReasonItem = z.infer<typeof reasonItemSchema>
export type WorkStatusItem = z.infer<typeof workStatusItemSchema>
export type WorkTypeItem = z.infer<typeof workTypeItemSchema>
export type ZbItem = z.infer<typeof zbItemSchema>
export type LineProductItem = z.infer<typeof lineProductItemSchema>
export type ZoneItem = z.infer<typeof zoneItemSchema>
export type MachineItem = z.infer<typeof machineItemSchema>
export type MaterialItem = z.infer<typeof materialItemSchema>
export type LevelItem = z.infer<typeof levelItemSchema>
export type PositionItem = z.infer<typeof positionItemSchema>
export type GroupItem = z.infer<typeof groupItemSchema>
export type TasklistItem = z.infer<typeof tasklistItemSchema>
export type LineSchdulItem = z.infer<typeof lineSchdulItemSchema>

export async function listActivityTypes(pool: Pool): Promise<ActivityTypeItem[]> {
  const r = await pool.query<{ mat: string; matdescrip: string | null; matcheck: string | null }>(
    `SELECT mat, matdescrip, matcheck
     FROM app.tbactivitytype
     ORDER BY mat`,
  )
  return r.rows.map((row) => ({
    id: row.mat,
    mat: row.mat,
    matdescrip: row.matdescrip ?? '',
    matcheck: row.matcheck ?? '',
  }))
}

export type ActivityTypeInput = {
  mat: string
  matdescrip?: string
  matcheck?: string
}

export async function createActivityType(
  pool: Pool,
  input: ActivityTypeInput,
): Promise<ActivityTypeItem> {
  const mat = input.mat.trim()
  const matdescrip = (input.matdescrip ?? '').trim()
  const matcheck = (input.matcheck ?? '').trim()
  await pool.query(
    `INSERT INTO app.tbactivitytype (mat, matdescrip, matcheck)
     VALUES ($1, $2, $3)`,
    [mat, matdescrip, matcheck],
  )
  return { id: mat, mat, matdescrip, matcheck }
}

export async function updateActivityType(
  pool: Pool,
  mat: string,
  input: Omit<ActivityTypeInput, 'mat'>,
): Promise<ActivityTypeItem | null> {
  const matdescrip = (input.matdescrip ?? '').trim()
  const matcheck = (input.matcheck ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbactivitytype
     SET matdescrip = $2, matcheck = $3
     WHERE mat = $1
     RETURNING mat, matdescrip, matcheck`,
    [mat, matdescrip, matcheck],
  )
  const row = r.rows[0] as { mat: string; matdescrip: string | null; matcheck: string | null } | undefined
  if (!row) return null
  return {
    id: row.mat,
    mat: row.mat,
    matdescrip: row.matdescrip ?? '',
    matcheck: row.matcheck ?? '',
  }
}

export async function deleteActivityType(pool: Pool, mat: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbactivitytype WHERE mat = $1`, [mat])
  return (r.rowCount ?? 0) > 0
}

export async function importActivityTypes(
  pool: Pool,
  rows: ActivityTypeInput[],
): Promise<{ inserted: number; updated: number; skipped: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  for (const row of rows) {
    const mat = row.mat?.trim()
    if (!mat) {
      skipped++
      continue
    }
    const matdescrip = (row.matdescrip ?? '').trim()
    const matcheck = (row.matcheck ?? '').trim()
    const exists = await pool.query(`SELECT 1 FROM app.tbactivitytype WHERE mat = $1`, [mat])
    if (exists.rowCount === 0) {
      await pool.query(
        `INSERT INTO app.tbactivitytype (mat, matdescrip, matcheck) VALUES ($1, $2, $3)`,
        [mat, matdescrip, matcheck],
      )
      inserted++
    } else {
      await pool.query(
        `UPDATE app.tbactivitytype SET matdescrip = $2, matcheck = $3 WHERE mat = $1`,
        [mat, matdescrip, matcheck],
      )
      updated++
    }
  }
  return { inserted, updated, skipped }
}

export async function listDepartments(pool: Pool): Promise<DepartmentItem[]> {
  const r = await pool.query<{ iddepartment: string; department: string }>(
    `SELECT iddepartment, department
     FROM app.tbdepartment
     ORDER BY iddepartment`,
  )
  return r.rows.map((row) => ({
    id: row.iddepartment,
    iddepartment: row.iddepartment,
    department: row.department,
  }))
}

export type DepartmentInput = {
  iddepartment: string
  department: string
}

export async function createDepartment(
  pool: Pool,
  input: DepartmentInput,
): Promise<DepartmentItem> {
  const iddepartment = input.iddepartment.trim()
  const department = input.department.trim()
  await pool.query(
    `INSERT INTO app.tbdepartment (iddepartment, department)
     VALUES ($1, $2)`,
    [iddepartment, department],
  )
  return { id: iddepartment, iddepartment, department }
}

export async function updateDepartment(
  pool: Pool,
  iddepartment: string,
  input: Partial<Pick<DepartmentInput, 'department'>>,
): Promise<DepartmentItem | null> {
  const department = (input.department ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbdepartment
     SET department = $2
     WHERE iddepartment = $1
     RETURNING iddepartment, department`,
    [iddepartment, department],
  )
  const row = r.rows[0] as { iddepartment: string; department: string } | undefined
  if (!row) return null
  return {
    id: row.iddepartment,
    iddepartment: row.iddepartment,
    department: row.department,
  }
}

export async function deleteDepartment(pool: Pool, iddepartment: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbdepartment WHERE iddepartment = $1`, [
    iddepartment,
  ])
  return (r.rowCount ?? 0) > 0
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

export async function listEquipments(pool: Pool): Promise<EquipmentItem[]> {
  const r = await pool.query<{
    equipment: string
    equdescrip: string | null
    equipmentsub: string | null
    functionalloc: string | null
    equl: string | null
    equ1: string | null
    equea: string | null
  }>(
    `SELECT equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea
     FROM app.tbequipment
     ORDER BY equipment`,
  )
  return r.rows.map((row) => ({
    id: row.equipment,
    equipment: row.equipment,
    equdescrip: row.equdescrip ?? '',
    equipmentsub: row.equipmentsub ?? '',
    functionalloc: row.functionalloc ?? '',
    equl: row.equl ?? '',
    equ1: row.equ1 ?? '',
    equea: row.equea ?? '',
  }))
}

export async function createEquipment(
  pool: Pool,
  input: EquipmentInput,
): Promise<EquipmentItem> {
  const equipment = input.equipment.trim()
  const equdescrip = input.equdescrip.trim()
  const equipmentsub = (input.equipmentsub ?? '').trim()
  const functionalloc = (input.functionalloc ?? '').trim()
  const equl = (input.equl ?? '').trim()
  const equ1 = (input.equ1 ?? '').trim()
  const equea = (input.equea ?? '').trim()

  await pool.query(
    `INSERT INTO app.tbequipment (equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea],
  )

  return {
    id: equipment,
    equipment,
    equdescrip,
    equipmentsub,
    functionalloc,
    equl,
    equ1,
    equea,
  }
}

export async function updateEquipment(
  pool: Pool,
  equipment: string,
  input: Omit<EquipmentInput, 'equipment'>,
): Promise<EquipmentItem | null> {
  const equdescrip = (input.equdescrip ?? '').trim()
  const equipmentsub = (input.equipmentsub ?? '').trim()
  const functionalloc = (input.functionalloc ?? '').trim()
  const equl = (input.equl ?? '').trim()
  const equ1 = (input.equ1 ?? '').trim()
  const equea = (input.equea ?? '').trim()

  const r = await pool.query(
    `UPDATE app.tbequipment
     SET equdescrip = $2,
         equipmentsub = $3,
         functionalloc = $4,
         equl = $5,
         equ1 = $6,
         equea = $7
     WHERE equipment = $1
     RETURNING equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea`,
    [equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea],
  )

  const row = r.rows[0] as
    | {
        equipment: string
        equdescrip: string | null
        equipmentsub: string | null
        functionalloc: string | null
        equl: string | null
        equ1: string | null
        equea: string | null
      }
    | undefined
  if (!row) return null

  return {
    id: row.equipment,
    equipment: row.equipment,
    equdescrip: row.equdescrip ?? '',
    equipmentsub: row.equipmentsub ?? '',
    functionalloc: row.functionalloc ?? '',
    equl: row.equl ?? '',
    equ1: row.equ1 ?? '',
    equea: row.equea ?? '',
  }
}

export async function deleteEquipment(pool: Pool, equipment: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbequipment WHERE equipment = $1`, [equipment])
  return (r.rowCount ?? 0) > 0
}

export async function importEquipments(
  pool: Pool,
  rows: EquipmentInput[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const equipment = (row.equipment ?? '').trim()
    const equdescrip = (row.equdescrip ?? '').trim()
    if (!equipment || !equdescrip) {
      failed++
      continue
    }

    const equipmentsub = (row.equipmentsub ?? '').trim()
    const functionalloc = (row.functionalloc ?? '').trim()
    const equl = (row.equl ?? '').trim()
    const equ1 = (row.equ1 ?? '').trim()
    const equea = (row.equea ?? '').trim()

    const exists = await pool.query(`SELECT 1 FROM app.tbequipment WHERE equipment = $1`, [
      equipment,
    ])
    if (exists.rowCount === 0) {
      await pool.query(
        `INSERT INTO app.tbequipment (equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea],
      )
      inserted++
    } else {
      await pool.query(
        `UPDATE app.tbequipment
         SET equdescrip = $2,
             equipmentsub = $3,
             functionalloc = $4,
             equl = $5,
             equ1 = $6,
             equea = $7
         WHERE equipment = $1`,
        [equipment, equdescrip, equipmentsub, functionalloc, equl, equ1, equea],
      )
      updated++
    }
  }

  return { inserted, updated, skipped, failed }
}

export type FunctionalInput = {
  functionalloc: string
  funldescrip: string
  functionallocsub?: string
}

export async function listFunctionals(pool: Pool): Promise<FunctionalItem[]> {
  const r = await pool.query<{
    functionalloc: string
    funldescrip: string | null
    functionallocsub: string | null
  }>(
    `SELECT functionalloc, funldescrip, functionallocsub
     FROM app.tbfunctional
     ORDER BY functionalloc`,
  )
  return r.rows.map((row) => ({
    id: row.functionalloc,
    functionalloc: row.functionalloc,
    funldescrip: row.funldescrip ?? '',
    functionallocsub: row.functionallocsub ?? '',
  }))
}

export async function createFunctional(
  pool: Pool,
  input: FunctionalInput,
): Promise<FunctionalItem> {
  const functionalloc = input.functionalloc.trim()
  const funldescrip = input.funldescrip.trim()
  const functionallocsub = (input.functionallocsub ?? '').trim()
  await pool.query(
    `INSERT INTO app.tbfunctional (functionalloc, funldescrip, functionallocsub)
     VALUES ($1, $2, $3)`,
    [functionalloc, funldescrip, functionallocsub || null],
  )
  return { id: functionalloc, functionalloc, funldescrip, functionallocsub }
}

export async function updateFunctional(
  pool: Pool,
  functionalloc: string,
  input: Omit<FunctionalInput, 'functionalloc'>,
): Promise<FunctionalItem | null> {
  const funldescrip = (input.funldescrip ?? '').trim()
  const functionallocsub = (input.functionallocsub ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbfunctional
     SET funldescrip = $2, functionallocsub = $3
     WHERE functionalloc = $1
     RETURNING functionalloc, funldescrip, functionallocsub`,
    [functionalloc, funldescrip, functionallocsub || null],
  )
  const row = r.rows[0] as
    | { functionalloc: string; funldescrip: string | null; functionallocsub: string | null }
    | undefined
  if (!row) return null
  return {
    id: row.functionalloc,
    functionalloc: row.functionalloc,
    funldescrip: row.funldescrip ?? '',
    functionallocsub: row.functionallocsub ?? '',
  }
}

export async function deleteFunctional(pool: Pool, functionalloc: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbfunctional WHERE functionalloc = $1`, [
    functionalloc,
  ])
  return (r.rowCount ?? 0) > 0
}

export async function importFunctionals(
  pool: Pool,
  rows: FunctionalInput[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const functionalloc = (row.functionalloc ?? '').trim()
    const funldescrip = (row.funldescrip ?? '').trim()
    if (!functionalloc || !funldescrip) {
      failed++
      continue
    }
    const functionallocsub = (row.functionallocsub ?? '').trim()
    const exists = await pool.query(`SELECT 1 FROM app.tbfunctional WHERE functionalloc = $1`, [
      functionalloc,
    ])
    if (exists.rowCount === 0) {
      await pool.query(
        `INSERT INTO app.tbfunctional (functionalloc, funldescrip, functionallocsub)
         VALUES ($1, $2, $3)`,
        [functionalloc, funldescrip, functionallocsub || null],
      )
      inserted++
    } else {
      await pool.query(
        `UPDATE app.tbfunctional
         SET funldescrip = $2, functionallocsub = $3
         WHERE functionalloc = $1`,
        [functionalloc, funldescrip, functionallocsub || null],
      )
      updated++
    }
  }

  return { inserted, updated, skipped, failed }
}

export type ReasonInput = {
  reasoncode: string
  reasonname: string
}

export async function listReasons(pool: Pool): Promise<ReasonItem[]> {
  const r = await pool.query<{ reasoncode: string; reasonname: string }>(
    `SELECT reasoncode, reasonname
     FROM app.tbreason
     ORDER BY reasoncode`,
  )
  return r.rows.map((row) => ({
    id: row.reasoncode,
    reasoncode: row.reasoncode,
    reasonname: row.reasonname,
  }))
}

export async function createReason(pool: Pool, input: ReasonInput): Promise<ReasonItem> {
  const reasoncode = input.reasoncode.trim()
  const reasonname = input.reasonname.trim()
  await pool.query(
    `INSERT INTO app.tbreason (reasoncode, reasonname) VALUES ($1, $2)`,
    [reasoncode, reasonname],
  )
  return { id: reasoncode, reasoncode, reasonname }
}

export async function updateReason(
  pool: Pool,
  reasoncode: string,
  input: { reasonname: string },
): Promise<ReasonItem | null> {
  const reasonname = (input.reasonname ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbreason SET reasonname = $2 WHERE reasoncode = $1
     RETURNING reasoncode, reasonname`,
    [reasoncode, reasonname],
  )
  const row = r.rows[0] as { reasoncode: string; reasonname: string } | undefined
  if (!row) return null
  return { id: row.reasoncode, reasoncode: row.reasoncode, reasonname: row.reasonname }
}

export async function deleteReason(pool: Pool, reasoncode: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbreason WHERE reasoncode = $1`, [reasoncode])
  return (r.rowCount ?? 0) > 0
}

export type WorkStatusInput = {
  syst: string
  wkstreason: string
  wkstcolor: string
}

export async function listWorkStatuses(pool: Pool): Promise<WorkStatusItem[]> {
  const r = await pool.query<{
    syst: string
    wkstreason: string | null
    wkstcolor: string | null
  }>(
    `SELECT syst, wkstreason, wkstcolor
     FROM app.tbwkstatus
     ORDER BY syst`,
  )
  return r.rows.map((row) => ({
    id: row.syst,
    syst: row.syst,
    wkstreason: row.wkstreason ?? '',
    wkstcolor: row.wkstcolor ?? '',
  }))
}

export async function createWorkStatus(
  pool: Pool,
  input: WorkStatusInput,
): Promise<WorkStatusItem> {
  const syst = input.syst.trim()
  const wkstreason = input.wkstreason.trim()
  const wkstcolor = input.wkstcolor.trim()
  await pool.query(
    `INSERT INTO app.tbwkstatus (syst, wkstreason, wkstcolor) VALUES ($1, $2, $3)`,
    [syst, wkstreason, wkstcolor],
  )
  return { id: syst, syst, wkstreason, wkstcolor }
}

export async function updateWorkStatus(
  pool: Pool,
  syst: string,
  input: { wkstreason: string; wkstcolor: string },
): Promise<WorkStatusItem | null> {
  const wkstreason = (input.wkstreason ?? '').trim()
  const wkstcolor = (input.wkstcolor ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbwkstatus SET wkstreason = $2, wkstcolor = $3 WHERE syst = $1
     RETURNING syst, wkstreason, wkstcolor`,
    [syst, wkstreason, wkstcolor],
  )
  const row = r.rows[0] as
    | { syst: string; wkstreason: string | null; wkstcolor: string | null }
    | undefined
  if (!row) return null
  return {
    id: row.syst,
    syst: row.syst,
    wkstreason: row.wkstreason ?? '',
    wkstcolor: row.wkstcolor ?? '',
  }
}

export async function deleteWorkStatus(pool: Pool, syst: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbwkstatus WHERE syst = $1`, [syst])
  return (r.rowCount ?? 0) > 0
}

export type WorkTypeInput = {
  idwkctrtype: string
  wkctrtype: string
}

export async function listWorkTypes(pool: Pool): Promise<WorkTypeItem[]> {
  const r = await pool.query<{ idwkctrtype: string; wkctrtype: string }>(
    `SELECT idwkctrtype, wkctrtype
     FROM app.tbwkctrtype
     ORDER BY idwkctrtype`,
  )
  return r.rows.map((row) => ({
    id: row.idwkctrtype,
    idwkctrtype: row.idwkctrtype,
    wkctrtype: row.wkctrtype,
  }))
}

export async function createWorkType(pool: Pool, input: WorkTypeInput): Promise<WorkTypeItem> {
  const idwkctrtype = input.idwkctrtype.trim()
  const wkctrtype = input.wkctrtype.trim()
  await pool.query(
    `INSERT INTO app.tbwkctrtype (idwkctrtype, wkctrtype) VALUES ($1, $2)`,
    [idwkctrtype, wkctrtype],
  )
  return { id: idwkctrtype, idwkctrtype, wkctrtype }
}

export async function updateWorkType(
  pool: Pool,
  idwkctrtype: string,
  input: { wkctrtype: string },
): Promise<WorkTypeItem | null> {
  const wkctrtype = (input.wkctrtype ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbwkctrtype SET wkctrtype = $2 WHERE idwkctrtype = $1
     RETURNING idwkctrtype, wkctrtype`,
    [idwkctrtype, wkctrtype],
  )
  const row = r.rows[0] as { idwkctrtype: string; wkctrtype: string } | undefined
  if (!row) return null
  return { id: row.idwkctrtype, idwkctrtype: row.idwkctrtype, wkctrtype: row.wkctrtype }
}

export async function deleteWorkType(pool: Pool, idwkctrtype: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbwkctrtype WHERE idwkctrtype = $1`, [
    idwkctrtype,
  ])
  return (r.rowCount ?? 0) > 0
}

export type ZbInput = {
  wkzb: string
  zbdescrip: string
}

export async function listZbs(pool: Pool): Promise<ZbItem[]> {
  const r = await pool.query<{ wkzb: string; zbdescrip: string | null }>(
    `SELECT wkzb, zbdescrip
     FROM app.tbwkzb
     ORDER BY wkzb`,
  )
  return r.rows.map((row) => ({
    id: row.wkzb,
    wkzb: row.wkzb,
    zbdescrip: row.zbdescrip ?? '',
  }))
}

export async function createZb(pool: Pool, input: ZbInput): Promise<ZbItem> {
  const wkzb = input.wkzb.trim()
  const zbdescrip = input.zbdescrip.trim()
  await pool.query(`INSERT INTO app.tbwkzb (wkzb, zbdescrip) VALUES ($1, $2)`, [
    wkzb,
    zbdescrip,
  ])
  return { id: wkzb, wkzb, zbdescrip }
}

export async function updateZb(
  pool: Pool,
  wkzb: string,
  input: { zbdescrip: string },
): Promise<ZbItem | null> {
  const zbdescrip = (input.zbdescrip ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbwkzb SET zbdescrip = $2 WHERE wkzb = $1
     RETURNING wkzb, zbdescrip`,
    [wkzb, zbdescrip],
  )
  const row = r.rows[0] as { wkzb: string; zbdescrip: string | null } | undefined
  if (!row) return null
  return { id: row.wkzb, wkzb: row.wkzb, zbdescrip: row.zbdescrip ?? '' }
}

export async function deleteZb(pool: Pool, wkzb: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbwkzb WHERE wkzb = $1`, [wkzb])
  return (r.rowCount ?? 0) > 0
}

export type LineProductInput = {
  productline: string
  prolinedescrip: string
}

export async function listLineProducts(pool: Pool): Promise<LineProductItem[]> {
  const r = await pool.query<{ productline: string; prolinedescrip: string }>(
    `SELECT productline, prolinedescrip
     FROM app.tbproductline
     ORDER BY productline`,
  )
  return r.rows.map((row) => ({
    id: row.productline,
    productline: row.productline,
    prolinedescrip: row.prolinedescrip,
  }))
}

export async function createLineProduct(
  pool: Pool,
  input: LineProductInput,
): Promise<LineProductItem> {
  const productline = input.productline.trim()
  const prolinedescrip = input.prolinedescrip.trim()
  await pool.query(
    `INSERT INTO app.tbproductline (productline, prolinedescrip) VALUES ($1, $2)`,
    [productline, prolinedescrip],
  )
  return { id: productline, productline, prolinedescrip }
}

export async function updateLineProduct(
  pool: Pool,
  productline: string,
  input: { prolinedescrip: string },
): Promise<LineProductItem | null> {
  const prolinedescrip = (input.prolinedescrip ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbproductline SET prolinedescrip = $2 WHERE productline = $1
     RETURNING productline, prolinedescrip`,
    [productline, prolinedescrip],
  )
  const row = r.rows[0] as { productline: string; prolinedescrip: string } | undefined
  if (!row) return null
  return { id: row.productline, productline: row.productline, prolinedescrip: row.prolinedescrip }
}

export async function deleteLineProduct(pool: Pool, productline: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbproductline WHERE productline = $1`, [
    productline,
  ])
  return (r.rowCount ?? 0) > 0
}

export async function importLineProducts(
  pool: Pool,
  rows: LineProductInput[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const productline = (row.productline ?? '').trim()
    const prolinedescrip = (row.prolinedescrip ?? '').trim()
    if (!productline) {
      failed++
      continue
    }
    const r = await pool.query(
      `INSERT INTO app.tbproductline (productline, prolinedescrip)
       VALUES ($1, $2)
       ON CONFLICT (productline) DO UPDATE SET prolinedescrip = EXCLUDED.prolinedescrip
       RETURNING (xmax = 0) AS inserted`,
      [productline, prolinedescrip],
    )
    if (r.rows[0]?.inserted) inserted++
    else updated++
  }

  return { inserted, updated, skipped, failed }
}

export type ZoneInput = {
  idzone: string
  zone: string
  zonedescrip?: string
  idproductline?: string
}

export async function listZones(pool: Pool): Promise<ZoneItem[]> {
  const r = await pool.query<{
    idzone: string
    zone: string
    zonedescrip: string | null
    idproductline: string | null
    prolinedescrip: string | null
  }>(
    `SELECT z.idzone,
            z.zone,
            z.zonedescrip,
            z.idproductline,
            pl.prolinedescrip
     FROM app.tbzone z
     LEFT JOIN app.tbproductline pl ON pl.productline = z.idproductline
     ORDER BY z.idzone`,
  )
  return r.rows.map((row) => ({
    id: row.idzone,
    idzone: row.idzone,
    zone: row.zone,
    zonedescrip: row.zonedescrip ?? '',
    idproductline: row.idproductline ?? '',
    productline: row.prolinedescrip ?? '',
  }))
}

export async function createZone(pool: Pool, input: ZoneInput): Promise<ZoneItem> {
  const idzone = input.idzone.trim()
  const zone = input.zone.trim()
  const zonedescrip = (input.zonedescrip ?? '').trim()
  const idproductline = (input.idproductline ?? '').trim() || null
  await pool.query(
    `INSERT INTO app.tbzone (idzone, zone, zonedescrip, idproductline)
     VALUES ($1, $2, $3, $4)`,
    [idzone, zone, zonedescrip || null, idproductline],
  )
  return (await listZones(pool)).find((x) => x.idzone === idzone) ?? {
    id: idzone,
    idzone,
    zone,
    zonedescrip,
    idproductline: idproductline ?? '',
    productline: '',
  }
}

export async function updateZone(
  pool: Pool,
  idzone: string,
  input: { zone?: string; zonedescrip?: string; idproductline?: string },
): Promise<ZoneItem | null> {
  const zone = (input.zone ?? '').trim()
  const zonedescrip = input.zonedescrip != null ? input.zonedescrip.trim() : null
  const idproductline = input.idproductline != null ? input.idproductline.trim() : null
  const r = await pool.query(
    `UPDATE app.tbzone
     SET zone = COALESCE(NULLIF($2, ''), zone),
         zonedescrip = COALESCE($3, zonedescrip),
         idproductline = COALESCE(NULLIF($4, ''), idproductline)
     WHERE idzone = $1
     RETURNING idzone`,
    [idzone, zone, zonedescrip, idproductline],
  )
  const row = r.rows[0] as { idzone: string } | undefined
  if (!row) return null
  return (await listZones(pool)).find((x) => x.idzone === row.idzone) ?? null
}

export async function deleteZone(pool: Pool, idzone: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbzone WHERE idzone = $1`, [idzone])
  return (r.rowCount ?? 0) > 0
}

export async function importZones(
  pool: Pool,
  rows: { zone: string; zonedescrip?: string; productline?: string }[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const zoneText = (row.zone ?? '').trim()
    const zonedescrip = (row.zonedescrip ?? '').trim()
    const productlineCode = (row.productline ?? '').trim()
    if (!zoneText) {
      failed++
      continue
    }

    let idproductline: string | null = null
    if (productlineCode) {
      const code = productlineCode.slice(0, 64)
      await pool.query(
        `INSERT INTO app.tbproductline (productline, prolinedescrip)
         VALUES ($1, $2)
         ON CONFLICT (productline) DO NOTHING`,
        [code, code],
      )
      idproductline = code
    }

    const found = await pool.query<{ idzone: string }>(
      `SELECT idzone FROM app.tbzone WHERE zone = $1 ORDER BY idzone LIMIT 1`,
      [zoneText],
    )
    const existingIdzone = found.rows[0]?.idzone ?? null

    if (!existingIdzone) {
      const idzone = zoneText.slice(0, 64)
      const r = await pool.query<{ inserted: boolean }>(
        `INSERT INTO app.tbzone (idzone, zone, zonedescrip, idproductline)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (idzone) DO UPDATE SET
           zone = EXCLUDED.zone,
           zonedescrip = EXCLUDED.zonedescrip,
           idproductline = EXCLUDED.idproductline
         RETURNING (xmax = 0) AS inserted`,
        [idzone, zoneText, zonedescrip || null, idproductline],
      )
      if (r.rows[0]?.inserted) inserted++
      else updated++
      continue
    }

    await pool.query(
      `UPDATE app.tbzone
       SET zonedescrip = $2,
           idproductline = $3
       WHERE idzone = $1`,
      [existingIdzone, zonedescrip || null, idproductline],
    )
    updated++
  }

  return { inserted, updated, skipped, failed }
}

export type MachineInput = {
  machine: string
  idzone?: string
  idwkctrtype?: string
}

export async function listMachines(pool: Pool): Promise<MachineItem[]> {
  const r = await pool.query<{
    machine: string
    idzone: string | null
    zone: string | null
    idwkctrtype: string | null
    wkctrtype: string | null
  }>(
    `SELECT m.machine,
            m.idzone,
            z.zone,
            m.idwkctrtype,
            t.wkctrtype
     FROM app.tbmainteanance m
     LEFT JOIN app.tbzone z ON z.idzone = m.idzone
     LEFT JOIN app.tbwkctrtype t ON t.idwkctrtype = m.idwkctrtype
     ORDER BY m.machine`,
  )
  return r.rows.map((row) => ({
    id: row.machine,
    machine: row.machine,
    idzone: row.idzone ?? '',
    zone: row.zone ?? '',
    idwkctrtype: row.idwkctrtype ?? '',
    wkctrtype: row.wkctrtype ?? '',
  }))
}

export async function createMachine(pool: Pool, input: MachineInput): Promise<MachineItem> {
  const machine = input.machine.trim()
  const idzone = (input.idzone ?? '').trim() || null
  const idwkctrtype = (input.idwkctrtype ?? '').trim() || null
  await pool.query(
    `INSERT INTO app.tbmainteanance (machine, idzone, idwkctrtype) VALUES ($1, $2, $3)`,
    [machine, idzone, idwkctrtype],
  )
  const item = (await listMachines(pool)).find((x) => x.machine === machine)
  return (
    item ?? { id: machine, machine, idzone: idzone ?? '', zone: '', idwkctrtype: idwkctrtype ?? '', wkctrtype: '' }
  )
}

export async function updateMachine(
  pool: Pool,
  machine: string,
  input: { idzone?: string; idwkctrtype?: string },
): Promise<MachineItem | null> {
  const idzone = (input.idzone ?? '').trim() || null
  const idwkctrtype = (input.idwkctrtype ?? '').trim() || null
  const r = await pool.query(
    `UPDATE app.tbmainteanance
     SET idzone = $2, idwkctrtype = $3
     WHERE machine = $1
     RETURNING machine`,
    [machine, idzone, idwkctrtype],
  )
  if ((r.rowCount ?? 0) === 0) return null
  const item = (await listMachines(pool)).find((x) => x.machine === machine) ?? null
  return item
}

export async function deleteMachine(pool: Pool, machine: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbmainteanance WHERE machine = $1`, [machine])
  return (r.rowCount ?? 0) > 0
}

export async function importMachines(
  pool: Pool,
  rows: { machine: string; zone?: string; wkctrtype?: string }[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const machine = (row.machine ?? '').trim()
    if (!machine) {
      failed++
      continue
    }
    const zoneText = (row.zone ?? '').trim()
    const typeText = (row.wkctrtype ?? '').trim()

    const idzone = zoneText ? zoneText.slice(0, 64) : null
    if (idzone) {
      await pool.query(
        `INSERT INTO app.tbzone (idzone, zone) VALUES ($1, $2)
         ON CONFLICT (idzone) DO UPDATE SET zone = EXCLUDED.zone`,
        [idzone, zoneText],
      )
    }

    let idwkctrtype: string | null = null
    if (typeText) {
      const found = await pool.query<{ idwkctrtype: string }>(
        `SELECT idwkctrtype FROM app.tbwkctrtype WHERE wkctrtype = $1 LIMIT 1`,
        [typeText],
      )
      if (found.rows[0]?.idwkctrtype) {
        idwkctrtype = found.rows[0].idwkctrtype
      } else {
        const id = typeText.slice(0, 64)
        await pool.query(
          `INSERT INTO app.tbwkctrtype (idwkctrtype, wkctrtype) VALUES ($1, $2)
           ON CONFLICT (idwkctrtype) DO UPDATE SET wkctrtype = EXCLUDED.wkctrtype`,
          [id, typeText],
        )
        idwkctrtype = id
      }
    }

    const r = await pool.query(
      `INSERT INTO app.tbmainteanance (machine, idzone, idwkctrtype)
       VALUES ($1, $2, $3)
       ON CONFLICT (machine) DO UPDATE SET idzone = EXCLUDED.idzone, idwkctrtype = EXCLUDED.idwkctrtype
       RETURNING (xmax = 0) AS inserted`,
      [machine, idzone, idwkctrtype],
    )
    if (r.rows[0]?.inserted) inserted++
    else updated++
  }

  return { inserted, updated, skipped, failed }
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

export async function listMaterials(pool: Pool): Promise<MaterialItem[]> {
  const r = await pool.query<{
    idmaterial: number
    wkorder: string
    matdoc: string | null
    entrydate: string | null
    matpo: string | null
    pstngdate: string | null
    docdate: string | null
    materialdesc: string | null
    matquantity: string | null
    matbun: string | null
    amountinlc: string | null
    crcy: string | null
    mvt: string | null
    costctr: string | null
    mattime: string | null
    matyr: string | null
    material: string | null
  }>(
    `SELECT idmaterial, wkorder, matdoc, entrydate::text, matpo, pstngdate::text, docdate::text,
            materialdesc, matquantity::text, matbun, amountinlc::text, crcy, mvt, costctr,
            mattime, matyr, material
     FROM app.tbmaterial
     ORDER BY idmaterial DESC
     LIMIT 1000`,
  )
  return r.rows.map((row) => ({
    id: String(row.idmaterial),
    idmaterial: row.idmaterial,
    wkorder: row.wkorder,
    matdoc: row.matdoc ?? '',
    entrydate: row.entrydate ?? '',
    matpo: row.matpo ?? '',
    pstngdate: row.pstngdate ?? '',
    docdate: row.docdate ?? '',
    materialdesc: row.materialdesc ?? '',
    matquantity: row.matquantity ? Number(row.matquantity) : 0,
    matbun: row.matbun ?? '',
    amountinlc: row.amountinlc ? Number(row.amountinlc) : 0,
    crcy: row.crcy ?? '',
    mvt: row.mvt ?? '',
    costctr: row.costctr ?? '',
    mattime: row.mattime ?? '',
    matyr: row.matyr ?? '',
    material: row.material ?? '',
  }))
}

export async function createMaterial(pool: Pool, input: MaterialInput): Promise<MaterialItem> {
  const wkorder = input.wkorder.trim()
  const pstngdate = input.pstngdate.trim()
  const materialdesc = input.materialdesc.trim()
  const amountinlc = input.amountinlc
  const mvt = input.mvt.trim()

  const r = await pool.query<{ idmaterial: number }>(
    `INSERT INTO app.tbmaterial (
       wkorder, matdoc, entrydate, matpo, pstngdate, docdate,
       materialdesc, matquantity, matbun, amountinlc, crcy, mvt,
       costctr, mattime, matyr, material
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11, $12,
       $13, $14, $15, $16
     )
     RETURNING idmaterial`,
    [
      wkorder,
      (input.matdoc ?? '').trim() || null,
      (input.entrydate ?? '').trim() || null,
      (input.matpo ?? '').trim() || null,
      pstngdate,
      (input.docdate ?? '').trim() || null,
      materialdesc,
      input.matquantity ?? null,
      (input.matbun ?? '').trim() || null,
      amountinlc,
      (input.crcy ?? '').trim() || null,
      mvt,
      (input.costctr ?? '').trim() || null,
      (input.mattime ?? '').trim() || null,
      (input.matyr ?? '').trim() || null,
      (input.material ?? '').trim() || null,
    ],
  )
  const id = r.rows[0]?.idmaterial
  const list = await pool.query(
    `SELECT idmaterial FROM app.tbmaterial WHERE idmaterial = $1`,
    [id],
  )
  if (list.rowCount === 0) {
    return {
      id: String(id),
      idmaterial: id,
      wkorder,
      matdoc: input.matdoc ?? '',
      entrydate: input.entrydate ?? '',
      matpo: input.matpo ?? '',
      pstngdate,
      docdate: input.docdate ?? '',
      materialdesc,
      matquantity: input.matquantity ?? 0,
      matbun: input.matbun ?? '',
      amountinlc,
      crcy: input.crcy ?? '',
      mvt,
      costctr: input.costctr ?? '',
      mattime: input.mattime ?? '',
      matyr: input.matyr ?? '',
      material: input.material ?? '',
    }
  }
  const item = (await listMaterials(pool)).find((x) => x.idmaterial === id)
  return item as MaterialItem
}

export async function updateMaterial(
  pool: Pool,
  idmaterial: number,
  input: Partial<MaterialInput>,
): Promise<MaterialItem | null> {
  const r = await pool.query(
    `UPDATE app.tbmaterial
     SET wkorder = COALESCE($2, wkorder),
         matdoc = COALESCE($3, matdoc),
         entrydate = COALESCE($4, entrydate),
         matpo = COALESCE($5, matpo),
         pstngdate = COALESCE($6, pstngdate),
         docdate = COALESCE($7, docdate),
         materialdesc = COALESCE($8, materialdesc),
         matquantity = COALESCE($9, matquantity),
         matbun = COALESCE($10, matbun),
         amountinlc = COALESCE($11, amountinlc),
         crcy = COALESCE($12, crcy),
         mvt = COALESCE($13, mvt),
         costctr = COALESCE($14, costctr),
         mattime = COALESCE($15, mattime),
         matyr = COALESCE($16, matyr),
         material = COALESCE($17, material)
     WHERE idmaterial = $1
     RETURNING idmaterial`,
    [
      idmaterial,
      input.wkorder?.trim() ?? null,
      input.matdoc?.trim() ?? null,
      input.entrydate?.trim() ?? null,
      input.matpo?.trim() ?? null,
      input.pstngdate?.trim() ?? null,
      input.docdate?.trim() ?? null,
      input.materialdesc?.trim() ?? null,
      input.matquantity ?? null,
      input.matbun?.trim() ?? null,
      input.amountinlc ?? null,
      input.crcy?.trim() ?? null,
      input.mvt?.trim() ?? null,
      input.costctr?.trim() ?? null,
      input.mattime?.trim() ?? null,
      input.matyr?.trim() ?? null,
      input.material?.trim() ?? null,
    ],
  )
  if ((r.rowCount ?? 0) === 0) return null
  const item = (await listMaterials(pool)).find((x) => x.idmaterial === idmaterial) ?? null
  return item
}

export async function deleteMaterial(pool: Pool, idmaterial: number): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbmaterial WHERE idmaterial = $1`, [idmaterial])
  return (r.rowCount ?? 0) > 0
}

export async function importMaterials(
  pool: Pool,
  rows: MaterialInput[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const wkorder = (row.wkorder ?? '').trim()
    const pstngdate = (row.pstngdate ?? '').trim()
    const materialdesc = (row.materialdesc ?? '').trim()
    const mvt = (row.mvt ?? '').trim()
    const amountinlc = row.amountinlc
    if (!wkorder || !pstngdate || !materialdesc || !mvt || typeof amountinlc !== 'number') {
      failed++
      continue
    }

    const r = await pool.query(
      `INSERT INTO app.tbmaterial (
         wkorder, matdoc, entrydate, matpo, pstngdate, docdate,
         materialdesc, matquantity, matbun, amountinlc, crcy, mvt,
         costctr, mattime, matyr, material
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16
       )
       ON CONFLICT (wkorder, pstngdate, amountinlc, mvt)
       DO UPDATE SET
         matdoc = EXCLUDED.matdoc,
         entrydate = EXCLUDED.entrydate,
         matpo = EXCLUDED.matpo,
         docdate = EXCLUDED.docdate,
         materialdesc = EXCLUDED.materialdesc,
         matquantity = EXCLUDED.matquantity,
         matbun = EXCLUDED.matbun,
         crcy = EXCLUDED.crcy,
         costctr = EXCLUDED.costctr,
         mattime = EXCLUDED.mattime,
         matyr = EXCLUDED.matyr,
         material = EXCLUDED.material
       RETURNING (xmax = 0) AS inserted`,
      [
        wkorder,
        (row.matdoc ?? '').trim() || null,
        (row.entrydate ?? '').trim() || null,
        (row.matpo ?? '').trim() || null,
        pstngdate,
        (row.docdate ?? '').trim() || null,
        materialdesc,
        row.matquantity ?? null,
        (row.matbun ?? '').trim() || null,
        amountinlc,
        (row.crcy ?? '').trim() || null,
        mvt,
        (row.costctr ?? '').trim() || null,
        (row.mattime ?? '').trim() || null,
        (row.matyr ?? '').trim() || null,
        (row.material ?? '').trim() || null,
      ],
    )

    if (r.rows[0]?.inserted) inserted++
    else updated++
  }

  return { inserted, updated, skipped, failed }
}

export type LevelInput = {
  idwklevel: string
  wklevel: string
}

export async function listLevels(pool: Pool): Promise<LevelItem[]> {
  const r = await pool.query<{ idwklevel: string; wklevel: string }>(
    `SELECT idwklevel, wklevel
     FROM app.tbwklevel
     ORDER BY idwklevel`,
  )
  return r.rows.map((row) => ({
    id: row.idwklevel,
    idwklevel: row.idwklevel,
    wklevel: row.wklevel,
  }))
}

export async function createLevel(pool: Pool, input: LevelInput): Promise<LevelItem> {
  const idwklevel = input.idwklevel.trim()
  const wklevel = input.wklevel.trim()
  await pool.query(`INSERT INTO app.tbwklevel (idwklevel, wklevel) VALUES ($1, $2)`, [
    idwklevel,
    wklevel,
  ])
  return { id: idwklevel, idwklevel, wklevel }
}

export async function updateLevel(
  pool: Pool,
  idwklevel: string,
  input: { wklevel: string },
): Promise<LevelItem | null> {
  const wklevel = (input.wklevel ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbwklevel SET wklevel = $2 WHERE idwklevel = $1
     RETURNING idwklevel, wklevel`,
    [idwklevel, wklevel],
  )
  const row = r.rows[0] as { idwklevel: string; wklevel: string } | undefined
  if (!row) return null
  return { id: row.idwklevel, idwklevel: row.idwklevel, wklevel: row.wklevel }
}

export async function deleteLevel(pool: Pool, idwklevel: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbwklevel WHERE idwklevel = $1`, [idwklevel])
  return (r.rowCount ?? 0) > 0
}

export type PositionInput = {
  idposition: string
  position: string
}

export async function listPositions(pool: Pool): Promise<PositionItem[]> {
  const r = await pool.query<{ idposition: string; position: string }>(
    `SELECT idposition, position
     FROM app.tbposition
     ORDER BY idposition`,
  )
  return r.rows.map((row) => ({
    id: row.idposition,
    idposition: row.idposition,
    position: row.position,
  }))
}

export async function createPosition(pool: Pool, input: PositionInput): Promise<PositionItem> {
  const idposition = input.idposition.trim()
  const position = input.position.trim()
  await pool.query(`INSERT INTO app.tbposition (idposition, position) VALUES ($1, $2)`, [
    idposition,
    position,
  ])
  return { id: idposition, idposition, position }
}

export async function updatePosition(
  pool: Pool,
  idposition: string,
  input: { position: string },
): Promise<PositionItem | null> {
  const position = (input.position ?? '').trim()
  const r = await pool.query(
    `UPDATE app.tbposition SET position = $2 WHERE idposition = $1
     RETURNING idposition, position`,
    [idposition, position],
  )
  const row = r.rows[0] as { idposition: string; position: string } | undefined
  if (!row) return null
  return { id: row.idposition, idposition: row.idposition, position: row.position }
}

export async function deletePosition(pool: Pool, idposition: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbposition WHERE idposition = $1`, [idposition])
  return (r.rowCount ?? 0) > 0
}

export type GroupInput = {
  wkctrgroup: string
  wkctrdescription?: string
}

export async function listGroups(pool: Pool): Promise<GroupItem[]> {
  const r = await pool.query<{ idwkctrgroup: number; wkctrgroup: string; wkctrdescription: string | null }>(
    `SELECT idwkctrgroup, wkctrgroup, wkctrdescription
     FROM app.tbwkctrgroup
     ORDER BY wkctrgroup`,
  )
  return r.rows.map((row) => ({
    id: String(row.idwkctrgroup),
    idwkctrgroup: row.idwkctrgroup,
    wkctrgroup: row.wkctrgroup,
    wkctrdescription: row.wkctrdescription ?? '',
  }))
}

export async function createGroup(pool: Pool, input: GroupInput): Promise<GroupItem> {
  const wkctrgroup = input.wkctrgroup.trim()
  const wkctrdescription = (input.wkctrdescription ?? '').trim()
  const r = await pool.query<{ idwkctrgroup: number }>(
    `INSERT INTO app.tbwkctrgroup (wkctrgroup, wkctrdescription)
     VALUES ($1, $2)
     RETURNING idwkctrgroup`,
    [wkctrgroup, wkctrdescription || null],
  )
  const idwkctrgroup = r.rows[0]?.idwkctrgroup ?? 0
  return { id: String(idwkctrgroup), idwkctrgroup, wkctrgroup, wkctrdescription }
}

export async function updateGroup(
  pool: Pool,
  idwkctrgroup: number,
  input: { wkctrgroup?: string; wkctrdescription?: string },
): Promise<GroupItem | null> {
  const wkctrgroup = (input.wkctrgroup ?? '').trim()
  const wkctrdescription = (input.wkctrdescription ?? '').trim()
  const r = await pool.query<{ idwkctrgroup: number; wkctrgroup: string; wkctrdescription: string | null }>(
    `UPDATE app.tbwkctrgroup
     SET wkctrgroup = COALESCE(NULLIF($2, ''), wkctrgroup),
         wkctrdescription = $3
     WHERE idwkctrgroup = $1
     RETURNING idwkctrgroup, wkctrgroup, wkctrdescription`,
    [idwkctrgroup, wkctrgroup, wkctrdescription || null],
  )
  const row = r.rows[0]
  if (!row) return null
  return {
    id: String(row.idwkctrgroup),
    idwkctrgroup: row.idwkctrgroup,
    wkctrgroup: row.wkctrgroup,
    wkctrdescription: row.wkctrdescription ?? '',
  }
}

export async function deleteGroup(pool: Pool, idwkctrgroup: number): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbwkctrgroup WHERE idwkctrgroup = $1`, [idwkctrgroup])
  return (r.rowCount ?? 0) > 0
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

export async function listTasklists(pool: Pool): Promise<TasklistItem[]> {
  const r = await pool.query<{
    idtasklist: number
    idwkctrtype: string
    wkctrtype: string | null
    idzone: string
    zone: string | null
    idmachine: string | null
    mntplan: string
    tasklist: string
    legacy: string
    machine: string
    pmlist: string
    pmday: number | null
    machinestatus: number | null
    pmmin: string | null
    pmman: string | null
    manhour: string | null
    mat: string | null
    runhr: string | null
    mpoint: string | null
    bcprunhr: string | null
    gls: string | null
    ment: string | null
    freqhour: string | null
    plan: string | null
  }>(
    `SELECT tl.idtasklist,
            tl.idwkctrtype, wt.wkctrtype,
            tl.idzone, z.zone,
            tl.idmachine,
            tl.mntplan, tl.tasklist, tl.legacy, tl.machine, tl.pmlist,
            tl.pmday, tl.machinestatus,
            tl.pmmin::text, tl.pmman::text, tl.manhour::text,
            tl.mat,
            tl.runhr::text, tl.mpoint, tl.bcprunhr::text, tl.gls, tl.ment, tl.freqhour::text, tl.plan
     FROM app.tbtasklist tl
     LEFT JOIN app.tbwkctrtype wt ON wt.idwkctrtype = tl.idwkctrtype
     LEFT JOIN app.tbzone z ON z.idzone = tl.idzone
     ORDER BY tl.idtasklist DESC
     LIMIT 1000`,
  )
  return r.rows.map((row) => ({
    id: String(row.idtasklist),
    idtasklist: row.idtasklist,
    idwkctrtype: row.idwkctrtype,
    wkctrtype: row.wkctrtype ?? '',
    idzone: row.idzone,
    zone: row.zone ?? '',
    idmachine: row.idmachine ?? '',
    mntplan: row.mntplan,
    tasklist: row.tasklist,
    legacy: row.legacy,
    machine: row.machine,
    pmlist: row.pmlist,
    pmday: row.pmday ?? 0,
    machinestatus: row.machinestatus ?? 0,
    pmmin: row.pmmin ? Number(row.pmmin) : 0,
    pmman: row.pmman ? Number(row.pmman) : 0,
    manhour: row.manhour ? Number(row.manhour) : 0,
    mat: row.mat ?? '',
    runhr: row.runhr ? Number(row.runhr) : 0,
    mpoint: row.mpoint ?? '',
    bcprunhr: row.bcprunhr ? Number(row.bcprunhr) : 0,
    gls: row.gls ?? '',
    ment: row.ment ?? '',
    freqhour: row.freqhour ? Number(row.freqhour) : 0,
    plan: row.plan ?? '',
  }))
}

export async function createTasklist(pool: Pool, input: TasklistInput): Promise<TasklistItem> {
  const payload = {
    idwkctrtype: input.idwkctrtype.trim(),
    idzone: input.idzone.trim(),
    idmachine: (input.idmachine ?? '').trim() || null,
    mntplan: input.mntplan.trim(),
    tasklist: input.tasklist.trim(),
    legacy: input.legacy.trim(),
    machine: input.machine.trim(),
    pmlist: input.pmlist.trim(),
    pmday: Number.isFinite(input.pmday as number) ? (input.pmday as number) : null,
    machinestatus: Number.isFinite(input.machinestatus as number) ? (input.machinestatus as number) : null,
    pmmin: Number.isFinite(input.pmmin as number) ? (input.pmmin as number) : null,
    pmman: Number.isFinite(input.pmman as number) ? (input.pmman as number) : null,
    manhour: Number.isFinite(input.manhour as number) ? (input.manhour as number) : null,
    mat: (input.mat ?? '').trim() || null,
    runhr: Number.isFinite(input.runhr as number) ? (input.runhr as number) : null,
    mpoint: (input.mpoint ?? '').trim() || null,
    bcprunhr: Number.isFinite(input.bcprunhr as number) ? (input.bcprunhr as number) : null,
    gls: (input.gls ?? '').trim() || null,
    ment: (input.ment ?? '').trim() || null,
    freqhour: Number.isFinite(input.freqhour as number) ? (input.freqhour as number) : null,
    plan: (input.plan ?? '').trim() || null,
  }
  const r = await pool.query<{ idtasklist: number }>(
    `INSERT INTO app.tbtasklist (
       idwkctrtype, idzone, idmachine,
       mntplan, tasklist, legacy, machine, pmlist,
       pmday, machinestatus, pmmin, pmman, manhour,
       mat, runhr, mpoint, bcprunhr, gls, ment, freqhour, plan
     )
     VALUES (
       $1, $2, $3,
       $4, $5, $6, $7, $8,
       $9, $10, $11, $12, $13,
       $14, $15, $16, $17, $18, $19, $20, $21
     )
     RETURNING idtasklist`,
    [
      payload.idwkctrtype,
      payload.idzone,
      payload.idmachine,
      payload.mntplan,
      payload.tasklist,
      payload.legacy,
      payload.machine,
      payload.pmlist,
      payload.pmday,
      payload.machinestatus,
      payload.pmmin,
      payload.pmman,
      payload.manhour,
      payload.mat,
      payload.runhr,
      payload.mpoint,
      payload.bcprunhr,
      payload.gls,
      payload.ment,
      payload.freqhour,
      payload.plan,
    ],
  )
  const idtasklist = r.rows[0]?.idtasklist ?? 0
  return (await listTasklists(pool)).find((x) => x.idtasklist === idtasklist) ?? {
    id: String(idtasklist),
    idtasklist,
    idwkctrtype: payload.idwkctrtype,
    wkctrtype: '',
    idzone: payload.idzone,
    zone: '',
    idmachine: payload.idmachine ?? '',
    mntplan: payload.mntplan,
    tasklist: payload.tasklist,
    legacy: payload.legacy,
    machine: payload.machine,
    pmlist: payload.pmlist,
    pmday: payload.pmday ?? 0,
    machinestatus: payload.machinestatus ?? 0,
    pmmin: payload.pmmin ?? 0,
    pmman: payload.pmman ?? 0,
    manhour: payload.manhour ?? 0,
    mat: payload.mat ?? '',
    runhr: payload.runhr ?? 0,
    mpoint: payload.mpoint ?? '',
    bcprunhr: payload.bcprunhr ?? 0,
    gls: payload.gls ?? '',
    ment: payload.ment ?? '',
    freqhour: payload.freqhour ?? 0,
    plan: payload.plan ?? '',
  }
}

export async function updateTasklist(
  pool: Pool,
  idtasklist: number,
  input: Partial<TasklistInput>,
): Promise<TasklistItem | null> {
  const existing = (await listTasklists(pool)).find((x) => x.idtasklist === idtasklist) ?? null
  if (!existing) return null
  const payload = {
    idwkctrtype: (input.idwkctrtype ?? existing.idwkctrtype).trim(),
    idzone: (input.idzone ?? existing.idzone).trim(),
    idmachine: ((input.idmachine ?? existing.idmachine) || '').trim() || null,
    mntplan: (input.mntplan ?? existing.mntplan).trim(),
    tasklist: (input.tasklist ?? existing.tasklist).trim(),
    legacy: (input.legacy ?? existing.legacy).trim(),
    machine: (input.machine ?? existing.machine).trim(),
    pmlist: (input.pmlist ?? existing.pmlist).trim(),
    pmday: input.pmday ?? existing.pmday,
    machinestatus: input.machinestatus ?? existing.machinestatus,
    pmmin: input.pmmin ?? existing.pmmin,
    pmman: input.pmman ?? existing.pmman,
    manhour: input.manhour ?? existing.manhour,
    mat: input.mat ?? existing.mat,
    runhr: input.runhr ?? existing.runhr,
    mpoint: input.mpoint ?? existing.mpoint,
    bcprunhr: input.bcprunhr ?? existing.bcprunhr,
    gls: input.gls ?? existing.gls,
    ment: input.ment ?? existing.ment,
    freqhour: input.freqhour ?? existing.freqhour,
    plan: input.plan ?? existing.plan,
  }
  await pool.query(
    `UPDATE app.tbtasklist SET
       idwkctrtype = $2,
       idzone = $3,
       idmachine = $4,
       mntplan = $5,
       tasklist = $6,
       legacy = $7,
       machine = $8,
       pmlist = $9,
       pmday = $10,
       machinestatus = $11,
       pmmin = $12,
       pmman = $13,
       manhour = $14,
       mat = $15,
       runhr = $16,
       mpoint = $17,
       bcprunhr = $18,
       gls = $19,
       ment = $20,
       freqhour = $21,
       plan = $22
     WHERE idtasklist = $1`,
    [
      idtasklist,
      payload.idwkctrtype,
      payload.idzone,
      payload.idmachine,
      payload.mntplan,
      payload.tasklist,
      payload.legacy,
      payload.machine,
      payload.pmlist,
      payload.pmday,
      payload.machinestatus,
      payload.pmmin,
      payload.pmman,
      payload.manhour,
      payload.mat || null,
      payload.runhr,
      payload.mpoint || null,
      payload.bcprunhr,
      payload.gls || null,
      payload.ment || null,
      payload.freqhour,
      payload.plan || null,
    ],
  )
  return (await listTasklists(pool)).find((x) => x.idtasklist === idtasklist) ?? null
}

export async function deleteTasklist(pool: Pool, idtasklist: number): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbtasklist WHERE idtasklist = $1`, [idtasklist])
  return (r.rowCount ?? 0) > 0
}

export async function importTasklists(
  pool: Pool,
  rows: {
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
  }[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  const clip128 = (v: string) => v.slice(0, 128)

  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const wkctrtypeText = (row.wkctrtype ?? '').trim()
    const zoneText = (row.zone ?? '').trim()
    const machineList = (row.machineList ?? '').trim()
    const mntplan = clip128((row.mntplan ?? '').trim())
    const tasklist = clip128((row.tasklist ?? '').trim())
    const legacy = clip128((row.legacy ?? '').trim())
    const machine = clip128((row.machine ?? '').trim())
    const pmlist = clip128((row.pmlist ?? '').trim())

    if (!wkctrtypeText || !zoneText || !machineList || !mntplan || !tasklist || !legacy || !machine || !pmlist) {
      failed++
      continue
    }

    const idzone = zoneText.slice(0, 64)
    await pool.query(
      `INSERT INTO app.tbzone (idzone, zone) VALUES ($1, $2)
       ON CONFLICT (idzone) DO UPDATE SET zone = EXCLUDED.zone`,
      [idzone, zoneText],
    )

    let idwkctrtype: string
    const found = await pool.query<{ idwkctrtype: string }>(
      `SELECT idwkctrtype FROM app.tbwkctrtype WHERE wkctrtype = $1 LIMIT 1`,
      [wkctrtypeText],
    )
    if (found.rows[0]?.idwkctrtype) {
      idwkctrtype = found.rows[0].idwkctrtype
    } else {
      const id = wkctrtypeText.slice(0, 64)
      await pool.query(
        `INSERT INTO app.tbwkctrtype (idwkctrtype, wkctrtype) VALUES ($1, $2)
         ON CONFLICT (idwkctrtype) DO UPDATE SET wkctrtype = EXCLUDED.wkctrtype`,
        [id, wkctrtypeText],
      )
      idwkctrtype = id
    }

    const idmachine = machineList.slice(0, 64)
    await pool.query(
      `INSERT INTO app.tbmainteanance (machine, idzone, idwkctrtype)
       VALUES ($1, $2, $3)
       ON CONFLICT (machine) DO UPDATE SET idzone = EXCLUDED.idzone, idwkctrtype = EXCLUDED.idwkctrtype`,
      [idmachine, idzone, idwkctrtype],
    )

    const r = await pool.query(
      `INSERT INTO app.tbtasklist (
         idwkctrtype, idzone, idmachine,
         mntplan, tasklist, legacy, machine, pmlist,
         pmday, machinestatus, pmmin, pmman, manhour,
         mat, runhr, mpoint, bcprunhr, gls, ment, freqhour, plan
       )
       VALUES (
         $1, $2, $3,
         $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18, $19, $20, $21
       )
       ON CONFLICT (idwkctrtype, idzone, mntplan, tasklist, machine, pmlist)
       DO UPDATE SET
         idmachine = EXCLUDED.idmachine,
         legacy = EXCLUDED.legacy,
         pmday = EXCLUDED.pmday,
         machinestatus = EXCLUDED.machinestatus,
         pmmin = EXCLUDED.pmmin,
         pmman = EXCLUDED.pmman,
         manhour = EXCLUDED.manhour,
         mat = EXCLUDED.mat,
         runhr = EXCLUDED.runhr,
         mpoint = EXCLUDED.mpoint,
         bcprunhr = EXCLUDED.bcprunhr,
         gls = EXCLUDED.gls,
         ment = EXCLUDED.ment,
         freqhour = EXCLUDED.freqhour,
         plan = EXCLUDED.plan
       RETURNING (xmax = 0) AS inserted`,
      [
        idwkctrtype,
        idzone,
        idmachine,
        mntplan,
        tasklist,
        legacy,
        machine,
        pmlist,
        row.pmday ?? 0,
        row.machinestatus ?? 0,
        row.pmmin ?? 0,
        row.pmman ?? 0,
        row.manhour ?? 0,
        (row.mat ?? '').trim() || null,
        row.runhr ?? 0,
        (row.mpoint ?? '').trim() || null,
        row.bcprunhr ?? 0,
        (row.gls ?? '').trim() || null,
        (row.ment ?? '').trim() || null,
        row.freqhour ?? 0,
        (row.plan ?? '').trim() || null,
      ],
    )

    if (r.rows[0]?.inserted) inserted++
    else updated++
  }

  return { inserted, updated, skipped, failed }
}

export type LineSchdulInput = {
  idproductline: string
  lineday: number
  uptime?: number
  linereason?: string
}

async function resolveProductlineDisplay(pool: Pool, idproductline: string): Promise<string> {
  const r = await pool.query<{ prolinedescrip: string }>(
    `SELECT prolinedescrip FROM app.tbproductline WHERE productline = $1 LIMIT 1`,
    [idproductline],
  )
  return r.rows[0]?.prolinedescrip?.trim() || idproductline
}

export async function listLineSchduls(pool: Pool): Promise<LineSchdulItem[]> {
  const r = await pool.query<{
    idline: number
    idproductline: string | null
    productline: string
    lineday: string | number | null
    uptime: string | number | null
    linereason: string | null
  }>(
    `SELECT idline, idproductline, productline, lineday, uptime, linereason
     FROM app.tblineschdul
     ORDER BY lineday DESC NULLS LAST, productline
     LIMIT 1000`,
  )
  const items: LineSchdulItem[] = []
  for (const row of r.rows) {
    const idproductline = row.idproductline ?? ''
    const lineday = row.lineday != null && row.lineday !== '' ? Number(row.lineday) : 0
    if (!idproductline || !Number.isFinite(lineday) || lineday <= 0) continue
    const uptime = row.uptime != null && row.uptime !== '' ? Number(row.uptime) : 0
    items.push({
      id: String(row.idline),
      idline: row.idline,
      idproductline,
      productline: row.productline ?? idproductline,
      lineday,
      uptime: Number.isFinite(uptime) ? uptime : 0,
      linereason: row.linereason ?? '',
    })
  }
  return items
}

function tableForMasterEntity(entity: string): string | null {
  // Keep in sync with `SUPPORTED_MASTER_ENTITIES` in schemas/master-data.ts
  switch (entity) {
    case 'activitytype':
      return 'app.tbactivitytype'
    case 'department':
      return 'app.tbdepartment'
    case 'equipment':
      return 'app.tbequipment'
    case 'functional':
      return 'app.tbfunctional'
    case 'reason':
      return 'app.tbreason'
    case 'workstatus':
      return 'app.tbwkstatus'
    case 'worktype':
      return 'app.tbwkctrtype'
    case 'zb':
      return 'app.tbwkzb'
    case 'lineproduct':
      return 'app.tbproductline'
    case 'zone':
      return 'app.tbzone'
    case 'machine':
      return 'app.tbmainteanance'
    case 'material':
      return 'app.tbmaterial'
    case 'level':
      return 'app.tbwklevel'
    case 'position':
      return 'app.tbposition'
    case 'group':
      return 'app.tbwkctrgroup'
    case 'tasklist':
      return 'app.tbtasklist'
    case 'lineschdul':
      return 'app.tblineschdul'
    default:
      return null
  }
}

export async function getMasterDataMeta(
  pool: Pool,
  entity: string,
): Promise<{ entity: string; count: number; lastUpdatedAt: string | null }> {
  const table = tableForMasterEntity(entity)
  if (!table) {
    return { entity, count: 0, lastUpdatedAt: null }
  }

  const countRes = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM ${table}`,
  )
  const count = countRes.rows[0]?.count ?? 0

  // Compute from audit log because legacy master tables don't have updated_at.
  let lastUpdatedAt: string | null = null
  try {
    const { rows } = await pool.query<{ last: string | null }>(
      `SELECT MAX(created_at)::timestamptz AS last
       FROM app.tbl_audit_log
       WHERE resource = $1
         AND action LIKE 'master-data.%'
         AND status = 'ok'`,
      [entity],
    )
    const raw = rows[0]?.last ?? null
    lastUpdatedAt = raw ? new Date(String(raw)).toISOString() : null
  } catch (err) {
    if (!isAuditTableMissing(err)) {
      console.error('[getMasterDataMeta]', entity, err)
    }
    lastUpdatedAt = null
  }

  return { entity, count, lastUpdatedAt }
}

export async function createLineSchdul(pool: Pool, input: LineSchdulInput): Promise<LineSchdulItem> {
  const idproductline = input.idproductline.trim().slice(0, 64)
  const lineday = Math.floor(input.lineday)
  const uptime = Number.isFinite(input.uptime as number) ? (input.uptime as number) : 0
  const linereason = (input.linereason ?? '').trim()
  const productline = await resolveProductlineDisplay(pool, idproductline)

  const r = await pool.query<{ idline: number }>(
    `INSERT INTO app.tblineschdul (idproductline, productline, lineday, uptime, linereason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING idline`,
    [idproductline, productline, lineday, uptime, linereason || null],
  )
  const idline = r.rows[0]?.idline ?? 0
  return (
    (await listLineSchduls(pool)).find((x) => x.idline === idline) ?? {
      id: String(idline),
      idline,
      idproductline,
      productline,
      lineday,
      uptime,
      linereason,
    }
  )
}

export async function updateLineSchdul(
  pool: Pool,
  idline: number,
  input: Partial<LineSchdulInput>,
): Promise<LineSchdulItem | null> {
  const existing =
    (await pool.query<{ idproductline: string | null; lineday: string | number | null }>(
      `SELECT idproductline, lineday FROM app.tblineschdul WHERE idline = $1`,
      [idline],
    )).rows[0] ?? null
  if (!existing) return null

  const idproductline = (input.idproductline ?? existing.idproductline ?? '').trim().slice(0, 64)
  const lineday = input.lineday != null ? Math.floor(input.lineday) : Number(existing.lineday ?? 0)
  const uptime = input.uptime != null ? input.uptime : undefined
  const linereason = input.linereason != null ? input.linereason : undefined
  const productline = await resolveProductlineDisplay(pool, idproductline)

  await pool.query(
    `UPDATE app.tblineschdul SET
       idproductline = $2,
       productline = $3,
       lineday = $4,
       uptime = COALESCE($5, uptime),
       linereason = COALESCE($6, linereason)
     WHERE idline = $1`,
    [
      idline,
      idproductline,
      productline,
      lineday,
      uptime,
      linereason != null ? linereason : null,
    ],
  )
  return (await listLineSchduls(pool)).find((x) => x.idline === idline) ?? null
}

export async function deleteLineSchdul(pool: Pool, idline: number): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tblineschdul WHERE idline = $1`, [idline])
  return (r.rowCount ?? 0) > 0
}

export async function importLineSchduls(
  pool: Pool,
  rows: { productline: string; lineday: number; uptime?: number; linereason?: string }[],
): Promise<{ inserted: number; updated: number; skipped: number; failed: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const idproductline = (row.productline ?? '').trim().slice(0, 64)
    const lineday = Math.floor(Number(row.lineday))
    const uptime = Number.isFinite(row.uptime as number) ? (row.uptime as number) : 0
    const linereason = (row.linereason ?? '').trim()

    if (!idproductline || !Number.isFinite(lineday) || lineday <= 0) {
      failed++
      continue
    }

    const productline = await resolveProductlineDisplay(pool, idproductline)

    const r = await pool.query<{ inserted: boolean }>(
      `INSERT INTO app.tblineschdul (idproductline, productline, lineday, uptime, linereason)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idproductline, lineday)
       DO UPDATE SET
         productline = EXCLUDED.productline,
         uptime = EXCLUDED.uptime,
         linereason = EXCLUDED.linereason
       RETURNING (xmax = 0) AS inserted`,
      [idproductline, productline, lineday, uptime, linereason || null],
    )
    if (r.rows[0]?.inserted) inserted++
    else updated++
  }

  return { inserted, updated, skipped, failed }
}
