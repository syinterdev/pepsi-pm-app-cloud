# แผน Phase การทำงานและ Checklist

> **ใช้ไฟล์นี้เป็นหลัก** สำหรับงานที่เหลือหลัง parity แกน (ขั้น 0–4 ใน [`parity-pending/CHECKLIST-ORDER.md`](parity-pending/CHECKLIST-ORDER.md))  
> รวม: ลูกค้า (`from customer/`, ประชุม 1–2), SAP integration, UX ระบบเก่า

> **ก่อนส่ง UAT ลูกค้า:** ใช้ checklist รวม [`PRE-UAT-MASTER-PHASES.md`](PRE-UAT-MASTER-PHASES.md) (P0–P7 · UI U4 · Deploy · Telegram)

**คู่มือผู้ใช้ (ภาษาไทย ครบทุกหน้า):** [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md)

**Workflow AI (Superpowers):** [`SUPERPOWERS-PM-APP.md`](SUPERPOWERS-PM-APP.md) · [`AGENTS.md`](../AGENTS.md)

**อัปเดต:** 2026-05-22

---

## หลักการข้าม Phase — รูปภาพเก็บใน Database

ระบบ PM-Pepsi-App **ไม่เก็บรูปบนดิสก์แบบ PHP** (`imgMember/`, โฟลเดอร์ upload แยก) — อัปโหลดแล้วเก็บใน **PostgreSQL** แล้วแสดงผ่าน API (cookie auth)

| ประเภทรูป | ตาราง / setting | รูปแบบเก็บ | API แสดงผล | Phase | สถานะ |
|-----------|-----------------|------------|------------|-------|--------|
| **รูปช่าง** (Eng Utilization, Manhours, โปรไฟล์) | `app.tbworkcenter` | `imgmember_data` BYTEA (WebP) | `GET /api/v1/personnel/:idwkctr/image` | 4 · 7 | [x] ทำแล้ว |
| **โลโก้ / Favicon** (Admin Branding) | `app.tbl_setting` | `app.logo_bytes` / `app.favicon_bytes` (jsonb) | settings public + admin | 8 | [x] ทำแล้ว |
| **รูป WO Confirm** (Before/After ~5 ใบ) | `app.tbconfirmimg` | `img_data` BYTEA (WebP) · fallback ไฟล์ legacy | `GET .../images/:idcimg/data` (DB ก่อน) | **6** | [x] แหล่งจริงใน DB |
| นำเข้ารูปเก่าจาก PHP | `imgMember/*.jpg` | — | script one-off หรือ Admin อัปทีละคน | 2 · 6 | [ ] ตามข้อมูลลูกค้า |

**งานที่ทำไปพร้อม Phase (ไม่แยกรอบ):**

- อัปโหลดรูปช่างที่ **Admin → Users** (`POST .../personnel/admin/:id/image`) — แปลง WebP 600px ก่อน INSERT
- หน้า **Eng Utilization** (`/summary-weekly`) — กริดรายคนพร้อมรูปจาก DB · แถบเตือน + กรอง **ไม่มีรูป**
- หน้า **Manhours Performance** — รูปกลางการ์ดจาก API เดียวกัน

**เกณฑ์ผ่าน (รูปใน DB):** ไม่มี flow production ที่พึ่ง path ไฟล์บนเซิร์ฟร์ (ยกเว้น archive integration ชั่วคราว) · backup DB ครอบรูป · เอกสาร [`customer-requirements/ENG-UTILIZATION-2026.md`](customer-requirements/ENG-UTILIZATION-2026.md)

---

## ภาพรวม Phase (เรียงตามความสำคัญ)

```text
[✅ Phase 0]  Integration hub (export CSV, watch folder, /integration)
       ↓
[⏳ Phase 1]  P0 — Parser SAP ALV (IW37N + Confirm IN)     ← บล็อกข้อมูลทั้งระบบ
       ↓
[  ] Phase 2]  P0 — ข้อมูลเข้า DB + UAT import/ปฏิทิน
       ↓
[~] Phase 3]  P1 — Bulk งาน (Team A/B, Mass Confirm 44)     ← โค้ด ✅ · UAT หลังมี WO ใน DB
       ↓
[~] Phase 4]  P1 — ปฏิทิน/WO: สรุป real-time + filter ไม่หาย  ← โค้ด ✅ · UAT Eng Util หลัง manhour+confirm
       ↓
[  ] Phase 5]  P1 — สถานะ REL/Confirm/Create + validation upload
       ↓
[~] Phase 6]  P2 — Confirm รูปใน DB + QC ก่อน dashboard (รูป/QC หลักเสร็จ · Export หลัง mass confirm ค้าง)
       ↓
[  ] Phase 7]  P2 — รายงาน/Audit/Revision log
       ↓
[  ] Phase 8]  P3 — Deploy production + Telegram/Board (ถ้าต้องการ)
```

**หลักการ:** ไม่เริ่ม Phase 3–4 จนกว่า Phase 1–2 ผ่าน UAT กับไฟล์ลูกค้าจริง

---

## Checklist สรุป (ติ๊กตาม Phase)

### Phase 0 — Integration แกน (ทำแล้ว)

- [x] `GET /api/v1/confirmation/export.csv` + ปุ่มดาวน์โหลด SAP
- [x] หน้า `/integration` (IW37N · Confirm IN · Confirm OUT · Jobs · คู่มือ)
- [x] Migration `075` — `integration_job` + scan `inbound/iw37n`
- [x] Migration `076` — scan `inbound/confirm`
- [x] Scheduler / `POST /integration/jobs/run` / `npm run integration:watch`
- [x] เอกสาร [`parity-pending/15-sap-csv-integration.md`](parity-pending/15-sap-csv-integration.md) Phase 1–4

### Phase 1 — P0 Parser SAP ALV

- [x] Auto-detect layout: **SAP ALV** vs **legacy header** (IW37N)
- [x] Implement `sap_alv` ใน `iw37n-parser.ts` (header row + col offset +2, Excel serial dates)
- [x] Unit test (`iw37n-parser.test.ts`) + probe `IW37N ล่าสุด.xlsx` → **1163 แถว**
- [x] Auto-detect + `sap_alv_confirm` ใน `confirmation-import.ts`
- [x] Unit test (`confirmation-import.test.ts`) + probe `AcZB02` → **~749 OK**
- [x] `Confirm WO.xls` — **ไม่ใช่ legacy M_Confirm** แต่เป็น **SAP ALV** (มี Dynamic List Display) → **49/49 OK**
- [x] อัปเดต [`customer-requirements/SAP-SAMPLE-PROBE.md`](customer-requirements/SAP-SAMPLE-PROBE.md)
- [x] อัปเดต §13 ใน `15-sap-csv-integration.md`

**เกณฑ์ผ่าน Phase 1:** Import ไฟล์ 2 ไฟล์หลักจาก `from customer/` ได้ inserted > 0 และ error ไม่ใช่แถว header ทั้งก้อน

### Phase 2 — P0 ข้อมูล + UAT เส้นทาง SAP ⏳ **ถัดไป**

- [x] รัน migration **`075_integration_job.sql`**, **`076_integration_confirm_in.sql`** บน DB เป้าหมาย ✅ (รายงานแล้ว)
- [x] โฟลเดอร์ `backend/data/integration/` + ทดสอบ drop ไฟล์ IW37N ✅ (job #15 · archive `2026-05/`)
- [ ] UAT: อัปโหลดมือที่ `/integration` → batch log แถว insert/update  
  - **IW37N:** แท็บ IW37N · ใช้ `IW37N ล่าสุด.xlsx` (ไม่ใช่ `IW37N.xlsx` ซ้ำ SHA) · ต้องเห็น `inserted`/`updated` ไม่ใช่ `skipped` ทั้งก้อน  
  - **อย่า** อัป `AcZB02…` ที่แท็บ IW37N — ใช้แท็บ **CONFIRM_IN**  
  - ทดสอบ API เดียวกัน: `cd PM-Pepsi-App/backend && npx tsx scripts/phase2-uat.ts --reset` → batch ใหม่ ~1163 `inserted`  
  - สถานะล่าสุด (2026-05-22): อัปที่ `/iw37n` ได้ batch #6–#8 แต่ **skipped/duplicate** — ยังไม่ติ๊กผ่านจนกว่าจะ import ครั้งแรกสำเร็จบน `/integration`
- [ ] UAT: watch `inbound/confirm` กับ `AcZB02,ZB05-Done.xlsx`  
  - วางไฟล์ใน `backend/data/integration/inbound/confirm/` → `/integration` แท็บ Job → **Run scan** (หรือ `npm run integration:watch`)  
  - **ต้อง import IW37N ชุดเดียวกับ Confirm ก่อน** — `IW37N ล่าสุด` กับ `AcZB02` ไม่มีเลข WO ตรงกัน (confirm → skip 749, insert 0)  
  - สำหรับ UAT ผ่าน: ใช้คู่ export SAP เดียวกัน หรือ `Confirm WO.xls` หลัง IW37N ที่มี WO ตรงกัน
- [ ] UAT: `/calendar` แสดง WO หลัง import (ไม่ว่างเมื่อมีข้อมูล)  
  - ข้อมูล SAP มักไม่ใช่ปีปัจจุบัน — ใช้ **dropdown ปี/เดือน** เหนือปฏิทิน (ไม่ต้องกดลูกศรทีละเดือน) หรือปุ่ม **ไป ม.ค. 2020**  
  - หลัง import `IW37N May-Jun.xls` (batch #11 · ~2559 แถว) — เลือกปี **2020** เดือน **พ.ค.–มิ.ย.**  
  - ถ้า `tbiw37n` มี 1163 แถวแต่ปฏิทินว่าง: ตรวจ `functionalloc` ต้องมี **`7151`** (filter โรงงาน) — ไฟล์ตัวอย่างมีค่าเช่น `ENGINEERING BUILDING` ไม่ผ่าน filter → ต้องแก้แมปคอลัมน์/ข้อมูล SAP กับลูกค้า
- [ ] UAT: `/work-orders` มีแถวตาม filter  
  - ตั้งช่วงวันที่ให้ครอบข้อมูล import (เช่น 2020-01-01 … 2020-04-30)  
  - กรอง Type **ZB02** — ใน DB มี ~649 แถวหลัง import ล่าสุด (ถ้า filter 7151 ผ่าน)  
  - Regression แยกที่บรรทัดถัดไป (กรองแล้วข้อมูลไม่หาย)
- [ ] UAT: Export Confirm CSV เปิดใน Excel ได้ · คอลัมน์ตรง SAP  
  - `/confirmation` หรือ `/integration` แท็บ CONFIRM_OUT → Download CSV  
  - Header ตรง SAP: `Comfirmation`, `Order`, `Start date Exe.`, `Wrk Ctr`, … (ทดสอบ unit แล้ว)  
  - แถว export ต้องมี WO ใน `view_exportconfirm` สถานะ **CRTD/REL** + มีข้อมูลใน `tbcofirm` หลัง Confirm IN สำเร็จ
- [x] Regression: กรอง Type (เช่น ZB02) **ไม่ทำให้ข้อมูลหาย** ([LEGACY B.2](customer-requirements/LEGACY-ISSUES-CHECKLIST.md)) — API test `wktype-filter-regression.test.ts` ผ่าน (พ.ค.–มิ.ย. 2020: WO ZB02>0, ปฏิทินมิ.ย. ZB02>0) · UAT มือ: เลือกปี **2020** + Type ZB02 แล้วกด Search
- [ ] บันทึกผล UAT ใน [`parity-pending/CHECKLIST-ORDER.md`](parity-pending/CHECKLIST-ORDER.md) ขั้นที่ 5
- [ ] **รูปช่างใน DB:** อัปโหลดรูปตัวอย่าง ≥1 คนที่ Admin → Users — ตรวจ `GET /api/v1/personnel/:id/image` เปิดได้ (ไม่พึ่ง `imgMember/`)

**เกณฑ์ผ่าน Phase 2:** ลูกค้าหรือทีม UAT ยืนยัน “นำเข้า SAP แล้วเห็นในปฏิทิน/ตาราง WO” · รูปช่างที่ใช้ในรายงานอยู่ใน DB แล้วอย่างน้อยชุดทดสอบ

### Phase 3 — P1 Bulk งาน (ประชุม + ระบบเก่า)

- [x] API `PATCH` หรือ `POST` batch เปลี่ยน `team` หลาย `idiw37n` ครั้งเดียว — `PATCH /api/v1/work-orders/team/batch` · สูงสุด 100 ids · `patchWorkOrderTeamBatch()` · test `work-order-team-batch.test.ts`
- [x] UI `/work-orders`: เลือกทั้งหน้า (เช่น 50 แถว) · radio Team A/B · ปุ่ม **Save ครั้งเดียว** — checkbox ทั้งหน้า · `บันทึกทีมครั้งเดียว` → `PATCH /api/v1/work-orders/team/batch`
- [x] ลบ/ไม่ใช้ popup สำเร็จทีละ WO ([LEGACY B.4](customer-requirements/LEGACY-ISSUES-CHECKLIST.md)) — toast เดียวต่อ batch
- [x] API/UI **Mass Confirm** — หลายรายการต่อ batch (อ้างอิง SAP **max confirm 44**) — `POST /api/v1/confirmation/closes/batch` · `/personnel/confirm` + `/confirmation` · สูงสุด 44
- [x] จำกัด batch size **44** ([MEETING-MINUTES](customer-requirements/MEETING-MINUTES.md)) — Zod `max(44)` · service `assertMassConfirmBatchSize` · UI เลือกไม่เกิน 44 · API `BATCH_SIZE_EXCEEDED`
- [x] Audit log สำหรับ bulk team / bulk confirm — `work-orders.team.batch` · `confirmation.mass_close` · `before`/`after` + `message` · ดูที่ Admin → Audit (กรอง Work orders / Confirmation)

**เกณฑ์ผ่าน Phase 3:** Assign ทีมทั้งหน้า + confirm หลายใบโดยไม่กด OK ทีละรายการ

### Phase 4 — P1 ปฏิทิน / WO UX + Eng Utilization

- [x] `FilterDetailSummary` อัปเดต **ทันที** เมื่อเปลี่ยน team ([LEGACY B.4c](customer-requirements/LEGACY-ISSUES-CHECKLIST.md)) — `applyPendingTeamToFilterDetail` บน `/work-orders` · badge live preview · `keepPreviousData` หลัง Save
- [x] **Eng Utilization** — กราฟ/กริดรายคนตาม [`Eng Utilization 2026.xlsx`](../new%20file/Eng%20Utilization%202026.xlsx) · ข้อมูลจาก DB · ช่วง รายวัน/สัปดาห์/เดือน/ปี — [`ENG-UTILIZATION-2026.md`](customer-requirements/ENG-UTILIZATION-2026.md)
- [x] **รูปช่างในกราฟ** — `EngUtilizationTeamGrid` + `imgmember_data` · ไม่มีรูป → ตัวอักษรย่อ + ลิงก์ Admin
- [ ] UAT Eng Utilization: เปรียบตัวเลข 1–2 แถวกับ Excel (ช่วงวันใกล้เคียง) หลังมี manhour + confirm ใน DB
- [x] กล่องสรุปบน `/calendar`: WorkOrder count, **Completion % + จำนวน WO ปิด**, TeamA/B Work — `POST /api/v1/calendar/filter-detail` + `FilterDetailSummary` ([LEGACY B.1](customer-requirements/LEGACY-ISSUES-CHECKLIST.md))
- [x] `WorkOrderDetailDialog`: `initialTab="task-list"` เมื่อเปิดจาก `/work-orders` และ `/plan-calendar` ([LEGACY B.4d](customer-requirements/LEGACY-ISSUES-CHECKLIST.md))
- [x] หลัง confirm ปิดงาน: แท็บ/ลิงก์ดูรูป+เวลาใน WO — แถบสรุป + ปุ่มใน `WorkOrderDetailDialog` · ลิงก์ `/confirmation` ([LEGACY A.2](customer-requirements/LEGACY-ISSUES-CHECKLIST.md))
- [x] แผนสีเขียว (TECO/ปิดแล้ว) **ห้าม Move** — API 409 + ปิด drag บนปฏิทิน ([LEGACY A.1](customer-requirements/LEGACY-ISSUES-CHECKLIST.md))

**เกณฑ์ผ่าน Phase 4:** ลูกค้าทดสอบ flow assign + ดู task ใน modal ตรง screenshot requirement

### Phase 5 — P1 สถานะและ validation

- [x] แสดงสถานะ **REL / Confirm / Create** ใน UI ชัด — `WoPmPhaseBadge` + legend บน `/work-orders`, `/calendar`, modal WO ([MEETING ครั้งที่ 2](customer-requirements/MEETING-MINUTES.md))
- [x] ประเภทงาน **ZD01/ZD02/ZD05** (ประชุมลูกค้า ครั้งที่ 2) — แมป IW37N **ZB** ใน filter/type · [WKTYPE-ZD-ZB-MAPPING.md](customer-requirements/WKTYPE-ZD-ZB-MAPPING.md)
- [x] หน้า import IW37N: สรุป error ก่อน commit · manual review — `POST /iw37n/import/preview` + `Iw37nImportReviewPanel` ([MEETING วาระ 3](customer-requirements/MEETING-MINUTES.md))
- [x] กันข้อมูลซ้ำ (SHA256 batch มีแล้ว) · แสดงข้อความเมื่อไฟล์ซ้ำ — preview/commit toast + `Iw37nImportReviewPanel` + ป้าย「ซ้ำ」ใน `/integration` และ `/iw37n`
- [x] เอกสารรอบ SAP 07:00/19:00: อธิบายว่า watch + upload ใช้ได้นอกรอบ — [SAP-SCHEDULE-AND-WORK-HOURS.md](customer-requirements/SAP-SCHEDULE-AND-WORK-HOURS.md) (แยกจากกฎเข้างาน 7:00–15:30 / OT Pepsi)

### Phase 6 — P2 Confirmation รูปใน DB + QC

- [x] Migration: `tbconfirmimg.img_data` BYTEA (+ mime) — `079_tbconfirmimg_img_data.sql` · **เลิก** `data/confirmation-images/` / `uploads/confirm-images` เป็นแหล่งจริง
- [x] อัปโหลด WO: `convertConfirmImageToWebp` → INSERT `img_data` (ไม่เขียนดิสก์) · script `scripts/migrate-confirm-images-to-db.ts` สำหรับรูปเก่า
- [x] `GET /api/v1/confirmation/images/:idcimg/data` — อ่าน `img_data` ก่อน · fallback ไฟล์ legacy
- [x] Before/After + อัปโหลดหลายรูปต่อฝั่ง · `img_phase` / `img_comment` migration `077` · UI `ConfirmationImagesPanel` (รับ `image/*` · เก็บ WebP)
- [x] ยืนยันจำนวนสูงสุดกับลูกค้า — **ไม่จำกัดจำนวน** · แนะนำ ~5/ฝั่งใน UI เท่านั้น — [CONFIRM-IMAGE-LIMITS.md](customer-requirements/CONFIRM-IMAGE-LIMITS.md)
- [x] Flow Admin ตรวจก่อนอัปเดตสถานะ/dashboard — `confirm_qc_status` · API QC · คิว `/confirmation` · แผงใน modal WO
- [x] Export Confirm หลัง mass confirm ครบชุด — `MassConfirmExportPanel` · `POST export/mass-summary` · `POST qc/approve-batch` · export `?idiw37n=`
- [ ] (ถ้ามี) script ย้ายรูปเก่าจาก `sap/imgMember/` → `tbworkcenter.imgmember_data`

### Phase 7 — P2 รายงาน / Audit

- [~] Weekly report สอดคล้องข้อมูลหลัง import ([MEETING ครั้งที่ 1 §1](customer-requirements/MEETING-MINUTES.md)) — PM=**ZB02** · Reactive=ZB01/ZB05 · `importCoverage` + ปุ่มช่วง SAP บน `/summary-weekly` · UAT เทียบ Excel หลัง Phase 2
- [~] Activity log ครบฟิลด์ + Week-to-Week UI — **[x]** คอลัมน์ครบ + W2W บน `/activity-log` · UAT เทียบ Excel ลูกค้ายังค้าง
- [x] Eng Utilization `/summary-weekly` — ข้อมูล live จาก DB (ไม่ import Excel ทุกครั้ง)
- [~] Utilization ใน `/manhours-hr` ตรวจกับข้อมูลจริง — Confirm÷HR จาก `view_exportconfirm` + `tbmanhours` · ตัวกรองวันที่ · เทียบ `M_manhour_chart_performance`
- [~] Admin: ช่างที่โผล่ใน Eng Utilization **ไม่มีรูป** ต้องปิดที่ Users ก่อน go-live — แบนเนอร์ + bulk TERMINATED ที่ `/admin/users` · Eng Util กรองเฉพาะ workstatus ใช้งาน · ปุ่มกรอง **ไม่มีรูป**
- [~] Auditor-friendly view / revision history — Phase A: `/reports/audit` (Planner+`reports.read`) · retention **365 วัน** · [AUDITOR-REVISION-PLAN.md](customer-requirements/AUDITOR-REVISION-PLAN.md) · Phase B/C ค้าง
- [x] แก้ task list: หลัง Save **ค้างหน้าเดิม** — `/master-data?entity=tasklist` · แก้แล้วค้าง dialog+แถว · scroll · WO modal ไม่รีเซ็ตแท็บ ([LEGACY A.3](customer-requirements/LEGACY-ISSUES-CHECKLIST.md))

### Phase 8 — P3 Production และช่องทางเสริม

- [ ] Deploy: [`from customer/server/DOCKER_AND_TAILSCALE.md`](from%20customer/server/DOCKER_AND_TAILSCALE.md) · [`13-deploy-offline.md`](parity-pending/13-deploy-offline.md)
- [ ] SFTP/email drop (ops) — `15-sap-csv` Phase 5
- [ ] Telegram แจ้งเตือน (ถ้า scope)
- [~] Engineering Board / kiosk display — `/board` · KPI + Eng Util + Week-to-Week · [ENGINEERING-BOARD.md](customer-requirements/ENGINEERING-BOARD.md)
- [x] Admin: Playwright tour · `npm test` ครบ ([`14-administrator.md`](parity-pending/14-administrator.md)) — custom Joyride tooltip · Vitest แยก `e2e/` · [`ADMIN-TOUR-E2E.md`](customer-requirements/ADMIN-TOUR-E2E.md) · backend `npm test` ผ่าน (wktype regression skip ถ้า DB ว่าง)

### Phase Future — นอก parity ปัจจุบัน

- [~] Machine vibration / Predictive maintenance — WO modal บันทึกค่า + กราฟ 3 แกน (`092_wo_pm_execution.sql`); predictive analytics ยังไม่มี
- [ ] Handheld แยก (`Hand held system.pptx`)

---

## รายละเอียดแต่ละ Phase

### Phase 0 — Integration แกน ✅

| งาน | ไฟล์/API หลัก | อ้างอิง |
|-----|----------------|---------|
| Export SAP CSV | `confirmation-export-csv.ts`, `/confirmation/export` | doc 15 Phase 1 |
| Watch IW37N | `integration-watch.ts`, `075_integration_job.sql` | doc 15 Phase 3 |
| Watch Confirm IN | `076_integration_confirm_in.sql` | doc 15 Phase 4 |
| UI ศูนย์กลาง | `IntegrationPage.tsx` | doc 15 Phase 2 |

---

### Phase 1 — P0 Parser SAP ALV ✅ **IW37N + Confirm IN**

| ลำดับ | งาน | ไฟล์ |
|------|-----|------|
| 1.1 | Detect ALV จากแถว 1 (`Dynamic List Display`) | `iw37n-parser.ts` |
| 1.2 | แมปคอลัมน์ ALV (Order idx+2, OpAc, …) | `iw37n-parser.ts`, เทียบ `M_iw37n.php` |
| 1.3 | Detect + parse Confirm ALV (header แถว 4) | `confirmation-import.ts` |
| 1.4 | Tests | `iw37n-parser.test.ts`, confirm import test |
| 1.5 | รัน `inspect-*-sample.ts` ซ้ำ → บันทึกใน SAP-SAMPLE-PROBE | `backend/scripts/` |

**ไฟล์ทดสอบบังคับ:**

- `from customer/SAP data/Data/IW37N ล่าสุด.xlsx`
- `from customer/AcZB02,ZB05-Done.xlsx`
- `from customer/Test/IW37N (27May).xls` (legacy regression)

---

### Phase 2 — P0 UAT ข้อมูล

**DB พร้อมแล้ว (075 + 076):**

| Migration | ได้อะไร |
|-----------|---------|
| **075** | `app.integration_job` · สแกน `inbound/iw37n` · scheduler / `POST /integration/jobs/run` |
| **076** | job type **confirm IN** · สแกน `inbound/confirm` |

**ขั้นถัดไป (แนะนำลำดับ):**

1. ~~สร้างโฟลเดอร์~~ ✅ — `backend/data/integration/` (ดู `README.md` ในโฟลเดอร์)
2. ทดสอบ drop: `cd PM-Pepsi-App/backend && npm run integration:drop-test` (หรือ copy เอง → `npm run integration:watch`)
3. อัปโหลดที่ `/integration` หรือ UI แท็บ IW37N (ถ้ายังไม่มีข้อมูลใน DB)
4. ตรวจ `/calendar`, `/work-orders`, `/summary-weekly`

| ลำดับ | งาน | หน้า |
|------|-----|------|
| 2.1 | Import IW37N สำเร็จ | `/integration`, `/iw37n` |
| 2.2 | Import Confirm IN | `/integration` แท็บ Confirm IN |
| 2.3 | ปฏิทินมี event | `/calendar` |
| 2.4 | ตาราง WO + filter | `/work-orders` |
| 2.5 | รายงานมีตัวเลข | `/summary-weekly`, `/reports` |
| 2.6 | Export กลับ SAP | `/confirmation` Download CSV |

---

### Phase 3 — P1 Bulk

| ลำดับ | งาน | Backend | Frontend |
|------|-----|---------|----------|
| 3.1 | Batch team update | `work-orders.ts`, route batch | `WorkOrdersPage.tsx` |
| 3.2 | Batch confirm | `confirmation` service | `/confirmation` |
| 3.3 | Permission + audit | `audit-mutation.ts` | toast เดียวต่อ batch |

---

### Phase 4 — P1 UX ปฏิทิน/WO + Eng Utilization

| ลำดับ | งาน | หมายเหตุ |
|------|-----|----------|
| 4.1 | Optimistic / client recount Team A/B | ไม่ refresh ทั้งหน้า |
| 4.2 | Eng Utilization กริดรายคน + รูปจาก `imgmember_data` | `/summary-weekly` |
| 4.3 | Admin กรอง **ไม่มีรูป** + อัปโหลด | `/admin/users` |
| 4.4 | Calendar summary | `POST /api/v1/calendar/filter-detail` + `FilterDetailSummary` |
| 4.5 | `initialTab` ใน dialog | `task-list` บน `/work-orders`, `/plan-calendar` · `confirm` บน `/planning`, `/personnel/confirm` |

---

### Phase 6 — รูป Confirm ใน DB (รายละเอียด)

| ลำดับ | งาน | ไฟล์ |
|------|-----|------|
| 6.1 | Migration `img_data` BYTEA บน `tbconfirmimg` | `database/migrations/079_tbconfirmimg_img_data.sql` |
| 6.2 | อัปโหลด → WebP ใน DB | `confirm-image.ts`, `confirmation.ts`, `work-orders.ts` POST |
| 6.3 | อ่านรูปจาก DB | `readConfirmationImageBuffer` · GET `.../images/:idcimg/data` |
| 6.4 | Before/After + หลายรูป · แสดงใน modal หลัง confirm | [x] UI + API · BYTEA แหล่งจริง |

### Phase 5–8

ดู checklist สรุปด้านบน · รายละเอียดใน [MEETING-MINUTES.md](customer-requirements/MEETING-MINUTES.md) และ [LEGACY-ISSUES-CHECKLIST.md](customer-requirements/LEGACY-ISSUES-CHECKLIST.md)

---

## แมปเอกสารอ้างอิง

| เอกสาร | บทบาท |
|--------|--------|
| **ไฟล์นี้** | Phase + checklist งานลูกค้า/SAP/UX |
| [`parity-pending/CHECKLIST-ORDER.md`](parity-pending/CHECKLIST-ORDER.md) | ย้าย PHP แกน 0–4 · UAT ขั้น 5 |
| [`parity-pending/15-sap-csv-integration.md`](parity-pending/15-sap-csv-integration.md) | สัญญาไฟล์ SAP · integration |
| [`customer-requirements/`](customer-requirements/) | ลูกค้า · ประชุม · probe · legacy · Eng Utilization |
| [`customer-requirements/AUTOMATION-DESIGN.md`](customer-requirements/AUTOMATION-DESIGN.md) | ออกแบบระบบ Auto (watch · outbound · scheduler · SFTP) |
| [`customer-requirements/AUTOMATION-PHASES.md`](customer-requirements/AUTOMATION-PHASES.md) | **Phase A0–A5 + checklist** ระบบ Automation (ติ๊กงาน) |
| [`customer-requirements/UI-POLISH-PHASES.md`](customer-requirements/UI-POLISH-PHASES.md) | **Phase U0–U3 + checklist** ปรับ UI สวย/ทันสมัยทุกหน้า |
| [`customer-requirements/UI-DESIGN-TOKENS.md`](customer-requirements/UI-DESIGN-TOKENS.md) | สรุป CSS `--brand-pepsi-*` · `--app-*` · `--sb-menu-*` · `--admin-*` |
| หลักการ **รูปใน DB** | ตารางด้านบนในไฟล์นี้ — ทำคู่ Phase 4 / 6 / 7 |
| [`parity-pending/PLAN.md`](parity-pending/PLAN.md) | สแกน PHP 241 ไฟล์ |

---

## สรุป: ทำอะไรวันนี้?

| ลำดับ | Phase | สถานะ |
|------|-------|--------|
| 0 | Integration hub | ✅ |
| **1** | **Parser SAP ALV** | **✅** |
| **2** | **UAT ข้อมูล** | **⏳** migration 075/076 ✅ · รอ import + ตรวจหน้า |
| 3–4 | Bulk + UX | **โค้ด ~ครบ** · UAT หลัง Phase 2 |
| **Auto** | ระบบใหม่ A0–A5 | [`AUTOMATION-PHASES.md`](customer-requirements/AUTOMATION-PHASES.md) — **A1 ถัดไป** |
| **UI** | สวย/ทันสมัย U0–U3 | [`UI-POLISH-PHASES.md`](customer-requirements/UI-POLISH-PHASES.md) — ~35 หน้า · คู่ [`skill-theme.md`](../skill-theme.md) |
| 5–7 | สถานะ · Confirm QC · Reports | ต่อเนื่อง |
| 8 | Deploy / Telegram | ก่อน go-live |

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-22 | [`UI-POLISH-PHASES.md`](customer-requirements/UI-POLISH-PHASES.md) — Phase U0–U3 checklist UI ทุกหน้า |
| 2026-05-22 | [`AUTOMATION-PHASES.md`](customer-requirements/AUTOMATION-PHASES.md) — Phase A0–A5 + checklist ระบบใหม่ |
| 2026-05-22 | เอกสาร [`AUTOMATION-DESIGN.md`](customer-requirements/AUTOMATION-DESIGN.md) — แผน Auto 4 ชั้น · CONFIRM_OUT scheduler · SFTP |
| 2026-05-22 | LEGACY A.1: แผน TECO/ปิดแล้ว ห้าม Move — `canMovePlan` + drag ปิด + API 409 |
| 2026-05-22 | Phase 4 B.1: กล่องสรุป `/calendar` — `POST /api/v1/calendar/filter-detail` + `FilterDetailSummary` |
| 2026-05-22 | หลักการ **รูปทั้งหมดใน DB** + checklist Phase 4/6/7 (Eng Utilization รูปช่าง ✅ · Confirm WO รอ migrate) |
| 2026-05-22 | Phase 2: โฟลเดอร์ integration + drop IW37N ทดสอบ (`integration-drop-test.ts`) |
| 2026-05-22 | Phase 2: บันทึก migration 075/076 รันบน DB เป้าหมายแล้ว |
| 2026-05-22 | Phase 7: Manhour HR Utilization (Confirm/HR) + ช่วงวันที่บน `/manhours-hr` |
| 2026-05-22 | Phase 7: Activity log (คน/Line/เวลา) + Week-to-Week บน `/reports` |
| 2026-05-22 | Phase 7: Weekly report — PM ZB02, `importCoverage` API/UI หลัง import SAP |
| 2026-05-22 | Phase 1 parser IW37N + Confirm ALV เสร็จ |
| 2026-05-21 | สร้างแผน Phase 0–8 + checklist รวมลูกค้า/ประชุม/SAP/legacy |
