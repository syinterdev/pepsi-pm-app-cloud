# PM Workflow — Phase & Checklist (ลูกค้า 9 มิ.ย. 2026)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** พร้อม implement — สรุป function ครบแล้ว  
**วิธีติ๊ก:** `[ ]` ยังไม่ทำ · `[~]` กำลังทำ · `[x]` เสร็จ

---

## เอกสารอ้างอิง (สรุปที่แล้ว)

| หัวข้อ | ไฟล์ |
|--------|------|
| ภาพรวม mntplan · binding | [`MASTER-PLAN-MNTPLAN-BINDING.md`](MASTER-PLAN-MNTPLAN-BINDING.md) |
| แท็บ Task | [`CALENDAR-WO-TASK-DESIGN.md`](CALENDAR-WO-TASK-DESIGN.md) |
| แท็บ Planning | [`PLANNING-TAB-DESIGN.md`](PLANNING-TAB-DESIGN.md) |
| แท็บ Close WO | [`CLOSE-WO-TAB-DESIGN.md`](CLOSE-WO-TAB-DESIGN.md) |
| หน้า Confirmation | [`CONFIRMATION-PAGE-DESIGN.md`](CONFIRMATION-PAGE-DESIGN.md) |
| Admin | [`ADMIN-FUNCTIONS-SUMMARY.md`](ADMIN-FUNCTIONS-SUMMARY.md) |
| Template Export SAP | [`docs from customer/Export_Confirm (26May).xlsx`](../../docs%20from%20customer/Export_Confirm%20(26May).xlsx) |

---

## ภาพรวม Phase (ลำดับทำ)

```text
[P0] ข้อมูล + Master Plan Publish     ← Task ไม่ว่าง
  ↓
[P1] แท็บ Task (mntplan hero)          ← Planner อ่าน PM ก่อนจ่าย
  ↓
[P2] แท็บ Planning (การ์ด + AA/BB…)    ← จ่ายงานช่าง
  ↓
[P3] แท็บ Close WO (assign + ack)      ← ช่างปิดงาน
  ↓
[P4] หน้า Confirmation (Planner)       ← Confirm/Reject + Export
  ↓
[P5] Nav · Admin ops · Telegram UAT     ← go-live
  ↓
[P6] UAT รอบ PM workflow              ← ลงนาม
```

**หลักการ:** ทำ P0 → P1 ก่อน · P2 ไม่ขึ้นกับ P3 · P4 ต้องมี P3 · P5 คู่ขนานได้บางส่วน

---

## P0 — ข้อมูลพื้นฐาน (บล็อกเกอร์)

> ไม่ UAT workflow จนกว่า Task list จะมีข้อมูลจาก Publish

### P0.1 Master Plan + Publish

- [x] Import/seed แผน EE · ME · PK จาก `docs from customer/01–03-MASTER PM PROCESS *.xlsx`
- [x] ยืนยัน `mntplan` ตัวอย่าง (`342596`, `610000004061`) มีแถวในแผน
- [x] รัน **Publish** (`npm run publish:master-plan` หรือ UI `/master-plan`)
- [x] ตรวจ `tbtasklist` มีแถวหลัง Publish

### P0.2 IW37N

- [x] Upload IW37N มี WO สถานะ CRTD/REL
- [x] WO ทดสอบมีฟิลด์ `mntplan` ตรงกับแผน
- [x] เปิด WO จาก `/calendar` ได้ (modal `tabLayout=assigned`)

### P0.3 Migration (ถ้ายังไม่รันบน DB เป้าหมาย)

- [x] `099_telegram_notify.sql` — `ack_status` / `ack_channel`
- [x] `100_telegram_link_token.sql` — ผูก Telegram ช่าง
- [x] อื่นที่ `/admin/health` แสดง pending

**เกณฑ์ผ่าน P0:** เปิด WO `mntplan=342596` → แท็บ Task มีอย่างน้อย 1 รายการ (หลัง P1 จะแสดงถูก layout)

---

## P1 — แท็บ Task (Planner)

**ออกแบบ:** [`CALENDAR-WO-TASK-DESIGN.md`](CALENDAR-WO-TASK-DESIGN.md)

### P1.1 Backend — `modal-detail` → `taskList`

- [x] เพิ่ม `summary.legacy` ใน `getWorkOrderModalDetail`
- [x] เพิ่ม `items[].displayLine` = `machine — pmlist`
- [x] อัปเดต `workOrderModalDetailSchema` (BE + FE `schemas.ts`)
- [x] Unit test query โดย `mntplan` ไม่ใช่ `wkorder`

### P1.2 Frontend — `WorkOrderTaskListPanel`

- [x] แถบ WO context: WO · วัน · สถานะ · ลิงก์ `mntplan` → `/master-plan`
- [x] การ์ด hero: **mntplan ตัวใหญ่** · legacy · craft/zone · task list รอง
- [x] Checklist: แต่ละแถว `displayLine` + badge เดิน/หยุด
- [x] สรุปจำนวนรายการ (เดิน/หยุด)
- [x] ปุ่ม CTA → สลับแท็บ Planning (ถ้ามี `planning.assign`)
- [x] Empty state ชัด: ยังไม่ Publish / ไม่มี mntplan ในแผน / ไม่มี mntplan ใน IW37N

### P1.3 i18n

- [x] คีย์ EN/TH ใน `scheduling.json` สำหรับ hero · empty · CTA

### P1.4 Verify

- [x] WO `4001560529` · mntplan `342596` — แสดง 1 รายการ ไม่เน้น `596` เป็นหัวหลัก
- [x] `npm test` backend (modal-detail) + frontend build ผ่าน

**เกณฑ์ผ่าน P1:** Planner เปิด Task → เห็น mntplan + checklist ครบ → กดไป Planning ได้

---

## P2 — แท็บ Planning (มอบหมายงาน)

**ออกแบบ:** [`PLANNING-TAB-DESIGN.md`](PLANNING-TAB-DESIGN.md)

### P2.1 Backend — กรอง pool ช่าง

- [x] `getWorkOrderModalDetail`: ไม่ส่ง `userrole=admin` / `userst=A`
- [x] กรอง inactive (`tbwkctrstatus.is_active`) ถ้ามี
- [x] (optional) `shiftTags` / `craftTags` ใน `workcenterItemSchema`

### P2.2 Frontend — การ์ดช่างรวม multi-select

- [x] รวม `PlanningQuickAssign` + `PlanningMultiAssign` → การ์ด + เลือกหลายใบ + ปุ่ม batch
- [x] ลบ/ซ่อน checkbox list แยก
- [x] การ์ด: ชื่อชัด · รหัส monospace · ASSIGNED · ชม.ว่าง
- [x] Checkbox กรอง **AA · BB · EE · UT** (label Shift Day/Night · Electrical · Utility)
- [x] แสดงป้าย UI **AA/BB** (แมป DB `A`/`B` ถ้าซิงค์ทีม WO)

### P2.3 มอบหมายกลุ่ม + ตารางจ่ายแล้ว

- [x] คงตาราง assignees + มอบหมายกลุ่ม (ไม่เปลี่ยน flow)
- [x] Badge ack `รับทราบ x/y` บน Planning

### P2.4 i18n

- [x] `planning.categoryAA` … `planning.assignSelected` EN/TH

### P2.5 Verify

- [x] `ADMIN01` ไม่ปรากฏใน pool
- [x] เลือก 2 ช่าง → `POST .../planning/batch` → การ์ด ASSIGNED
- [x] กรอง EE แสดงเฉพาะช่างที่ตรง craft (หรือทั้งหมดถ้ายังไม่มี master AA/BB)

**เกณฑ์ผ่าน P2:** Planner จ่ายหลายคนผ่านการ์ด · ไม่มี Admin ในรายการ

---

## P3 — แท็บ Close WO (ช่าง)

**ออกแบบ:** [`CLOSE-WO-TAB-DESIGN.md`](CLOSE-WO-TAB-DESIGN.md)

### P3.1 Backend — สิทธิ์แท็บ

- [x] `modal-detail.planning.closeWoAccess`: `canView` · `canWrite` · `reason`
- [x] คำนวณ: technician + assign row + `ack_status=acknowledged`
- [x] `POST .../confirmation/.../close` บังคับเงื่อนไขเดียวกัน (403 ถ้าไม่ผ่าน)

### P3.2 Frontend — `WorkOrderDetailDialog`

- [x] แสดงแท็บ Close WO เฉพาะ `closeWoAccess.canView`
- [x] Planner/Admin ไม่เห็นแท็บใน `assignedLayout`
- [x] Banner เมื่อ assign แต่ยังไม่ ack: กดรับงาน (Telegram หรือ `/planning`)
- [x] ปุ่มรับงาน Web ใน modal (ถ้า pending) → `POST .../planning/orders/:idiw37/ack`

### P3.3 Verify

- [x] ช่างไม่ได้ assign → ไม่เห็น Close WO
- [x] ช่าง assign แต่ยังไม่ ack → ไม่เห็น Close WO
- [x] ช่าง ack (web หรือ telegram) → เห็น Close WO + บันทึกได้
- [x] Planner เปิด WO เดียวกัน → ไม่เห็น Close WO

**เกณฑ์ผ่าน P3:** ช่างปิดงานได้เฉพาะหลังรับงาน · Planner ไม่เห็นแท็บ

---

## P4 — หน้า Confirmation (Planner)

**ออกแบบ:** [`CONFIRMATION-PAGE-DESIGN.md`](CONFIRMATION-PAGE-DESIGN.md)

### P4.1 Backend — preview + export

- [x] `GET /api/v1/confirmation/preview` — แถวปิดงานรอตรวจ (ก่อน QC approve)
- [x] Schema แถวเดียวกับ export (9 ฟิลด์แสดง + 14 ฟิลด์ export)
- [x] `export.xlsx`: sheet name **`Worksheet`** (ตรง template ลูกค้า)
- [x] Header 14 คอลัมน์ · สะกด **Comfirmation** · วันที่ `DDMMYYYY` · Act.Work 2 ทศนิยม
- [x] Regression test เทียบ `Export_Confirm (26May).xlsx`

### P4.2 Frontend — หน้าใหม่ `/confirmation`

- [x] Title เมนู: **Confirmation** (ไม่ใช่ Export Confirmation)
- [x] แท็บ: ทั้งหมด · รอตรวจ · อนุมัติแล้ว · ส่งกลับ
- [x] ตาราง 9 คอลัมน์ (หัวเข้ม · zebra) — ตามภาพลูกค้า
- [x] ดูรูป (drawer/modal) · ปุ่ม **Confirm** / **Reject** (`ConfirmQcPanel`)
- [x] Section Export — แถว approved + Export To Excel / CSV
- [x] Redirect `/personnel/confirm` → `/confirmation`

### P4.3 Nav + RBAC

- [x] `nav-config.ts`: เมนูเดียว **Confirmation** · ลบ Personnel Confirmation จาก sidebar หลัก
- [x] Planner (`U`) มี `confirmation.read` + review (`confirmation.import` approve/reject + `confirmation.export`)
- [x] อัปเดต `tbmenu` migration [`111_confirmation_menu_planner_rbac.sql`](../../database/migrations/111_confirmation_menu_planner_rbac.sql)
- [x] i18n `nav.json` · `personnel.json` (ลิงก์ dashboard)

### P4.4 Verify

- [x] ช่างปิดงาน → Planner เห็นแถวใน **รอตรวจ** ทันที — `scripts/verify-p44-confirmation-flow.mjs` (WO 512 → pending)
- [x] Confirm → แถวย้ายไป Export section — QC approve + `listConfirmationExportRows` รวม `tbwrkclose`
- [x] ดาวน์โหลด Excel เปิดใน Excel ตรง template — vitest `confirmation-export-xlsx.test.ts` เทียบ `Export_Confirm (26May).xlsx`
- [x] Reject → ช่างแก้ไขได้ (flow เดิม) — reject + comment 201 ใน verify script

**แก้ระหว่าง verify:** `idcom`/`idiw37` coerce (Zod) · export รวม personnel close · `applyTecoSystemStatus` ไม่ทำให้ approve ล้ม

**เกณฑ์ผ่าน P4:** ✅ Planner ตรวจ → Confirm → Export ไฟล์ SAP ได้

---

## P5 — Nav · Admin · Telegram (go-live)

**อ้างอิง:** [`ADMIN-FUNCTIONS-SUMMARY.md`](ADMIN-FUNCTIONS-SUMMARY.md) · [`TELEGRAM-IMPLEMENTATION-CHECKLIST.md`](TELEGRAM-IMPLEMENTATION-CHECKLIST.md) · [`P5-GO-LIVE-RUNBOOK.md`](P5-GO-LIVE-RUNBOOK.md)

### P5.1 Telegram (server offline)

**Dev verify (ไม่ต้องมี Bot จริง):**

```powershell
cd PM-Pepsi-App/backend
npm run seed:telegram-p51
npm run verify:p51-telegram
```

| ขั้น | Dev | Production |
|------|-----|------------|
| BotFather + token | `[ ]` optional | `[ ]` `.env` `TELEGRAM_BOT_TOKEN` |
| setWebhook | `[ ]` skip locally | `[ ]` `npm run telegram:set-webhook` |
| `/admin/telegram` ack_to_planner | `[x]` seed / DB | `[ ]` ลูกค้าตั้ง Chat ID จริง + Test send |
| ผูกช่าง ≥2 คน | `[x]` WC001/WC002 mock chat | `[ ]` invite จริงในมือถือ |
| จ่ายงาน → ack → Planner | `[x]` webhook callback + DB | `[ ]` DM + กลุ่มจริง |

- [ ] BotFather + token ใน secrets (`.env` — production)
- [ ] `setWebhook` → `/api/v1/telegram/webhook` — `npm run telegram:set-webhook`
- [x] `/admin/telegram`: กลุ่ม `ack_to_planner` (dev seed · prod ตั้งใน Admin)
- [x] ผูกช่างทดสอบ ≥2 คน (dev: WC001/WC002 mock · prod: `/admin/users` invite)
- [x] จ่ายงาน → รับทราบ → Planner group resolve (dev: `verify:p51-telegram` · prod: E2E DM)

**โค้ดพร้อม:** migration 099/100 · webhook · DM · ack · `ack_to_planner`

### P5.2 Admin ปฏิบัติการ

**Dev verify:**

```powershell
cd PM-Pepsi-App/backend
npm run verify:p52-backup
```

| ขั้น | Dev | Production |
|------|-----|------------|
| Backup target `D:/PM-Pepsi-App/backup` | `[x]` verify script | `[x]` UAT `/admin/backup` 2026-06-19 |
| Cron `0 2 * * *` | `[x]` DB default | `[x]` UI แสดงถูกต้อง |
| Manual backup + `.sql.gz` | `[x]` `verify:p52-backup` | `[x]` Backup now UI → `#3` success |
| Publish Master Plan callout | `[x]` `/admin/master` | `[x]` |

- [x] Backup schedule บน `D:/PM-Pepsi-App/backup` — dev: `verify:p52-backup` · prod: `/admin/backup` + Backup now
- [x] คู่มือสั้น: Publish Master Plan หลัง import แผนปี — callout ที่ `/admin/master` + runbook
- [ ] (เฟส 2) ฟิลด์ AA/BB ใน `/personnel/admin`

### P5.3 Menu Builder (ถ้า prod ใช้ `tbmenu`)

- [x] Sync เมนู Confirmation ใหม่ — migration [`111_confirmation_menu_planner_rbac.sql`](../../database/migrations/111_confirmation_menu_planner_rbac.sql)
- [x] ซ่อน `/personnel/confirm` สำหรับ Planner — deprecated ใน nav + migration 111

**ตรวจ:** `cd PM-Pepsi-App/backend && npm run verify:p5-go-live`

**เกณฑ์ผ่าน P5:** Telegram E2E 1 WO · backup รันสำเร็จ

---

## P6 — UAT รอบ PM Workflow

### สคริปต์ UAT (ลำดับ)

| # | บทบาท | ขั้นตอน | ผ่าน |
|---|--------|---------|------|
| U1 | Admin | Import IW37N + Publish Master Plan | [ ] |
| U2 | Planner | Calendar → WO → **Task** อ่าน mntplan + checklist | [ ] |
| U3 | Planner | **Planning** จ่าย 2 ช่าง (การ์ด · AA/BB filter) | [ ] |
| U4 | ช่าง | รับงาน (Web หรือ Telegram) | [ ] |
| U5 | ช่าง | **Close WO** ปิดงาน + รูป | [ ] |
| U6 | Planner | **Confirmation** ดูตาราง + รูป → Confirm | [ ] |
| U7 | Planner | Export Excel → เปรียบ template ลูกค้า | [ ] |
| U8 | ช่าง | ไม่ได้ assign → ไม่เห็น Close WO | [ ] |
| U9 | Planner | ไม่เห็น Close WO ใน modal | [ ] |

### Regression

- [ ] `npm test` backend
- [ ] `npm run build` frontend
- [ ] ไม่ regression แท็บ Work Order เต็ม (`tabLayout=full`)

---

## แผนงานแนะนำ (สัปดาห์)

| สัปดาห์ | Phase | ผลลัพธ์ |
|---------|-------|---------|
| 1 | P0 + P1 | Task tab ถูกต้องบน WO จริง |
| 2 | P2 | Planning การ์ด + กรอง Admin |
| 3 | P3 + P4 (BE) | Close WO gate + preview API |
| 4 | P4 (FE) + P5 | Confirmation หน้าใหม่ + Telegram UAT |
| 5 | P6 | UAT ลงนาม |

---

## ไฟล์หลักที่จะแตะ (สรุป)

| Phase | Backend | Frontend |
|-------|---------|----------|
| P1 | `work-orders.ts`, schemas | `WorkOrderTaskListPanel.tsx`, `WorkOrderDetailDialog.tsx` |
| P2 | `work-orders.ts` (wc query) | `PlanningQuickAssign.tsx` หรือใหม่, `WorkOrderDetailDialog.tsx` |
| P3 | `work-orders.ts`, `confirmation.ts` | `WorkOrderDetailDialog.tsx` |
| P4 | `confirmation.ts`, routes | `ConfirmationPage.tsx`, `nav-config.ts` |
| P5 | telegram routes, migrations | `AdminTelegramPage.tsx`, menu |

---

## บันทึกความคืบหน้า

| Phase | สถานะ | วันที่เสร็จ | หมายเหตุ |
|-------|--------|-------------|----------|
| P0 | [ ] | | |
| P1 | [ ] | | |
| P2 | [ ] | | |
| P3 | [ ] | | |
| P4 | [ ] | | |
| P5 | [ ] | | |
| P6 | [ ] | | |

**อัปเดตล่าสุดโดย:** _______________ **วันที่:** _______________
