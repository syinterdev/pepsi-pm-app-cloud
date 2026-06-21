/**
 * รหัสช่าง Engineering (WorkCntr) — จากลูกค้า
 * WorkCntr = `tbworkcenter.wkctr` (PAC/PRO/UTI) — ไม่ใช่รหัส HR (`idwkctr`)
 * ไฟล์: `docs from customer/Code ช่าง Eng.xls` + UI Confirm ผู้ปฏิบัติงาน
 * ใช้ใน `tbworkcenter.wkctr` และ picker ปิดงาน (tbwrkclose)
 */
export type EngTechnicianCode = {
  wkctr: string
  titlewkctr: string
  namewkctr: string
  surnamewkctr: string
  /** ชื่ออังกฤษจาก Excel (อ้างอิง) */
  nameEn?: string
}

/** 25 ช่าง Engineering ที่แสดงใน grid Confirm (ลำดับ PAC → PRO → UTI) */
export const ENG_TECHNICIAN_CODES: readonly EngTechnicianCode[] = [
  { wkctr: 'PAC007', titlewkctr: 'นางสาว', namewkctr: 'พชรพรรณ', surnamewkctr: 'ชัยเนตร', nameEn: 'Pacharapan Jayanetra' },
  { wkctr: 'PAC009', titlewkctr: 'นาย', namewkctr: 'อนุวัฒน์', surnamewkctr: 'จันทร์ดี' },
  { wkctr: 'PAC010', titlewkctr: 'นาย', namewkctr: 'กฤษฎิ์', surnamewkctr: 'อนนท์', nameEn: 'Narit Anon' },
  { wkctr: 'PAC011', titlewkctr: 'นาย', namewkctr: 'เจษฎา', surnamewkctr: 'ปากกองวัน', nameEn: 'Chetsada Parkongwan' },
  { wkctr: 'PAC012', titlewkctr: 'นาย', namewkctr: 'นพดล', surnamewkctr: 'จีดมั่น', nameEn: 'Noppadol Jitmon' },
  { wkctr: 'PAC013', titlewkctr: 'นาย', namewkctr: 'ออมทรัพย์', surnamewkctr: 'สกุลประกายพร', nameEn: 'Oomsap Sakunprakaiphon' },
  { wkctr: 'PAC014', titlewkctr: 'นาย', namewkctr: 'ภูวดล', surnamewkctr: 'คนดี', nameEn: 'Phuwadon Kondee' },
  { wkctr: 'PAC015', titlewkctr: 'นาย', namewkctr: 'จักรพงษ์', surnamewkctr: 'กาบศรี', nameEn: 'Jakkapong Kapsee' },
  { wkctr: 'PRO007', titlewkctr: 'นาย', namewkctr: 'จิรวัฒน์', surnamewkctr: 'ปันขันธ์', nameEn: 'Jirawat Pankhan' },
  { wkctr: 'PRO008', titlewkctr: 'นาย', namewkctr: 'จักรกริศน์', surnamewkctr: 'แสนขัติย์' },
  { wkctr: 'PRO009', titlewkctr: 'นาย', namewkctr: 'เอกนรินทร์', surnamewkctr: 'ไชยวงค์', nameEn: 'Aeknarin Chaiwong' },
  { wkctr: 'PRO010', titlewkctr: 'นาย', namewkctr: 'สรรเสริญ', surnamewkctr: 'จายนวล', nameEn: 'Sarsern Jainuay' },
  { wkctr: 'PRO011', titlewkctr: 'นาย', namewkctr: 'ธวัชชัย', surnamewkctr: 'แก้วจันทร์', nameEn: 'Tavatchai Gaewchan' },
  { wkctr: 'PRO013', titlewkctr: 'นาย', namewkctr: 'รัชชานนท์', surnamewkctr: 'นนทะธรรม', nameEn: 'Ratchanon Nontathum' },
  { wkctr: 'PRO014', titlewkctr: 'นาย', namewkctr: 'สมนึก', surnamewkctr: 'มงคลแก้ว', nameEn: 'Somnuk Mongkholkaew' },
  { wkctr: 'PRO015', titlewkctr: 'นาย', namewkctr: 'เจษฎาพงศ์', surnamewkctr: 'ดวงแก้ว', nameEn: 'Jassdapong Daoungkeaw' },
  { wkctr: 'PRO016', titlewkctr: 'นาย', namewkctr: 'ยุทธการ', surnamewkctr: 'คาวิชา', nameEn: 'Yuttakarn Karvichar' },
  { wkctr: 'PRO017', titlewkctr: 'นาย', namewkctr: 'ศรัล', surnamewkctr: 'แป้นเพชร', nameEn: 'Yotsaran Panphet' },
  { wkctr: 'PRO019', titlewkctr: 'นาย', namewkctr: 'กฤษดา', surnamewkctr: 'รังสิตวัฒนะ', nameEn: 'Kritsada Rangsitwattana' },
  { wkctr: 'UTI004', titlewkctr: 'นาย', namewkctr: 'อานนท์', surnamewkctr: 'สุริยะมณี', nameEn: 'Arnon Suriyamanee' },
  { wkctr: 'UTI006', titlewkctr: 'นาย', namewkctr: 'กรณ์', surnamewkctr: 'เที่ยงโคกสูง', nameEn: 'Korn Tiangkongsang' },
  { wkctr: 'UTI007', titlewkctr: 'นาย', namewkctr: 'ภาณุวัช', surnamewkctr: 'ไชยชุมภู', nameEn: 'Panuwat Chaichompu' },
  { wkctr: 'UTI008', titlewkctr: 'นาย', namewkctr: 'อภินันท์', surnamewkctr: 'ถาคำ', nameEn: 'Apinan Takhom' },
  { wkctr: 'UTI011', titlewkctr: 'นาย', namewkctr: 'ประพันธ์', surnamewkctr: 'ผัดกันตุ้ย', nameEn: 'Prapan Phatkantui' },
  { wkctr: 'UTI012', titlewkctr: 'นาย', namewkctr: 'ณัฐวุฒิ', surnamewkctr: 'มีงิ้ว', nameEn: 'Nuttawau MeeNgiw' },
] as const

export const ENG_TECHNICIAN_WKCTR_LIST = ENG_TECHNICIAN_CODES.map((t) => t.wkctr)

const ENG_TECHNICIAN_BY_WKCTR = new Map(
  ENG_TECHNICIAN_CODES.map((t) => [t.wkctr, t] as const),
)

export function engTechnicianDisplayName(row: {
  wkctr?: string | null
  titlewkctr?: string | null
  namewkctr?: string | null
  surnamewkctr?: string | null
}): string {
  const fromRow = [row.titlewkctr, row.namewkctr, row.surnamewkctr].filter(Boolean).join(' ').trim()
  if (fromRow) return fromRow
  const code = (row.wkctr ?? '').trim().toUpperCase()
  const catalog = code ? ENG_TECHNICIAN_BY_WKCTR.get(code) : undefined
  if (!catalog) return ''
  return [catalog.titlewkctr, catalog.namewkctr, catalog.surnamewkctr].filter(Boolean).join(' ').trim()
}

/** ป้ายตัวกรอง — `PAC007 — นาย อนุวัฒน์ จันทร์ดี` */
export function formatWorkcenterFilterLabel(wkctr: string, displayName: string): string {
  const name = displayName.trim()
  return name ? `${wkctr} — ${name}` : wkctr
}
