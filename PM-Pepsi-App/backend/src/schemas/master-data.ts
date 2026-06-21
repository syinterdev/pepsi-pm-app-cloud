/**
 * สอดคล้อง frontend/src/api/schemas.ts
 */
import { z } from 'zod'

export const activityTypeItemSchema = z.object({
  id: z.string(),
  mat: z.string(),
  matdescrip: z.string(),
  matcheck: z.string(),
})

export const departmentItemSchema = z.object({
  id: z.string(),
  iddepartment: z.string(),
  department: z.string(),
})

export const equipmentItemSchema = z.object({
  id: z.string(),
  equipment: z.string(),
  equdescrip: z.string(),
  equipmentsub: z.string(),
  functionalloc: z.string(),
  equl: z.string(),
  equ1: z.string(),
  equea: z.string(),
})

export const functionalItemSchema = z.object({
  id: z.string(),
  functionalloc: z.string(),
  funldescrip: z.string(),
  functionallocsub: z.string(),
})

export const reasonItemSchema = z.object({
  id: z.string(),
  reasoncode: z.string(),
  reasonname: z.string(),
})

export const workStatusItemSchema = z.object({
  id: z.string(),
  syst: z.string(),
  wkstreason: z.string(),
  wkstcolor: z.string(),
})

export const workTypeItemSchema = z.object({
  id: z.string(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
})

export const zbItemSchema = z.object({
  id: z.string(),
  wkzb: z.string(),
  zbdescrip: z.string(),
})

export const lineProductItemSchema = z.object({
  id: z.string(),
  productline: z.string(),
  prolinedescrip: z.string(),
})

export const zoneItemSchema = z.object({
  id: z.string(),
  idzone: z.string(),
  zone: z.string(),
  zonedescrip: z.string(),
  idproductline: z.string(),
  productline: z.string(),
})

export const machineItemSchema = z.object({
  id: z.string(),
  machine: z.string(),
  idzone: z.string(),
  zone: z.string(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
})

export const materialItemSchema = z.object({
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

export const levelItemSchema = z.object({
  id: z.string(),
  idwklevel: z.string(),
  wklevel: z.string(),
})

export const positionItemSchema = z.object({
  id: z.string(),
  idposition: z.string(),
  position: z.string(),
})

export const groupItemSchema = z.object({
  id: z.string(),
  idwkctrgroup: z.number(),
  wkctrgroup: z.string(),
  wkctrdescription: z.string(),
})

export const tasklistItemSchema = z.object({
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

export const lineSchdulItemSchema = z.object({
  id: z.string(),
  idline: z.number(),
  idproductline: z.string(),
  productline: z.string(),
  lineday: z.number(),
  uptime: z.number(),
  linereason: z.string(),
})

export const masterDataItemGenericSchema = z.object({
  id: z.string(),
  code: z.string(),
  nameTh: z.string(),
  plant: z.string(),
  active: z.boolean(),
})

export const masterDataResponseSchema = z.object({
  entity: z.string(),
  items: z.array(
    z.union([
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
      masterDataItemGenericSchema,
    ]),
  ),
})

export const masterDataMetaResponseSchema = z.object({
  entity: z.string(),
  count: z.number().int().min(0),
  /** ISO string (timestamptz) of latest successful mutation; null when audit missing/empty */
  lastUpdatedAt: z.string().nullable(),
})

export const SUPPORTED_MASTER_ENTITIES = [
  'activitytype',
  'department',
  'equipment',
  'functional',
  'reason',
  'workstatus',
  'worktype',
  'zb',
  'lineproduct',
  'zone',
  'machine',
  'material',
  'level',
  'position',
  'group',
  'tasklist',
  'lineschdul',
] as const
export type SupportedMasterEntity = (typeof SUPPORTED_MASTER_ENTITIES)[number]

export function isSupportedMasterEntity(entity: string): entity is SupportedMasterEntity {
  return (SUPPORTED_MASTER_ENTITIES as readonly string[]).includes(entity)
}

export const activityTypeBodySchema = z.object({
  mat: z.string().min(1).max(64),
  matdescrip: z.string().max(2000).optional().default(''),
  matcheck: z.string().max(64).optional().default(''),
})

export const activityTypeImportBodySchema = z.object({
  rows: z.array(activityTypeBodySchema).min(1).max(500),
})

export const activityTypeImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
})

export const activityTypePatchSchema = z.object({
  matdescrip: z.string().max(2000).optional(),
  matcheck: z.string().max(64).optional(),
})

export const departmentBodySchema = z.object({
  iddepartment: z.string().min(1).max(64),
  department: z.string().min(1).max(2000),
})

export const departmentPatchSchema = z.object({
  department: z.string().min(1).max(2000),
})

export const equipmentBodySchema = z.object({
  equipment: z.string().min(1).max(64),
  equdescrip: z.string().min(1).max(2000),
  equipmentsub: z.string().max(2000).optional().default(''),
  functionalloc: z.string().max(2000).optional().default(''),
  equl: z.string().max(2000).optional().default(''),
  equ1: z.string().max(2000).optional().default(''),
  equea: z.string().max(2000).optional().default(''),
})

export const equipmentImportBodySchema = z.object({
  rows: z.array(equipmentBodySchema).min(1).max(2000),
})

export const equipmentImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export const equipmentPatchSchema = z.object({
  equdescrip: z.string().min(1).max(2000),
  equipmentsub: z.string().max(2000).optional(),
  functionalloc: z.string().max(2000).optional(),
  equl: z.string().max(2000).optional(),
  equ1: z.string().max(2000).optional(),
  equea: z.string().max(2000).optional(),
})

export const functionalBodySchema = z.object({
  functionalloc: z.string().min(1).max(64),
  funldescrip: z.string().min(1).max(2000),
  functionallocsub: z.string().max(64).optional().default(''),
})

export const functionalImportBodySchema = z.object({
  rows: z.array(functionalBodySchema).min(1).max(2000),
})

export const functionalImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export const functionalPatchSchema = z.object({
  funldescrip: z.string().min(1).max(2000),
  functionallocsub: z.string().max(64).optional(),
})

export const reasonBodySchema = z.object({
  reasoncode: z.string().min(1).max(64),
  reasonname: z.string().min(1).max(2000),
})

export const reasonPatchSchema = z.object({
  reasonname: z.string().min(1).max(2000),
})

export const workStatusBodySchema = z.object({
  syst: z.string().min(1).max(32),
  wkstreason: z.string().min(1).max(2000),
  wkstcolor: z.string().min(1).max(32),
})

export const workStatusPatchSchema = z.object({
  wkstreason: z.string().min(1).max(2000),
  wkstcolor: z.string().min(1).max(32),
})

export const workTypeBodySchema = z.object({
  idwkctrtype: z.string().min(1).max(64),
  wkctrtype: z.string().min(1).max(2000),
})

export const workTypePatchSchema = z.object({
  wkctrtype: z.string().min(1).max(2000),
})

export const zbBodySchema = z.object({
  wkzb: z.string().min(1).max(32),
  zbdescrip: z.string().min(1).max(2000),
})

export const zbPatchSchema = z.object({
  zbdescrip: z.string().min(1).max(2000),
})

export const lineProductBodySchema = z.object({
  productline: z.string().min(1).max(64),
  prolinedescrip: z.string().min(1).max(2000),
})

export const lineProductPatchSchema = z.object({
  prolinedescrip: z.string().min(1).max(2000),
})

export const lineProductImportBodySchema = z.object({
  rows: z.array(lineProductBodySchema).min(1).max(2000),
})

export const lineProductImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export const zoneBodySchema = z.object({
  idzone: z.string().min(1).max(64),
  zone: z.string().min(1).max(2000),
  zonedescrip: z.string().max(2000).optional().default(''),
  idproductline: z.string().max(64).optional().default(''),
})

export const zonePatchSchema = z.object({
  zone: z.string().min(1).max(2000).optional(),
  zonedescrip: z.string().max(2000).optional(),
  idproductline: z.string().max(64).optional(),
})

export const zoneImportBodySchema = z.object({
  rows: z
    .array(
      z.object({
        zone: z.string().min(1).max(2000),
        zonedescrip: z.string().optional().default(''),
        productline: z.string().optional().default(''),
      }),
    )
    .min(1)
    .max(5000),
})

export const zoneImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export const machineBodySchema = z.object({
  machine: z.string().min(1).max(64),
  idzone: z.string().max(64).optional().default(''),
  idwkctrtype: z.string().max(64).optional().default(''),
})

export const machinePatchSchema = z.object({
  idzone: z.string().max(64).optional(),
  idwkctrtype: z.string().max(64).optional(),
})

export const machineImportBodySchema = z.object({
  rows: z
    .array(
      z.object({
        machine: z.string().min(1).max(64),
        zone: z.string().optional().default(''),
        wkctrtype: z.string().optional().default(''),
      }),
    )
    .min(1)
    .max(2000),
})

export const machineImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const materialBodySchema = z.object({
  wkorder: z.string().min(1).max(64),
  matdoc: z.string().max(64).optional().default(''),
  entrydate: isoDateSchema.optional(),
  matpo: z.string().max(64).optional().default(''),
  pstngdate: isoDateSchema,
  docdate: isoDateSchema.optional(),
  materialdesc: z.string().min(1).max(2000),
  matquantity: z.number().optional(),
  matbun: z.string().max(32).optional().default(''),
  amountinlc: z.number(),
  crcy: z.string().max(16).optional().default(''),
  mvt: z.string().min(1).max(32),
  costctr: z.string().max(64).optional().default(''),
  mattime: z.string().max(32).optional().default(''),
  matyr: z.string().max(16).optional().default(''),
  material: z.string().max(64).optional().default(''),
})

export const materialPatchSchema = materialBodySchema.partial()

export const materialImportBodySchema = z.object({
  rows: z.array(materialBodySchema).min(1).max(5000),
})

export const materialImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export const levelBodySchema = z.object({
  idwklevel: z.string().min(1).max(64),
  wklevel: z.string().min(1).max(2000),
})

export const levelPatchSchema = z.object({
  wklevel: z.string().min(1).max(2000),
})

export const positionBodySchema = z.object({
  idposition: z.string().min(1).max(64),
  position: z.string().min(1).max(2000),
})

export const positionPatchSchema = z.object({
  position: z.string().min(1).max(2000),
})

export const groupBodySchema = z.object({
  wkctrgroup: z.string().min(1).max(64),
  wkctrdescription: z.string().max(2000).optional().default(''),
})

export const groupPatchSchema = z.object({
  wkctrgroup: z.string().min(1).max(64).optional(),
  wkctrdescription: z.string().max(2000).optional(),
})

export const tasklistBodySchema = z.object({
  idwkctrtype: z.string().min(1).max(64),
  idzone: z.string().min(1).max(64),
  idmachine: z.string().max(64).optional().default(''),
  mntplan: z.string().min(1).max(128),
  tasklist: z.string().min(1).max(128),
  legacy: z.string().min(1).max(128),
  machine: z.string().min(1).max(128),
  pmlist: z.string().min(1).max(128),
  pmday: z.number().optional().default(0),
  machinestatus: z.number().optional().default(0),
  pmmin: z.number().optional().default(0),
  pmman: z.number().optional().default(0),
  manhour: z.number().optional().default(0),
  mat: z.string().max(64).optional().default(''),
  runhr: z.number().optional().default(0),
  mpoint: z.string().max(2000).optional().default(''),
  bcprunhr: z.number().optional().default(0),
  gls: z.string().max(2000).optional().default(''),
  ment: z.string().max(2000).optional().default(''),
  freqhour: z.number().optional().default(0),
  plan: z.string().max(2000).optional().default(''),
})

export const tasklistPatchSchema = tasklistBodySchema.partial()

export const tasklistImportBodySchema = z.object({
  rows: z
    .array(
      z.object({
        wkctrtype: z.string().min(1).max(2000),
        zone: z.string().min(1).max(2000),
        machineList: z.string().min(1).max(2000),
        mntplan: z.string().min(1).max(2000),
        tasklist: z.string().min(1).max(2000),
        legacy: z.string().min(1).max(2000),
        machine: z.string().min(1).max(2000),
        pmlist: z.string().min(1).max(2000),
        pmday: z.number().optional(),
        machinestatus: z.number().optional(),
        pmmin: z.number().optional(),
        pmman: z.number().optional(),
        manhour: z.number().optional(),
        mat: z.string().optional().default(''),
        runhr: z.number().optional(),
        mpoint: z.string().optional().default(''),
        bcprunhr: z.number().optional(),
        gls: z.string().optional().default(''),
        ment: z.string().optional().default(''),
        freqhour: z.number().optional(),
        plan: z.string().optional().default(''),
      }),
    )
    .min(1)
    .max(5000),
})

export const tasklistImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})

export const lineSchdulBodySchema = z.object({
  idproductline: z.string().min(1).max(64),
  lineday: z.number().int().min(1),
  uptime: z.number().optional().default(0),
  linereason: z.string().max(2000).optional().default(''),
})

export const lineSchdulPatchSchema = lineSchdulBodySchema.partial()

export const lineSchdulImportBodySchema = z.object({
  rows: z
    .array(
      z.object({
        productline: z.string().min(1).max(2000),
        lineday: z.number().int().min(1),
        uptime: z.number().optional(),
        linereason: z.string().optional().default(''),
      }),
    )
    .min(1)
    .max(5000),
})

export const lineSchdulImportResultSchema = z.object({
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
})
