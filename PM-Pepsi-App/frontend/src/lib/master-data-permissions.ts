import { usePermission } from '@/lib/use-permission'

export function useMasterDataPermissions() {
  return {
    canRead: usePermission('master-data.read'),
    canWrite: usePermission('master-data.write'),
    canDelete: usePermission('master-data.delete'),
    canImport: usePermission('master-data.import'),
  }
}
