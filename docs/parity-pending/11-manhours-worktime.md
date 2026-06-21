# ลำดับที่ 11 — Manhours & Worktime

**สถานะรวม:** **เสร็จ** — ครบโมดูล 11 (รวม W_worktime_view) 2026-05-19  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Route:** `/manhours`, `/manhours/admin`, `/worktime`, `/manhours-hr`  
**Checklist หลัก:** `M_manhour*`, `worktime_*`, `W_worktime_view.php`, `W_manhours_hr.php`

---

## ทำแล้ว

- [x] `/manhours` — UI + chart จาก DB ([`ManhoursPage`](../PM-Pepsi-App/frontend/src/features/manhours/ManhoursPage.tsx) → `GET /api/v1/manhours/summary`)
- [x] **Migration + API manhour จริง** — 2026-05-19
  - Migration [`042_tbmanhours_full_api.sql`](../../database/migrations/042_tbmanhours_full_api.sql): ขยาย `app.tbmanhours` จาก migration 010 ให้ครบ legacy `M_manhour*`
    - เพิ่ม `stworkday` (Start Date) + `updated_at`
    - backfill `stworkday = workday` สำหรับข้อมูลเก่า
    - เพิ่ม unique index `uq_tbmanhours_wkctr_period (idwkctr, stworkday, workday)` เทียบ PHP ที่เช็คซ้ำด้วยรหัส HR + start/end
    - เพิ่ม indexes `idx_tbmanhours_stworkday`, `idx_tbmanhours_period`
  - Backend schema [`manhours.ts`](../../PM-Pepsi-App/backend/src/schemas/manhours.ts): เพิ่ม contract จริงสำหรับ `manhourItem`, `list`, `upsert`, `ok`, `import`, `worktime/me`
  - Backend service [`manhours.ts`](../../PM-Pepsi-App/backend/src/services/manhours.ts):
    - `listManhours()` filter `q/idwkctr/from/to/limit/offset`
    - `getManhour()`, `upsertManhour()`, `deleteManhour()`
    - `importManhoursFile()` อ่าน Excel/CSV ด้วย `xlsx`, skip 2 rows, columns ตาม legacy `ManHours.xlsx`: `idwkctr, StartDate, EndDate, WH, OT1, OT15, OT1HOL, OT2, OT3`
    - import/upsert ใช้ `ON CONFLICT (idwkctr, stworkday, workday) DO UPDATE` เพื่อเทียบ logic update ของ PHP
    - `listWorktimeDaily()` สำหรับ `/worktime` ต่อ DB จริงใน step ถัดไป
  - Backend routes [`routes/manhours.ts`](../../PM-Pepsi-App/backend/src/routes/manhours.ts):
    - `GET /api/v1/manhours/summary?idwkctr=&daysBack=` — summary chart จาก DB จริง (Admin ระบุ idwkctr ได้, user ทั่วไปเห็นของตัวเอง)
    - `GET /api/v1/manhours` — list จริง (Admin ทุกคน/กรองได้, user เห็นของตัวเอง)
    - `GET /api/v1/manhours/:idmanhour`
    - `POST /api/v1/manhours`, `PUT /api/v1/manhours/:idmanhour`, `DELETE /api/v1/manhours/:idmanhour` — Admin only
    - `POST /api/v1/manhours/import` — Admin only, multer memory, limit 15MB
    - `GET /api/v1/worktime/me` — total + daily rows จาก `tbmanhours`
  - Frontend contract [`schemas.ts`](../../PM-Pepsi-App/frontend/src/api/schemas.ts) + API client [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts): เพิ่ม `fetchManhourList`, `fetchManhourOne`, `upsertManhour`, `deleteManhour`, `postManhourImport`, `fetchWorktimeMe`
  - Tests: เพิ่ม [`manhours.test.ts`](../../PM-Pepsi-App/backend/src/schemas/manhours.test.ts) ครอบคลุม upsert payload, reject ชั่วโมงติดลบ, API row contract, `/worktime/me` contract
- [x] **`/worktime`, `/manhours-hr` ต่อ DB** — 2026-05-19
  - [`WorktimePage.tsx`](../../PM-Pepsi-App/frontend/src/features/manhours/WorktimePage.tsx): แท็บ **มอบหมายงาน** (`W_worktime_view` → `GET /api/v1/worktime/planning`) + แท็บ **ชั่วโมง HR** (`worktime_manhours.php` → `GET /api/v1/worktime/me`)
  - [`ManhoursHrPage.tsx`](../../PM-Pepsi-App/frontend/src/features/manhours/ManhoursHrPage.tsx): ตาราง HR คอลัมน์ครบ Summary/W + OT net จาก `GET /api/v1/manhours/hr` (กรอง `wkctr` session, Admin ระบุ `?wkctr=` ได้)
  - Backend: `GET /api/v1/manhours/hr`, `listManhours({ filterWkctr })`, join `tbposition.position`
- [x] **`ModalMHshow.php` ใน backlog/calendar** — 2026-05-19
  - [`ManhourSummaryDialog.tsx`](../../PM-Pepsi-App/frontend/src/components/scheduling/ManhourSummaryDialog.tsx): modal สรุป Plan/Action MIN+H, ZB counts, completion %, ตาราง WO
  - [`BacklogPage.tsx`](../../PM-Pepsi-App/frontend/src/features/backlog/BacklogPage.tsx) + [`CalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx): ลากเลือกวันบน FullCalendar → `POST /api/v1/backlog/manhour-summary`
  - Backend [`getBacklogManhourSummary`](../../PM-Pepsi-App/backend/src/services/backlog.ts): แปลง `untime=H` → นาที, วันเดียวใช้ `bscstart/cday` ตรงวัน (เทียบ PHP)

- [x] **เกณฑ์ §3 ครบ (ขอบเขตแกน)** — 2026-05-19
  - **UI:** `/manhours` (chart สัปดาห์), `/manhours/admin` (CRUD/import Admin), `/worktime` (รายวัน), `/manhours-hr` (ตาราง HR), `ManhourSummaryDialog` ใน backlog/calendar (ลากเลือกวันบนปฏิทิน)
  - **Data:** Zod backend/frontend — `manhourItem`, `worktimeMe`, `backlogManhour*`, `manhours/summary`; PG `tbmanhours` + `view_order` + `tbwkzb`
  - **Business rules:** `untime=H` → นาทีก่อนรวม (ModalMHshow); วันเดียว `bscstart/cday` ตรงวัน; HR กรอง `wkctr`; import Excel skip 2 rows + `ON CONFLICT DO UPDATE`; Admin-only CRUD/import; workcenter เห็น `/worktime/me` ของตัวเอง
  - **Modal:** `ModalMHshow.php` → `ManhourSummaryDialog` + `POST /api/v1/backlog/manhour-summary` (N/A แท็บย่อยอื่นในโมดูลนี้)
  - **Tests:** `npm test` — backend 6 files / 21 tests (`manhours.test.ts`, `backlog-manhour.test.ts`, `manhour-minutes.test.ts`, …); frontend 5 files / 13 tests (`manhours-schemas.test.ts`, `ManhourSummaryDialog.test.tsx`, `format-manhour-date.test.ts`, …)
- [x] **Admin CRUD/import UI** — 2026-05-19 (`M_manhour.php`, `M_manhour_form.php`, `M_manhour_imports.php`)
  - [`ManhourAdminPage.tsx`](../../PM-Pepsi-App/frontend/src/features/manhours/ManhourAdminPage.tsx): ตาราง + ค้นหา + modal เพิ่ม/แก้ไข/ลบ + นำเข้า Excel (`POST /api/v1/manhours/import`)
  - Route `/manhours/admin` (Admin only) + nav-config + migration [`043_manhour_admin_menu.sql`](../../database/migrations/043_manhour_admin_menu.sql)
  - `/manhours` = สรุป chart; Admin จัดการข้อมูลที่ `/manhours/admin`

- [x] **`M_manhour_chart*` charts** — 2026-05-19
  - [`ManhoursPage.tsx`](../../PM-Pepsi-App/frontend/src/features/manhours/ManhoursPage.tsx): ช่วงวันที่ + Performance KPI (เทียบ `M_manhour_chart` + `M_manhour_chart_performance`) + Pie HR vs Confirm (`M_manhour_chart_show`)
  - API: `GET /api/v1/manhours/chart/performance`, `GET /api/v1/manhours/chart/breakdown`
  - แท็บ "รายสัปดาห์" คง bar chart จาก `GET /api/v1/manhours/summary`

- [x] **`W_worktime_view.php`** — 2026-05-19
  - Service [`worktime-planning.ts`](../../PM-Pepsi-App/backend/src/services/worktime-planning.ts): join `tbplangingwork` + `tbiw37n` (แก้ SQL legacy ที่ไม่ join tbiw37n)
  - API `GET /api/v1/worktime/planning` — คอลัมน์ รหัสแผน / วันเริ่ม-สิ้นสุด / ผู้จัด / หมายเหตุ + ลิงก์ WO

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ลำดับ 11 |
| 2026-05-19 | **Migration + API manhour จริงเสร็จ** — เพิ่ม migration `042_tbmanhours_full_api.sql` ขยาย `tbmanhours` ด้วย `stworkday`, unique `(idwkctr, stworkday, workday)`, indexes; เพิ่ม backend schema/service/routes CRUD + import Excel skip 2 rows + `/worktime/me`; เพิ่ม frontend Zod/API client; เพิ่ม backend tests `manhours.test.ts` |
| 2026-05-19 | **`/worktime` + `/manhours-hr` UI ต่อ DB** — `WorktimePage`, `ManhoursHrPage`, route `GET /manhours/hr` + position join |
| 2026-05-19 | **`ModalMHshow` ใน backlog/calendar** — `ManhourSummaryDialog` + ปรับ `getBacklogManhourSummary` (H→MIN, single-day filter) |
| 2026-05-19 | **เกณฑ์ §3 ครบ (แกน)** — helper `manhour-minutes.ts`; Vitest backend 21 + frontend 13 tests; สรุป UI/Data/Rules/Modal/Tests; สถานะโมดูล → เสร็จ (แกน) |
| 2026-05-19 | **Admin UI M_manhour*** — `ManhourAdminPage` + `/manhours/admin` + import/CRUD modal |
| 2026-05-19 | **Chart M_manhour_chart*** — Performance + Pie breakdown APIs + `/manhours` 3 แท็บ |
| 2026-05-19 | **W_worktime_view** — `/worktime` แท็บมอบหมายงาน + `GET /worktime/planning` |
