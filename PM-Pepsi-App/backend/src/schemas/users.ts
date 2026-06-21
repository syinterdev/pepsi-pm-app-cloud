import { z } from 'zod'

/** รายการผู้ใช้แบบย่อ — หน้า Settings (`/settings` แท็บผู้ใช้ระบบ) */
export const usersListResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int(),
      username: z.string(),
      role: z.string(),
      active: z.boolean(),
    }),
  ),
})

export type UsersListResponse = z.infer<typeof usersListResponseSchema>
