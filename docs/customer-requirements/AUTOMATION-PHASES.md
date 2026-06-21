# แผน Phase + Checklist — ระบบ Automation (PM-Pepsi-App)

> **ใช้ไฟล์นี้เป็นหลัก** สำหรับงาน “ระบบใหม่แบบ Auto” (ไฟล์ SAP ↔ DB ↔ โฟลเดอร์ ↔ scheduler)  
> ออกแบบ: [`AUTOMATION-DESIGN.md`](AUTOMATION-DESIGN.md) · แผนรวมแอป: [`WORK-PHASES.md`](../WORK-PHASES.md) · สัญญาไฟล์: [`15-sap-csv-integration.md`](../parity-pending/15-sap-csv-integration.md)

**อัปเดต:** 2026-05-22

---

## ภาพรวม Phase

```text
[✅ A0] Foundation     — Integration hub · watch · job · parser
       ↓
[⏳ A1] Data ready     — ข้อมูล SAP ใน DB ผ่าน UAT (บล็อก Auto ถัดไป)
       ↓
[  ] A2] Inbound+      — stable file · แจ้ง fail · peak scan 07/19
       ↓
[  ] A3] Outbound loop — CONFIRM_OUT → outbound/ · cron · หลัง mass confirm
       ↓
[  ] A4] Production I/O — SFTP/share · service · go-live
       ↓
[  ] A5] Smart ops     — Telegram · retry · dashboard · banner ข้อมูลใหม่
```

**หลักการ:** ไม่เริ่ม **A2–A5** จนกว่า **A1** ผ่าน (มี WO ในปฏิทิน/WO จาก import จริง)

---

## ตารางสรุป

| Phase | ชื่อ | สถานะ | เกณฑ์ผ่านสั้นๆ |
|-------|------|--------|----------------|
| **A0** | Foundation | ✅ | Watch รันได้ · job log · parser ALV |
| **A1** | Data ready | ⏳ | Import IW37N+Confirm คู่กัน · calendar/WO ไม่ว่าง |
| **A2** | Inbound+ | [ ] | ไฟล์วางแล้วเข้า DB เอง · fail มีแจ้งเตือน |
| **A3** | Outbound loop | [ ] | CSV ออก `outbound/confirm` ตามเวลา/เหตุการณ์ |
| **A4** | Production I/O | [ ] | SFTP ↔ โฟลเดอร์ · deploy doc ครบ |
| **A5** | Smart ops | [ ] | Admin เห็นสถานะ · Telegram เมื่อ job fail |

---

## Checklist ตาม Phase

### Phase A0 — Foundation (ทำแล้ว)

**โฟลเดอร์ & DB**

- [x] โครง `backend/data/integration/` — `inbound/iw37n`, `inbound/confirm`, `outbound/confirm`, `archive/`, `error/`
- [x] Migration `075_integration_job.sql` — ตาราง `app.integration_job`
- [x] Migration `076_integration_confirm_in.sql` — scan confirm inbound
- [x] README dev: `backend/data/integration/README.md`

**Backend**

- [x] `integration-watch.ts` — import IW37N + Confirm IN → archive/error
- [x] `integration-scheduler.ts` — interval จาก `tbl_setting`
- [x] `integration-lock.ts` — ไม่รัน job ซ้อน
- [x] `POST /api/v1/integration/jobs/run` · `GET .../status` · `GET .../jobs`
- [x] Parser SAP ALV — IW37N + Confirm (`iw37n-parser`, `confirmation-import`)
- [x] `GET /api/v1/confirmation/export.csv` (ดาวน์โหลดมือ)
- [x] เปิด scheduler ใน `index.ts` เมื่อ `INTEGRATION_WATCH_SCHEDULER≠0`

**Frontend**

- [x] หน้า `/integration` — แท็บ IW37N · Confirm IN/OUT · Jobs · คู่มือ
- [x] Preview ก่อน commit IW37N (`Iw37nImportReviewPanel`)

**เอกสาร**

- [x] [`AUTOMATION-DESIGN.md`](AUTOMATION-DESIGN.md)
- [x] [`15-sap-csv-integration.md`](../parity-pending/15-sap-csv-integration.md) §8 pipeline

**เกณฑ์ผ่าน A0:** `npm run integration:watch` หรือ API รัน scan แล้วมี `integration_job` สถานะ `done`/`failed` พร้อม summary

---

### Phase A1 — Data ready (บล็อกอยู่ — ผูก WORK-PHASES Phase 2)

> งานนี้ = ให้ **pipeline มีข้อมูลจริง** ก่อนต่อ Auto ขั้นสูง

**Migration & โฟลเดอร์**

- [x] รัน migration 075/076 บน DB เป้าหมาย
- [x] โฟลเดอร์ integration พร้อม · ทดสอบ `integration-drop-test` / drop ไฟล์

**Import IW37N**

- [ ] UAT `/integration` แท็บ IW37N — ไฟล์ใหม่ → `inserted`/`updated` > 0 (ไม่ใช่ skipped ทั้งก้อน) — **คู่มือ:** [`AUTOMATION-A1-IW37N-UAT.md`](AUTOMATION-A1-IW37N-UAT.md)
- [x] API: `npm run uat:phase2 -- --reset` → inserted=1163 (2026-05-22 · `IW37N ล่าสุด.xlsx`)
- [ ] UI: ทำตามคู่มือหลัง `npm run uat:reset-iw37n` (ถ้าเคยอัปไฟล์เดิมแล้ว)
- [x] ตรวจ `functionalloc` มี **`7151`** — [`FACTORY-FUNCTIONALLOC-7151.md`](FACTORY-FUNCTIONALLOC-7151.md) · `npm run probe:functionalloc`  
  - **`IW37N ล่าสุด.xlsx` (ALV): 0%** — ไม่มีคอลัมน์ Functional loc. → ปฏิทิน/WO ว่าง  
  - **`IW37N May-Jun.xls` (legacy): 100%** — ใช้ไฟล์นี้สำหรับ UAT calendar/WO  
  - [ ] ตกลง layout ALV กับลูกค้า หรือแก้ parser แมปคอลัมน์จาก header
- [ ] บันทึก batch id + SHA ใน integration job

**Import Confirm IN**

- [ ] ใช้ **คู่ไฟล์ SAP ชุดเดียวกับ IW37N** (หรือ `Confirm WO.xls` หลัง IW37N ที่ WO ตรง)
- [ ] วางใน `inbound/confirm/` → Run scan → insert > 0
- [ ] **อย่า** อัป Confirm ที่แท็บ IW37N

**ตรวจหน้าแอป**

- [ ] `/calendar` — เลือกปี/เดือนตรงข้อมูล (เช่น 2020 พ.ค.–มิ.ย.) → มี event
- [ ] `/work-orders` — ช่วงวันที่ + ZB02 → มีแถว
- [ ] Export Confirm CSV — เปิดใน Excel · header ตรง SAP
- [ ] อัปโหลดรูปช่าง ≥1 ที่ Admin → Users (ทดสอบ Eng Util ภายหลัง)

**Watch (smoke)**

- [ ] วางไฟล์ใน `inbound/iw37n` โดยไม่กดอัปโหลด → ภายใน interval watch มี job ใหม่
- [ ] ไฟล์ซ้ำ SHA → skip + archive (ไม่ crash)

**เอกสาร UAT**

- [ ] บันทึกผลใน [`parity-pending/CHECKLIST-ORDER.md`](../parity-pending/CHECKLIST-ORDER.md) ขั้นที่ 5

**เกณฑ์ผ่าน A1:** ทีม/ลูกค้ายืนยัน “นำเข้า SAP แล้วเห็นในปฏิทินและ WO” · Confirm IN กับ IW37N สอดคล้อง

---

### Phase A2 — Inbound+ (หลัง A1)

**Backend**

- [ ] Stable-file: รอไฟล์เขียนจบ (เช่น 30s ไม่เปลี่ยน size) ก่อน parse
- [ ] สรุป job: แยก `skipped_duplicate` vs `skipped_no_wkorder` (Confirm IN)
- [ ] Setting `integration.sap_peak_scan` — รัน scan พิเศษ ~07:05 / ~19:05 (optional cron)
- [ ] Audit action ครบ: `integration.iw37n.in`, `integration.confirm.in` (มีแนวแล้ว — ตรวจครบทุก path)
- [ ] Unit/integration test: stable-file + error sidecar

**Frontend / UX**

- [ ] แบนเนอร์ “ข้อมูล SAP อัปเดตล่าสุด ณ …” บน `/calendar` หลัง job สำเร็จ
- [ ] `/integration` แสดงไฟล์ค้างใน inbound (count + ชื่อ)
- [ ] ปุ่มดาวน์โหลด `.error.json` จากแถว job ที่ fail

**Admin settings (`tbl_setting`)**

- [ ] เอกสารคีย์: `integration.watch_enabled`, `integration.watch_interval_minutes`
- [ ] (ถ้าเพิ่ม UI) แก้ interval จาก Admin → Settings

**เกณฑ์ผ่าน A2:** วางไฟล์ SAP แล้วไม่ต้องเปิดหน้าอัปโหลด · fail มี sidecar + เห็นใน UI ภายใน 15 นาที

---

### Phase A3 — Outbound loop (หลัง A1)

**Backend — CONFIRM_OUT อัตโนมัติ**

- [ ] Service `writeConfirmOutToOutbound(pool, opts)` — สร้าง CSV ลง `outbound/confirm/CONFIRM_OUT_*.csv`
- [ ] Archive ไป `archive/outbound/YYYY-MM/`
- [ ] `POST /api/v1/integration/confirm/export/run`
- [ ] `GET /api/v1/integration/confirm/export/latest` — metadata + path
- [ ] Audit `integration.confirm.out` + บันทึก job type `confirm_out`

**Scheduler**

- [ ] `confirm-out-scheduler.ts` — cron จาก setting (เช่น `0 18 * * *`)
- [ ] Setting: `integration.confirm_out_enabled`, `integration.confirm_out_cron`
- [ ] Env: `CONFIRM_OUT_SCHEDULER` (คล้าย `INTEGRATION_WATCH_SCHEDULER`)

**Event-driven**

- [ ] หลัง mass confirm ครบ + (optional) QC approve batch → queue export หนึ่งไฟล์
- [ ] เอกสาร flow ใน [`AUTOMATION-DESIGN.md`](AUTOMATION-DESIGN.md) §4.3

**Frontend**

- [ ] แท็บ Confirm OUT บน `/integration`: ปุ่ม **Generate to folder** · แสดงไฟล์ล่าสุดใน outbound
- [ ] ยังคงปุ่ม Download CSV มือ (fallback)

**ทดสอบ**

- [ ] Unit test ชื่อไฟล์ `confirmationExportSapCsvFilename()`
- [ ] UAT: มีแถวใน `view_exportconfirm` → ไฟล์ใน outbound เปิดใน Excel ได้
- [ ] SAP team เก็บไฟล์จากโฟลเดอร์ (หรือ copy มือใน dev)

**เกณฑ์ผ่าน A3:** ทุกวันหลังเลิกงานมีไฟล์ CONFIRM_OUT ใน outbound (หรือหลัง mass confirm) โดยไม่กดดาวน์โหลด

---

### Phase A4 — Production I/O (ก่อน go-live)

**Server & โฟลเดอร์**

- [ ] กำหนด `INTEGRATION_ROOT` บน server (นอก `git`, backup รวม)
- [ ] SMB หรือ SFTP landing → symlink/junction ไป `inbound/iw37n`, `inbound/confirm`
- [ ] SAP เก็บจาก `outbound/confirm` (read-only share ให้ SAP)
- [ ] สิทธิ์ OS: user รัน `pm-api` เขียน inbound/outbound/archive/error ได้

**Process**

- [ ] `pm-api.service` — `INTEGRATION_WATCH_SCHEDULER=1`, `CONFIRM_OUT_SCHEDULER=1`
- [ ] `BACKUP_SCHEDULER=1` (แยกจาก integration แต่ควรเปิดคู่กัน)
- [ ] Task Scheduler / cron สำรอง: peak scan 07:05, 19:05 (ถ้าไม่ใช้ in-process)

**Deploy doc**

- [ ] อัปเดต [`from customer/server/DOCKER_AND_TAILSCALE.md`](../from%20customer/server/DOCKER_AND_TAILSCALE.md) หรือ runbook ใหม่ — path + SFTP
- [ ] Runbook: ไฟล์ค้าง error/ — ใครแก้ · retry อย่างไร

**Security**

- [ ] SFTP แยก user read/write ต่อโฟลเดอร์
- [ ] ไม่ expose inbound ผ่าน HTTP สาธารณะ

**เกณฑ์ผ่าน A4:** SAP วางไฟล์ที่ share → PM ได้ภายใน N นาที · PM สร้าง outbound → SAP ดึงได้โดยไม่ login แอป

---

### Phase A5 — Smart ops (หลัง A3/A4)

**แจ้งเตือน**

- [ ] Setting `integration.notify_on_fail`
- [ ] In-app notification / toast สำหรับ role `integration.admin`
- [ ] Telegram bot (Phase 8) — ข้อความสั้น + ลิงก์ `/integration`
- [ ] (Optional) Email SMTP จาก Admin settings

**Retry & ops**

- [ ] ปุ่ม Retry job จากไฟล์ใน `error/` (คัดลอกกลับ inbound)
- [ ] `failStaleIntegrationJobs` — ตรวจ cron รายวัน
- [ ] Admin Console widget: job 5 รายการล่าสุด · inbound count · outbound ล่าสุด

**Monitoring**

- [ ] `GET /api/v1/integration/health` — inbound stuck, last success, disk space (optional)
- [ ] เอกสาร on-call: อาการ ECONNRESET / API crash → ดู terminal + audit

**เกณฑ์ผ่าน A5:** job fail ภายใน 5 นาที Admin ได้รับแจ้ง · แก้และ retry ได้โดยไม่แตะ DB มือ

---

## Checklist เปิดใช้ Auto บนเครื่อง dev (ทุกวัน)

| ขั้น | คำสั่ง / การตั้งค่า | ติ๊ก |
|------|---------------------|------|
| 1 | Backend `.env` มี `DATABASE_URL` | [ ] |
| 2 | ไม่ตั้ง `INTEGRATION_WATCH_SCHEDULER=0` | [ ] |
| 3 | `integration.watch_enabled` = true (Admin หรือ default) | [ ] |
| 4 | `pm-api` รันอยู่ (`http://127.0.0.1:4000/api/v1/health`) | [ ] |
| 5 | Frontend proxy ไป :4000 (`npm run dev`) | [ ] |
| 6 | วางไฟล์ทดสอบใน `inbound/iw37n` หรือกด Run scan ที่ `/integration` | [ ] |

---

## Checklist UAT รอบ SAP (ลูกค้า)

| # | ขั้นตอน | ผลที่คาดหวัง | [ ] |
|---|---------|--------------|-----|
| 1 | SAP ส่ง IW37N (~07:00 หรือมือ) → โฟลเดอร์/share | ไฟล์ปรากฏใน inbound | |
| 2 | รอ watch หรือ Run scan | Job `done`, inserted > 0 | |
| 3 | เปิด `/calendar` ปี/เดือนถูก | เห็น WO | |
| 4 | Assign ทีม `/work-orders` batch | Toast สำเร็จ · audit มี | |
| 5 | Mass confirm ≤44 | สถานะอัปเดต | |
| 6 | CONFIRM_OUT ใน outbound (หลัง A3) | SAP โหลด CSV ได้ | |
| 7 | แจ้ง fail ทดสอบ (ไฟล์เสีย) | error/ + แจ้ง Admin (หลัง A5) | |

---

## แมปกับ WORK-PHASES

งาน UI/ความสวยงามทุกหน้า — แยกไฟล์ [`UI-POLISH-PHASES.md`](UI-POLISH-PHASES.md) (Phase U0–U3)

| AUTOMATION-PHASES | WORK-PHASES |
|-------------------|-------------|
| A0 | Phase 0 + Phase 1 (parser) |
| A1 | Phase 2 (ข้อมูล + UAT) |
| A2–A3 | ส่วนหนึ่ง Phase 8 + 15-sap doc |
| A4 | Phase 8 Deploy |
| A5 | Phase 8 Telegram + Admin |

แอปฟีเจอร์ Bulk/UX (Phase 3–4 ใน WORK-PHASES) **โค้ดครบแล้ว** — UAT ยังรอ A1

---

## สรุป: ทำอะไรสัปดาห์นี้?

| ลำดับ | งาน |
|------|-----|
| 1 | **ปิด A1** — import IW37N+Confirm คู่กัน · ตรวจ 7151 · calendar มีงาน |
| 2 | เปิด watch ให้รันจริงทุกวัน |
| 3 | เริ่ม **A3** — CONFIRM_OUT ลงโฟลเดอร์ (ถ้า A1 ผ่าน) |
| 4 | วางแผน **A4** SFTP กับทีม infra |

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-22 | สร้างไฟล์ Phase A0–A5 + checklist dev/UAT + แมป WORK-PHASES |
