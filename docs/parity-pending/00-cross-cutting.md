# งานค้างข้ามลำดับ (Cross-cutting)

**อ้างอิงหลัก:** [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) §3, §5  
**ไม่ผูกลำดับเดียว** — มักทำคู่กับลำดับ 3–5 และ shell (ลำดับ 1)

**Stack เต็มรูปแบบ ([`skills.md`](../../skills.md)):** ยังไม่มี — รายการด้านล่างที่ติ๊กแล้วเป็น **แกน/parity บางส่วน** ไม่ใช่ครบ stack · ดู [`00-stack-target.md`](00-stack-target.md)

---

## ฐานข้อมูล PostgreSQL

- [x] รัน migration **`001`–`008`** ครบใน schema `app` — สคริปต์ [`run-all-migrations.ps1`](../../database/scripts/run-all-migrations.ps1) + ไฟล์ใน [`database/migrations/`](../../database/migrations/)
- [x] ตรวจด้วย [`verify_app_schema.sql`](../../database/scripts/verify_app_schema.sql) — รายการตาราง/view + จำนวนแถว
- [x] **Seed** ข้อมูลทดสอบ — [`009_dev_auth_seed.sql`](../../database/seeds/009_dev_auth_seed.sql) + [`010_dev_demo_data.sql`](../../database/seeds/010_dev_demo_data.sql); รวม [`run-all-seeds.ps1`](../../database/scripts/run-all-seeds.ps1)
- [x] เอกสารติดตั้ง offline บน D: — [`docs/ON-SITE-DATABASE-SETUP.md`](../ON-SITE-DATABASE-SETUP.md) + [`database/seeds/README.md`](../../database/seeds/README.md)

### ขั้นตอนที่คุณทำบนเครื่อง (DBeaver)

1. ถ้ายังไม่ครบ: รัน `001` … `008` (คุณรัน `008` + tbmenu แล้ว)
2. รัน **`database/seeds/009_dev_auth_seed.sql`**
3. รัน **`database/seeds/010_dev_demo_data.sql`**
4. รัน **`database/scripts/verify_app_schema.sql`** — ดูคอลัมน์ `ok` และจำนวนแถว
5. Login **`WC001`** / `wc001` ทดสอบ calendar / planning / dashboard

> **หมายเหตุ:** Migration ใน `003`/`004`/`005` มี sample อยู่แล้ว — `010` เสริม WO ผูก WC001 + planning + line

---

## UI / UX เทียบ PHP

- [x] **FullCalendar** (ลำดับ 3, 4, 5) — `MonthFullCalendar` ใน `/calendar`, `/line-calendar`, `/backlog` (รองรับ click event/date และ drag & drop ผ่าน callback ของแต่ละหน้า)
- [x] Date picker มาตรฐาน Shadcn แทน jQuery UI (`DatePicker` + `react-day-picker` — ใช้ใน backlog manhour ช่วงวันที่) *(บางจุด — ยังไม่แทน `datepicker.php` ทุกหน้า)*

## `sap/modalPages/` (§5 ใน checklist หลัก)

- [x] `MovePlant.php` — ย้ายแผน (calendar + backlog) — `POST /api/v1/scheduling/move-plan`, ลาก event บน FullCalendar, `MovePlanDialog`
- [x] `ModalOrderDetail.php` — รายละเอียด WO แบบแกน — `WorkOrderDetailDialog` (แท็บ WO / Planning / Task / Machine / Material) + API ขยาย
- [x] `autocomplete.php` — ค้น `wkorder` — `GET /api/v1/work-orders/suggestions` + `WorkOrderAutocomplete` (หน้า `/work-orders`; ใช้ซ้ำใน Confirmation ลำดับ 9)
- [ ] แท็บยืนยันงาน: `confirmTab*`, `plan_confirmTab*`, `ShowPlan*`, `submit_upload_file.php` ฯลฯ — **ลำดับ 9** [`09-confirmation.md`](09-confirmation.md) *(ยังไม่ทำ)*

## Shell / Layout (ลำดับ 1)

- [x] `footer.php` — [`AppFooter.tsx`](../../PM-Pepsi-App/frontend/src/components/layout/AppFooter.tsx) (ลำดับ 1)
- [x] `navbar.php` — โปรไฟล์, อายุ, ชั่วโมงรวม (`worktime_count.php`) — profile API + migration `010_tbmanhours` + [`AppNavbarUser.tsx`](../../PM-Pepsi-App/frontend/src/components/layout/AppNavbarUser.tsx)

## DevOps / ส่งมอบ

- [ ] Docker compose offline + bind mount D:
- [ ] Auto backup ตามบรีฟลูกค้า
- [x] คู่มือ: `VITE_ENABLE_MSW=false`, proxy `/api`, พอร์ต PG — ใน [`ON-SITE-DATABASE-SETUP.md`](../ON-SITE-DATABASE-SETUP.md)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ — แยกจากสรุปลำดับ 1–8 |
| 2026-05-16 | §ฐานข้อมูล — สคริปต์ migration/seed/verify + ON-SITE-DATABASE-SETUP |
| 2026-05-16 | FullCalendar + Shadcn DatePicker — `/calendar`, `/line-calendar`, `/backlog` |
| 2026-05-16 | เพิ่ม [`00-stack-target.md`](00-stack-target.md) — ยืนยันยังไม่มี stack เต็มรูปแบบตาม skills.md |
| 2026-05-16 | MovePlant + ModalOrderDetail (แกน) + autocomplete — migration `009_tbreason`, API scheduling |
| 2026-05-16 | navbar.php — `AppNavbarUser` + profile API (อายุ/อายุงาน work center) |
| 2026-05-16 | worktime_count — `app.tbmanhours`, `worktimeTotalHours` ใน profile, `GET /api/v1/manhours/summary` |
