/**
 * Personnel Confirmation dashboard
 * แสดง WO ที่ยังเปิด (`syst CRTD/REL`) พร้อม progress bar % ของช่างที่ปิดงาน
 * (`view_countpersonelclose`) สำหรับ Admin
 */
import { z } from 'zod'

export const personnelConfirmRowSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  mntplan: z.string().nullable(),
  wktype: z.string().nullable(),
  mat: z.string().nullable(),
  equdescrip: z.string().nullable(),
  functionalloc: z.string().nullable(),
  shortText: z.string().nullable(),
  /** ISO date string `yyyy-mm-dd` */
  bscStart: z.string().nullable(),
  /** ISO date string ของ `tbmoveplan.cday` ถ้ามี (New Plan) */
  cday: z.string().nullable(),
  syst: z.string().nullable(),
  systemstatus: z.string().nullable(),
  wkstcolor: z.string().nullable(),
  wkctr: z.string().nullable(),
  /** จำนวนช่างที่มอบหมาย (tbplangingwork.idiw37) */
  plannedCount: z.number().int(),
  /** จำนวนช่างที่ปิดงานจริง (distinct wkctr ใน tbcofirm) */
  closedCount: z.number().int(),
  /** ปัด 0-100 */
  percentClose: z.number().int(),
  /** มี tbcofirm อย่างน้อย 1 แถวหรือไม่ (สำหรับสีปุ่ม success/info) */
  hasConfirm: z.boolean(),
  /** Admin QC — pending | approved | rejected */
  qcStatus: z.enum(['pending', 'approved', 'rejected']).nullable(),
})

export const personnelConfirmListResponseSchema = z.object({
  items: z.array(personnelConfirmRowSchema),
  totalRows: z.number().int(),
  /** สรุปรวมไว้บนหัวการ์ด (open WO + งานปิดครบ) */
  summary: z.object({
    totalOpen: z.number().int(),
    fullyClosed: z.number().int(),
    inProgress: z.number().int(),
    notStarted: z.number().int(),
  }),
})

export type PersonnelConfirmRow = z.infer<typeof personnelConfirmRowSchema>
export type PersonnelConfirmListResponse = z.infer<
  typeof personnelConfirmListResponseSchema
>
