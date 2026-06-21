# แผน Phase + Checklist ก่อน UAT (Master)

> **ใช้ไฟล์นี้เป็นหลัก** สำหรับทีมพัฒนา — ทำให้ครบก่อนเขียน/ส่ง **ชีต UAT ให้ลูกค้า**  
> **ยังไม่ใช่เอกสาร UAT** — เมื่อ Phase นี้ปิดแล้ว ค่อยอัปเดต [`customer-requirements/UAT-ROUND-2-TH.md`](customer-requirements/UAT-ROUND-2-TH.md) เป็นรอบ 3 หรือสร้างฉบับใหม่

**อัปเดต:** 2026-06-09  
**Workflow AI:** [`SUPERPOWERS-PM-APP.md`](SUPERPOWERS-PM-APP.md) · [`AGENTS.md`](../AGENTS.md)

---

## วัตถุประสงค์

| เป้าหมาย | รายละเอียด |
|----------|-------------|
| **รวม checklist ก่อน UAT** | ข้อมูล SAP · ฟีเจอร์ · UI · Telegram · Deploy — ที่เดียว |
| **แยกจากชีต UAT** | UAT = ลูกค้าทดสอบ · ไฟล์นี้ = ทีม dev/QC ปิดงานก่อน |
| **ไล่ทีละหน้าได้** | แต่ละ Phase มีลำดับแนะนำ + เกณฑ์ผ่านชัด |

---

## สัญลักษณ์สถานะ

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| `[ ]` | ยังไม่ทำ / ยังไม่ผ่าน |
| `[~]` | โค้ดมีแล้ว · รอ migration / UAT ภายใน / ปรับ UI |
| `[x]` | ปิดแล้ว (dev + ทดสอบภายในผ่าน) |
| `[—]` | N/A หรือเลื่อนออก scope go-live |

**Phase ปัจจุบัน:** _______________  
**อัปเดตล่าสุดโดย:** _______________ **วันที่:** _______________

---

## ภาพรวม Phase (ก่อน UAT)

```text
[P0] ข้อมูล SAP + DB + migration ครบ
  ↓
[P1] Flow หลัก: ปฏิทิน · WO · Planning · Confirm
  ↓
[P2] PM Manual / ค่าวัด / ฟอร์มกระดาษ
  ↓
[P3] Telegram (ถ้า go-live รอบนี้)
  ↓
[P4] UI U4  →  เอกสารแยก: PRE-UAT-UI-PHASES.md
  ↓
[P5] รายงาน · Admin · Board
  ↓
[P6] Deploy Windows (PM2 + IIS + HTTPS tunnel)
  ↓
[P7] QA ภายใน + เอกสาร UAT พร้อมส่งลูกค้า
```

**หลักการ:** ไม่ส่ง UAT จนกว่า **P0 + P1** ผ่านอย่างน้อย · **P4** ทำคู่กับไล่หน้า · **P6** ก่อน UAT บนเครื่องโรงงานจริง

---

## ตารางความคืบหน้า (อัปเดตมือ)

| Phase | ชื่อ | สถานะ | บล็อก UAT? |
|-------|------|--------|------------|
| **P0** | ข้อมูล SAP + DB | `[~]` | **ใช่** |
| **P1** | Flow หลัก | `[~]` | **ใช่** |
| **P2** | PM Manual / ค่าวัด | `[~]` | ใช่ (ถ้าลูกค้า UAT PM) |
| **P3** | Telegram | `[~]` | ตาม scope go-live |
| **P4** | UI Polish U4 | `[x]` | ไม่ (แต่ควรทำก่อนส่ง) → **[`PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md)** |
| **P5** | รายงาน · Admin · Board | `[~]` | บางข้อ |
| **P6** | Deploy production | `[ ]` | **ใช่** (UAT บน env จริง) |
| **P7** | Handoff → ชีต UAT | `[ ]` | สุดท้าย |

---

## เกณฑ์ผ่าน Master (Gate ก่อนเขียนชีต UAT)

ติ๊กครบทุกข้อด้านล่างก่อนส่ง UAT ให้ลูกค้า:

- [ ] **P0** — Import IW37N + Confirm IN คู่กันได้ · ปฏิทิน/WO ไม่ว่างเมื่อมีข้อมูล · migration รันครบบน DB เป้าหมาย
- [ ] **P1** — Flow A1–A9 (ด้านล่าง) ทีม dev ทดสอบผ่านบน env เดียวกับที่ลูกค้าจะใช้
- [ ] **P2** — PM ฟอร์มกระดาษ WO **4001565681** บันทึก/แสดงครบ (ถ้ารวมใน scope UAT)
- [x] **P4** — ผ่าน Gate U4 ใน [`PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md) (หน้า 1–13 · build · audit:ui · E2E U4e/U4f)
- [ ] **P6** — URL HTTPS เปิดได้ · login · API health · backup plan
- [ ] ไม่มี `(mock)` ใน production UI — `npm run audit:ui` ผ่าน
- [ ] [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md) สอดคล้องฟีเจอร์ล่าสุด (รูปหลัง PM · Telegram ถ้ามี)
- [ ] Commit/tag บันทึกใน header ชีต UAT

---

# P0 — ข้อมูล SAP + Database

> อ้างอิง: [`WORK-PHASES.md`](WORK-PHASES.md) Phase 1–2 · [`MEETING-SUMMARY-REQUIREMENTS.md`](customer-requirements/MEETING-SUMMARY-REQUIREMENTS.md)

## P0.1 Parser & Integration

- [x] Parser IW37N SAP ALV + legacy
- [x] Parser Confirm IN SAP ALV
- [x] หน้า `/integration` + watch folder + job log
- [x] Preview ก่อน commit IW37N / Confirm IN
- [ ] **UAT ภายใน:** Import `IW37N ล่าสุด` → inserted > 0 (ไม่ skipped ทั้งก้อน)
- [ ] **UAT ภายใน:** Confirm IN **คู่** IW37N ชุดเดียวกัน → inserted > 0
- [ ] **UAT ภายใน:** Export Confirm CSV เปิด Excel · header ตรง SAP

## P0.2 ข้อมูลบน DB โรงงาน

- [ ] รัน migration ตามลำดับบน DB เป้าหมาย (อย่างน้อย):
  - [ ] `075` `076` integration job
  - [ ] `092` wo pm execution · `093` pm vibration menu
  - [ ] `096` role bilingual (ถ้ายังไม่รัน)
  - [ ] `098` planning.read ช่าง
  - [ ] `099` `100` `101` Telegram (ถ้า scope P3)
- [ ] `functionalloc` / filter **7151** — WO แสดงบนปฏิทินได้
- [ ] มี WO ทดสอบ: **4001565681** (PM 3 เฟส) + WO สำหรับ planning/confirm

## P0.3 รูปใน DB

- [x] รูปช่าง → `tbworkcenter.imgmember_data`
- [x] รูป confirm → `tbconfirmimg.img_data` (WebP)
- [ ] อัปโหลดรูปช่าง ≥3 คนสำหรับ Eng Utilization UAT
- [ ] (ถ้ามี) script ย้ายรูป legacy `imgMember/` → DB

**เกณฑ์ผ่าน P0:** ทีม dev เปิด `/calendar` + `/work-orders` หลัง import จริง · เห็น WO · filter ZB02 ไม่ทำข้อมูลหาย

---

# P1 — Flow หลัก (ทดสอบภายในก่อน UAT)

> ใช้เป็น **script ทดสอบทีม** — คัดลอกไปชีต UAT ทีหลัง

| # | Flow | Route | Dev QA | หมายเหตุ |
|---|------|-------|:------:|----------|
| P1-A1 | Login · สลับ EN/TH · เมนูตาม RBAC | `/login`, topbar | `[ ]` | Globe icon |
| P1-A2 | Import IW37N → ปฏิทินมี event | `/integration`, `/calendar` | `[ ]` | เลือกปี/เดือนถูก |
| P1-A3 | ค้นหา WO → เปิด modal แท็บ Task | `/work-orders` | `[ ]` | |
| P1-A4 | จ่ายงาน Manual + batch | `/planning` | `[ ]` | Multi-assign |
| P1-A5 | ช่างเห็นงาน `/planning` + `/plan-calendar` | planning routes | `[ ]` | migration 098 |
| P1-A6 | Bulk team A/B ทั้งหน้า | `/work-orders` | `[x]` | |
| P1-A7 | Mass confirm ≤44 | `/personnel/confirm` | `[x]` | |
| P1-A8 | รูปหลัง PM + comment → ปิดงาน | WO modal Confirm | `[ ]` | **ไม่บังคับ Before** |
| P1-A9 | QC approve → TECO บน dashboard | `/confirmation` | `[ ]` | |
| P1-A10 | Eng Utilization / Board | `/summary-weekly`, `/board` | `[ ]` | |

### P1 — Regression ระบบเก่า

- [x] Filter Type ไม่ทำข้อมูลหาย ([LEGACY B.2](customer-requirements/LEGACY-ISSUES-CHECKLIST.md))
- [x] แผนเขียว (TECO) ห้าม Move ปฏิทิน
- [x] หลัง confirm เห็นรูป/เวลาใน WO modal
- [x] Task list save ไม่เด้งหน้าแรก
- [ ] UAT มือซ้ำทุกข้อ Must ใน LEGACY-ISSUES

### P1 — รูปปิดงาน (กฎลูกค้าล่าสุด)

- [x] อัปโหลด/API รับเฉพาะ `phase=after` (ไม่รับ before ใหม่)
- [x] Telegram ส่งรูปหลัง PM เท่านั้น
- [ ] อัปเดตข้อความ UI/QC ทุกจุด (ไม่พูด Before/After คู่)
- [ ] อัปเดต [`CONFIRM-IMAGE-LIMITS.md`](customer-requirements/CONFIRM-IMAGE-LIMITS.md) + UAT doc

**เกณฑ์ผ่าน P1:** P1-A1–A10 ทีม dev ติ๊ก `[x]` บน env staging/production

---

# P2 — PM Manual & ค่าวัด (ฟอร์มกระดาษ)

> อ้างอิง: [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](customer-requirements/PM-MANUAL-ENTRY-WORK-ORDER-FORM.md) · UAT §B.1

## P2.1 หน้า `/pm-vibration`

- [~] Layout SAP หน้า 1–2 (print form)
- [ ] เปรียบ **ทีละฟิลด์** กับ WO **4001565681** (print ลูกค้า)
- [ ] กระแส 3 เฟส R/S/T บันทึก + แสดงใน WO modal
- [ ] Vibration X/Y/Z + เส้น Warn/Alarm
- [ ] Comments หน้า 2 ↔ WO modal ตรงกัน
- [ ] Import/Export Excel template PM

## P2.2 WO modal แท็บ Task

- [x] PM comment thread
- [x] PM readings + กราฟ
- [ ] UI แท็บ Task สอดคล้อง `/pm-vibration` (ไม่ generic)

**เกณฑ์ผ่าน P2:** ทีม dev ถ่าย screenshot คู่กระดาษ · ไม่มีฟิลด์สำคัญหาย · บันทึกแล้ว reload คงค่า

---

# P3 — Telegram (ถ้ารวม go-live)

> อ้างอิง: [`TELEGRAM-IMPLEMENTATION-CHECKLIST.md`](customer-requirements/TELEGRAM-IMPLEMENTATION-CHECKLIST.md) · [`TELEGRAM-ASSIGNMENT-FLOW.md`](customer-requirements/TELEGRAM-ASSIGNMENT-FLOW.md)

## P3.1 บล็อกเกอร์เว็บ (§A)

- [ ] Migration `038` multi-assign บน DB โรงงาน
- [ ] Migration `098` ช่าง `planning.read`
- [x] จ่ายงาน Manual + batch + กลุ่ม (โค้ด)
- [ ] ช่างเห็นงาน `/planning` + `/plan-calendar` หลังจ่าย
- [ ] UAT ภายใน: ทีม A/B ≠ จ่ายช่าง (ลูกค้าเข้าใจ)

## P3.2 ตัดสินใจลูกค้า (§B)

- [ ] B1 Planner รับแจ้ง ack ทางกลุ่ม Admin
- [x] B2 ปิดงานในแชท: เวลาย่อ + **รูปหลัง PM** + comment (โค้ด)
- [ ] B3 บังคับ ack ก่อนทำงาน — ยืนยัน
- [ ] B4 ภาษา Bot — ไทย (default)
- [ ] B6 ลูกค้าจัดการกลุ่มใน Admin

## P3.3 Ops + โค้ด

- [x] Admin `/admin/telegram` · Settings Telegram link
- [x] Bot webhook · ack · mini close · photo/comment
- [ ] BotFather token + `setWebhook` HTTPS
- [ ] Migration `099` `100` `101` บน DB โรงงาน
- [ ] `.env`: `TELEGRAM_*`, `APP_PUBLIC_URL`, `CORS_ORIGIN`

## P3.4 Dev QA Telegram

- [ ] ผูกบัญชีช่าง → DM งานใหม่
- [ ] กดรับทราบ → แจ้งกลุ่ม Planner
- [ ] รูปหลัง PM ในแชท → แสดงบนเว็บ WO
- [ ] Comment ในแชท → `tbconfirmcom`
- [ ] ปิดงานย่อ → `tbwrkclose`

**เกณฑ์ผ่าน P3:** §H ใน TELEGRAM-IMPLEMENTATION-CHECKLIST ครบ · หรือตัด scope → บันทึกใน UAT ว่า N/A

---

# P4 — UI Polish U4

> **เอกสารแยก — ทำ UI ก่อน:** [`customer-requirements/PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md)  
> ครอบ U4a–U4e · ไล่ทีละหน้า · popup · animation · brand · Gate UI

**สถานะ Master:** ติ๊ก `[x]` เมื่อ **U4 Gate ผ่าน** ในเอกสาร UI

- [x] U4 Gate ผ่าน (หน้า 1–13 · `npm run build` · `audit:ui` · E2E console/viewport/locale/portal)

---

# P5 — รายงาน · Admin · Board

## P5.1 รายงาน

- [x] `/summary-weekly` Eng Utilization live
- [ ] เทียบตัวเลข 1–2 แถวกับ Excel ลูกค้า
- [~] `/manhours-hr` utilization
- [~] `/activity-log` Week-to-Week
- [~] `/reports/audit` — Phase B/C revision ค้าง ([AUDITOR-REVISION-PLAN.md](customer-requirements/AUDITOR-REVISION-PLAN.md))

## P5.2 Admin

- [x] Console · Users · Roles · Branding · Settings · Audit · Health · Backup
- [x] Admin tour Playwright
- [~] ช่างไม่มีรูป — แบนเนอร์ + bulk TERMINATED
- [ ] Branding preview หลัง palette ใหม่

## P5.3 Engineering Board

- [x] Kiosk `/board` โซน A–D
- [ ] ทดสอบ 1080p / 4K TV ไม่แตก layout
- [ ] PM readings โซน C รีเฟรช 60s

**เกณฑ์ผ่าน P5:** รายงานที่ลูกค้า UAT ไม่ error ว่าง · Admin ใช้จัดการ user/role ได้

---

# P6 — Deploy Production (Windows · ไม่ Docker · ไม่ Tailscale)

> แนวทาง: **D:\pm-deploy** · **PM2** (api) · **IIS** (static + proxy) · **Cloudflare Tunnel** (HTTPS ไม่เปิด 443 inbound)

## P6.1 เครื่องโรงงาน

- [ ] Node LTS + PostgreSQL (Windows Service) บน D:
- [ ] `git clone` / deploy script · `npm ci` + `build` backend + frontend
- [ ] PM2 `ecosystem.config.cjs` + `pm2 save` + startup หลัง reboot
- [ ] IIS: serve `frontend/dist` · proxy `/api` → `:4000`
- [ ] Cloudflare Tunnel → `https://pm.<domain>` (Telegram webhook)

## P6.2 Environment

- [ ] `.env` production: `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `APP_PUBLIC_URL`
- [ ] Telegram env (ถ้า P3)
- [ ] Backup DB รายวัน → `D:\pm-deploy\backups`
- [ ] ไม่ commit `.env`

## P6.3 Smoke หลัง deploy

- [ ] `GET /api/v1/health` 200
- [ ] Login · เปิด `/calendar` · `/planning`
- [ ] (P3) `getWebhookInfo` Telegram OK

**เกณฑ์ผ่าน P6:** URL เดียวกับที่ลูกค้า UAT · HTTPS · ไม่พึ่ง localhost

---

# P7 — QA ภายใน + Handoff ชีต UAT

## P7.1 ทดสอบอัตomatic

- [ ] `cd PM-Pepsi-App/backend && npm test`
- [ ] `cd PM-Pepsi-App/frontend && npm run build`
- [ ] `npm run test:e2e:smoke` (ถ้า env พร้อม)
- [ ] `npm run audit:ui`

## P7.2 เอกสารก่อนส่งลูกค้า

- [ ] อัปเดต [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md) — รูปหลัง PM · Telegram · ภาษา EN default
- [x] สร้าง **UAT รอบ 3** — [`UAT-ROUND-3-TH.md`](customer-requirements/UAT-ROUND-3-TH.md) (+ `.docx`):
  - [ ] ใส่ URL · commit · วันที่ · บัญชีทดสอบ
  - [ ] เพิ่ม § Telegram (ถ้า P3)
  - [ ] แก้ Confirm: **รูปหลัง PM เท่านั้น**
  - [ ] ลบ/แก้ scope ที่ปิดแล้ว (Line Calendar ฯลฯ)
- [ ] Export Word/PDF สำหรับลูกค้ากรอก
- [x] [`E2E-TEST-DETAILED-TH.docx`](customer-requirements/E2E-TEST-DETAILED-TH.docx) — E2E Playwright
- [x] [`TEST-CASE-SCENARIO-DETAILED-TH.docx`](customer-requirements/TEST-CASE-SCENARIO-DETAILED-TH.docx) — Test Case Scenario
- [x] [`SECURITY-DETAILED-TH.docx`](customer-requirements/SECURITY-DETAILED-TH.docx) — Security & Cybersecurity

## P7.3 ส่งมอบ

- [ ] ส่ง URL + บัญชีทดสอบ + ไฟล์ SAP ตัวอย่าง
- [ ] ประชุม kickoff UAT 30 นาที (flow A1–A10)
- [ ] ช่องรับ feedback ใน §E–F ชีต UAT

**เกณฑ์ผ่าน P7:** ลูกค้าได้ชีต UAT พร้อมกรอก · ระบบบน URL จริง · ทีม dev ไม่มี P0 blocker ค้าง

---

## ลำดับทำงานแนะนำ (ทีม dev)

| สัปดาห์ | โฟกัส | Phase |
|---------|--------|-------|
| 1 | Import SAP จริง + migration DB โรงงาน | P0 |
| 2 | Flow P1-A1–A10 บน staging · แก้ blocker | P1 |
| 3 | PM ฟอร์มกระดาษ + `/pm-vibration` | P2 |
| 4 | ไล่ UI — **ใช้ [`PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md)** | U4 |
| 5 | Telegram ops + deploy Windows | P3 + P6 |
| 6 | QA + เขียนชีต UAT | P7 |

**ไล่ทีละหน้า UI:** [`PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md) §U4d — เริ่มที่ `/planning`

---

## แมปเอกสารอ้างอิง

| เอกสาร | ใช้เมื่อ |
|--------|---------|
| [`WORK-PHASES.md`](WORK-PHASES.md) | Phase 0–8 เดิม (parity + SAP) |
| [`PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md) | **U4 UI ก่อน UAT** — ไล่ทีละหน้า · popup · motion |
| [`UI-POLISH-PHASES.md`](customer-requirements/UI-POLISH-PHASES.md) | U0–U3 ปิดแล้ว · U4 → PRE-UAT-UI-PHASES |
| [`TELEGRAM-IMPLEMENTATION-CHECKLIST.md`](customer-requirements/TELEGRAM-IMPLEMENTATION-CHECKLIST.md) | รายละเอียด Telegram §A–H |
| [`UAT-ROUND-3-TH.md`](customer-requirements/UAT-ROUND-3-TH.md) | **ชีต UAT go-live รอบ 3** (ส่งลูกค้าเมื่อ P7 ผ่าน) |
| [`UAT-ROUND-2-TH.md`](customer-requirements/UAT-ROUND-2-TH.md) | ชีต UAT รอบ 2 (อ้างอิง PM manual ละเอียด) |
| [`MEETING-SUMMARY-REQUIREMENTS.md`](customer-requirements/MEETING-SUMMARY-REQUIREMENTS.md) | requirement ประชุม |
| [`LEGACY-ISSUES-CHECKLIST.md`](customer-requirements/LEGACY-ISSUES-CHECKLIST.md) | regression ระบบเก่า |
| [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md) | คู่มือผู้ใช้ |
| [`TEST-CASE-SCENARIO-DETAILED-TH.docx`](customer-requirements/TEST-CASE-SCENARIO-DETAILED-TH.docx) | Manual/UAT test scenarios |
| [`E2E-TEST-DETAILED-TH.docx`](customer-requirements/E2E-TEST-DETAILED-TH.docx) | Playwright E2E catalog |
| [`SECURITY-DETAILED-TH.docx`](customer-requirements/SECURITY-DETAILED-TH.docx) | Security go-live checklist |
| [`INSTALL-DEPLOY-RUNBOOK-TH.docx`](customer-requirements/INSTALL-DEPLOY-RUNBOOK-TH.docx) | Deploy P6 · Runbook IT |
| [`SETUP-NEW-MACHINE.md`](SETUP-NEW-MACHINE.md) | ติดตั้ง dev/UAT (Markdown ละเอียด) |

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-06-09 | สร้าง Master ก่อน UAT — รวม P0–P7 · U4 UI · Deploy Windows · รูปหลัง PM · Telegram |
