import { PersonnelAdminPage } from '@/features/personnel/PersonnelAdminPage'

/** Admin console — ขยายจาก PersonnelAdminPage + reset/lock/impersonate */
export function AdminUsersPage() {
  return <PersonnelAdminPage variant="admin" />
}