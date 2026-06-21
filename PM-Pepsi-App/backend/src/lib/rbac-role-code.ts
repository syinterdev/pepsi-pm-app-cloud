/**
 * Maps session `userst` to `tbl_role.role_code` (A/H/U/W).
 */
export function normalizeRoleCode(userst: string | null | undefined): string {
  const code = (userst ?? '').trim().toUpperCase()
  if (code.length >= 1 && code.length <= 16 && /^[A-Z][A-Z0-9_]*$/.test(code)) return code
  return 'U'
}
