# ลำดับที่ 2 — Master data (Activity type + อื่นๆ)

**สถานะรวม:** แกนเสร็จ ✅ · UAT ขั้น 5 ⏳  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Checklist หลัก:** แถว `M_activitytype*` และ master `M_*` อื่นใน §4  
**Migration:** [`002_tbactivitytype.sql`](../../database/migrations/002_tbactivitytype.sql), [`004_tbiw37n_calendar.sql`](../../database/migrations/004_tbiw37n_calendar.sql), [`005_tbwkzb_tbfunctional.sql`](../../database/migrations/005_tbwkzb_tbfunctional.sql), [`009_tbreason.sql`](../../database/migrations/009_tbreason.sql), [`011_tbdepartment.sql`](../../database/migrations/011_tbdepartment.sql), [`012_tbequipment.sql`](../../database/migrations/012_tbequipment.sql), [`013_tbwkstatus_add_wkstreason.sql`](../../database/migrations/013_tbwkstatus_add_wkstreason.sql), [`014_tbwkctrtype.sql`](../../database/migrations/014_tbwkctrtype.sql), [`015_tbproductline.sql`](../../database/migrations/015_tbproductline.sql), [`016_tbzone.sql`](../../database/migrations/016_tbzone.sql), [`017_tbmainteanance.sql`](../../database/migrations/017_tbmainteanance.sql), [`018_tbmaterial.sql`](../../database/migrations/018_tbmaterial.sql), [`019_tbwklevel.sql`](../../database/migrations/019_tbwklevel.sql), [`020_tbposition.sql`](../../database/migrations/020_tbposition.sql), [`021_tbwkctrgroup.sql`](../../database/migrations/021_tbwkctrgroup.sql), [`022_tbtasklist.sql`](../../database/migrations/022_tbtasklist.sql), [`023_tblineschdul_unique.sql`](../../database/migrations/023_tblineschdul_unique.sql), [`024_tbzone_extend.sql`](../../database/migrations/024_tbzone_extend.sql)

---

## ทำแล้ว (แกน)

- [x] `GET/POST/PUT/DELETE /api/v1/master-data/activitytype`
- [x] `POST /api/v1/master-data/activitytype/import` (CSV rows ใน body)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/department`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/equipment`
- [x] `POST /api/v1/master-data/equipment/import` (rows ใน body)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/functional`
- [x] `POST /api/v1/master-data/functional/import` (rows ใน body)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/reason`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/workstatus`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/worktype`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/zb`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/lineproduct`
- [x] `POST /api/v1/master-data/lineproduct/import` (rows ใน body)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/zone`
- [x] `POST /api/v1/master-data/zone/import` (rows ใน body; PHP import skip 2 rows)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/machine`
- [x] `POST /api/v1/master-data/machine/import` (rows ใน body)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/material`
- [x] `POST /api/v1/master-data/material/import` (rows ใน body; เก็บ date ใน PG)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/level`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/position`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/group`
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/tasklist`
- [x] `POST /api/v1/master-data/tasklist/import` (rows ใน body; PHP import skip 2 rows)
- [x] `GET/POST/PUT/DELETE /api/v1/master-data/lineschdul`
- [x] `POST /api/v1/master-data/lineschdul/import` (rows ใน body; PHP import skip 2 rows)
- [x] `GET /api/v1/user-log` (User Log: login/logout ของผู้ใช้ที่ล็อกอิน)
- [x] [`ActivityTypePanel.tsx`](../../PM-Pepsi-App/frontend/src/features/master-data/ActivityTypePanel.tsx) + [`master-data-api.ts`](../../PM-Pepsi-App/frontend/src/lib/master-data-api.ts)
- [x] แท็บ activity type บน `/master-data` ต่อ PostgreSQL (badge API+DB)

---

## ยังไม่ทำ (UAT / checklist หลัก)

### Activity type (parity `M_activitytype.php`)

- [x] อัปโหลดไฟล์ตรงแบบ PHP — รองรับ **`.csv`**, **`.xls`**, **`.xlsx`**, **`.xlsm`**, **`.xlsb`** (ยังมี textarea เป็นทางเลือกสำรอง)
- [x] UI แยก modal เทียบ `M_activitytype_form.php` / `M_activitytype_imports.php` (ถ้าต้องการ layout เดิม)
- [x] Validation / ข้อความ error แบบ PHP ครบทุกกรณี (English-first)

### Master อื่น (แท็บยัง MSW)

- [x] `M_department*` → migration + API + แท็บ `/master-data` (CRUD + modal create/edit/delete; ไม่มี import ใน PHP)
- [x] `M_equipment*` + imports (CRUD + import file + modal create/edit/delete; PHP import skip 2 rows)
- [x] `M_functional*` (ตาราง `005` มีแล้ว) + CRUD/import API + แท็บ `/master-data` (PHP import skip 2 rows)
- [x] `M_reason*` → ใช้ migration 009 + CRUD API + แท็บ `/master-data`
- [x] `M_workstatus*` → เพิ่ม migration 013 (เพิ่ม `wkstreason`) + CRUD API + แท็บ `/master-data`
- [x] `M_worktype*` → เพิ่ม migration 014 (`tbwkctrtype`) + CRUD API + แท็บ `/master-data`
- [x] `M_zb*` → ใช้ migration 005 (`tbwkzb`) + CRUD API + แท็บ `/master-data`
- [x] `M_lineproduct*` → เพิ่ม migration 015 (`tbproductline`) + CRUD/import API + แท็บ `/master-data` (PHP import skip 2 rows)
- [x] `M_machine*` → เพิ่ม migration 016+017 (`tbzone`, `tbmainteanance`) + CRUD/import API + แท็บ `/master-data` (PHP import skip 2 rows)
- [x] `M_zone_imports.php` → เพิ่ม zone import + extend zone fields (migration 024: `zonedescrip`, `idproductline`) (PHP import skip 2 rows)
- [x] `M_material*` → เพิ่ม migration 018 (`tbmaterial`) + CRUD/import API + แท็บ `/master-data` (PHP import skip 2 rows; เก็บ date ใน PG)
- [x] `M_level*` → เพิ่ม migration 019 (`tbwklevel`) + CRUD API + แท็บ `/master-data`
- [x] `M_position*` → เพิ่ม migration 020 (`tbposition`) + CRUD API + แท็บ `/master-data`
- [x] `M_Group*` → เพิ่ม migration 021 (`tbwkctrgroup`) + CRUD API + แท็บ `/master-data`
- [x] `M_tasklist*` → เพิ่ม migration 022 (`tbtasklist`) + CRUD/import API + แท็บ `/master-data` (PHP import skip 2 rows)
- [x] `M_lineschdul*` → ใช้ migration 003 (`tblineschdul`) + เพิ่ม migration 023 (unique index upsert) + CRUD/import API + แท็บ `/master-data` (PHP import skip 2 rows)
- [x] อื่นๆ (`M_*` ถัดไป) — `M_UserLog.php` → `/user-log` + `GET /api/v1/user-log`
- [x] ลบหรือแยก badge **MSW mock** ใน [`MasterDataPage.tsx`](../../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) เมื่อแต่ละ entity ต่อ DB

### เกณฑ์ §3

- [ ] ติ๊ก §3 สำหรับ activity type อย่างน้อย → **เสร็จ** ใน checklist หลัก
- [ ] แผน phase สำหรับ master ที่เหลือ (ลำดับ 9+ หรือแทรกใน 2)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ |
| 2026-05-18 | Activity type import รองรับอัปโหลดไฟล์ .csv/.xls/.xlsx/.xlsm/.xlsb (แทนการ paste CSV อย่างเดียว) |
| 2026-05-18 | UI Activity type แยก modal ฟอร์ม (เพิ่ม/แก้ไข/ลบ) และ modal นำเข้าไฟล์ เทียบ PHP |
| 2026-05-18 | เพิ่ม validation ฝั่ง UI (required/format) + error cases import/file ให้ครอบคลุมแบบ PHP (English-first) |
| 2026-05-18 | เพิ่ม Department (`tbdepartment`) — migration 011 + CRUD API + แท็บ Department ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Equipment (`tbequipment`) — migration 012 + CRUD/import API + แท็บ Equipment ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Functional loc. (`tbfunctional`) — ใช้ migration 005 + CRUD/import API + แท็บ Functional loc. ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Reason (`tbreason`) — ใช้ migration 009 + CRUD API + แท็บ Reason ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Work status (`tbwkstatus`) — migration 013 เพิ่ม `wkstreason` + CRUD API + แท็บ Work status ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Work type (`tbwkctrtype`) — migration 014 + CRUD API + แท็บ Work type ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม ZB (`tbwkzb`) — ใช้ migration 005 + CRUD API + แท็บ ZB ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Line product (`tbproductline`) — migration 015 + CRUD/import API + แท็บ Line product ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Zone+Machine (`tbzone`, `tbmainteanance`) — migration 016+017 + CRUD/import API + แท็บ Zone/Machine ต่อ DB ใน `/master-data` |
| 2026-05-18 | Zone import parity — เพิ่ม `POST /api/v1/master-data/zone/import` + extend `tbzone` (migration 024: `zonedescrip`, `idproductline`) |
| 2026-05-18 | เพิ่ม Material (`tbmaterial`) — migration 018 + CRUD/import API + เก็บ date ใน PG + แท็บ Material ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Level+Position (`tbwklevel`, `tbposition`) — migration 019+020 + CRUD API + แท็บ Level/Position ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Group+Task list (`tbwkctrgroup`, `tbtasklist`) — migration 021+022 + CRUD/import API + แท็บ Group/Task list ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม Line schedule (`tblineschdul`) — เพิ่ม unique index (migration 023) + CRUD/import API + แท็บ Line schedule ต่อ DB ใน `/master-data` |
| 2026-05-18 | เพิ่ม User Log (`M_UserLog.php`) — `GET /api/v1/user-log` + หน้า `/user-log` + migration 025 (เมนู) |
| 2026-05-21 | ปิดแกน parity hub `/master-data` (17 แท็บ API+DB) — อัปเดต [`PLAN.md`](PLAN.md) §3.2; คง UAT ขั้น 5 + ติ๊ก §3 ใน checklist หลัก |
| 2026-05-21 | `/user-log` — อัปเดต [`PLAN.md`](PLAN.md) §3.2–§3.3 แกน ✅ (รายละเอียดใน §3.2 User Log) |
