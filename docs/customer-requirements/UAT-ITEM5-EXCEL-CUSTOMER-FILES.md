# รายงาน UAT — ไฟล์ Excel จากลูกค้า (ข้อ 5)

**โครงการ:** PM Pepsi App  
**วันที่ทดสอบ:** 3 มิถุนายน 2026  
**อ้างอิง:** Checklist รอบ 2 ข้อ 5 · P0 #2 — IW37N Template 2026 · [`MEETING-SUMMARY-REQUIREMENTS.md`](MEETING-SUMMARY-REQUIREMENTS.md)  
**โฟลเดอร์ไฟล์:** `docs from customer/`

---

## สรุปผล (Executive Summary)

| หัวข้อ | ผล | หมายเหตุ |
|--------|-----|----------|
| **นำเข้า IW37N — ZB02All** | **ผ่าน** | 522 แถว · 516 Order · ปฏิทินพ.ค. 2026 แสดง **212** รายการ |
| **นำเข้า Confirm IN คู่ ZB02All** | **ยังไม่ผ่าน** | ไม่มีไฟล์ Confirm ในโฟลเดอร์ที่ **Order ตรง** กับ ZB02All |
| **ไฟล์ ZB02All 1** | **ไม่ใช่ Confirm** | เนื้อหา **เหมือน ZB02All ทุก Order** — ใช้นำเข้า IW37N ได้ แต่ **ไม่ใช่** แท็บ Confirm IN |
| **Export_Confirm (26May).xlsx** | **ยัง parse ไม่ได้** | 0 แถว Confirm — รูปแบบคอลัมน์ไม่ตรง parser ปัจจุบัน |
| **Master PM / Task List / Eng Time** | **อ้างอิง + Master Plan** | Master PM 3 ไฟล์ → `/master-plan` (อ่าน/แก้/import/export/publish) · Eng Time = UAT แยก |
| **IW37N & MB51 template (SAP)** | **อ้างอิง** | 5 sheets — ข้อมูล WO อยู่ **IW37N Excel** · MB51 = วัสดุ |
| **Template PM ค่าวัด (กระแส 3 เฟส)** | **ผ่าน** | Template ในระบบ parse ได้ 9 แถว · 0 error (แก้ตาม feedback ลูกค้า) |

**สรุปสั้น:** ระบบ **พร้อมรับ IW37N ชุด ZB02All** แล้ว · ขั้นต่อไปต้องได้ **ไฟล์ Confirm IN จาก SAP** ที่ Order ชุด `400157xxxx` ตรงกับ IW37N ก่อนปิด P0 #2 ครบ

---

## 1) ไฟล์ Excel ทั้งหมดใน `docs from customer/`

| # | ไฟล์ | ประเภทที่ใช้ใน PM App | ผลทดสอบ | คำแนะนำ |
|---|------|------------------------|---------|---------|
| 1 | `Templete IW37N on PM App - ZB02All.xlsx` | **IW37N (ZB02)** | **ผ่าน** — 522 แถว · Order `4001570392` … `4001570931` (516 Order) | ใช้ที่ `/integration` หรือ `/iw37n` → แท็บ **นำเข้า IW37N** |
| 2 | `Templete IW37N on PM App - ZB02All 1.xlsx` | **IW37N (ซ้ำ #1)** | **Identical กับ #1** | **ไม่ใช่ Confirm IN** — ไม่ต้องอัปที่แท็บ Confirm |
| 3 | `Export_Confirm (26May).xlsx` | คาดว่า Confirm IN | **ไม่ผ่าน** — parser ได้ 0 แถว | ขอ export SAP รูปแบบ ALV Confirm / IW47 ที่มี Order ตรง ZB02All |
| 4 | `01-MASTER PM PROCESS EE 2026.xlsx` | Master แผน PM (EE) | ไม่ใช่ IW37N | **Phase 1–4 ✅** — seed + UI `/master-plan` · แก้/log/import/export/publish |
| 5 | `02-MASTER PM PROCESS ME 2026.xlsx` | Master แผน PM (ME) | ไม่ใช่ IW37N | **Phase 1–4 ✅** — `/master-plan?discipline=ME` |
| 6 | `03-MASTER PM PACKING 2026.xlsx` | Master แผน PM (Packing) | ไม่ใช่ IW37N | **Phase 1–4 ✅** — `/master-plan?discipline=PK` (37 sheets) |
| 7 | `PMTaskList (Test PK1DC).xlsx` | Task list ทดสอบ | ไม่ใช่ IW37N/Confirm | อ้างอิง PK1 DC |
| 8 | `LPN Engineer Time 2026.04.xlsx` | Man-hour / Utilization | ไม่ใช่ IW37N | ใช้เทียบรายงาน Eng Utilization (UAT แยก) |
| 9 | `Code ช่าง Eng.xls` | รหัสช่าง / Work center | ไม่ใช่ IW37N | อ้างอิง mapping ช่าง |
| 10 | `IW37N & MB51 template.xlsx` | **Template SAP โดยตรง** (IW37N + MB51) | อ้างอิง · ดู §6 | 5 sheets — ข้อมูลจริงอยู่ sheet **IW37N Excel** · MB51 = วัสดุ (261/262) |

---

## 2) ทดสอบอัตโนมัติ — IW37N ZB02All

**คำสั่ง (ทีม dev):**

```powershell
cd PM-Pepsi-App\backend
npm run uat:phase2-zb02all -- --reset
```

**ผลล่าสุด (3 มิ.ย. 2026):**

| รหัสทดสอบ | ผล | รายละเอียด |
|-----------|-----|------------|
| `iw37n-zb02all` | **ผ่าน** | Batch insert **522** แถว · ไม่ duplicate |
| `calendar-after-zb02all` | **ผ่าน** | ปฏิทิน **212** events · เดือน **พ.ค. 2026** |
| `confirm-in-paired` | **ไม่ผ่าน** | ไม่พบไฟล์ Confirm ที่ match Order ZB02All |

**หลัง import ใน DB:**

| รายการ | ค่า |
|--------|-----|
| แถวใน `tbiw37n` | 522 |
| Order ไม่ซ้ำ | 516 |
| ช่วง Order (จากไฟล์) | `4001570392` … `4001570931` |

---

## 3) Confirm IN — สิ่งที่ยังขาด (รอลูกค้า)

### ปัญหา

- ไฟล์ **`ZB02All 1`** ชื่อคล้าย Confirm แต่เป็น **IW37N ชุดเดียวกับ ZB02All** ทุก Order
- ไฟล์ **`Export_Confirm (26May).xlsx`** ในโฟลเดอร์ **ยังอ่านไม่ได้** (0 แถว Confirm)

### ไฟล์ Confirm อื่นที่ลองแล้ว (นอกโฟลเดอร์นี้) — ไม่ match ZB02All

| ไฟล์ | แถว Confirm | Order ตรง ZB02All |
|------|-------------|-------------------|
| `AcZB02,ZB05-Done.xlsx` | 749 | **0** |
| `IW47 Daily 12May2026.xlsx` | 94 | **0** (Order 400156xxxx) |
| `Export_Confirm (26May).xlsx` | 0 | **0** |

### สิ่งที่ขอจากลูกค้า

1. Export **Confirm IN** จาก SAP **ชุดเดียวกับ** IW37N ZB02All (Order `4001570392` …)
2. อัปที่ `/integration` → แท็บ **นำเข้า Confirm (IN)** — **ไม่ใช่** แท็บ IW37N
3. เกณฑ์ผ่าน: มีแถว insert/update **> 0** · ไม่ skipped ทั้งก้อนเพราะ “ไม่พบ WO”

---

## 4) UAT มือ (Planner / ผู้ทดสอบฝั่งลูกค้า)

### 4.1 IW37N ZB02All — ผ่านแล้ว (ยืนยันซ้ำได้)

1. Login สิทธิ์ `iw37n.import`
2. เปิด `/integration` → **นำเข้า IW37N**
3. เลือก `Templete IW37N on PM App - ZB02All.xlsx`
4. Preview → ต้องเห็น inserted/updated **> 0** → Commit
5. เปิด `/calendar` → เลือก **พ.ค. 2026** → ต้องเห็น WO ประเภท ZB02

### 4.2 Confirm IN — รอไฟล์

ทำขั้นตอนเดียวกับ 4.1 ที่แท็บ **Confirm IN** เมื่อได้ไฟล์ SAP ที่ Order ตรง

### 4.3 PM ค่าวัด / กระแส 3 เฟส (Template Excel ในระบบ)

- ดาวน์โหลด: หน้า **PM ค่าวัด / กระแส 3 เฟส** → **ดาวน์โหลด template**
- โครง 10 คอลัมน์ · Sheet **กระแส 3 เฟส** (Phase R/S/T) · Sheet **Vibration 3 แกน** (แกน X/Y/Z)
- รายละเอียด: [`PM-MEASUREMENTS-3PHASE-CURRENT.md`](PM-MEASUREMENTS-3PHASE-CURRENT.md)

### 4.4 Master Plan EE / ME / PK (ไฟล์ `01`–`03-MASTER PM … 2026.xlsx`)

**หน้า:** `/master-plan` (เมนู **Master Plan** — แยกจาก Master Data SAP ที่ `/master-data`)

| ลำดับ | รายการ UAT | ผ่าน | หมายเหตุ |
|------|------------|:----:|----------|
| 1 | เปิด EE — แท็บ sheet ชื่อและลำดับตรง Excel | ☐ | 15 sheets |
| 2 | เปิด ME — รวม `legend`, `Total Master plan` | ☐ | 16 sheets |
| 3 | เปิด PK — มีทั้ง `PK1` และ `PK1 (Production)` | ☐ | 37 sheets · ค้นหา sheet |
| 4 | Zone / Machine List fill-down ตรง Excel | ☐ | เทียบแถวที่เซลล์ว่าง |
| 5 | ดับเบิลคลิกแก้ PM list / days / Min → refresh ยังอยู่ | ☐ | ต้องมี `master-data.write` |
| 6 | Change history แสดง who / when / before / after | ☐ | ปุ่ม Change history |
| 7 | ลิงก์แถว → IW37N / WO | ☐ | คอลัมน์ Links |
| 8 | Export Excel แล้วเปรียบจำนวนแถวต่อ sheet | ☐ | ปุ่ม Export Excel |
| 9 | Import Excel ใหม่ → draft + Publish → Task list | ☐ | วงจรประจำปี |

**Dev verify:** `cd PM-Pepsi-App/backend && npm run verify:master-plan`

---

## 6) Template SAP โดยตรง — `IW37N & MB51 template.xlsx`

ไฟล์นี้เป็น **คู่มือ + ตัวอย่าง export จาก SAP** (ไม่ใช่ไฟล์ Planner เตรียมแบบ ZB02All)

| Sheet | เนื้อหา | ใช้กับ PM App |
|-------|---------|---------------|
| **IW37N** | วิธีตั้ง Filter ใน SAP (Order Status, ZB01–ZB05, Plant 7151) | อ้างอิง — **ไม่ใช่ข้อมูล import** |
| **MB51** | วิธี export Movement 261/262 · Layout GIAPP | อ้างอิง — **วัสดุ/GR-GI นอก scope import หลัก** |
| **IW37N Excel** | ตัวอย่าง ALV export · **~2,408 Order** · ZB02/ZB05 | **รูปแบบที่ parser รองรับ** (MntPlan, Order, Type, …) |
| **MB51 Excel** | Material Document · MvT 261 | ยังไม่ import — อ้างอิง GR/GI |
| Sheet1 | ว่าง | — |

**คำแนะนำ**

- นำเข้า WO: export จาก transaction **IW37N** ให้ได้รูปแบบเดียวกับ sheet **IW37N Excel** — หรือใช้ **`Templete IW37N…ZB02All.xlsx`** (522 แถว · พ.ค. 2026) ที่ทดสอบผ่านแล้ว
- ไฟล์รวม 5 sheets — อัปทั้งไฟล์ parser จะรวมทุก sheet (มีแถวคำแนะนำปน) · **แนะนำ export แยกเฉพาะ ALV data**
- ตรวจสอบ dev: `npx tsx scripts/inspect-iw37n-mb51-template.ts`

---

## 5) Checklist สำหรับลูกค้า (เช็ค/เซ็นรับทราบ)

| ลำดับ | รายการ | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|------|--------|:----:|:-------:|----------|
| 1 | IW37N ZB02All นำเข้าได้ · 522 แถว | ☐ | ☐ | |
| 2 | ปฏิทินพ.ค. 2026 แสดง WO ZB02 | ☐ | ☐ | 212 events |
| 3 | เข้าใจว่า ZB02All 1 = IW37N ไม่ใช่ Confirm | ☐ | ☐ | |
| 4 | จะส่งไฟล์ Confirm IN ที่ Order ตรง ZB02All | ☐ | ☐ | |
| 5 | Template PM กระแส 3 เฟส ตรงเอกสาร WO | ☐ | ☐ | Phase R/S/T (A) |

**ผู้ทดสอบ (ลูกค้า):** ___________________  
**วันที่:** ___________________  
**ความเห็นเพิ่มเติม:** ___________________

---

## เอกสารที่เกี่ยวข้อง

- [`UAT-ZB02ALL-TEMPLATE.md`](UAT-ZB02ALL-TEMPLATE.md) — รายละเอียด technical ZB02All
- [`PM-MEASUREMENTS-3PHASE-CURRENT.md`](PM-MEASUREMENTS-3PHASE-CURRENT.md) — สเปก PM กระแส 3 เฟส
- [`MEETING-SUMMARY-REQUIREMENTS.md`](MEETING-SUMMARY-REQUIREMENTS.md) — checklist ความต้องการรวม
- [`../superpowers/specs/2026-06-09-master-plan-design.md`](../superpowers/specs/2026-06-09-master-plan-design.md) — สเปก Master Plan + ข้อความตอบลูกค้า §13
- [`../USER-MANUAL-TH.md`](../USER-MANUAL-TH.md) §6.4 — คู่มือ Master Plan

---

*รายงานนี้สร้างจาก automation `npm run uat:phase2-zb02all` และสคริปต์ `scripts/probe-customer-excel.ts` · อัปเดตเมื่อได้ไฟล์ Confirm IN ชุดใหม่จะทดสอบซ้ำและแก้สถานะข้อ 4*
