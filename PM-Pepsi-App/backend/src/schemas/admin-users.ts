import { z } from 'zod'
import { authUserSchema } from './auth.js'
import { personnelAdminListResponseSchema, personnelUserroleSchema } from './personnel-admin.js'

export const adminUserAccountTypeSchema = z.enum(['workcenter', 'member'])

export const adminUsersListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  userrole: personnelUserroleSchema.optional(),
  limit: z.coerce.number().int().min(1).max(2000).optional().default(500),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export const adminBulkUserroleBodySchema = z.object({
  idwkctrs: z.array(z.string().min(1).max(64)).min(1).max(500),
  userrole: personnelUserroleSchema,
})

export const adminBulkUserroleResponseSchema = z.object({
  ok: z.literal(true),
  updated: z.number().int(),
  userrole: personnelUserroleSchema,
})

export const adminMemberItemSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  fullname: z.string().nullable(),
  status: z.string().nullable(),
  lastLogin: z.string().nullable(),
  passMustChange: z.boolean(),
})

export const adminMembersListResponseSchema = z.object({
  items: z.array(adminMemberItemSchema),
  total: z.number().int(),
})

export const adminResetPasswordResponseSchema = z.object({
  ok: z.literal(true),
  temporaryPassword: z.string(),
  passMustChange: z.literal(true),
})

export const adminLockResponseSchema = z.object({
  ok: z.literal(true),
  workstatus: z.string().optional(),
  status: z.string().optional(),
})

export const adminImpersonateResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export const adminUsersListResponseSchema = personnelAdminListResponseSchema

export const adminPhotoGoLiveQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  weeksBack: z.coerce.number().int().min(1).max(52).optional(),
})

export const adminPhotoGoLiveItemSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string().nullable(),
  workstatus: z.string().nullable(),
  manhourHours: z.number(),
})

export const adminPhotoGoLiveResponseSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  items: z.array(adminPhotoGoLiveItemSchema),
})

export const adminDeactivateWithoutPhotoBodySchema = z.object({
  idwkctrs: z.array(z.string().min(1).max(64)).min(1).max(500),
  workstatus: z.string().min(1).max(16).optional(),
})

export const adminDeactivateWithoutPhotoResponseSchema = z.object({
  ok: z.literal(true),
  updated: z.number().int(),
  workstatus: z.string(),
  skipped: z.array(z.string()),
})

export type AdminMemberItem = z.infer<typeof adminMemberItemSchema>
