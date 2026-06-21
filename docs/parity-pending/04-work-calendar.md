# ลำดับที่ 4 — Work calendar (IW37 / scheduling)

**สถานะรวม:** แกนเสร็จ ✅ · UAT ขั้น 5 ⏳  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Checklist หลัก:** `calendar.php`, `M_filter_iw37.php`, `calendar_wkctr.php`  
**Migration:** [`004_tbiw37n_calendar.sql`](../../database/migrations/004_tbiw37n_calendar.sql) · dependency: [`002_tbactivitytype.sql`](../../database/migrations/002_tbactivitytype.sql), [`005_tbwkzb_tbfunctional.sql`](../../database/migrations/005_tbwkzb_tbfunctional.sql), [`009_tbreason.sql`](../../database/migrations/009_tbreason.sql), [`013_tbwkstatus_add_wkstreason.sql`](../../database/migrations/013_tbwkstatus_add_wkstreason.sql)  
**Route:** `/calendar`

---

## ทำแล้ว (แกน)

- [x] ตาราง `tbiw37n`, `tbwkstatus`, `tbmoveplan`, view `app.view_order`
- [x] `GET /api/v1/calendar/events`
- [x] [`CalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx) — ปฏิทินรายเดือน + badge API+DB
- [x] `GET /api/v1/calendar/filter-options`
- [x] `POST /api/v1/calendar/events` (ฟิลเตอร์แบบ PHP)
- [x] Modal รายละเอียด WO + MovePlanDialog (ลากย้ายแผน)

---

## เส้นทางโค้ด (E2E)

- **Route (FE):** [`App.tsx`](../../PM-Pepsi-App/frontend/src/App.tsx) → `path="calendar"` → [`CalendarPage`](../../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx)
- **ฟิลเตอร์ (FE):** [`CalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx)
  - โหลด options: `fetchCalendarFilterOptions()` → [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts) → `GET /api/v1/calendar/filter-options`
  - ค้นหา (POST): `postCalendarEvents(body)` → `POST /api/v1/calendar/events`
- **ปฏิทิน (FE):** `MonthFullCalendar` → click event เปิด `WorkOrderDetailDialog`, drag event เปิด `MovePlanDialog`
- **API (BE):**
  - `GET /api/v1/calendar/filter-options` → [`routes/calendar.ts`](../../PM-Pepsi-App/backend/src/routes/calendar.ts) → [`services/calendar.ts`](../../PM-Pepsi-App/backend/src/services/calendar.ts)
  - `GET /api/v1/calendar/events` → [`routes/calendar.ts`](../../PM-Pepsi-App/backend/src/routes/calendar.ts) → `listCalendarEvents(...)`
  - `POST /api/v1/calendar/events` → [`routes/calendar.ts`](../../PM-Pepsi-App/backend/src/routes/calendar.ts) → `listCalendarEventsFiltered(...)` (ใช้ `appendInFilter` จาก `scheduling-shared`)
- **DB (PG):** `app.view_order` (จาก migration `004`)

---

## ยังไม่ทำ (UAT / stack)

### ฟิลเตอร์

- [x] [`M_filter_iw37.php`](../../sap/pages/M_filter_iw37.php) — ฟอร์มกรอง + **POST** แบบ PHP
- [x] API `POST /api/v1/calendar/events`
- [x] แชร์ logic กับ backlog ผ่าน `appendInFilter` ใน backend (`scheduling-shared.ts`)

### ปฏิทิน / modal

- [x] FullCalendar + สีจาก `tbwkstatus.wkstcolor`
- [x] Modal รายละเอียด WO บนปฏิทิน
- [x] [`MovePlant.php`](../../sap/modalPages/MovePlant.php) — ย้ายแผน + อัปเดต `tbmoveplan`

### ปฏิทินตาม work center

- [x] [`calendar_wkctr.php`](../../sap/pages/calendar_wkctr.php) — รองรับ `/calendar?wkctr=` และ `/calendar/wc/:code` (prefill filter `wkctr` แล้วใช้ `POST /api/v1/calendar/events`)
- [x] อ่าน `view_confrim` (หรือ view ที่เทียบเท่าใน PG) — เพิ่ม `app.view_confrim` และให้ backend ใช้ view นี้เมื่อกรอง `wkctr` (ช่วยเตรียม parity ของข้อมูล confirmation)

### Cross-cutting

- [x] FullCalendar, MovePlant — [`00-cross-cutting.md`](00-cross-cutting.md)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ |
| 2026-05-18 | ปิดฟิลเตอร์ `M_filter_iw37` บน React (`/calendar`) + API `filter-options` + `POST /calendar/events`; อัปเดตเอกสารให้ sync |
| 2026-05-18 | เพิ่ม route calendar ตาม work center: `/calendar?wkctr=` และ `/calendar/wc/:code` (prefill filter `wkctr`) |
| 2026-05-18 | เพิ่ม migration `028_view_confrim.sql` สร้าง `app.view_confrim` และใช้เป็น data source เมื่อกรอง `wkctr` |
| 2026-05-21 | ปิดแกน parity — อัปเดต [`PLAN.md`](PLAN.md) §3.1 ลำดับ 2 → ✅; คง UAT ขั้น 5 ตาม [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) |
| 2026-05-22 | `listCalendarFilterOptions` + `scheduling-move` ใช้ `sqlFactoryScope` ให้สอดคล้อง events — ดู [`17-four-routes-php-audit.md`](17-four-routes-php-audit.md) |
