# รายงานการประชุมลูกค้า (ครั้งที่ 1–2)

**สรุปสไลด์ + checklist แก้งาน:** [`MEETING-SUMMARY-REQUIREMENTS.md`](MEETING-SUMMARY-REQUIREMENTS.md)

อัปเดต: 2026-05-21  
ไฟล์ต้นฉบับ (repo root):

| ครั้ง | ไฟล์ | วันที่ประชุม |
|------|------|--------------|
| **1** | [`รายงานการประชุม ครั้งที่ 1 PDF.pdf`](../../รายงานการประชุม%20ครั้งที่%201%20PDF.pdf) | อังคาร **28 เม.ย. 2569** 13:30–14:30 |
| **2** | [`รายงานการประชุม ครั้งที่ 2.docx`](../../รายงานการประชุม%20ครั้งที่%202.docx) | พฤหัส **7 พ.ค. 2569** 13:30–14:30 (ออนไลน์) |

**โครงการ:** PM Dashboard & Monitoring System — เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง (โรงงาน)  
**ผู้พัฒนา:** เอส.วาย. อินเตอร์แอคทีฟ ดีเวลลอปเมนท์  
**ลูกค้า (รับรอง):** คุณพชรพรรณ ชัยเนตร (ครั้งที่ 1)

---

## สรุปภาพรวม

| ครั้ง | โฟกัส |
|------|--------|
| **1** | วิสัยทัศน์ฟีเจอร์หลัก 6 กลุ่ม (Dashboard, Web/Telegram, SAP Import, Workload, Machine log, Confirmation+รูป) |
| **2** | ปัญหาเทคนิคทีม dev, สถาปัตยกรรม, **รายละเอียด implement** (SAP 07:00/19:00, Order type, สถานะ REL/Confirm/Create, Mass Confirm 44, Audit, Calendar) |

ครั้งที่ 2 **ต่อเนื่อง** ครั้งที่ 1 ในหัวข้อ Data Integration & Scheduling และขยายเป็น Work Order Management & Audit Trail

---

## ครั้งที่ 1 — วาระและความต้องการ

### 1) Dashboard & Reporting

| รายการ | รายละเอียด | แมป PM-Pepsi-App | สถานะ |
|--------|-------------|------------------|--------|
| ภาพรวม PM รายสัปดาห์ | ติดตามแผนบำรุงเชิงป้องกัน | `/`, `/summary-weekly`, `/reports` | [~] มีรายงาน ยังไม่ครบ Telegram/Board |
| Real-time จ่ายงาน/คืนงานช่าง | ใช้สรุปรายงานสัปดาห์ | `/work-orders`, `/planning`, team summary | [~] ดู [LEGACY-ISSUES](LEGACY-ISSUES-CHECKLIST.md) §B.4c |
| รายงานประจำสัปดาห์ | แม่นยำจากสถานะจริง | `GET /api/v1/reports/summary-weekly` + `importCoverage` | [~] PM ZB02 หลัง import · UAT เทียบ Excel |

### 2) Web Application & Connectivity

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| Responsive Web | Desktop + Mobile | React + Tailwind | [~] |
| Telegram แจ้งเตือน | ช่องทางแจ้งเตือน | — | [ ] ยังไม่มี |
| Engineering Board | มอนิเตอร์กลางแผนก | `/board` (kiosk) | [~] รีเฟรช 60s · [ENGINEERING-BOARD.md](ENGINEERING-BOARD.md) |
| Paperless | ลดกระดาษ | ทั้งระบบ | [~] |

### 3) Data Integration & Scheduling

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| Import Excel จาก SAP | สร้างตารางงาน + Tracking | `/integration`, `/iw37n`, watch `inbound/iw37n` | [~] parser ALV ยังไม่ครบ — [SAP-SAMPLE-PROBE](SAP-SAMPLE-PROBE.md) |
| Scheduling + Tracking ที่เดียว | ไม่กระจัดกระจาย | `/calendar`, `/plan-calendar`, `/planning` | [~] |

### 4) Workload Management (หัวหน้างาน)

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| Dashboard ความหนาแน่นงานรายวัน | Workload balance | `/manhours`, planning assign | [~] |
| มอบหมายงานช่างผ่านระบบ | Job Assignment | `/planning`, `/work-orders` (team A/B) | [~] bulk save ยังไม่มี |

### 5) Machine Monitoring & Log (Predictive)

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| Log เครื่องจักร + กราฟ vibration | Predictive maintenance | — | [ ] **นอก scope แกน parity PHP** — บันทึกเป็น Future |

### 6) Final Inspection & Confirmation

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| หน้ายืนยันงาน | วัน เวลา ระยะเวลาจริง | `/confirmation`, close WO ใน modal | [~] |
| รูป Before/After ~5 รูป | Admin ตรวจก่อนอัปเดต Dashboard | confirmation images · QC flow | [x] รูปใน DB + [CONFIRM-QC-FLOW.md](CONFIRM-QC-FLOW.md) |
| อัปเดต Dashboard หลังอนุมัติ | QC ก่อนเข้าระบบ | `confirm_qc_status` + export เฉพาะ approved | [x] [CONFIRM-QC-FLOW.md](CONFIRM-QC-FLOW.md) |

---

## ครั้งที่ 2 — วาระและความต้องการ

### วาระที่ 1 — แจ้งให้ทราบ

- รายงานปัญหา/อุปสรรคทีมพัฒนา (ข้อจำกัดเทคนิค, ผลต่อแผนงาน)
- นำเสนอ System Architecture + Technology Stack (React, Express, PostgreSQL — สอดคล้อง PM-Pepsi-App)

### วาระที่ 2 — พิจารณา/สืบเนื่อง

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| Job Assignment + Real-time Monitoring | ติดตามมอบหมายและผลช่าง | เหมือนครั้งที่ 1 §4 | [~] |
| Weekly Report ถูกต้องสูงสุด | เก็บข้อมูลให้วิเคราะห์ได้ | reports + import quality | [~] |

### วาระที่ 3 — Data Integration (ต่อเนื่องครั้งที่ 1)

#### ปัญหาปัจจุบัน (Current Issues)

| ปัญหา | ความหมาย | แนวทางในระบบใหม่ |
|--------|----------|------------------|
| SAP ส่งข้อมูล **07:00 และ 19:00** เท่านั้น | Monitoring แบบเดิมไม่ตรง UX ผู้ใช้ | Watch folder + **อัปโหลดมือ anytime** · ไม่บังคับรอบเดียว · อ่าน [SAP-SCHEDULE-AND-WORK-HOURS.md](SAP-SCHEDULE-AND-WORK-HOURS.md) |
| UX ไม่สอดคล้องรอบเวลา | ช่างใช้งานนอกรอบ | แยก “ข้อมูลล่าสุดจาก SAP” กับ “งานที่ assign ใน PM” |

#### แนวทางพัฒนา

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| Import/Export Excel SAP | Scheduling + Tracking | `15-sap-csv-integration.md` §1–4 | [~] |
| Data Validation & Cleanup | Manual review ก่อน upload, กันข้อมูลซ้ำ | preview API + สรุป error ก่อน commit · SHA256 | [~] IW37N แล้ว · Confirm import ยังทีละขั้น |
| ความยืดหยุ่นช่าง | ไม่ถูกจำกัดแค่รอบ 07:00/19:00 | UI import + integration jobs | [~] |

### วาระที่ 4 — Work Order Management & Audit Trail

#### ประเภทใบสั่งซ่อม (จาก SAP)

| รหัส (ประชุม) | ความหมาย | หมายเหตุ |
|--------------|----------|----------|
| **ZD01** | Breakdown / เครื่องหยุด | IW37N **ZB05** · [WKTYPE-ZD-ZB-MAPPING.md](WKTYPE-ZD-ZB-MAPPING.md) · filter/type |
| **ZD05** | General Repair | IW37N **ZB01** · [WKTYPE-ZD-ZB-MAPPING.md](WKTYPE-ZD-ZB-MAPPING.md) |
| **ZD02** | Preventive Maintenance (PM) + Maintenance Code ข้างหน้า | IW37N **ZB02** (ไฟล์เก่ามี ZB02/ZB05) · UI filter/type |

#### สถานะระบบ (System Status Control)

| สถานะ | นิยาม (ประชุม) | แมป PHP/React |
|--------|----------------|---------------|
| **REL** | งานยังไม่เสร็จ | `REL` ใน `syst` / IW37N |
| **Confirm** | เสร็จแล้ว — เตรียมส่งกลับ SAP | `tbcofirm`, export confirm |
| **Create** | แผนสัปดาห์ถัดไปจาก SAP ยังไม่ assign ช่าง | `CRTD` / แผนใหม่ |

#### ทรัพยากรบุคคล

| รายการ | แมป | สถานะ |
|--------|-----|--------|
| Auto Mode | ตามข้อมูล import | default หลัง IW37N |
| Manual Mode | Admin จัดการ | `/planning`, admin |
| คำนวณคน+เวลาอัตโนมัติ | ลด key-in | manhour / planning duration | [~] |

#### Mass Confirmation Optimization

| รายการ | รายละเอียด | แมป | สถานะ |
|--------|-------------|-----|--------|
| **Mass Confirm 44** (SAP) | ยืนยันหลายรายการครั้งเดียว — เดิมทีละ 1 | Bulk confirm UI + API | [ ] |
| Export จาก mass confirm | ข้อมูลกลับ SAP | `GET .../confirmation/export.csv` | [x] export มีแล้ว · bulk confirm ยังไม่มี |

> บันทึกในประชุม: *“Max confirmation SAP ใช้ max confirm 44”* · *“ข้อมูลที่ export จาก mass confirm”* — สอดคล้อง `09-confirmation` และ integration CONFIRM_OUT

#### Logging & Analytics

| รายการ | แมป | สถานะ |
|--------|-----|--------|
| Activity Logs (คน, งาน, ทรัพยากร, Line, เวลา) | `/activity-log` · `GET /reports/activity-log` | [~] audit + login |
| Week-to-Week | `/reports` ตาราง `weekToWeek` + กราฟ KPI | [~] |
| Utilization Rate | manhour HR reports | [~] |
| Work Order Calendar (Order Frame) | `/calendar` | [~] |

#### Audit Readiness

| รายการ | แมป | สถานะ |
|--------|-----|--------|
| Auditor Dashboard | `/reports/audit` + Activity log | [~] Planner ดูได้ (`reports.read`) · retention 365 วัน |
| Maintenance Plan Revision History | `tbl_resource_revision` (แผน Phase C) | [ ] แผนแล้ว · ยังไม่ implement |
| Task Commenting (ชดเชย SAP ไม่มี log) | WO comments, confirm comments | [~] |

#### หมายเหตุท้ายรายงาน (ครั้งที่ 2)

- *“IW37 คืออะไร”* — อธิบายลูกค้า: รายงาน **IW37N** จาก SAP = แหล่ง Work Order หลัก → โมดูล `/iw37n`, `/integration`
- *“ที่เคยออกแบบไว้ ของ papsi”* — อ้างระบบ/เอกสารเก่าใน `from customer/` + screenshot

---

## รวม Must-have จากการประชุม (ลำดับแนะนำ)

| P | หัวข้อ | อ้างอิง |
|---|--------|---------|
| **P0** | Import IW37N/Confirm SAP ALV ได้จริง | ครั้งที่ 1 §3 · ครั้งที่ 2 วาระ 3 |
| **P0** | Export Confirm กลับ SAP (CSV) | ครั้งที่ 2 · Mass confirm ข้อมูล |
| **P1** | Real-time Job Assignment + รายงานสัปดาห์ | ครั้งที่ 1 §1, §4 |
| **P1** | Mass Confirm / Bulk action (ไม่ทีละ 1 รายการ) | ครั้งที่ 2 · LEGACY §B.4 |
| **P1** | สถานะ REL / Confirm / Create ชัดใน UI | ครั้งที่ 2 วาระ 4 |
| **P1** | Validation ก่อน upload + กันข้อมูลซ้ำ | ครั้งที่ 2 วาระ 3 |
| **P2** | Confirmation + รูป ~5 ใบ + Admin ตรวจ | ครั้งที่ 1 §6 |
| **P2** | Activity log + Utilization + Audit dashboard | ครั้งที่ 2 วาระ 4 |
| **P3** | Telegram, Engineering Board | ครั้งที่ 1 §2 |
| **Future** | Vibration / Predictive | ครั้งที่ 1 §5 |

---

## คำถามเปิด (ยืนยันกับลูกค้า)

1. ไฟล์ IW37N รุ่นถัดไปจะส่ง **ZD** ในคอลัมน์ Type แทน **ZB** หรือไม่? (นิยาม ZD ใช้ตามประชุมแล้ว — [WKTYPE-ZD-ZB-MAPPING.md](WKTYPE-ZD-ZB-MAPPING.md))
2. **Mass Confirm 44** — จำกัด 44 รายการต่อ batch หรือชื่อฟังก์ชัน SAP?
3. ~~รูป Before/After — จำนวนสูงสุด~~ → **ไม่จำกัดจำนวน** ([CONFIRM-IMAGE-LIMITS.md](CONFIRM-IMAGE-LIMITS.md)) · ค้าง: ใครกดอนุมัติ QC (Admin เท่านั้น?)
4. รอบ **07:00 / 19:00** — ยังใช้อยู่หรือให้ watch folder สแกนถี่กว่า?

---

## เอกสารที่เกี่ยวข้อง

- [`CATALOG.md`](CATALOG.md) — ไฟล์ `from customer/`
- [`LEGACY-ISSUES-CHECKLIST.md`](LEGACY-ISSUES-CHECKLIST.md) — UX ระบบเก่า
- [`SAP-SAMPLE-PROBE.md`](SAP-SAMPLE-PROBE.md) — ผลทดสอบ parser
- [`../parity-pending/15-sap-csv-integration.md`](../parity-pending/15-sap-csv-integration.md) §13
