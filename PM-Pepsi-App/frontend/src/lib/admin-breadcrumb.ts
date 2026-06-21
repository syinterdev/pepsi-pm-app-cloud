export {
  adminBreadcrumbTrail,
  adminSectionGroupLabelForSection,
  adminSectionGroupLabelForSection as adminSectionGroupLabel,
} from '@/lib/admin-i18n'

export type AdminBreadcrumbCrumb = {
  label: string
  to?: string
  current?: boolean
}
