# สารบัญเอกสารลูกค้า (`from customer/`)

อัปเดต: 2026-05-21 · ไฟล์ต้นฉบับอยู่ที่ repo root: `from customer/`

---

## 0) รายงานการประชุม (ล่าสุดจากลูกค้า)

| ไฟล์ | วันที่ | สรุป |
|------|--------|------|
| [`รายงานการประชุม ครั้งที่ 1 PDF.pdf`](../../รายงานการประชุม%20ครั้งที่%201%20PDF.pdf) | 28 เม.ย. 2569 | วิสัยทัศน์ 6 กลุ่ม: Dashboard, Web/Telegram, SAP Import, Workload, Machine log, Confirm+รูป |
| [`รายงานการประชุม ครั้งที่ 2.docx`](../../รายงานการประชุม%20ครั้งที่%202.docx) | 7 พ.ค. 2569 | SAP 07:00/19:00, ZD01/02/05, REL/Confirm/Create, **Mass Confirm 44**, Audit, Calendar |
| [`new file/Eng Utilization 2026.xlsx`](../../new%20file/Eng%20Utilization%202026.xlsx) | 2026 | รายงาน PM/Reactive/RCA รายคน · อ้างอิง Board Phase 2 |

สรุปเป็นข้อ checklist: [**MEETING-MINUTES.md**](MEETING-MINUTES.md) · Board ขยาย: [**ENGINEERING-BOARD-V2-REQUIREMENTS.md**](ENGINEERING-BOARD-V2-REQUIREMENTS.md)

| เอกสารยืนยัน (รอลงนาม) | หัวข้อ |
|------------------------|--------|
| [**CONFIRM-IMAGE-LIMITS.md**](CONFIRM-IMAGE-LIMITS.md) | จำนวนรูป Before/After — **ไม่จำกัด** (แนะนำ ~5/ฝั่ง) |

---

## 1) เอกสารความต้องการ (อ่านก่อน)

| ไฟล์ | ประเภท | สรุปเนื้อหา | แมป parity |
|------|--------|-------------|------------|
| `PM Application Requirement.docx` | SRS | แอป PM Scheduling; **3 ชีต Excel**: Scheduling, Work Order Status (CRTD/REL/TECO/CLSD), Confirmation | `07-iw37n`, `09-confirmation`, `15` |
| `PM Application Requirement (Details).docx` | SRS | ปฏิทิน Month/Week/Day, Drag & Drop แผน, Reason code, Modal 3 Tab (Task / Planning / Close WO), Filter | `08`, `04-work-calendar` |
| `PM Application Requirement (Details)Rev.1.docx` | SRS | เหมือนด้านบน + **ZB01–05**, TECO ยัง confirm, Available hour, สิทธิ์ตาม role | **อ้างอิงล่าสุด** ใน docx ชุดนี้ |
| `requirement_13_02_63 (003).docx` | ประชุม 13 ก.พ. 2563 | Excel ที่ต้องมี (Task list, Equipment, Product Line, HR, IP19); ManHour, Backlog 30 วัน, Barcode WO, Export/Import SAP, รายงาน | `11`, `12`, `05`, `10`, `15` |
| `Additional Requirment 08Jul20.xlsx` | เพิ่มเติม | Requirement ก.ค. 2020 | ดูชีตในไฟล์ |
| `Additional Requirment 10Jun20.xlsx` | เพิ่มเติม | มิ.ย. 2020 | ดูชีต |
| `Additional Requirment 11Jun20.xlsx` | เพิ่มเติม | มิ.ย. 2020 (ชีต 11Jun, 10Jun) | ดูชีต |
| `PM App.xlsx` | ตัวอย่าง | Backlog แยกเดือน + รายการ WO | `05-backlog` |
| `PM SAP Background report.xlsx` | รายงาน | พื้นหลัง/รายงาน SAP | `12-reports-summary` |
| `Hand held system.pptx` | นำเสนอ | ระบบมือถือ/handheld | scope แยก — ยังไม่ใน parity หลัก |

> **หมายเหตุ:** `tools/extract_srs_outline.py` อ้าง `Software Requirement Specification Pepsi Cola PM Project.docx` — **ไฟล์นั้นไม่อยู่ใน `from customer/`** (อาจอยู่ที่อื่นหรือยังไม่ copy)

---

## 2) บั๊กและ UX ระบบเก่า (ทีม dev เก่า)

| ไฟล์ | วันที่ | รายละเอียด |
|------|--------|------------|
| `Problem PM App2  (4Sep).xlsx` | ก.ย. 2020 | Move แผนเขียว, หลัง confirm ไม่เห็นรูป/เวลาใน WO |
| `Problem PM App3  (8Sep).xlsx` | ก.ย. 2020 | + แก้ task list แล้วเด้งหน้าแรก |
| `Problem PM App4  (15 Sep).xlsx` | ก.ย. 2020 | + เวลา/จำนวน WO ไม่ตรง filter |

รายการ Must/Should รวม screenshot: [**LEGACY-ISSUES-CHECKLIST.md**](LEGACY-ISSUES-CHECKLIST.md)

---

## 3) Template / ไฟล์ SAP สำคัญ (root)

| ไฟล์ | ใช้ทดสอบ | ผล probe (สั้น) |
|------|----------|----------------|
| `IW37N & MB51 template.xlsx` | รูปแบบ IW37N + MB51 | รัน `inspect-iw37n-sample.ts` |
| `AcZB02,ZB05-Done.xlsx` | Confirm IN (ZB02/ZB05) | Parser ปัจจุบัน 0 OK · ALV probe ~750 แถว — ดู [SAP-SAMPLE-PROBE.md](SAP-SAMPLE-PROBE.md) |
| `Copy of LineWorking.xlsx` | Product line | `03-line-calendar` |

สำเนาใน root โปรเจกต์: `IW37N.xlsx`, `AcZB02,ZB05-Done.xlsx` (ซ้ำกับโฟลเดอร์นี้)

---

## 4) `SAP data/Data/` — ข้อมูลอ้างอิง

| กลุ่ม | ไฟล์ตัวอย่าง | โมดูล |
|------|-------------|--------|
| **IW37N** | `IW37N ล่าสุด.xlsx`, `IW37N.xls`, `IW37N (22Apr20).xls`, `IW37N 08Jul20.xls`, `IW37N rev1.xls` | import, ปฏิทิน, WO |
| **Confirm** | `Confirm WO.xls`, `PC50 Y2018 Confirm.xls/xlsx` | confirmation |
| **Task list** | `Task list.xlsx`, `Gen task list.xlsx`, `General task list.xlsx`, `Task list หน้าตาในระบบ SAP.xlsx` | modal Task List, master |
| **Master** | `Work Center list.xls`, `Functional Location & Equipment.xls`, `Status WO.xlsx`, `IP19.xls`, `IA17.xls`, `PC50.xlsx` | `02-master-data` |
| **GR/GI** | `GR 1May-12Jun20.xls`, `GI 1May-12Jun20.xls` | วัสดุ — นอก parity หลัก |
| **อื่น** | `PM Database.xlsx`, `Proposal.xlsx`, `Work Order data.xlsx`, `ข้อมูลเวลาตั้งแต่ มกราคม.xls` | อ้างอิง schema/รายงาน |

### `SAP data/Jul/`

`IW37N 24Jul20.xls`, `IW37N May-Jun.xls`, `GR 24Jul20.xls`, `GI 24Jul20.xls`

---

## 5) `Test/` — ชุดทดสอบ import (หลายรูปแบบ)

| รูปแบบ | ไฟล์ตัวอย่าง | หมายเหตุ |
|--------|-------------|----------|
| **SAP ALV** (Dynamic List Display) | หลายไฟล์ชื่อ IW37N* | ข้าม 4 แถว + offset คอลัมน์ — ดู probe |
| **Header แถวเดียว (legacy)** | `IW37N (27May).xls` | Parser ปัจจุบัน ~1183 แถว; บางแถวไม่มี Bsc start |
| **Web export** | `iw37n (Web).xlsx` | ทดสอบแยก |
| **Material** | `Material 15Jul.xlsx` | scope วัสดุ |
| **GR/GI** | `15JulGR.xls`, `15JulGI.xls` | |

รายการไฟล์ครบ: 18 ไฟล์ใน `Test/` (ส่วนใหญ่ `.xls` / `.xlsx`)

---

## 6) `server/` — โครงสร้างเซิร์ฟเวอร์

| ไฟล์ | เนื้อหา |
|------|---------|
| `LINE_ALBUM_Spec server_*.jpg` | ภาพ spec เครื่อง |
| `DOCKER_AND_TAILSCALE.md` | Docker บน D:, Tailscale, พอร์ต 3000, deploy ~300GB |

แมป: `13-deploy-offline.md`, `docs/ON-SITE-DATABASE-SETUP.md`

---

## 7) ลำดับอ่านที่แนะนำ

1. [**MEETING-MINUTES.md**](MEETING-MINUTES.md) (ครั้งที่ 1–2)
2. `PM Application Requirement (Details)Rev.1.docx`
3. `requirement_13_02_63 (003).docx`
3. `PM Application Requirement.docx`
4. [LEGACY-ISSUES-CHECKLIST.md](LEGACY-ISSUES-CHECKLIST.md)
5. [SAP-SAMPLE-PROBE.md](SAP-SAMPLE-PROBE.md)
6. `SAP data/Data/IW37N ล่าสุด.xlsx` + `AcZB02,ZB05-Done.xlsx` (UAT import)
7. `server/DOCKER_AND_TAILSCALE.md` (onsite)

---

## 8) งานถัดไปจากสารบัญนี้ (P0 → P2)

| ลำดับ | งาน | บล็อก |
|------|-----|-------|
| **P0** | Parser `sap_alv_iw37n` + `sap_alv_confirm` | import ไฟล์ลูกค้าจริง |
| **P0** | Regression ค้นหาปฏิทิน (ข้อมูลไม่หายเมื่อ filter) | LEGACY §2 |
| **P1** | Bulk assign Team A/B + Save ครั้งเดียว + summary real-time | LEGACY §5–7 |
| **P1** | Task List เป็นแท็บแรกใน WO dialog บนหน้า assign | LEGACY §6 |
| **P2** | แก้ user/username ผิด (เช่น `0`) | LEGACY §3–4 |
| **P2** | อ่าน Additional Requirement xlsx เป็นข้อ checklist | ไฟล์ 08–11Jun |
