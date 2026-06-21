# ลำดับที่ 3 — Line calendar

**สถานะรวม:** แกนเสร็จ ✅ · UAT ขั้น 5 ⏳  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Checklist หลัก:** `line_calendar.php`, `M_lineschdul*`  
**Migration:** [`003_tblineschdul.sql`](../../database/migrations/003_tblineschdul.sql) + [`023_tblineschdul_unique.sql`](../../database/migrations/023_tblineschdul_unique.sql) (รองรับ upsert import) + [`027_view_lineschdul.sql`](../../database/migrations/027_view_lineschdul.sql) (parity legacy view) · dependency: [`015_tbproductline.sql`](../../database/migrations/015_tbproductline.sql) (lookup ชื่อเส้น/รายละเอียด)
**Route:** `/line-calendar`

---

## ทำแล้ว (แกน)

- [x] `GET /api/v1/line-calendar/events?year=&month=`
- [x] [`LineCalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/line-calendar/LineCalendarPage.tsx) — ปฏิทินรายเดือน + badge API+DB
- [x] Route `/line-calendar` ในเมนู A:U:W (`calendar.read`) — redirect หลัง login ใช้ **0A** → `/plan-calendar` (ไม่ใช่หน้านี้; ทางเลือก **0B** ค่อยชี้มาที่นี่)
- [x] CRUD/import `tblineschdul` ผ่าน `/master-data` + API `POST/PUT/DELETE /api/v1/master-data/lineschdul` + `POST /api/v1/master-data/lineschdul/import`

---

## เส้นทางโค้ด (E2E)

- **Route (FE):** [`App.tsx`](../../PM-Pepsi-App/frontend/src/App.tsx) → `path="line-calendar"` → [`LineCalendarPage`](../../PM-Pepsi-App/frontend/src/features/line-calendar/LineCalendarPage.tsx)
- **ปฏิทิน (FE):** [`LineCalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/line-calendar/LineCalendarPage.tsx)
  - โหลด event เดือน: `fetchLineCalendarEvents(year, month)` → [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts) → `GET /api/v1/line-calendar/events`
  - คลิกวัน: เปิด dialog โหมด create → `createLineSchdul(...)` → [`master-data-api.ts`](../../PM-Pepsi-App/frontend/src/lib/master-data-api.ts) → `POST /api/v1/master-data/lineschdul`
  - คลิกกิจกรรม: เปิด dialog โหมด edit → `updateLineSchdul(...)` → `PUT /api/v1/master-data/lineschdul/:idline`
  - ลาก/ย้ายวัน: `updateLineSchdul(idline, { lineday })` → `PUT /api/v1/master-data/lineschdul/:idline`
- **API (BE):**
  - `GET /api/v1/line-calendar/events` → [`routes/line-calendar.ts`](../../PM-Pepsi-App/backend/src/routes/line-calendar.ts) → [`services/line-calendar.ts`](../../PM-Pepsi-App/backend/src/services/line-calendar.ts) → query `app.tblineschdul`
  - `POST/PUT/DELETE/IMPORT /api/v1/master-data/lineschdul...` → [`routes/master-data.ts`](../../PM-Pepsi-App/backend/src/routes/master-data.ts) → [`services/master-data.ts`](../../PM-Pepsi-App/backend/src/services/master-data.ts)
- **DB (PG):** ตาราง `app.tblineschdul` จาก migration `003` + unique index `(idproductline, lineday)` จาก `023`
- **หมายเหตุ:** ชื่อเส้น/รายละเอียด `productline` ถูก resolve จาก `app.tbproductline` (migration `015`)

---

## ยังไม่ทำ (UAT / stack)

### UI / ปฏิทิน

- [x] **FullCalendar** แบบ [`line_calendar.php`](../../sap/pages/line_calendar.php)
- [x] สีกิจกรรม `#408a63` / `#bfbfbf` ตรง PHP
- [x] Modal คลิกวัน / แก้ไขกิจกรรม
- [x] ลาก/ย้ายวัน (drag & drop) แล้วบันทึกลง `tblineschdul` (เรียก `PUT /api/v1/master-data/lineschdul/:idline`)

### CRUD ข้อมูลเส้น

- [x] `M_lineschdul.php` — รายการ (รวมใน `/master-data` แท็บ `lineschdul`)
- [x] `M_lineschdul_form.php` — เพิ่ม/แก้ (modal create/edit/delete ใน `/master-data`)
- [x] `M_lineschdul_imports.php` — นำเข้า (modal import file ใน `/master-data`)
- [x] API `POST/PUT/DELETE/IMPORT` สำหรับ `app.tblineschdul` (อยู่ใต้ `/api/v1/master-data/lineschdul...`)

### View / DB

- [x] View `view_lineschdul` ใน PG (legacy ใช้ `SELECT * FROM view_lineschdul`; เพิ่ม `app.view_lineschdul` ให้โครงสร้างเท่ากับ `app.tblineschdul`)

### Cross-cutting

- [x] FullCalendar — ดู [`00-cross-cutting.md`](00-cross-cutting.md)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ |
| 2026-05-18 | ไล่โค้ดครบเส้นทาง FE→BE→DB (line-calendar + master-data lineschdul) และอัปเดต checklist ให้ sync กับสถานะในโค้ด |
| 2026-05-18 | เพิ่ม migration `027_view_lineschdul.sql` สร้าง `app.view_lineschdul` เพื่อ parity กับ legacy query |
| 2026-05-18 | ปิดงาน cross-cutting FullCalendar สำหรับลำดับที่ 3 (อ้างอิง `00-cross-cutting.md`) |
| 2026-05-21 | ปิดแกน parity — อัปเดต [`PLAN.md`](PLAN.md) §3.1 ลำดับ 3 → ✅; คง UAT ขั้น 5 ตาม [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) |
