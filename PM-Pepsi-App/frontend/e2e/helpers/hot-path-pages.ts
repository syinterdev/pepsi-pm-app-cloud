/** U4e / U4d — หน้า 1–7 ตาม PRE-UAT-UI-PHASES.md (ลำดับ PRE-UAT ไม่เรียง path) */
export const HOT_PATH_PAGES: Array<{
  id: string
  path: string
  heading: RegExp
  /** หน้าที่มีตารางหลัก — ตรวจ scroll container ที่ 1280×720 */
  tablePage?: boolean
  /** ข้อความที่ต้องเปลี่ยนตาม locale (EN → TH) */
  localeText?: { en: string; th: string }
}> = [
  {
    id: '1-planning',
    path: '/planning',
    heading: /Planning|แผนงาน/i,
    tablePage: true,
    localeText: { en: 'PM / CM Planning', th: 'แผน PM / CM' },
  },
  {
    id: '3-confirmation',
    path: '/confirmation',
    heading: /Confirmation|รับรอง/i,
    tablePage: true,
    localeText: { en: 'All', th: 'ทั้งหมด' },
  },
  {
    id: '4-calendar',
    path: '/calendar',
    heading: /Calendar|ปฏิทิน/i,
    localeText: { en: 'Work scheduling calendar', th: 'ปฏิทิน Work scheduling' },
  },
  {
    id: '5-work-orders',
    path: '/work-orders',
    heading: /Work order|ใบงาน|WO\/Confirmation/i,
    tablePage: true,
    localeText: { en: 'Import IW37N', th: 'นำเข้า IW37N' },
  },
  {
    id: '6-admin-telegram',
    path: '/admin/telegram',
    heading: /Telegram/i,
    localeText: { en: 'Telegram & notifications', th: 'Telegram & การแจ้งเตือน' },
  },
  {
    id: '7-settings',
    path: '/settings',
    heading: /Settings|ตั้งค่า/i,
    localeText: { en: 'Settings', th: 'ตั้งค่า' },
  },
]
