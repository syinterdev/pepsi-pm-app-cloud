/** Display name for sidebar footer / compact user blocks */
export function authUserDisplayName(
  user: { fullnameTh?: string | null; username: string },
): string {
  return user.fullnameTh?.trim() || user.username
}
