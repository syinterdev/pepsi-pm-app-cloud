/**
 * Admin CRUD ของ `tbworkcenter`
 * field1..field25 + flow ภาพประจำตัวที่เปลี่ยนมาเก็บเป็น WebP ใน BYTEA
 */
import { z } from 'zod'

export const personnelUserroleSchema = z.enum(['admin', 'manager', 'planner', 'technician'])
export const personnelUserstSchema = z.enum(['A', 'H', 'U', 'W'])

export const personnelAdminItemSchema = z.object({
  idwkctr: z.string(),
  titlewkctr: z.string().nullable(),
  namewkctr: z.string().nullable(),
  surnamewkctr: z.string().nullable(),
  titlewkctreng: z.string().nullable(),
  namewkctreng: z.string().nullable(),
  surnamewkctreng: z.string().nullable(),
  /** unix seconds */
  startwork: z.number().int().nullable(),
  /** unix seconds */
  wkctrdate: z.number().int().nullable(),
  iddepartment: z.string().nullable(),
  department: z.string().nullable(),
  idposition: z.string().nullable(),
  position: z.string().nullable(),
  wkctr: z.string(),
  plnt: z.string().nullable(),
  cat: z.string().nullable(),
  resp: z.string().nullable(),
  idwkctrgroup: z.string().nullable(),
  wkctrgroup: z.string().nullable(),
  idwkctrtype: z.string().nullable(),
  wkctrtype: z.string().nullable(),
  idwklevel: z.string().nullable(),
  wklevel: z.string().nullable(),
  wkctrtel: z.string().nullable(),
  wkctrmail: z.string().nullable(),
  labourcost: z.number(),
  userst: z.string(),
  /** explicit role ใหม่บน tbworkcenter.userrole — ใช้กับ dashboard/RBAC ใหม่ */
  userrole: personnelUserroleSchema,
  workstatus: z.string().nullable(),
  imgmember: z.string().nullable(),
  imgmemberMime: z.string(),
  imgmemberBytes: z.number().int(),
  hasImage: z.boolean(),
  /** migration 053 — บังคับเปลี่ยนรหัสผ่านครั้งถัดไปหลัง reset */
  passMustChange: z.boolean().optional(),
  telegramChatId: z.string().nullable().optional(),
  telegramUsername: z.string().nullable().optional(),
  telegramLinkedAt: z.string().nullable().optional(),
})

export const personnelAdminListResponseSchema = z.object({
  items: z.array(personnelAdminItemSchema),
  totalRows: z.number().int(),
})

/** อนุญาต `null` แปลว่า clear, undefined แปลว่า "ไม่ส่งมา / ไม่แก้" */
export const personnelAdminUpsertBodySchema = z.object({
  idwkctr: z.string().min(1).max(64),
  titlewkctr: z.string().max(64).nullable().optional(),
  namewkctr: z.string().max(255).nullable().optional(),
  surnamewkctr: z.string().max(255).nullable().optional(),
  titlewkctreng: z.string().max(64).nullable().optional(),
  namewkctreng: z.string().max(255).nullable().optional(),
  surnamewkctreng: z.string().max(255).nullable().optional(),
  /** รับเป็น `dd.mm.yyyy` หรือ `yyyy-mm-dd` หรือ unix; แปลงใน service */
  startwork: z.string().nullable().optional(),
  wkctrdate: z.string().nullable().optional(),
  iddepartment: z.string().max(64).nullable().optional(),
  idposition: z.string().max(64).nullable().optional(),
  wkctr: z.string().max(64),
  plnt: z.string().max(32).nullable().optional(),
  cat: z.string().max(64).nullable().optional(),
  resp: z.string().max(64).nullable().optional(),
  idwkctrgroup: z.string().max(64).nullable().optional(),
  idwkctrtype: z.string().max(64).nullable().optional(),
  idwklevel: z.string().max(64).nullable().optional(),
  wkctrtel: z.string().max(32).nullable().optional(),
  wkctrmail: z.string().max(255).nullable().optional(),
  labourcost: z.coerce.number().min(0).default(0),
  userst: personnelUserstSchema.default('U'),
  userrole: personnelUserroleSchema.default('planner'),
  pass: z.string().max(255).optional(),
  workstatus: z.string().max(64).nullable().optional(),
})

export const personnelAdminOkSchema = z.object({
  ok: z.literal(true),
  idwkctr: z.string(),
})

export const personnelImportRowResultSchema = z.object({
  rowNo: z.number().int(),
  idwkctr: z.string(),
  action: z.enum(['inserted', 'updated', 'skipped', 'error']),
  message: z.string().optional(),
})

export const personnelImportResponseSchema = z.object({
  fileName: z.string(),
  totalRows: z.number().int(),
  inserted: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  errors: z.number().int(),
  rows: z.array(personnelImportRowResultSchema),
})

export const personnelImageUploadResponseSchema = z.object({
  idwkctr: z.string(),
  imgmember: z.string(),
  mime: z.literal('image/webp'),
  bytes: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
})

/**
 * Lookup `workstatus` (tbwkctrstatus)
 * - `is_active=true` => ยังทำงานอยู่ (default ใน filter)
 * - `is_active=false` => ลาออก / เกษียณ / พ้นสภาพ
 */
export const personnelWorkstatusOptionSchema = z.object({
  workstatus: z.string(),
  wkstatusdes: z.string(),
  wkstcolor: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
})

export const personnelWorkstatusOptionsResponseSchema = z.object({
  items: z.array(personnelWorkstatusOptionSchema),
})

export type PersonnelAdminItem = z.infer<typeof personnelAdminItemSchema>
export type PersonnelAdminUpsertBody = z.infer<typeof personnelAdminUpsertBodySchema>
export type PersonnelImportRowResult = z.infer<typeof personnelImportRowResultSchema>
export type PersonnelImportResponse = z.infer<typeof personnelImportResponseSchema>
export type PersonnelWorkstatusOption = z.infer<typeof personnelWorkstatusOptionSchema>
export type PersonnelUserrole = z.infer<typeof personnelUserroleSchema>
