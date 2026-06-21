# Checklist งานก่อนพัฒนา Telegram + จ่ายงานแจ้งเตือน

**เวอร์ชัน:** 1.1  
**อัปเดต:** 2026-06-09  
**Flow อ้างอิง:** [`TELEGRAM-ASSIGNMENT-FLOW.md`](TELEGRAM-ASSIGNMENT-FLOW.md)

> ติ๊กใน Cursor/VS Code: คลิกช่อง `[ ]` หรือแก้เป็น `[x]` เมื่อเสร็จ  
> กำลังทำ: ใส่ `[~]` แทน `[ ]` (markdown ไม่ติ๊กอัตโนมัติ แต่เห็นสถานะชัด)

---

## ความคืบหน้า Phase (อัปเดตมือ)

| Phase | ชื่อ | สถานะ |
|-------|------|--------|
| **A** | บล็อกเกอร์จ่ายงานเว็บ | `[ ]` ยังไม่เริ่ม |
| **B** | ตัดสินใจกับลูกค้า | `[ ]` ยังไม่เริ่ม |
| **C** | Admin กลุ่ม Telegram | `[~]` โค้ดพร้อม — รอรัน migration + UAT |
| **D** | Bot + ผูกรายคน | `[~]` โค้ดพร้อม — รอ BotFather + migration 100 + UAT |
| **E** | แจ้งเตือน + รับทราบ | `[~]` โค้ดพร้อม — รอ Bot + migration 099 + UAT |
| **F** | ปิดงาน + Confirmation | `[ ]` ยังไม่เริ่ม |
| **G** | ทดสอบ + เอกสาร | `[ ]` ยังไม่เริ่ม |
| **H** | UAT รอบ Telegram | `[ ]` ยังไม่เริ่ม |

**Phase ปัจจุบัน:** _______________  
**อัปเดตล่าสุดโดย:** _______________  **วันที่:** _______________

---

## วิธีใช้

1. ทำ **§A** ให้ครบก่อน — อย่าเริ่ม Bot ถ้ายังจ่ายงานเว็บไม่ผ่าน
2. ปิด **§B** กับลูกค้า
3. ทำ **§C → §H** ตามลำดับ (อย่าข้าม **§C** — ลูกค้าจัดการกลุ่มเอง)
4. อัปเดตตาราง「ความคืบหน้า Phase」ด้านบนเมื่อจบแต่ละ Phase

---

## A) งานที่ต้องเสร็จก่อนเริ่ม Telegram (บล็อกเกอร์)

> ไม่เริ่ม Bot / webhook จนกว่า flow จ่ายงานบนเว็บจะ UAT ผ่าน

- [ ] **A1** — Migration `038` (multi-assign) รันบน DB โรงงาน  
  - เกณฑ์: มี index `idx_tbplangingwork_idiw37_wkctr`
- [ ] **A2** — Migration `098` (ช่างมี `planning.read`) รันบน DB โรงงาน  
  - เกณฑ์: ช่างเปิด `/plan-calendar` ไม่ได้ 403
- [x] **A3** — จ่ายงาน Manual + batch หลายคน (`PlanningMultiAssign`)  
  - เกณฑ์: SQL / UI มีแถว `(idiw37, wkctr)` · checkbox + `POST …/planning/batch`
- [x] **A4** — จ่ายงานกลุ่ม (Auto/G) — แก้ `planning-group.ts` แล้ว (โค้ด)  
  - เกณฑ์: จ่ายกลุ่มได้ ≥1 ช่าง · toast แสดง `assigned[]`
- [ ] **A5** — ช่างเห็นงานที่ `/planning` หลังจ่าย  
  - เกณฑ์: รายการ WO ตรงผู้รับ
- [ ] **A6** — ช่างเห็นงานที่ `/plan-calendar` เมื่อเลือกเดือนถูก  
  - เกณฑ์: ตรง `bscstart` / `cday` ของ WO
- [ ] **A7** — ลูกค้าเข้าใจ **ทีม A/B/EE/UT** ≠ **จ่ายช่าง**  
  - เกณฑ์: UAT ยืนยัน — ต้องจ่ายที่ Planning
- [ ] **A8** — Import IW37N มี WO ทดสอบ (CRTD/REL)  
  - เกณฑ์: มีเลข WO สำหรับ UAT Telegram

**Phase A ผ่านเมื่อ:** ติ๊ก A1–A3, A5–A8 ครบ (A4 มีแล้ว)

---

## B) ข้อตัดสินใจกับลูกค้า (ปิดก่อนออกแบบ Admin)

- [ ] **B1** — Planner รับแจ้ง「รับทราบแล้ว」ทางไหน  
  - [ ] แชทส่วนตัว  
  - [ ] กลุ่มที่ Admin ตั้งเอง (แนะนำ)  
  - [ ] ทั้งคู่
- [ ] **B2** — ปิดงานผ่าน Telegram รอบแรก  
  - [ ] ลิงก์เปิดเว็บเท่านั้น  
  - [ ] บันทึกเวลาในแชท  
  - [ ] อัปรูปในแชท
- [ ] **B3** — บังคับกดรับทราบก่อนทำงานหรือไม่  
  - [ ] ใช่ — บังคับ ack  
  - [ ] ไม่ — แจ้งเตือนอย่างเดียว
- [ ] **B4** — ภาษาข้อความ Bot  
  - [ ] ไทย  
  - [ ] อังกฤษ  
  - [ ] ตามโปรไฟล์ผู้ใช้
- [ ] **B5** — ช่างไม่มี Telegram  
  - [ ] ใช้เว็บอย่างเดียว  
  - [ ] แจ้ง Admin รายวัน
- [ ] **B6** — ยืนยัน: **ลูกค้าจัดการกลุ่มแจ้งเตือนเองใน Admin**

**Phase B ผ่านเมื่อ:** ติ๊ก B1–B6 ครบ + บันทึกวันที่ตัดสินใจ: _______________

---

## C) Admin: กลุ่ม Telegram (ลูกค้าจัดการเอง)

> สร้าง/แก้/ปิด **กลุ่มแจ้งเตือน** ใน Admin — ไม่แก้ `.env` ทุกครั้ง

### C0) ออกแบบ (อ่านอย่างเดียว — ไม่ต้องติ๊ก)

| `notify_kind` | ใช้เมื่อ |
|---------------|---------|
| `assignment_to_tech` | DM ช่าง (รายคน — ไม่ใช่กลุ่ม) |
| `ack_to_planner` | ช่างกดรับทราบ → แจ้ง Planner |
| `ack_summary` | สรุปรับทราบรายวัน |
| `confirm_reminder` | QC / Confirm ค้าง |
| `custom` | ลูกค้าตั้งเอง |

### C1) Database & migration

- [x] **C1.1** — ตาราง `app.tbl_telegram_notify_group` (`099_telegram_notify.sql`)
- [x] **C1.2** — ตาราง `app.tbl_telegram_notify_group_member` (ถ้า `link_type=workcenters`)
- [x] **C1.3** — ฟิลด์รายคน: `tbworkcenter.telegram_chat_id`, `telegram_username`, `telegram_linked_at`
- [x] **C1.4** — สถานะรับทราบ: `ack_status` / `ack_at` / `ack_channel` บน `tbplangingwork`
- [x] **C1.5** — Bot status ใน env (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_NOTIFY_ENABLED`)
- [x] **C1.6** — Permission `admin.telegram.read`, `admin.telegram.write`
- [x] **C1.7** — เมนู Admin `tbmenu` → `/admin/telegram`

<details>
<summary>ร่าง SQL migration 099 (คลิกขยาย)</summary>

```sql
CREATE TABLE app.tbl_telegram_notify_group (
  id            serial PRIMARY KEY,
  code          varchar(32) NOT NULL UNIQUE,
  name          text NOT NULL,
  notify_kind   varchar(32) NOT NULL,
  link_type     varchar(16) NOT NULL DEFAULT 'none',
  link_ref      varchar(64),
  telegram_chat_id bigint,
  enabled       boolean NOT NULL DEFAULT true,
  note          text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

</details>

### C2) Admin UI (`/admin/telegram`)

- [x] **C2.1** — หน้าหลัก「Telegram & การแจ้งเตือน」+ การ์ดสรุป
- [x] **C2.2** — ตารางกลุ่ม — CRUD (เพิ่ม/แก้/ปิด/ลบ)
- [x] **C2.3** — ฟอร์ม: ชื่อ · ประเภท event (`notify_kind`) · เปิด/ปิด
- [x] **C2.4** — ฟอร์ม: ผูก master (`link_type` + wkctrgroup / pm_team / wkctr)
- [x] **C2.5** — ฟอร์ม: Chat ID กลุ่ม Telegram (+ hint ใน UI)
- [x] **C2.6** — ปุ่ม「ทดสอบส่ง」→ `POST .../groups/:id/test`
- [x] **C2.7** — ลิงก์ช่างผูกบัญชี → `/admin/users` + ตาราง link-status
- [x] **C2.8** — คู่มือใน UI (ไทย): สร้างกลุ่ม TG · add Bot
- [x] **C2.9** — Audit log `admin.telegram.group.*`
- [x] **C2.10** — i18n EN/TH ใน `locales/admin.json`

### C3) API Admin

- [x] **C3.1** — `GET /api/v1/admin/telegram/summary`
- [x] **C3.2** — `GET/POST/PATCH/DELETE .../telegram/groups`
- [x] **C3.3** — `POST .../telegram/groups/:id/test`
- [x] **C3.4** — `GET .../telegram/link-status` (ช่างผูก/ไม่ผูก)

**Phase C ผ่านเมื่อ:** C1 + C2 + C3 ครบ + Admin สร้างกลุ่มทดสอบส่งได้ 1 ครั้ง

---

## D) Bot & ผูกบัญชีรายคน

- [ ] **D1** — สร้าง Bot (BotFather) · `TELEGRAM_BOT_TOKEN` บน production
- [x] **D2** — Webhook `POST /api/v1/telegram/webhook` + secret (`telegram.ts`, `maintenance-mode` exempt)
- [x] **D3** — `/start <token>` ผูก `wkctr` ↔ `chat_id` (`100_telegram_link_token.sql`, `telegram-webhook.ts`)
- [x] **D4** — Admin/Users: ปุ่ม「สร้างลิงก์เชิญ Telegram」 (`PersonnelAdminPage` + `TelegramInviteDialog`)
- [x] **D5** — Settings ช่าง: ผูก/ยกเลิกตัวเอง (`TelegramLinkPanel` ใน Profile)
- [x] **D6** — Token เชิญหมดอายุ · ใช้ครั้งเดียว (`telegram-link.ts` — 24h, SHA-256 hash)

**Phase D ผ่านเมื่อ:** ช่างทดสอบ 1 คนผูก Telegram สำเร็จ

---

## E) แจ้งเตือนจ่ายงาน & รับทราบ

- [x] **E1** — Hook หลัง assign (`planning/assign` + `work-orders/.../planning/batch`)
- [x] **E2** — ส่ง DM ช่าง (ข้อความ + ปุ่มรับทราบ + ลิงก์เว็บ) — `telegram-assignment-notify.ts`
- [x] **E3** — Callback รับทราบ → อัปเดต `ack_status` — `telegram-webhook.ts` + `planning-ack.ts`
- [x] **E4** — แจ้งกลุ่ม `ack_to_planner` ตาม Admin ตั้ง
- [x] **E5** — กรองกลุ่มตาม `link_type` / `link_ref` — `telegram-notify-groups.ts`
- [x] **E6** — UI: ป้ายรับทราบ `/planning` + WO modal Planning
- [x] **E7** — ปุ่มรับทราบบนเว็บ — `POST /api/v1/planning/orders/:idiw37/ack`
- [x] **E8** — ไม่ส่งซ้ำถ้า `acknowledged` แล้ว (notify เฉพาะ `assigned[]`)

**Phase E ผ่านเมื่อ:** จ่ายงาน 1 WO → ช่างได้ DM → กดรับทราบ → กลุ่ม Planner ได้ข้อความ

---

## F) ปิดงาน & Confirmation

- [ ] **F1** — Regression ปิดงานบนเว็บหลังมี Telegram
- [ ] **F2** — (ถ้า B2) แจ้งกลุ่ม `confirm_reminder` เมื่อ QC ค้าง
- [x] **F3** — Telegram: ลิงก์ `/work-orders/:id` (Confirm tab) + ปุ่มปิดงานย่อ `c:{idplanw}`
- [ ] **F4** — Planner Confirm + export SAP ตาม [`CONFIRM-QC-FLOW.md`](CONFIRM-QC-FLOW.md)

---

## G) ทดสอบ & เอกสาร

- [ ] **G1** — Unit test: resolve กลุ่มตาม `link_type`
- [ ] **G2** — Integration test: webhook callback รับทราบ
- [ ] **G3** — E2E smoke: Admin สร้างกลุ่ม → ทดสอบส่ง
- [ ] **G4** — อัปเดต [`USER-MANUAL-TH.md`](../USER-MANUAL-TH.md) § Admin Telegram
- [x] **G5** — อัปเดต [`UAT-ROUND-3-TH.md`](UAT-ROUND-3-TH.md) §F Telegram
- [ ] **G6** — คู่มือลูกค้า 1 หน้า: วิธีตั้งกลุ่ม TG

---

## H) UAT รอบ Telegram (หลัง deploy)

- [ ] **H1** — Admin สร้างกลุ่ม「Planner รับทราบ」+ ทดสอบส่ง
- [ ] **H2** — Admin ผูก Telegram ช่าง 2 คน
- [ ] **H3** — Planner จ่ายงานรายคน → ช่างได้ DM
- [ ] **H4** — Planner จ่ายงานกลุ่ม wkctrgroup → สมาชิกได้ DM
- [ ] **H5** — ช่างกดรับทราบ → กลุ่ม Planner ได้ข้อความ
- [ ] **H6** — กลุ่มผูก `pm_team=EE` แจ้งเฉพาะ WO ทีม EE
- [ ] **H7** — ปิดกลุ่มใน Admin → ไม่ส่งเมื่อ disabled
- [ ] **H8** — ช่างไม่ผูก TG → ยังเห็น `/planning`
- [ ] **H9** — End-to-end ถึง `/confirmation` + export SAP

**UAT ผ่านเมื่อ:** H1–H9 ครบ · ลงนาม: _______________ วันที่: _______________

---

## ลำดับทำงาน (สรุป)

```text
[A] บล็อกเกอร์จ่ายงานเว็บ
 ↓
[B] ตัดสินใจลูกค้า
 ↓
[C] Admin กลุ่ม Telegram  ← ลูกค้าจัดการเอง
 ↓
[D] Bot + ผูกรายคน
 ↓
[E] แจ้งเตือน + รับทราบ
 ↓
[F] ปิดงาน / Confirmation
 ↓
[G] ทดสอบ + คู่มือ
 ↓
[H] UAT
```

---

## แมปโค้ด

| ส่วน | ไฟล์ |
|------|------|
| Admin sections | `PM-Pepsi-App/frontend/src/lib/admin-sections.ts` |
| จ่ายงานกลุ่ม | `PM-Pepsi-App/backend/src/lib/planning-group.ts` |
| ผู้ใช้/ช่าง | `PM-Pepsi-App/frontend/src/features/admin/users/AdminUsersPage.tsx` |

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-06-09 | v1.4 — Phase E โค้ด: DM จ่ายงาน + callback รับทราบ + แจ้ง Planner + UI ack |
| 2026-06-09 | v1.3 — Phase D โค้ด: migration 100 + webhook + Admin/Users + Settings ผูก TG |
| 2026-06-09 | v1.2 — Phase C โค้ด: migration 099 + `/admin/telegram` + API |
| 2026-06-09 | v1.1 — เปลี่ยนเป็น `- [ ]` / `- [x]` ติ๊กได้ + ตารางความคืบหน้า Phase |
| 2026-06-09 | v1.0 — Checklist ก่อน implement + Admin กลุ่ม Telegram |
