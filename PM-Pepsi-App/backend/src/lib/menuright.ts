/** menuright แบบ `A:U:W` กับ UserST */
export function canAccessMenuright(userst: string, menuright: string): boolean {
  const role = userst.trim()
  if (!role) return false
  const allowed = menuright.split(':').map((s) => s.trim()).filter(Boolean)
  return allowed.includes(role)
}
