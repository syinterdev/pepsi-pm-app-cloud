# ลำดับที่ 6 — Work orders + master filters

**สถานะรวม:** แกนเสร็จ ✅ · UAT ขั้น 5 ⏳  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Checklist หลัก:** `workorder.php`, `W_confirm*`, master filter  
**Migration:** [`005_tbwkzb_tbfunctional.sql`](../../database/migrations/005_tbwkzb_tbfunctional.sql)  
**Route:** `/work-orders`

---

## ทำแล้ว (แกน)

- [x] `GET /api/v1/work-orders` (ค้นหา `q`, กรอง `status`)
- [x] `GET /api/v1/work-orders/:id` (lookup `idiw37` หรือ `wkorder`)
- [x] `tbwkzb`, `tbfunctional` ใช้ใน backlog filter-options
- [x] [`WorkOrdersPage.tsx`](../../PM-Pepsi-App/frontend/src/features/work-orders/WorkOrdersPage.tsx) เรียก API จริง
- [x] Backlog modal รายละเอียด WO ต่อ PG

---

## ยังไม่ทำ (UAT / stack)

### หน้า Work orders

- [x] Badge **API + DB** บน WorkOrdersPage (สอดคล้องโมดูลอื่น)
- [x] Deep link เปิด WO รายตัว เช่น `/work-orders/:id` (เปิด `WorkOrderDetailDialog` ทันที)
- [x] Parity [`workorder.php`](../../sap/pages/workorder.php), `Work_Order_Status.php`
- [x] ชุด `W_confirm*.php` — ยืนยันปิดงาน + comment + image (รวมอยู่ในแท็บ Confirm ของ `WorkOrderDetailDialog`)

### Master UI สำหรับ filter tables

- [x] CRUD UI `M_functional*` (ตารางมีใน `005`) — ทำใน `/master-data` แท็บ `functional` (CRUD + import)
- [x] CRUD UI สำหรับ work center zone / `tbwkzb` — ทำใน `/master-data` แท็บ `zone` + `zb` (CRUD + import)

### Modal

- [x] [`ModalOrderDetail.php`](../../sap/modalPages/ModalOrderDetail.php) เต็มรูปแบบ (แท็บ machine/material/planning ฯลฯ)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ |
| 2026-05-18 | เพิ่ม badge `API + DB` ใน WorkOrdersPage ให้สอดคล้องโมดูลอื่น |
| 2026-05-18 | เพิ่ม route `/work-orders/:id` และเปิด `WorkOrderDetailDialog` อัตโนมัติ |
| 2026-05-18 | ปิด parity workorder.php + Work_Order_Status.php: เพิ่ม filter-options + search (POST) + เลือกทีมต่อแถว + แสดงตาราง work status จาก `tbwkstatus` |
| 2026-05-18 | ปิด parity W_confirm*: เพิ่ม comment + image + close-work ในแท็บ Confirm ของ `WorkOrderDetailDialog` (ใช้ migrations 026 + 029) |
| 2026-05-18 | ปิด CRUD UI `M_functional*` โดยใช้แท็บ `functional` ในหน้า `/master-data` |
| 2026-05-18 | ปิด CRUD UI work center zone / `tbwkzb` โดยใช้แท็บ `zone` + `zb` ในหน้า `/master-data` |
| 2026-05-18 | ปิด `ModalOrderDetail.php` เต็มรูปแบบ: ต่อแท็บ Task List / Machine / Planning / Material ใน `WorkOrderDetailDialog` + API `/api/v1/work-orders/:id/modal-detail` + จ่ายงาน `/planning` |
| 2026-05-21 | ปิดแกน parity — อัปเดต [`PLAN.md`](PLAN.md) §3.1 ลำดับ 5 → ✅; คง UAT ขั้น 5 ตาม [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) |
