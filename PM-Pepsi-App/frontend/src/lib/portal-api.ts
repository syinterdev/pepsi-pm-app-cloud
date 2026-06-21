import { z } from 'zod'
import { fetchApi } from '@/lib/fetch-api'

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

export type PortalModule = z.infer<typeof portalModuleSchema>
export type PortalModulesResponse = z.infer<typeof portalModulesResponseSchema>

export const moduleHandoffResponseSchema = z.object({
  redirectUrl: z.string().url(),
  expiresAt: z.string(),
  moduleCode: z.string(),
})

export type ModuleHandoffResponse = z.infer<typeof moduleHandoffResponseSchema>

export async function fetchPortalModules(): Promise<PortalModulesResponse> {
  const raw = await fetchApi<unknown>('/api/v1/portal/modules')
  return portalModulesResponseSchema.parse(raw)
}

export async function requestModuleHandoff(moduleCode: string): Promise<ModuleHandoffResponse> {
  const raw = await fetchApi<unknown>('/api/v1/auth/module-handoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleCode }),
  })
  return moduleHandoffResponseSchema.parse(raw)
}
