/**
 * Parser สำหรับ Excel/CSV นำเข้า `Personel.xlsx`
 *
 * - Skip 2 rows แรก (PHP: `if ($n > 2)`)
 * - คอลัมน์ที่ใช้: Row[0]=idwkctr, Row[1]=titlewkctr, Row[2]=namewkctr, Row[3]=surnamewkctr,
 *   Row[4]=titlewkctreng, Row[5]=namewkctreng, Row[6]=surnamewkctreng, Row[7]=startwork (dd.mm.yyyy พ.ศ.),
 *   Row[8]=iddepartment, Row[9]=position (lookup → idposition), Row[10]=wkctr, Row[11]=plnt,
 *   Row[12]=cat, Row[13]=resp, Row[14]=wkctrgroup (lookup → idwkctrgroup), Row[15]=wkctrtype (lookup → idwkctrtype),
 *   Row[16]=wklevel (lookup → idwklevel), Row[17]=wkctrdate (dd.mm.yyyy พ.ศ.), Row[18]=wkctrtel,
 *   Row[19]=wkctrmail, Row[20]=labourcost, Row[21]=userst, Row[22]=pass,
 *   Row[23]=userrole (optional: admin/manager/planner/technician)
 * - ปีใน PHP เป็น พ.ศ. (` $yy = $Lineday[2] - 543 `) — แปลงเป็น ค.ศ. ใน service
 * - แถวที่ Row[0] (idwkctr) ว่างถือว่า skip
 */
import * as XLSX from 'xlsx'

export type PersonnelImportParsedRow = {
  rowNo: number
  idwkctr: string
  titlewkctr: string
  namewkctr: string
  surnamewkctr: string
  titlewkctreng: string
  namewkctreng: string
  surnamewkctreng: string
  startwork: number | null
  iddepartment: string
  positionName: string
  wkctr: string
  plnt: string
  cat: string
  resp: string
  wkctrgroupName: string
  wkctrtypeName: string
  wklevelName: string
  wkctrdate: number | null
  wkctrtel: string
  wkctrmail: string
  labourcost: number
  userst: 'A' | 'H' | 'U' | 'W'
  pass: string
  userrole: string
}

export type PersonnelParseResult =
  | { kind: 'ok'; row: PersonnelImportParsedRow }
  | {
      kind: 'error'
      rowNo: number
      idwkctr: string
      message: string
    }

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number') {
    // Date serial ของ Excel จะถูกแปลงด้วยเซลไหนก็ตามใน sheet — เก็บเป็น string ก่อน
    return String(v)
  }
  return String(v).trim()
}

/**
 * dd.mm.yyyy → epoch วินาที (00:00:00)
 * รับทั้งปี ค.ศ. และ พ.ศ. (>= 2500 → ลบ 543)
 */
export function parseThaiDate(value: string): number | null {
  const t = value.trim()
  if (!t) return null
  const parts = t.split(/[./-]/)
  if (parts.length < 3) return null
  const day = Number(parts[0])
  const month = Number(parts[1])
  let year = Number(parts[2])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  if (year >= 2500) year -= 543
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null
  const d = new Date(year, month - 1, day, 0, 0, 0, 0)
  const sec = Math.floor(d.getTime() / 1000)
  return sec > 0 ? sec : null
}

function normalizeUserst(value: string): 'A' | 'U' | 'W' {
  const v = value.trim().toUpperCase()
  if (v === 'A') return 'A'
  if (v === 'W') return 'W'
  if (v === 'H') return 'U'
  return 'U'
}

export function parsePersonnelFile(buf: Buffer): PersonnelParseResult[] {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const out: PersonnelParseResult[] = []
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 1
      if (rowNo <= 2) continue
      const r = rows[i] ?? []

      const idwkctr = cellStr(r[0])
      if (!idwkctr) continue

      try {
        const labourcostRaw = cellStr(r[20])
        const labourcost = labourcostRaw === '' ? 0 : Number(labourcostRaw)
        if (!Number.isFinite(labourcost)) {
          out.push({
            kind: 'error',
            rowNo,
            idwkctr,
            message: `Bad labourcost: "${labourcostRaw}"`,
          })
          continue
        }

        out.push({
          kind: 'ok',
          row: {
            rowNo,
            idwkctr,
            titlewkctr: cellStr(r[1]),
            namewkctr: cellStr(r[2]),
            surnamewkctr: cellStr(r[3]),
            titlewkctreng: cellStr(r[4]),
            namewkctreng: cellStr(r[5]),
            surnamewkctreng: cellStr(r[6]),
            startwork: parseThaiDate(cellStr(r[7])),
            iddepartment: cellStr(r[8]),
            positionName: cellStr(r[9]),
            wkctr: cellStr(r[10]),
            plnt: cellStr(r[11]),
            cat: cellStr(r[12]),
            resp: cellStr(r[13]),
            wkctrgroupName: cellStr(r[14]),
            wkctrtypeName: cellStr(r[15]),
            wklevelName: cellStr(r[16]),
            wkctrdate: parseThaiDate(cellStr(r[17])),
            wkctrtel: cellStr(r[18]),
            wkctrmail: cellStr(r[19]),
            labourcost,
            userst: normalizeUserst(cellStr(r[21])),
            pass: cellStr(r[22]),
            userrole: cellStr(r[23]),
          },
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        out.push({ kind: 'error', rowNo, idwkctr, message: msg })
      }
    }
  }
  return out
}
