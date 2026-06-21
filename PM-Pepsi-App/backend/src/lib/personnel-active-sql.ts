/**
 * เงื่อนไข "บุคลากรยังใช้งาน"
 * (NULL/ว่าง นับว่ายังใช้งาน — data เก่าก่อน migration 039)
 */
export function personnelIsActiveSql(wcAlias = 'wc'): string {
  return `(
    ${wcAlias}.workstatus IS NULL OR ${wcAlias}.workstatus = ''
    OR EXISTS (
      SELECT 1 FROM app.tbwkctrstatus s
      WHERE s.workstatus = ${wcAlias}.workstatus AND s.is_active = true
    )
  )`
}
