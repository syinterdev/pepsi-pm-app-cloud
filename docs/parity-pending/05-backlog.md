# ลำดับที่ 5 — Backlog

**สถานะรวม:** เสร็จ  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Checklist หลัก:** `backlog.php`  
**Migration:** ใช้ `004` (`view_order`) — ไม่มีไฟล์แยก  
**Route:** `/backlog`

---

## ทำแล้ว (แกน)

- [x] `GET /api/v1/backlog/filter-options` (รวม `tbwkzb`, `tbfunctional` จาก `005`)
- [x] `POST /api/v1/backlog/events`
- [x] Logic ร่วม [`scheduling-shared.ts`](../../PM-Pepsi-App/backend/src/services/scheduling-shared.ts)
- [x] [`BacklogPage.tsx`](../../PM-Pepsi-App/frontend/src/features/backlog/BacklogPage.tsx) — ฟิลเตอร์ + ปฏิทิน + badge API+DB
- [x] Modal รายละเอียด WO ผ่าน `GET /api/v1/work-orders/:id` (PG)

---

## ยังไม่ทำ

### ปฏิทิน / interaction

- [x] FullCalendar แบบ [`backlog.php`](../../sap/pages/backlog.php) (month/week/day + hover tooltip + select ช่วงวัน)
- [x] Drag-and-drop ย้ายงานบนปฏิทิน (เปิด MovePlant dialog)
- [x] [`MovePlant.php`](../../sap/modalPages/MovePlant.php) — flow ย้ายแผนครบ

### Manhour / modal อื่น

- [x] [`ModalMHshow.php`](../../sap/modalPages/ModalMHshow.php) — ใช้ `POST /api/v1/backlog/manhour-summary` และแสดงสรุป + breakdown + ตารางรายการ
- [x] [`FilterDetail.php`](../../sap/modalPages/FilterDetail.php) — เพิ่ม `POST /api/v1/backlog/filter-detail` และแสดงสรุปตัวกรองบน BacklogPage

### Parity checklist

- [x] เปลี่ยนแถว `backlog.php` ใน checklist หลักจาก **กำลังทำ** → **เสร็จ**

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ |
| 2026-05-18 | ปิด parity FullCalendar backlog: month/week/day, tooltip, select ช่วงวัน (manhour), drag&drop เปิด MovePlant |
| 2026-05-18 | ทำ `ModalMHshow` parity: เพิ่ม `POST /api/v1/backlog/manhour-summary` และแทนที่ mock dialog ใน BacklogPage |
| 2026-05-18 | ทำ `FilterDetail` parity: เพิ่ม `POST /api/v1/backlog/filter-detail` และแสดงสรุปตัวกรองบน BacklogPage |
