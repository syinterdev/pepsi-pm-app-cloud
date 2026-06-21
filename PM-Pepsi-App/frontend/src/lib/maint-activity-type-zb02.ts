/** สอดคล้อง backend/src/data/maint-activity-type-zb02.ts */
export type MaintActivityTypeRow = {
  orderType: 'ZB02'
  mat: string
  description: string
}

export const MAINT_ACTIVITY_TYPE_ZB02: readonly MaintActivityTypeRow[] = [
  { orderType: 'ZB02', mat: '001', description: 'Inspection & Cond. Monitoring' },
  { orderType: 'ZB02', mat: '002', description: 'Preventive Maintenance' },
  { orderType: 'ZB02', mat: '007', description: 'Cleaning' },
  { orderType: 'ZB02', mat: '009', description: 'Work out of inspection' },
  { orderType: 'ZB02', mat: '013', description: 'Audit (AIB) / Food Safety' },
  { orderType: 'ZB02', mat: '016', description: 'Meeting' },
  { orderType: 'ZB02', mat: '017', description: 'Assistance to Ops' },
  { orderType: 'ZB02', mat: '018', description: 'Statutory' },
  { orderType: 'ZB02', mat: '019', description: 'Training' },
  { orderType: 'ZB02', mat: '022', description: 'Environmental & Sustainability' },
  { orderType: 'ZB02', mat: '023', description: 'Safety' },
  { orderType: 'ZB02', mat: '027', description: 'Modification' },
  { orderType: 'ZB02', mat: '029', description: 'RCA (Root Cause Analysis)' },
  { orderType: 'ZB02', mat: '033', description: 'Lubrication' },
  { orderType: 'ZB02', mat: '034', description: 'Calibration' },
  { orderType: 'ZB02', mat: '035', description: 'Improve Perf to Spec (IPS)' },
  { orderType: 'ZB02', mat: '038', description: 'Maintenance - Entry list WM' },
  { orderType: 'ZB02', mat: '039', description: 'Operations - Entry list WM' },
  { orderType: 'ZB02', mat: '040', description: 'Dry run - Entry list WM' },
] as const
