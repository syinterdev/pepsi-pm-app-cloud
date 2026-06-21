export type MasterEntityDef = {
  id: string
  label: string
  legacy?: string
}

/** 17 master entities per 14-administrator.md §4.6 — ตรงกับ `SUPPORTED_MASTER_ENTITIES` บน API */
export const MASTER_ENTITIES: MasterEntityDef[] = [
  { id: 'activitytype', label: 'Activity type', legacy: 'M_activitytype' },
  { id: 'department', label: 'Department', legacy: 'M_department' },
  { id: 'equipment', label: 'Equipment', legacy: 'M_equipment' },
  { id: 'functional', label: 'Functional location', legacy: 'M_functional' },
  { id: 'reason', label: 'Reason', legacy: 'M_reason' },
  { id: 'workstatus', label: 'Work status', legacy: 'M_workstatus' },
  { id: 'worktype', label: 'Work type', legacy: 'M_worktype' },
  { id: 'zb', label: 'ZB', legacy: 'M_zb' },
  { id: 'lineproduct', label: 'Line product', legacy: 'M_lineproduct' },
  { id: 'zone', label: 'Zone', legacy: 'M_zone' },
  { id: 'machine', label: 'Machine', legacy: 'M_machine' },
  { id: 'material', label: 'Material', legacy: 'M_material' },
  { id: 'level', label: 'Level', legacy: 'M_level' },
  { id: 'position', label: 'Position', legacy: 'M_position' },
  { id: 'group', label: 'Group', legacy: 'M_Group' },
  { id: 'tasklist', label: 'Task list', legacy: 'M_tasklist' },
  { id: 'lineschdul', label: 'Line schedule', legacy: 'M_lineschdul' },
]

export const MASTER_ENTITY_IDS = MASTER_ENTITIES.map((e) => e.id)

export function masterDataHref(entityId: string): string {
  return `/master-data?entity=${encodeURIComponent(entityId)}`
}
