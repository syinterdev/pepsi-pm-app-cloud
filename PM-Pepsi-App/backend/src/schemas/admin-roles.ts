import { z } from 'zod'

export const roleCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]{0,15}$/, 'role_code ต้องเป็น A-Z, 0-9, _ ความยาว 1–16')

export const adminRoleSchema = z.object({
  roleCode: z.string(),
  /** Thai display name */
  roleName: z.string(),
  roleNameEn: z.string(),
  roleColor: z.string(),
  isSystem: z.boolean(),
  description: z.string().nullable(),
  userCount: z.number().int(),
  permissionCount: z.number().int(),
})

export type AdminRole = z.infer<typeof adminRoleSchema>

export const adminRolesListResponseSchema = z.object({
  items: z.array(adminRoleSchema),
})

export const adminPermissionSchema = z.object({
  permCode: z.string(),
  permGroup: z.string(),
  permName: z.string(),
  description: z.string().nullable(),
})

export const adminPermissionsResponseSchema = z.object({
  groups: z.array(
    z.object({
      group: z.string(),
      permissions: z.array(adminPermissionSchema),
    }),
  ),
})

export const adminRoleMatrixResponseSchema = z.object({
  roles: z.array(adminRoleSchema),
  groups: z.array(
    z.object({
      group: z.string(),
      permissions: z.array(
        adminPermissionSchema.extend({
          grants: z.record(z.string(), z.boolean()),
        }),
      ),
    }),
  ),
})

export const createRoleBodySchema = z.object({
  roleCode: roleCodeSchema,
  roleName: z.string().trim().min(1).max(120),
  roleNameEn: z.string().trim().min(1).max(120),
  roleColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#4DA6FF'),
  description: z.string().max(500).nullable().optional(),
})

export const updateRoleBodySchema = z.object({
  roleName: z.string().trim().min(1).max(120).optional(),
  roleNameEn: z.string().trim().min(1).max(120).optional(),
  roleColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().max(500).nullable().optional(),
})

export const setRolePermissionsBodySchema = z.object({
  grants: z.record(z.string(), z.boolean()),
})

export const roleOkSchema = z.object({ ok: z.literal(true) })

export const simulateRoleResponseSchema = z.object({
  roleCode: z.string(),
  permissions: z.array(z.string()),
})
