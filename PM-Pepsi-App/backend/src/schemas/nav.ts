import { z } from 'zod'

export const navMenuItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('heading'),
    label: z.string(),
    menuright: z.string(),
  }),
  z.object({
    kind: z.literal('item'),
    label: z.string(),
    to: z.string(),
    menuright: z.string(),
    icon: z.string().optional(),
    end: z.boolean().optional(),
  }),
])

export const navMenuResponseSchema = z.object({
  items: z.array(navMenuItemSchema),
})
