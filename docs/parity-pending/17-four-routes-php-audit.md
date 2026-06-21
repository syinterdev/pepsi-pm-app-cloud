# Audit — `/plan-calendar` · `/calendar` · `/line-calendar` · `/master-data` (เทียบ PHP)

อัปเดต: **2026-05-22**  
อ้างอิง: [`04-work-calendar.md`](04-work-calendar.md) · [`03-line-calendar.md`](03-line-calendar.md) · [`02-master-data.md`](02-master-data.md) · [`08-dashboard-planning.md`](08-dashboard-planning.md) · [`FACTORY-FUNCTIONALLOC-7151.md`](../customer-requirements/FACTORY-FUNCTIONALLOC-7151.md) · [`UI-POLISH-PHASES.md`](../customer-requirements/UI-POLISH-PHASES.md)

---

## สรุปภาพรวม

| Route | PHP หลัก | สถานะแกน | ช่องว่างสำคัญ | U2 polish |
|-------|-----------|----------|---------------|-----------|
| `/plan-calendar` | `M_plan_calendar.php` | ✅ | ข้อมูลต้องมี `view_planwork` + `idwkctr` ตรง login | ✅ |
| `/calendar` | `calendar.php` + `M_filter_iw37.php` | ✅ | วันที่ IW37N อาจเป็นอดีต (เช่น 2020) — ใช้ปุ่มเลือกเดือน | ✅ |
| `/line-calendar` | `line_calendar.php` | ✅ | ไม่ผูก 7151 (ตาราง `tblineschdul`) | ✅ |
| `/master-data` | `M_activitytype.php` + `M_*` อื่น | ✅ (17 แท็บ API+DB) | UI ยัง `PageHeader` ไม่ใช่ `AppPageShell` | ⏳ |

---

## 1. `/plan-calendar` — Plan Calendar / จ่ายงานช่าง

### PHP (`sap/pages/M_plan_calendar.php`)

```sql
SELECT * FROM view_planwork
WHERE idwkctr = '<session mem_id>'
  AND syst IN ('CRTD','REL')
ORDER BY bscstart DESC
```

- FullCalendar แสดง event ตาม `cday` (ย้ายแผน) หรือ `bscstart`
- สี “ย้ายข้ามเดือน” เทียบ `$MoveMc1 <> $MoveMc2`
- คลิก event → เปิดฟอร์มปิดงาน / รายละเอียด WO

### React

| ชั้น | ไฟล์ | หมายเหตุ |
|------|------|----------|
| FE | `PlanCalendarPage.tsx` | `AppPageShell`, skeleton, empty, ลิงก์ calendar/backlog |
| API | `GET /api/v1/plan-calendar/events?year=&month=` | `plan-calendar.ts` → `view_planwork` + `idwkctr` จาก session |
| Modal | `WorkOrderDetailDialog` | `initialTab="task-list"` (LEGACY B.4d) |

### เช็กลิสต์ parity

- [x] กรอง `idwkctr` = work center ที่ login
- [x] เฉพาะ `CRTD` / `REL`
- [x] วันที่แสดง = `COALESCE(cday, bscstart)` ในเดือนที่เลือก
- [x] สี move-over ข้ามเดือน
- [x] Post-login WC → redirect `/plan-calendar` (`auth-paths.ts`)
- [ ] **UAT:** user ไม่มีแถวใน `view_planwork` → ปฏิทินว่าง (ต้องจ่ายงานใน WO modal หรือ `/planning` ก่อน)

### ไม่ใช้ filter 7151

`view_planwork` มาจาก `tbplangingwork` + `tbiw37n` แล้ว — ไม่มี `functionalloc LIKE` แยกใน PHP

---

## 2. `/calendar` — Work scheduling

### PHP

- `calendar.php` — FullCalendar จาก `view_order` ผ่าน `M_filter_iw37.php`
- เงื่อนไขโรงงาน: ``functionalloc LIKE '%7151%'`` (`define.php` `$Factory_code`)
- ฟิลเตอร์: activity, wktype, functional, equipment, status, wkctr, team, ช่วงวันที่
- ลาก event → `MovePlant.php` → `tbmoveplan`
- `calendar_wkctr.php` — กรองตาม work center (React: `?wkctr=` / `/calendar/wc/:code` → `view_confrim`)

### React

| ชั้น | ไฟล์ |
|------|------|
| FE | `CalendarPage.tsx` — ฟิลเตอร์, `FilterDetailSummary`, `MonthFullCalendar`, MovePlan |
| API | `GET/POST /api/v1/calendar/*` — `calendar.ts` |
| Factory | Events ใช้ `sqlFactoryScope` (รองรับ ALV ที่มี 7151 ใน `funcdescrip`) |

### ช่องว่าง / แก้แล้ว (2026-05-22)

| ประเด็น | สถานะ |
|---------|--------|
| filter-options ใช้แค่ `functionalloc LIKE` | **แก้แล้ว** → `sqlFactoryScope` ใน `listCalendarFilterOptions` |
| ข้อมูล IW37N ไม่มี `7151` ใน `functionalloc` | รัน `fix-functionalloc-7151.ts` หรือ re-import หลัง parser ใหม่ — ดู [`FACTORY-FUNCTIONALLOC-7151.md`](../customer-requirements/FACTORY-FUNCTIONALLOC-7151.md) |
| ปฏิทินว่างเพราะดูเดือนปัจจุบัน แต่ข้อมูลปี 2020 | ใช้ตัวเลือกปี/เดือน หรือปุ่ม “ไปเดือนที่มีข้อมูล” บนหน้า |
| ย้ายแผน (drag) | `scheduling-move.ts` — **แก้แล้ว** `sqlFactoryScope` ใน `moveWorkOrderPlan` + autocomplete |

---

## 3. `/line-calendar` — ปฏิทินเส้นผลิต

### PHP (`line_calendar.php`)

```sql
SELECT * FROM view_lineschdul
```

- สี `#408a63` (มี uptime) / `#bfbfbf` (ปิด)
- คลิกวัน / event → modal CRUD (ใน PHP แยก `M_lineschdul*`)

### React

| ชั้น | ไฟล์ |
|------|------|
| FE | `LineCalendarPage.tsx` — ปฏิทิน + dialog create/edit + drag เปลี่ยน `lineday` |
| API อ่าน | `GET /api/v1/line-calendar/events` → `tblineschdul` |
| API เขียน | `POST/PUT/DELETE /api/v1/master-data/lineschdul` (แท็บ master-data ด้วย) |

### เช็กลิสต์ parity

- [x] สี event ตรง PHP
- [x] CRUD + import อยู่ `/master-data` แท็บ Line schedule
- [x] Drag ย้ายวัน → `PUT` อัปเดต `lineday`
- [ ] **UAT:** ต้องมีแถวใน `tblineschdul` สำหรับเดือนที่ดู (ไม่เกี่ยว IW37N / 7151)

---

## 4. `/master-data` — Master data hub

### PHP

- แต่ละ entity: `M_<entity>.php`, `M_<entity>_form.php`, `M_<entity>_imports.php` (บางตัว)
- Activity type, Department, Equipment, Functional, Reason, Work status, Work type, ZB, Line product, Zone, Machine, Material, Level, Position, Group, Task list, Line schedule

### React (`MasterDataPage.tsx`)

| แท็บ | API prefix | Import |
|------|------------|--------|
| Activity type | `/master-data/activitytype` | ไฟล์ xlsx/csv |
| Department … Line schedule | ตาม [`02-master-data.md`](02-master-data.md) | ตาม entity |

### เช็กลิสต์ parity

- [x] 17 แท็บต่อ PostgreSQL (ไม่ใช่ MSW)
- [x] RBAC ผ่าน `useMasterDataPermissions` (`master-data.read/write/import/delete`)
- [x] Import skip 2 rows ตาม PHP (zone, machine, material, tasklist, lineschdul, …)
- [ ] **U2:** ยังใช้ `PageHeader` + `Tabs` แบบเก่า — ยังไม่ mark ใน [`UI-POLISH-PHASES.md`](../customer-requirements/UI-POLISH-PHASES.md) §แผน & นำเข้า SAP
- [ ] **UAT:** ทดสอบ import ไฟล์จริงจากลูกค้าทีละ entity

### ไม่เกี่ยว filter 7151

Master tables เป็นข้อมูลอ้างอิง — ไม่กรองโรงงานใน PHP

---

## Cross-cutting: โรงงาน 7151

| บริการ | ใช้ `sqlFactoryScope` |
|--------|----------------------|
| `calendar.ts` events + filter-options | ✅ (2026-05-22) |
| `backlog.ts` events + filter + manhour | ✅ (2026-05-22) |
| `work-orders.ts` | ✅ |
| `scheduling-move.ts` | ✅ (2026-05-22) |
| `plan-calendar.ts` | N/A (`view_planwork`) |
| `line-calendar.ts` | N/A (`tblineschdul`) |
| `master-data.ts` | N/A |

PHP ใช้เฉพาะ `functionalloc LIKE '%7151%'` — React ขยายเป็น `(functionalloc OR funcdescrip) ILIKE` เพื่อข้อมูล SAP ALV หลัง import

---

## เอกสารที่ควรอ่านคู่กัน

1. [`UI-POLISH-PHASES.md`](../customer-requirements/UI-POLISH-PHASES.md) — U2 ปฏิทิน ✅, master-data ⏳
2. [`WORK-PHASES.md`](../WORK-PHASES.md) — phase รวมโปรเจกต์
3. [`16-iw37n-php-parity.md`](16-iw37n-php-parity.md) — สาเหตุปฏิทินว่างหลัง import ALV
4. [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) — ลำดับ 0A plan-calendar หลัง login

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-22 | สร้าง audit 4 routes; แก้ `sqlFactoryScope` ใน `calendar.ts`, `backlog.ts`, `scheduling-move.ts` |
