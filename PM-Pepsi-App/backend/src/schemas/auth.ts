/**
 * สอดคล้อง frontend/src/api/schemas.ts — แก้ทั้งสองที่เมื่อเปลี่ยนสัญญา
 */
import { z } from 'zod'

export const loginModeSchema = z.enum(['workcenter', 'member'])

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
 /** workcenter (tbworkcenter) | member (tbl_member) */
  mode: loginModeSchema.optional().default('workcenter'),
})

export const logoutRequestSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
})

export const authUserSchema = z.object({
  idwkctr: z.string(),
  username: z.string(),
  wkctr: z.string(),
  plnt: z.string().nullable().optional(),
  userst: z.string(),
  sysstatus: z.string(),
  roleNameTh: z.string().optional(),
  roleNameEn: z.string().optional(),
  userLevel: z.number().optional(),
  fullnameTh: z.string().optional(),
  fullnameEng: z.string().optional(),
  titlewkctr: z.string().optional(),
  namewkctr: z.string().optional(),
  surnamewkctr: z.string().optional(),
  imgMember: z.string().nullable().optional(),
  accountType: z.enum(['workcenter', 'member']).default('workcenter'),
  memId: z.string().optional(),
  /** RBAC codes from tbl_role_permission — populated on GET /auth/me */
  permissions: z.array(z.string()).optional(),
  passMustChange: z.boolean().optional(),
  impersonatedBy: z
    .object({
      idwkctr: z.string(),
      username: z.string(),
      userst: z.string(),
    })
    .optional(),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export const authSessionResponseSchema = z.object({
  user: authUserSchema,
})

export const logoutResponseSchema = z.object({
  ok: z.literal(true),
})

/** Password change request */
export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'ยืนยันรหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export const changePasswordResponseSchema = z.object({
  ok: z.literal(true),
  token: z.string(),
  user: authUserSchema,
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LogoutRequest = z.infer<typeof logoutRequestSchema>
export type AuthUser = z.infer<typeof authUserSchema>
