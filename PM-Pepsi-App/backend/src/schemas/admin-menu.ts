import { z } from 'zod'
import { navShellModeSchema } from './settings.js'

export const menuKindSchema = z.enum(['heading', 'item'])

export const adminMenuRowSchema = z.object({
  idmenu: z.number().int(),
  idmenusub: z.string(),
  menuon: z.number().int(),
  menuKind: menuKindSchema,
  menuright: z.string(),
  menuicon: z.string().nullable(),
  menutitle: z.string(),
  menulink: z.string().nullable(),
  reactRoute: z.string().nullable(),
  menuname: z.string().nullable(),
  menulavel: z.number().int(),
  endExact: z.boolean(),
})

export type AdminMenuRow = z.infer<typeof adminMenuRowSchema>

export const adminMenuListResponseSchema = z.object({
  items: z.array(adminMenuRowSchema),
})

export const createMenuBodySchema = z.object({
  menuKind: menuKindSchema,
  menutitle: z.string().trim().min(1).max(200),
  menuright: z.string().trim().min(1).max(32),
  menuicon: z.string().max(64).nullable().optional(),
  menulink: z.string().max(500).nullable().optional(),
  reactRoute: z.string().max(200).nullable().optional(),
  menuname: z.string().max(64).nullable().optional(),
  idmenusub: z.string().max(16).default('0'),
  menulavel: z.number().int().min(0).max(9).default(1),
  endExact: z.boolean().default(false),
  menuon: z.number().int().optional(),
})

export const updateMenuBodySchema = createMenuBodySchema.partial()

export const reorderMenuBodySchema = z.object({
  items: z
    .array(
      z.object({
        idmenu: z.number().int(),
        menuon: z.number().int(),
      }),
    )
    .min(1),
})

export const menuOkSchema = z.object({ ok: z.literal(true) })

export const navLayoutResponseSchema = z.object({
  navShellMode: navShellModeSchema,
})

export const patchNavLayoutBodySchema = z.object({
  navShellMode: navShellModeSchema,
})
