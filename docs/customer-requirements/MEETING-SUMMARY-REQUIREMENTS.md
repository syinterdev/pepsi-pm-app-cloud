# สรุปความต้องการจากการประชุมลูกค้า (สำหรับแก้งาน / UAT)

อัปเดต: **2026-06-02** (รอบ 2 — ทำทีละข้อจาก checklist ด้านล่าง)  
แหล่ง: สไลด์สรุปจากรายงานประชุม · ต้นฉบับครบใน [`MEETING-MINUTES.md`](MEETING-MINUTES.md) (ครั้งที่ 1–2, เม.ย.–พ.ค. 2569)

**โครงการ:** PM Dashboard & Monitoring System — เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง  
**ผู้พัฒนา:** เอส.วาย. อินเตอร์แอคทีฟ ดีเวลลอปเมนท์

---

## สรุปที่ทำเสร็จแล้วล่าสุด (2026-06-02)

| หัวข้อ | แมปในแอป | สถานะ | หมายเหตุ UAT |
|--------|-----------|--------|--------------|
| ปฏิทิน — ตัวกรอง 5 ชนิด | `/calendar` | **[x]** | FL · สถานะแสดงผล · ช่าง/กลุ่ม · ประเภท WO · Priority |
| ปฏิทิน — สรุปช่องวัน | `/calendar` Month view | **[x]** | `{n} WO · {h} Hrs` (แผน + confirm) |
| Assigned Job modal | คลิก WO จากปฏิทิน | **[x]** | 3 แท็บ Task / Planning / Close WO |
| Available hour (Planning) | WO modal แท็บ Planning | **[x]** | HR Manhour prorate ต่อวัน − ชม.จ่ายงาน |
| PM Comment ต่อ WO | WO modal แท็บ Task | **[x]** | `tbwo_pm_note` · Comments and Findings |
| PM ค่าวัด + กราฟ (กระแส / Vibration) | WO modal แท็บ Task | **[x]** | `tbwo_pm_reading` · กราฟเส้น 3 แกน |
| ส่งออก Excel ค่าวัด | `/pm-vibration`, WO modal | **[x]** | ไม่มีปุ่ม export บน `/board` (kiosk ดูอย่างเดียว) |
| Engineering Board — ค่าวัด PM | `/board` โซน C | **[x]** | กราฟ + สรุป · รีเฟรช 60s |
| หน้า PM ค่าวัด | `/pm-vibration` | **[~]** | Import Excel · manual แถว generic — **UI ต้องตรงฟอร์ม WO** ([`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](PM-MANUAL-ENTRY-WORK-ORDER-FORM.md)) |
| Mass Confirm 44 + team batch | `/work-orders`, `/personnel/confirm` | **[x]** | มีก่อนหน้านี้แล้ว |
| Integration IW37N / Confirm IN·OUT | `/integration`, `/iw37n`, `/confirmation` | **[x]** | แกน parity — UAT ข้อมูลจริงยัง P0 |

Migration ที่เกี่ยวข้อง: `092_wo_pm_execution.sql` · `093_pm_vibration_menu.sql`

### ความคืบหน้ารอบ 2 (ทำทีละข้อ — 2026-06-02)

| ลำดับ | ข้อใน checklist | งานที่ทำ | สถานะ |
|------|-----------------|----------|--------|
| 1 | P0 #4 · § A — ข้อความ UI รอบ SAP | แบนเนอร์ `SapUploadScheduleNote` ที่ `/integration` + `/iw37n` | **[x]** |
| 2 | P0 #1 — Import IW37N | `npm run uat:phase2 -- --reset` → inserted **1129** (ไฟล์ `IW37N ล่าสุด.xlsx`) | **[~]** ผ่าน automation · UAT มือยืนยนซ้ำ |
| 3 | P0 #3 — ปฏิทิน/WO หลัง import | แก้ bug `vo..wktype` ใน `searchWorkOrders` · calendar **495** events · WO **1127** · 7151 ใน FL **1129** | **[x]** |
| 4 | P0 #2 — Confirm IN คู่ IW37N | ทดสอบ `docs from customer/Templete IW37N…ZB02All*.xlsx` — **ทั้งคู่เป็น IW37N** ไม่ใช่ Confirm · IW37N **522 inserted** · รอไฟล์ Confirm IN จาก SAP (Order `400157xxxx`) | **[ ]** รอไฟล์ Confirm คู่ ZB02All |
| 5 | P0 #2 — IW37N template 2026 | `npm run uat:phase2-zb02all -- --reset` · ปฏิทิน **2026-5** **212** events | **[x]** · รายงานลูกค้า [`UAT-ITEM5-EXCEL-CUSTOMER-FILES.md`](UAT-ITEM5-EXCEL-CUSTOMER-FILES.md) |
| 6 | P1 — Confirm IN preview | `POST /api/v1/confirmation/import/preview` · แท็บ Confirm IN ที่ `/integration` | **[x]** |

---

## ภาพรวมหัวข้อจากสไลด์

| # | หัวข้อ | วัตถุประสงค์สั้นๆ | อ้างอิงประชุม |
|---|--------|-------------------|---------------|
| **A** | การบูรณาการข้อมูลและการจัดตารางงาน | จัดลำดับความสำคัญงานบำรุง (Task Prioritization) ต่อเนื่องจากประชุมครั้งที่ 1 | ครั้งที่ 1 §3 · ครั้งที่ 2 วาระ 3 |
| **B** | แนวทางพัฒนาระบบและรายละเอียดการดำเนินงาน | Import/Export SAP · ตรวจข้อมูลก่อนเข้า DB · ช่างไม่ถูกจำกัดแค่รอบส่งข้อมูล | ครั้งที่ 1 §3 · ครั้งที่ 2 วาระ 3 |
| **C** | Dashboard & รายงานรายสัปดาห์ | ติดตามแผน PM รายสัปดาห์ · มอบหมายงานแบบ real-time · รายงานแม่นยำ | ครั้งที่ 1 §1, §4 · ครั้งที่ 2 วาระ 2 |
| **D** | บริหารใบสั่งซ่อม · สถานะระบบ · ทรัพยากรบุคคล | ประเภท ZD01/02/05 · REL/Confirm/Create · Auto/Manual + คำนวณคน/เวลา | ครั้งที่ 2 วาระ 4 |
| **E** | Mass Confirm · Logging & Analytics | Bulk ปิดงาน · Activity log · Utilization · ปฏิทิน Order Frame | ครั้งที่ 2 วาระ 4 |
| **F** | Audit & ปรับปรุงแผนงาน | Auditor dashboard · Revision log · Comment ชดเชย SAP | ครั้งที่ 2 วาระ 4 |

---

## A) การบูรณาการข้อมูลและการจัดตารางงาน (Data Integration & Scheduling)

### วัตถุประสงค์

เพิ่มประสิทธิภาพและความคล่องตัวในการ **จัดลำดับความสำคัญงานบำรุงรักษา (Task Prioritization)** — ต่อเนื่องจากการประชุมครั้งที่ 1

### ปัญหาและข้อจำกัดเชิงเทคนิค (Current Issues)

| ปัญหา | รายละเอียด |
|--------|-------------|
| รอบส่งข้อมูลจากระบบภายนอก | ข้อมูลจาก **เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง** (ผ่าน SAP) กำหนดช่วงส่งชัดเจน: **07:00 น.** และ **19:00 น.** |
| UX ไม่สอดคล้อง | รูปแบบ Monitoring แบบเดิมในห้วงเวลานั้น **อาจไม่ตรงพฤติกรรมผู้ใช้จริง** (ช่าง/หัวหน้างานใช้งานนอกรอบ) |

**หมายเหตุสำคัญ:** รอบ **07:00 / 19:00 ของ SAP** ≠ เวลาเข้างานช่าง 7:00–15:30 — อ่าน [`SAP-SCHEDULE-AND-WORK-HOURS.md`](SAP-SCHEDULE-AND-WORK-HOURS.md)

### แมประบบ PM-Pepsi-App

| ความต้องการ | หน้า/API | สถานะปัจจุบัน | งานที่ต้องทำ |
|-------------|----------|---------------|--------------|
| Scheduling + Tracking ในระบบเดียว | `/calendar`, `/plan-calendar`, `/planning`, `/backlog` | [~] แกนมี · **filter + สรุปช่องวัน [x]** | UAT หลัง import SAP จริง ([`WORK-PHASES.md`](../WORK-PHASES.md) Phase 2) |
| ไม่ผูก UX แค่รอบ SAP | `/integration`, `/iw37n`, watch `inbound/*` | **[x]** แบนเนอร์ไทย + เอกสาร [`SAP-SCHEDULE-AND-WORK-HOURS.md`](SAP-SCHEDULE-AND-WORK-HOURS.md) | UAT มือ: ผู้ใช้อ่านแล้วเข้าใจว่าอัปได้นอก 07:00/19:00 |
| Task prioritization | filter Type (ZB02/ZD02), backlog, team A/B | [~] · **Priority filter ปฏิทิน [x]** | ยืนยันกฎลำดับความสำคัญกับลูกค้า |

---

## B) แนวทางการพัฒนาระบบและรายละเอียดการดำเนินงาน

### B.1 การพัฒนาระบบนำเข้าและส่งออกข้อมูล (Data Import/Export Interface)

พัฒนาโมดูล **นำเข้า (Import)** จากไฟล์ **Excel ที่ Export จาก SAP** เพื่อใช้:

- สร้าง **ตารางการปฏิบัติงาน (Scheduling)**
- **ติดตามสถานะงาน (Tracking)** ภายในระบบเดียว

| ช่องทาง | เส้นทาง | สถานะ | งานที่ต้องทำ |
|---------|---------|--------|--------------|
| Hub รวม SAP | `/integration` | [x] แกน | UAT ZB02All IW37N **[x]** · Confirm IN คู่ชุด — [`UAT-ZB02ALL-TEMPLATE.md`](UAT-ZB02ALL-TEMPLATE.md) |
| IW37N import | `/iw37n`, `POST .../iw37n/import` | [x] parser ALV + legacy | UAT: `ZB02All.xlsx` **522 แถว** · `npm run uat:phase2-zb02all` |
| Confirm IN | แท็บ CONFIRM_IN ที่ `/integration` | [x] parser | รอ export SAP ที่ Order ตรง ZB02All (ไม่ใช่ไฟล์ `ZB02All 1`) |
| Confirm OUT (กลับ SAP) | `/confirmation/export`, CSV | [x] export | ทดสอบเปิดใน Excel ตรงคอลัมน์ SAP |
| Watch folder | `npm run integration:watch` | [x] | ตั้ง cron บนเซิร์ฟเวอร์ลูกค้า (offline) |

เอกสารเทคนิค: [`../parity-pending/15-sap-csv-integration.md`](../parity-pending/15-sap-csv-integration.md) · [`SAP-SAMPLE-PROBE.md`](SAP-SAMPLE-PROBE.md)

### B.2 กระบวนการตรวจสอบข้อมูลก่อนเข้าสู่ระบบ (Data Validation & Cleanup)

กำหนดให้มี:

- **Manual Review** ก่อนอัปโหลด
- จัดเตรียมข้อมูลก่อน **Upload**
- ป้องกัน **Data Redundancy** (ข้อมูลซ้ำ/ไม่จำเป็น) เข้า DB หลัก

| ความต้องการ | แมปในระบบ | สถานะ | งานที่ต้องทำ |
|-------------|-----------|--------|--------------|
| ตรวจก่อน commit | IW37N preview + สรุป error/duplicate (SHA256) | **[~] IW37N [x]** · **Confirm IN preview [x]** (`/integration` แท็บ Confirm IN) | ขยาย duplicate detection Confirm |
| กันข้อมูลซ้ำ | batch skip/duplicate ใน integration job | [~] | UAT: import ครั้งแรกต้องได้ inserted > 0 |
| Manual review ชัดใน UI | ข้อความไทย + ตาราง error ก่อนกดยืนยัน | [~] | ปรับ UX ตาม [`UAT-ROUND-1-TH.md`](UAT-ROUND-1-TH.md) |

### B.3 การเพิ่มความยืดหยุ่นในการปฏิบัติงาน

ช่างสามารถ **บริหารจัดการข้อมูลได้ตามความเหมาะสม** — **ไม่ถูกจำกัดด้วยรอบเวลารับส่งข้อมูลเพียงอย่างเดียว**

| แนวทาง | การทำในระบบใหม่ | สถานะ |
|--------|------------------|--------|
| อัปโหลดนอก 07:00/19:00 | อัปโหลดมือ + watch ตลอด 24 ชม. | [~] |
| แยก “ข้อมูล SAP ล่าสุด” vs “งานที่ assign ใน PM” | ปฏิทิน/ WO แสดงจาก DB หลัง import; planning assign แยกจากรอบ SAP | [~] |
| Bulk ไม่ทีละรายการ | `PATCH .../work-orders/team/batch` · Mass Confirm 44 · `POST .../confirmation/closes/batch` | **[x]** |
| PM ค่าวัด + กราฟ + Comment ต่อ WO | WO modal Task · `092_wo_pm_execution.sql` · `PUT .../pm-note` · `POST .../pm-readings` | **[x]** |
| PM ค่าวัด — กราฟบน Board (ไม่ export) | `GET /api/v1/board/pm-readings` · `/board` โซน C | **[x]** |
| ส่งออก Excel ค่าวัด | `GET .../pm-readings/export.xlsx` · WO modal · `/pm-vibration` | **[x]** |
| หน้า PM ค่าวัด + นำเข้า Excel | `/pm-vibration` · `POST /pm-readings/batch` · `POST /pm-readings/import` · `093` | **[x]** |
| **แก้ PM กระแส 3 เฟส (ลูกค้า)** | เอกสาร WO 4001565681 · เฟส **R/S/T (A)** ต่อเครื่อง · แยกจาก Vibration X/Y/Z · [`PM-MEASUREMENTS-3PHASE-CURRENT.md`](PM-MEASUREMENTS-3PHASE-CURRENT.md) | **[x]** 2026-06-03 |

---

## C) Dashboard & รายงานรายสัปดาห์ (Preventive Maintenance)

### วัตถุประสงค์

ติดตามและประเมินผล **ภาพรวมแผนงานบำรุงรักษาเชิงป้องกัน (Preventive Maintenance)** ในรูปแบบ **รายสัปดาห์**

### รายละเอียดการดำเนินงาน

#### C.1 ระบบแสดงผลมอบหมายงาน + Real-time Monitoring

| รายการ | แมป | สถานะ | งานที่ต้องทำ |
|--------|-----|--------|--------------|
| สถานะ Job Assignment | `/work-orders`, `/planning`, team A/B | [~] bulk team **[x]** · Assigned modal 3 แท็บ **[x]** | Real-time refresh / สรุปทีมไม่ popup ทีละ WO |
| ผลการปฏิบัติงานช่างแบบปัจจุบัน | `/summary-weekly`, `/manhours`, `/board` | [~] | Eng Utilization 2026 — UAT เทียบ Excel ลูกค้า |
| Engineering Board | `/board` (kiosk) | [~] KPI + Eng Util **[x]** · โซน PM readings **[x]** | สเปก V2 เต็ม — [`ENGINEERING-BOARD.md`](ENGINEERING-BOARD.md) |

#### C.2 จัดเก็บข้อมูลเพื่อรายงานประจำสัปดาห์ (Weekly Report)

เพิ่มประสิทธิภาพการจัดเก็บข้อมูลเพื่อวิเคราะห์และสรุปเป็น **รายงานประจำสัปดาห์** ให้ **ถูกต้องและแม่นยำสูงสุด**

| รายการ | แมป | สถานะ | งานที่ต้องทำ |
|--------|-----|--------|--------------|
| KPI / สรุปสัปดาห์ | `/reports`, `GET .../reports/summary-weekly` | [~] | ข้อมูล PM (ZB02) ต้องมาจาก import ที่ผ่าน QC |
| ความครอบคลุม import | `importCoverage` ใน API reports | [~] | แสดงใน UI ว่าข้อมูลสัปดาห์นั้นครบหรือไม่ |
| รูปช่างใน DB | `GET .../personnel/:id/image` | [x] | UAT อัปอย่างน้อย 1 คนที่ Admin → Users |
| QC ก่อนเข้า Dashboard | `confirm_qc_status` | [x] | [`CONFIRM-QC-FLOW.md`](CONFIRM-QC-FLOW.md) · ผู้อนุมัติ = **Foreman** (สิทธิ์ `confirmation.import`) |

---

## D) บริหารใบสั่งซ่อม สถานะระบบ และทรัพยากร (ครั้งที่ 2 — วาระที่ 4)

### D.1 การบริหารจัดการประเภทใบสั่งซ่อม (Order Types) และเชื่อมโยง SAP

นำเข้าข้อมูลจาก SAP แล้ว **แยกประเภทงานชัดเจน** — ระบบต้อง **แสดง Maintenance Code ไว้ด้านหน้า** ให้มองเห็นง่าย

| รหัส (ประชุม) | ความหมาย | แมป IW37N (`wktype`) | แสดงในแอป |
|--------------|----------|----------------------|-----------|
| **ZD01** | Breakdown — ฉุกเฉิน / เครื่องหยุด | **ZB05** | Filter/คอลัมน์ `ZB05 · ZD01` |
| **ZD05** | General Repair — ซ่อมทั่วไป | **ZB01** | `ZB01 · ZD05` |
| **ZD02** | Preventive Maintenance (PM) | **ZB02** (+ Maintenance Code ข้างหน้า) | `ZB02 · ZD02` |

รายละเอียดแมป: [`WKTYPE-ZD-ZB-MAPPING.md`](WKTYPE-ZD-ZB-MAPPING.md) · โค้ด `wktype-zd-mapping.ts`

| งานที่ต้องทำ | สถานะ |
|--------------|--------|
| Filter Type ตรง ZD ในตาราง WO / ปฏิทิน | [x] กรอง `ZB01/ZB02/ZB05` + ป้าย ZD01/ZD02/ZD05 |
| แสดง Maintenance Code ด้านหน้าชัด (ZD02) | [x] `002 · ZB02 · ZD02` บนปฏิทิน + ตาราง WO |
| รองรับคอลัมน์ **ZD** ในไฟล์ SAP รุ่นใหม่ (ถ้ามี) | [ ] คำถามเปิดด้านล่าง |

### D.2 การจัดการสถานะระบบ (System Status Control)

| สถานะ | นิยาม (ประชุม) | แมปในระบบ | งานที่ต้องทำ |
|--------|----------------|-----------|--------------|
| **REL** (Released) | งาน **กำลังดำเนินการ** ยังไม่เสร็จ | `syst` / สถานะ IW37N `REL` | แสดงป้าย/สีชัดใน `/work-orders`, `/calendar` |
| **Confirm** | งาน **เสร็จแล้ว** — เตรียม **ส่งกลับ SAP** | `tbcofirm`, export CSV | เชื่อม `/confirmation` + CONFIRM_OUT |
| **Create** | แผน **สัปดาห์ถัดไป** จาก SAP — **ยังไม่ assign ช่าง** | `CRTD` / แผนใหม่หลัง import | แยกจาก REL ใน UI planning |

| งานที่ต้องทำ | สถานะ |
|--------------|--------|
| ผู้ใช้แยก REL / Confirm / Create ได้ในหน้าเดียว | [x] ป้าย Create/REL/Confirm · กรอง `/calendar` · แถบสีบน event |
| Export Confirm เฉพาะสถานะที่พร้อมส่ง SAP | [x] `view_exportconfirm` + QC |

### D.3 ระบบบริหารทรัพยากรบุคคลและเวลาแบบอัตโนมัติ (Automated Resource Allocation)

| ความต้องการ | แมป | สถานะ | งานที่ต้องทำ |
|-------------|-----|--------|--------------|
| **ค้นหาด้วย Key** — แสดงรายละเอียดช่าง + ชื่องาน | WO autocomplete, grid รหัส WorkCntr | [~] | [`ENG-TECHNICIAN-CODES.md`](ENG-TECHNICIAN-CODES.md) — 25 รหัส PAC/PRO/UTI |
| **Auto Mode** — แสดงตามข้อมูล import | ค่า default หลัง IW37N (`importWkctr`) | [x] แสดงบน `/planning` + จ่ายกลุ่ม (G) |
| **Manual Mode** — Admin ปรับได้ | `/planning`, `/admin/users` | [x] PlanningQuickAssign + Available hour ต่อช่าง |
| **คำนวณจำนวนคน + เวลาอัตโนมัติ** — ลด key-in | manhour, planning duration | [x] คอลัมน์ **ชม.งาน** + Available hour ใน dialog จ่ายงาน |

---

## E) Mass Confirm · Logging & Analytics (ครั้งที่ 2 — วาระที่ 4)

### E.1 การเพิ่มประสิทธิภาพการยืนยันปิดงาน (Mass Confirmation Optimization)

| ความต้องการ | รายละเอียด | แมป | สถานะ |
|-------------|-------------|-----|--------|
| **Mass Confirm 44** | ยืนยันปิดงานแบบ **Bulk** — ไม่ทีละ 1 รายการ | UI/API bulk confirm ที่ `/work-orders`, `/personnel/confirm` | **[x] มีแล้ว** — `POST /api/v1/confirmation/closes/batch` · `MassConfirmBar` จำกัด 44 |
| ลดเวลา key-in | เดิม popup สำเร็จทีละ WO | toast เดียวต่อ batch (team มีแล้ว) | [x] team batch · [x] confirm bulk |
| Export หลัง mass confirm | ข้อมูลกลับ SAP | `GET .../confirmation/export.csv` | [x] export + `MassConfirmExportPanel` หลัง batch |

> บันทึกประชุม: *“Max confirmation SAP ใช้ max confirm 44”* — ยืนยันว่าเป็น **จำกัด 44 รายการ/ครั้ง** หรือชื่อฟังก์ชัน SAP

### E.2 ระบบบันทึกประวัติและวิเคราะห์ผล (Logging & Analytics)

#### Activity Logs (บันทึกเหตุการณ์)

เก็บรายละเอียด:

- ชื่อผู้ปฏิบัติงาน
- รายละเอียดงาน
- ทรัพยากรที่ใช้
- ข้อมูล **Line** (สายการผลิต)
- **เวลาเริ่ม–สิ้นสุด**
- แสดงผลแบบ **Week-to-Week**

| แมป | สถานะ | งานที่ต้องทำ |
|-----|--------|--------------|
| `/activity-log`, `GET .../reports/activity-log` | [x] | คน · งาน · ทรัพยากร · Line · เริ่ม–สิ้น · Week-to-Week ย่อบนหน้าเดียวกัน |
| `/reports` ตาราง `weekToWeek` | [x] | Utilization + Backlog Δ สัปดาห์ต่อสัปดาห์ |

#### Utilization Rate

| แมป | สถานะ | งานที่ต้องทำ |
|-----|--------|--------------|
| `/manhours`, `/manhours-hr`, `/summary-weekly` | [~] | Eng Utilization 2026 — [`ENG-UTILIZATION-2026.md`](ENG-UTILIZATION-2026.md) · สรุป audit ที่ `/reports/audit` |

#### Work Order Calendar (Order Frame)

| แมป | สถานะ | งานที่ต้องทำ |
|-----|--------|--------------|
| `/calendar` — รวมกรอบเวลาใบงาน | [x] | มุมมอง &quot;วัน&quot; = Gantt Order Frame · hover Plan/Finish/ช่วงเวลา · แบนเนอร์ audit + `/reports/audit` |

---

## F) Audit Readiness และปรับปรุงแผนงาน (ครั้งที่ 2 — วาระที่ 4)

### F.1 หน้าจอสำหรับการตรวจสอบ (Auditor Interface)

| ความต้องการ | แมป | สถานะ | งานที่ต้องทำ |
|-------------|-----|--------|--------------|
| Dashboard แสดงแผน **PM** + **Work Orders** อ่านง่ายสำหรับ audit | `/reports/audit` (Auditor Hub) | [x] | สรุป PM/WO เดือนนี้ · Utilization · Order Frame · Revision 7 วัน |
| สิทธิ์ Planner/Auditor ดูได้ | RBAC `reports.read` | [~] | |

### F.2 การติดตามการปรับปรุงแผน (Maintenance Plan Revision History)

| ความต้องการ | แมป | สถานะ |
|-------------|-----|--------|
| **Revision Log** — บันทึกเมื่อแก้แผน + ความถี่ | `tbl_resource_revision` + Hub | **[~]** | migration `095` · จ่ายงาน/ย้ายแผน · ยังไม่มีแท็บใน WO detail |

แผน: [`AUDITOR-REVISION-PLAN.md`](AUDITOR-REVISION-PLAN.md) Phase C

### F.3 ระบบบันทึกข้อคิดเห็น (Task Commenting)

| ความต้องการ | แมป | สถานะ |
|-------------|-----|--------|
| ช่าง/หัวหน้า **บันทึกเหตุผล** เมื่องานทำตามแผน PM ไม่ได้ | `tbwo_pm_note` · WO modal Task · confirm comments | **[x]** PM note · [~] confirm comments |
| **ชดเชยข้อจำกัด SAP** — SAP ไม่มี log ประเภทนี้ | เก็บใน PM App | [~] ยืนยัน UX กับลูกค้า |

---

## รายการแก้งานรวม (ลำดับแนะนำ — ใช้ติ๊กงาน)

อ้างอิงแผน phase: [`../WORK-PHASES.md`](../WORK-PHASES.md) · checklist UAT: [`UAT-ROUND-1-TH.md`](UAT-ROUND-1-TH.md)

### P0 — บล็อกข้อมูลทั้งระบบ

- [x] **Phase 2 UAT (template 2026):** `Templete IW37N on PM App - ZB02All.xlsx` → **522 inserted** · ปฏิทิน พ.ค. 2026 — รายงานลูกค้า [`UAT-ITEM5-EXCEL-CUSTOMER-FILES.md`](UAT-ITEM5-EXCEL-CUSTOMER-FILES.md) · technical [`UAT-ZB02ALL-TEMPLATE.md`](UAT-ZB02ALL-TEMPLATE.md)
- [~] **Phase 2 UAT (legacy):** `IW37N ล่าสุด.xlsx` → **1129 inserted** (ข้อมูล 2020)
- [ ] **Phase 2 UAT:** Confirm IN หลัง ZB02All — ต้องได้ไฟล์ Confirm จาก SAP ที่ **Order ตรง** (ไฟล์ `ZB02All 1` = IW37N ซ้ำ ไม่ใช่ Confirm)
- [x] **ปฏิทิน/WO:** หลัง import เห็น WO (functionalloc 7151 · แก้ filter ZB02 `vo..wktype`)
- [x] เอกสารรอบ SAP 07:00/19:00 — ผู้ใช้เข้าใจว่าอัปได้นอกรอบ ([`SAP-SCHEDULE-AND-WORK-HOURS.md`](SAP-SCHEDULE-AND-WORK-HOURS.md) + แบนเนอร์ UI)

### P1 — ประสบการณ์ใช้งานหลังมีข้อมูล

- [~] Validation / preview ก่อน upload — Confirm IN preview **[x]** ที่ `/integration` · duplicate hash ยังไม่มี
- [x] **Mass Confirm 44** — UI/API bulk ปิดงาน (§ E.1) · export CSV + export panel
- [x] สถานะ **REL / Confirm / Create** แสดงชัดใน UI (§ D.2) — ป้าย `/work-orders` · กรอง+แถบสี `/calendar`
- [x] ประเภทงาน **ZD01 / ZD02 / ZD05** + Maintenance Code ด้านหน้า (§ D.1) — filter Type (ZB/ZD) · ป้าย `002 · ZB02 · ZD02`
- [x] Auto/Manual mode + คำนวณคน/เวลา (§ D.3) — `/planning` Manual+Auto dialog · ชม.งาน WO · Available hour ต่อช่าง
- [~] Real-time สรุปมอบหมายงาน + รายงานสัปดาห์เทียบ Excel ลูกค้า
- [x] ปฏิทิน filter + Assigned Job modal + สรุปช่องวัน (§ A · สไลด์ลูกค้า 2026-05)
- [x] PM ค่าวัด / กราฟ / Comment / `/pm-vibration` / Board โซน C (§ B.3)

### P2 — คุณภาพข้อมูลและ audit

- [x] Confirmation + รูป Before/After + QC ก่อน dashboard — `ConfirmationImagesPanel` · `ConfirmQcPanel` · KPI ปิดเดือนนี้กรอง `confirm_qc_status=approved` ([`CONFIRM-QC-FLOW.md`](CONFIRM-QC-FLOW.md))
- [x] Activity log ครบ (คน · งาน · ทรัพยากร · Line · เวลา) + Week-to-Week (§ E.2) — `/activity-log` · `/reports`
- [x] Utilization + ปฏิทิน Order Frame สำหรับ audit (§ E.2) — `/reports/audit` Week-to-Week + Eng Util links · `/calendar` Order Frame Gantt + hover
- [x] Auditor hub (`/reports/audit`) — แผน PM + WO · Utilization · Order Frame · revision 7 วัน (§ F.1–F.2)
- [ ] **Revision history** แผนงาน (§ F.2 — ยังไม่ implement)
- [~] Task commenting ชดเชย SAP (§ F.3) — PM note **[x]** · revision log ยังไม่มี

### P3 — ช่องทางเสริม (นอกแกน parity PHP)

- [ ] Telegram แจ้งเตือน
- [~] Engineering Board เต็มตามสเปก V2 — KPI + Eng Util + PM zone **[x]**
- [~] Machine log / Predictive — **Vibration trend + import [x]** · analytics ขั้นสูง Future

---

## บทบาทและสิทธิ์ (RBAC) — ตกลงกับลูกค้า

| บทบาท (องค์กร) | role ในระบบ | หน้าที่หลัก | ตั้งค่าสิทธิ์ |
|----------------|-------------|-------------|---------------|
| **Admin** | `A` | ดูแลระบบทั้งหมด · กำหนด role/permission | `/admin/roles` |
| **Planner / Engineering** | `U` | แผน · จ่ายงาน · import/export SAP | Admin grant ตาม matrix |
| **Technician (ช่าง)** | `W` | รับงาน · ทำงาน · ปิดงาน · บันทึก PM | Admin grant ตาม matrix |
| **Foreman (โฟร์แมน / supervisor)** | `H` หรือ role ใหม่ | **อนุมัติ QC** ก่อน Dashboard/Export SAP | Admin grant **`confirmation.import`** + `confirmation.read` |

- จุดที่ไม่ตรง 3 role คงที่ → **Admin เป็นคนกำหนด permission ต่อ role** ที่ `/admin/roles` (ไม่ hardcode ในโค้ด)
- QC approve ใช้สิทธิ์ `confirmation.import` — มอบให้ Foreman ไม่จำเป็นต้องเป็น Admin
- เอกสาร flow: [`CONFIRM-QC-FLOW.md`](CONFIRM-QC-FLOW.md)

---

## คำถามเปิด (ยืนยันกับลูกค้าก่อนแก้เยอะ)

1. ไฟล์ IW37N ถัดไปใช้คอลัมน์ **ZD** แทน **ZB** หรือไม่?
2. **Mass Confirm 44** — จำกัด 44 รายการต่อครั้ง หรือชื่อฟังก์ชัน SAP?
3. รอบ **07:00 / 19:00** — SAP ยังส่งตามนี้หรือให้ scan ถี่กว่า?
4. ~~ใครมีสิทธิ์อนุมัติ QC รูปก่อนเข้า Dashboard?~~ → **Foreman (โฟร์แมน)** — Admin ตั้งสิทธิ์ `confirmation.import` (ดู § บทบาทและสิทธิ์)

รายละเอียดเต็ม: [`MEETING-MINUTES.md`](MEETING-MINUTES.md) § คำถามเปิด

---

## เอกสารที่เกี่ยวข้อง

| เอกสาร | ใช้เมื่อ |
|--------|---------|
| [`MEETING-MINUTES.md`](MEETING-MINUTES.md) | รายงานครบ 6 กลุ่มฟีเจอร์ + ครั้งที่ 2 (ZD, Mass 44, Audit) |
| [`../WORK-PHASES.md`](../WORK-PHASES.md) | ติ๊ก Phase 0–8 งานพัฒนา |
| [`UAT-ROUND-1-TH.md`](UAT-ROUND-1-TH.md) | ชีตทดสอบรอบ 1 ภาษาไทย |
| [`SAP-SCHEDULE-AND-WORK-HOURS.md`](SAP-SCHEDULE-AND-WORK-HOURS.md) | แยกรอบ SAP vs เวลาเข้างานช่าง |
| [`../USER-MANUAL-TH.md`](../USER-MANUAL-TH.md) | คู่มือทุกหน้า |
| [`ENGINEERING-BOARD.md`](ENGINEERING-BOARD.md) | Kiosk `/board` · โซน PM readings |
| [`CALENDAR-DISPLAY.md`](CALENDAR-DISPLAY.md) | Filter ปฏิทิน · สรุปช่องวัน |

**ต้นฉบับ PDF/DOCX:** [`รายงานการประชุม ครั้งที่ 1 PDF.pdf`](../../รายงานการประชุม%20ครั้งที่%201%20PDF.pdf) · [`รายงานการประชุม ครั้งที่ 2.docx`](../../รายงานการประชุม%20ครั้งที่%202.docx)
