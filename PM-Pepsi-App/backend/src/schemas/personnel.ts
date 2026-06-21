/**
 * Personal Dashboard
 * (สรุปงานปิดต่อช่าง). เก็บข้อมูลเฉพาะของ user ที่ login อยู่เท่านั้น
 * เพื่อใช้บน `/personnel`
 */
import { z } from 'zod'
import { worktimeBreakdownSchema } from './manhours.js'

export const personnelDashboardProfileSchema = z.object({
  accountType: z.enum(['workcenter', 'member']),
  idwkctr: z.string(),
  username: z.string(),
  displayName: z.string(),
  /** SAP work center code เช่น PAC007 */
  wkctr: z.string(),
  plnt: z.string().nullable().optional(),
  userst: z.string(),
  /** explicit role จาก tbworkcenter.userrole (migration 041) */
  userRole: z.enum(['admin', 'manager', 'planner', 'technician']),
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  workGroup: z.string().nullable().optional(),
  workType: z.string().nullable().optional(),
  workLevel: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  tel: z.string().nullable().optional(),
  imgMember: z.string().nullable().optional(),
  birthdayLabel: z.string().nullable().optional(),
  workAgeLabel: z.string().nullable().optional(),
  startWorkDate: z.string().nullable().optional(),
  birthdayDate: z.string().nullable().optional(),
  lastLogin: z.string().nullable().optional(),
})

export const personnelPlanningItemSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  wktype: z.string().nullable(),
  shortText: z.string().nullable(),
  functionalLoc: z.string().nullable(),
  equipment: z.string().nullable(),
  /** unix seconds → ISO date */
  bscStart: z.string().nullable(),
  syst: z.string().nullable(),
})

export const personnelConfirmItemSchema = z.object({
  idclose: z.number().int(),
  idiw37: z.number().int(),
  wkorder: z.string(),
  confirmation: z.string(),
  wkctr: z.string(),
  timewk: z.number(),
  unitc: z.string(),
  /** ISO date */
  stdate: z.string().nullable(),
  endate: z.string().nullable(),
  timeclose: z.string().nullable(),
})

export const personnelRoleSchema = z.enum([
  'admin',
  'manager',
  'planner',
  'technician',
])

/** ทีม row — ใช้สำหรับการ์ดผู้จัดการ (`manager`) */
export const personnelTeamMemberSchema = z.object({
  idwkctr: z.string(),
  displayName: z.string(),
  position: z.string().nullable(),
  workGroup: z.string().nullable(),
  openCount: z.number().int(),
  closedCount: z.number().int(),
  totalMinutes: z.number(),
})

/** WO รอจ่ายงาน — ใช้สำหรับการ์ด planner */
export const personnelUnassignedWorkOrderSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  wktype: z.string().nullable(),
  shortText: z.string().nullable(),
  equipment: z.string().nullable(),
  functionalLoc: z.string().nullable(),
  bscStart: z.string().nullable(),
  syst: z.string().nullable(),
  wkctr: z.string().nullable(),
})

/** ข้อมูลเฉพาะ role — backend จะ populate ตาม role ของ user */
export const personnelRoleDataSchema = z.object({
  /** สำหรับ manager: สมาชิกใน workgroup เดียวกัน (สรุปงาน) */
  team: z
    .object({
      groupCode: z.string().nullable(),
      groupName: z.string().nullable(),
      totalOpen: z.number().int(),
      totalClose: z.number().int(),
      members: z.array(personnelTeamMemberSchema),
    })
    .nullable()
    .optional(),
  /** สำหรับ planner / admin: WO ยังไม่มีคนจ่าย */
  unassigned: z
    .object({
      total: z.number().int(),
      items: z.array(personnelUnassignedWorkOrderSchema),
    })
    .nullable()
    .optional(),
  /** สำหรับ admin/planner: ยอด WO open ทั้งโรงงาน (ดูภาพรวม) */
  global: z
    .object({
      openTotal: z.number().int(),
      closeToday: z.number().int(),
      assignedTotal: z.number().int(),
    })
    .nullable()
    .optional(),
})

export const personnelDashboardResponseSchema = z.object({
  /** legacy enum 'A' | 'U' | 'W' | 'H' — ส่งกลับมาตามที่ผู้ใช้ login */
  role: personnelRoleSchema,
  roleLabel: z.string(),
  profile: personnelDashboardProfileSchema,
  planning: z.object({
    openCount: z.number().int(),
    closedCount: z.number().int(),
    recent: z.array(personnelPlanningItemSchema),
  }),
  confirmation: z.object({
    totalClose: z.number().int(),
    totalMinutes: z.number(),
    recent: z.array(personnelConfirmItemSchema),
  }),
  worktime: worktimeBreakdownSchema.nullable(),
  /** ข้อมูลเฉพาะ role (manager/planner/admin) */
  roleData: personnelRoleDataSchema,
})

export type PersonnelRole = z.infer<typeof personnelRoleSchema>
export type PersonnelDashboardResponse = z.infer<typeof personnelDashboardResponseSchema>
