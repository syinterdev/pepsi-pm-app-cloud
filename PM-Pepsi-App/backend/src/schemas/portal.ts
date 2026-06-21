import { z } from 'zod'

export const portalModuleSchema = z.object({
  code: z.string(),
  nameTh: z.string(),
  nameEn: z.string(),
  descriptionTh: z.string(),
  descriptionEn: z.string(),
  iconKey: z.string(),
  accentToken: z.string().nullable(),
  external: z.boolean(),
  entryUrl: z.string(),
  ready: z.boolean(),
  handoff: z.string(),
})

export const portalModulesResponseSchema = z.object({
  modules: z.array(portalModuleSchema),
  autoRedirect: z.string().nullable(),
})

export const moduleHandoffRequestSchema = z.object({
  moduleCode: z.string().min(1).max(32),
})

export const moduleHandoffResponseSchema = z.object({
  redirectUrl: z.string().url(),
  expiresAt: z.string(),
  moduleCode: z.string(),
})

export const moduleExchangeRequestSchema = z.object({
  code: z.string().min(1),
  moduleCode: z.string().min(1).max(32),
})

export const moduleExchangeUserSchema = z.object({
  idwkctr: z.string(),
  memId: z.string().nullable(),
  username: z.string(),
  userst: z.string(),
  accountType: z.enum(['workcenter', 'member']),
  fullnameTh: z.string().nullable(),
  fullnameEng: z.string().nullable(),
  wkctr: z.string(),
  plnt: z.string().nullable(),
})

export const moduleExchangeResponseSchema = z.object({
  user: moduleExchangeUserSchema,
  hubPermissions: z.array(z.string()),
  handoffAt: z.string(),
})

export type PortalModule = z.infer<typeof portalModuleSchema>
export type PortalModulesResponse = z.infer<typeof portalModulesResponseSchema>
