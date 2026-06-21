# ลำดับที่ 8 — Dashboard + Planning

**สถานะรวม:** เสร็จ (แกน) — 2026-05-21  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่ใช่ — ขาด FullCalendar DnD ใน Planning, charts KPI Dashboard, IndexedDB offline, Docker ส่งมอบ — ดู [00-stack-target.md](00-stack-target.md)  
**Checklist หลัก:** `content.php` (แทน Home), `M_planwork*` — ปิดทุกบรรทัด (Dashboard / Planning / Navigation / ข้อมูล)  
**Migration:** [`007_tbplangingwork_view_planwork.sql`](../../database/migrations/007_tbplangingwork_view_planwork.sql), [`031_dashboard_menu_all_roles.sql`](../../database/migrations/031_dashboard_menu_all_roles.sql), [`074_plan_calendar_menu.sql`](../../database/migrations/074_plan_calendar_menu.sql) (เมนู `tbmenu` — ไฟล์ ✅ · รันบน PG ต่อ env)  
**Route:** `/` (Home), **`/plan-calendar`** (login WC — `M_plan_calendar`), `/planning`, `/work-orders/:id`, `/iw37n`

---

## ทำแล้ว (แกน)

- [x] `app.tbplangingwork`, view `app.view_planwork`
- [x] `GET /api/v1/dashboard/summary`
- [x] `GET /api/v1/planning/orders` — กรอง `idwkctr` session + `syst IN ('CRTD','REL')`
- [x] [`HomePage.tsx`](../../PM-Pepsi-App/frontend/src/features/home/HomePage.tsx) — การ์ดสรุปจาก PG
- [x] [`PlanningPage.tsx`](../../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) — ตารางแผน + badge API+DB
- [x] เปลี่ยนการ์ด “รอยืนยันบุคลากร” เป็น “รอจ่ายงาน” พร้อมคำอธิบายว่าเป็น WO เปิดที่ยังไม่มีแผนใน `tbplangingwork`
- [x] ลิงก์จากการ์ด Dashboard ไปโมดูลที่เกี่ยวข้อง: `/work-orders`, `/planning`, `/iw37n`
- [x] เพิ่มเมนู sidebar “Dashboard / หน้าแรก” (`/`) ให้ทุกสิทธิ์ `A:U:W` ทั้ง fallback nav และ `tbmenu`
- [x] ตรวจ KPI เพิ่มเติมจาก PHP: `index2.php`/`content.php` เป็น SB Admin demo ไม่มี business KPI; KPI จริงอยู่กลุ่ม `W_summary_weekly*` ให้โยกไป phase `/reports`
- [x] `POST /api/v1/planning/assign` — จ่ายงานเข้า `tbplangingwork` แบบ upsert ตาม `idiw37` (Admin เท่านั้น)
- [x] [`PlanningPage.tsx`](../../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) — เพิ่มปุ่มจ่ายงานจากรายการ Planning ไปยัง work center ของผู้ล็อกอิน
- [x] Register route handler [`registerPlanningRoutes`](../../PM-Pepsi-App/backend/src/routes/planning.ts) ครอบ `POST /api/v1/planning/assign` (403 ถ้า `userst != 'A'`, 400 zod, 404 WO ไม่อยู่ใน CRTD/REL, 503 ถ้ายังไม่รัน migration `007_tbplangingwork_view_planwork.sql`)
- [x] Assign dialog ใน `PlanningPage` — เลือก WC ปลายทาง (จาก `/api/v1/workcenters`) / Team `P`/`G` / `pwcomment` + shortcut "จ่ายให้ฉัน" (parity แกน `M_planwork_view_form.php`: upsert `idiw37`, `wkctr`, `wkctrpw`, `pwcomment`, `pwteam`)
- [x] **`/plan-calendar`** — `GET /api/v1/plan-calendar/events` + [`PlanCalendarPage`](../../PM-Pepsi-App/frontend/src/features/plan-calendar/PlanCalendarPage.tsx) (เทียบ `M_plan_calendar.php`; post-login WC)

---

## ยังไม่ทำ

### Dashboard (`/`)

- [x] คำอธิบายการ์ด “รอยืนยันบุคลากร” — เปลี่ยนเป็น “รอจ่ายงาน” เพราะนับ WO ที่ยังไม่มี `tbplangingwork` (ไม่ใช่โมดูล personnel)
- [x] ลิงก์จากการ์ดไปโมดูลที่เกี่ยว (planning, iw37n, work-orders)
- [x] เมนู sidebar สำหรับ Dashboard — `/` อยู่ใน `tbmenu` และ fallback nav พร้อม `menuright = A:U:W`
- [x] KPI เพิ่มเติมถ้า PHP มีใน `index2` / รายงาน (phase 2) — `index2.php` โหลด `content.php` ซึ่งเป็น template demo; candidate ที่พบคือ Technician Utilizations / Summary Weekly จาก `W_summary_weekly*` ให้ตามใน `/reports` phase 2

### Planning (`/planning`)

- [x] [`M_planwork_view_form.php`](../../sap/pages/M_planwork_view_form.php) — จ่ายงาน → insert/update `tbplangingwork` (แกน: upsert `idiw37`, `wkctr`, `wkctrpw`, `pwcomment`, `pwteam`) — **แกนเสร็จ** ผ่าน Assign dialog ใน [`PlanningPage`](../../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx); ส่วน 4 tabs (Work Order / Confirmation / Images / Planning) ของฟอร์มเดิมยังไม่ทำ — ดู `plan_confirmTab*` ใน §5 checklist
- [x] API `POST /api/v1/planning/assign` — register แล้วใน [`routes/planning.ts`](../../PM-Pepsi-App/backend/src/routes/planning.ts) (auth + Admin-only + zod + SCHEMA_NOT_READY); service [`assignPlanningWork`](../../PM-Pepsi-App/backend/src/services/planning.ts) upsert `tbplangingwork` ตาม `idiw37`
- [x] [`M_planwork_close.php`](../../sap/pages/M_planwork_close.php), [`M_planwork_view_form_close.php`](../../sap/pages/M_planwork_view_form_close.php) — **แกนเสร็จ**: `GET /api/v1/planning/orders?status=closed` แสดงงานที่ `syst NOT IN ('CRTD','REL')` พร้อม `closedDate`; ปุ่ม `ดูปิดงาน` เปิด [`WorkOrderDetailDialog`](../../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) ที่แท็บ Confirm เพื่อดูประวัติปิดงาน / รูป / comment
- [x] [`W_planwork_view.php`](../../sap/pages/W_planwork_view.php), [`W_planwork_view_close.php`](../../sap/pages/W_planwork_view_close.php) — **แกนเสร็จ**: `/planning` ใช้ข้อมูลตาม `idwkctr` ของ user ที่ login, สลับ `งานเปิด` (`CRTD/REL`) กับ `งานปิดแล้ว` (not `CRTD/REL`); ปุ่ม `บันทึกปิดงาน` เปิด Confirm tab ซึ่ง reuse API confirmation เดิม
- [x] Modal ทีม / แท็บ [`plan_confirmTab*`](../../sap/modalPages/) ใน §5 checklist — **แกนเสร็จโดยรวมกับ `WorkOrderDetailDialog`**: Work Order / Task List / Planning / Confirm Close / Images / Comment ใช้ API `work-orders/:id/modal-detail` + `confirmation/*`; ส่วน presentation ไม่ clone jQuery/DataTables เดิม

### Navigation

- [x] ลิงก์ WO จาก Planning → `/work-orders/:id` (ไม่ใช่แค่รายการรวม) — เลข WO ใน [`PlanningPage`](../../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) ไป `/work-orders/${id}` และ [`WorkOrdersPage`](../../PM-Pepsi-App/frontend/src/features/work-orders/WorkOrdersPage.tsx) เปิด [`WorkOrderDetailDialog`](../../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) จาก route param

### ข้อมูล

- [x] ต้องมีแถวใน `tbiw37n` + `wkctr` ตรง user ถึงจะเห็นแผนในตาราง — `/planning` query ผ่าน `view_planwork.idwkctr = authUser.idwkctr`; เพิ่มข้อความ debug ใน [`PlanningPage`](../../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) และเพิ่ม query ตรวจ `Planning visibility by login work center` / `wkctr not mapped` ใน [`verify_app_schema.sql`](../../database/scripts/verify_app_schema.sql)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-19 | **ปิดลำดับ 8 ระดับแกน** — checkbox ครบทั้ง Dashboard / Planning / Navigation / ข้อมูล; ปรับ header `สถานะรวม` เป็น “เสร็จ (แกน) — 2026-05-19” และระบุงานเหลือสำหรับ **stack เต็ม** (FullCalendar DnD Planning, charts KPI Dashboard, IndexedDB offline, Docker ส่งมอบ); อัปเดต `COMPLETION-MATRIX.md` แถวลำดับ 8 ควบคู่ |
| 2026-05-19 | **Planning data visibility** — ยืนยันเงื่อนไขข้อมูลว่า `/planning` เห็นรายการเมื่อ `view_planwork.idwkctr` ตรงกับ `authUser.idwkctr` (จาก `tbiw37n.wkctr` หรือ `tbplangingwork.wkctr` ที่ map กับ `tbworkcenter`); เพิ่มข้อความ debug `idwkctr/wkctr` ใน `PlanningPage` และเพิ่ม section ตรวจ visibility / unmapped `wkctr` ใน `database/scripts/verify_app_schema.sql`; อัปเดต checklist หลักควบคู่ |
| 2026-05-19 | **Navigation Planning → Work Order detail** — เปลี่ยนลิงก์เลข WO ใน `PlanningPage` จากรายการรวม `/work-orders` เป็น `/work-orders/:id`; route `work-orders/:id` มีอยู่ใน `App.tsx` และ `WorkOrdersPage` เปิด dialog รายละเอียดจาก route param; อัปเดต checklist หลักควบคู่ |
| 2026-05-19 | **ปิด parity แกนบรรทัด 40-42** — เพิ่ม `GET /api/v1/planning/orders?status=open|closed` เพื่อรองรับ `M_planwork_close.php`, `W_planwork_view.php`, `W_planwork_view_close.php`; เพิ่มปุ่มสลับ “งานเปิด/งานปิดแล้ว” ใน `PlanningPage`, แสดง `Plan Close`, และเปิด `WorkOrderDetailDialog` ที่แท็บ Confirm สำหรับบันทึก/ดูปิดงาน; เพิ่ม `initialTab` ให้ `WorkOrderDetailDialog`; อัปเดต checklist หลักควบคู่ |
| 2026-05-19 | **ปิด parity แกน `M_planwork_view_form.php`** — register route handler `POST /api/v1/planning/assign` ที่หายไป (auth + Admin-only 403 + zod 400 + 404 ถ้า WO ไม่อยู่ใน CRTD/REL + 503 SCHEMA_NOT_READY), ยกระดับ UI ใน `PlanningPage` จากปุ่ม “จ่ายให้ฉัน” เป็น Assign dialog (WC ปลายทาง จาก `/api/v1/workcenters` + Team `P`/`G` + `pwcomment`); อัปเดต checklist หลักควบคู่ |
| 2026-05-19 | เพิ่ม API `POST /api/v1/planning/assign` สำหรับ Admin เพื่อ upsert `tbplangingwork` และเพิ่มปุ่ม “จ่ายให้ฉัน” ใน `PlanningPage`; อัปเดต checklist หลักควบคู่ |
| 2026-05-19 | ตรวจ KPI เพิ่มเติม: `content.php` เป็น SB Admin demo (Primary/Warning/Success/Danger + chart/table ตัวอย่าง); ไม่เพิ่ม KPI ใหม่ใน Dashboard รอบนี้ และบันทึก candidate รายงาน `W_summary_weekly*` ไป phase `/reports` |
| 2026-05-19 | เพิ่มเมนู sidebar “Dashboard / หน้าแรก” สำหรับทุกสิทธิ์ (`A:U:W`) และ migration `031_dashboard_menu_all_roles.sql` สำหรับ DB ที่รันแล้ว |
| 2026-05-19 | เพิ่มลิงก์จากการ์ดสรุป Dashboard ไป `/work-orders`, `/planning`, `/iw37n`; อัปเดต checklist หลักควบคู่ |
| 2026-05-19 | ปรับการ์ด Dashboard จาก “รอยืนยันบุคลากร” เป็น “รอจ่ายงาน” และระบุความหมายว่าเป็น WO เปิด (`CRTD`/`REL`) ที่ยังไม่มีแถวใน `tbplangingwork`; อัปเดต checklist หลักควบคู่ |
| 2026-05-16 | สร้างไฟล์ |
