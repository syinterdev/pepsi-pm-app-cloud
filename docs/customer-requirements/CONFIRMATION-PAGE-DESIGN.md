# หน้า Confirmation — สรุป + ออกแบบ (Planner)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** P4.1 Backend ✅ · P4.2–P4.4 ยังไม่ implement  
**ผู้ใช้หลัก:** **Planner** (ตรวจปิดงาน · Confirm/Reject · Export SAP)

**ไฟล์อ้างอิงลูกค้า:** [`docs from customer/Export_Confirm (26May).xlsx`](../../docs%20from%20customer/Export_Confirm%20(26May).xlsx)

---

## สิ่งที่ลูกค้าต้องการ

1. เมื่อ**ช่างกดปิดงาน**แล้ว — หน้า **Confirmation** แสดงข้อมูลเบื้องต้นเป็นตารางตามภาพ (Order · Operation · Wrk Ctr · Act.Work · …)
2. **ทำหน้านี้ใหม่** ทั้ง **sidebar** และ **page** — ชื่อเมนู **Confirmation** (ไม่แยก Personnel Confirmation / Export Confirmation)
3. **Planner** ดูข้อมูล · **ดูรูปการทำงาน** · กด **Confirm** หรือ **Reject**
4. **Export Confirmation** (นำไป upload SAP) — รูปแบบไฟล์ต้องตรง template ลูกค้าเท่านั้น

---

## ปัญหาปัจจุบัน (split ไม่ตรงลูกค้า)

| Route ปัจจุบัน | เมนู sidebar | ผู้ใช้ | ปัญหา |
|----------------|--------------|--------|--------|
| `/personnel/confirm` | Personnel Confirmation | **Admin** (`A`) | เน้น % ปิดงานรายคน — ไม่ใช่หน้าหลัก Planner |
| `/confirmation` | Export Confirmation | A:U:W | เน้น export/import/mass — ไม่รวม queue ตรวจงานช่างเป็นหน้าเดียว |

ลูกค้าต้องการ **หน้าเดียว** `/confirmation` = **Confirmation** สำหรับ Planner

---

## Flow ภาพรวม

```
ช่างปิดงาน (Close WO / Telegram)
        ↓
บันทึก personnel close / supervisor close / รูป
        ↓
Planner เปิด Confirmation — เห็นแถวตาราง (รูปแบบ Export) ต่อ WO / ต่อช่าง
        ↓
Planner ดูรูป · ตรวจข้อมูล · [Confirm] หรือ [Reject]
        ↓
Confirm แล้ว → แถวเข้า Export pool (QC approved)
        ↓
Planner กด Export To Excel → ไฟล์ตรง template → upload SAP
```

---

## โครงหน้าใหม่ — wireframe

```
┌─ Confirmation (Planner) ──────────────────────────────────────┐
│  [ค้นหา WO / Wrk Ctr]   แท็บ: ทั้งหมด | รอตรวจ | อนุมัติแล้ว | ส่งกลับ │
├─ รายการ WO (หรือรวมเป็นตารางเดียว) ───────────────────────────┤
│  ┌ ตารางข้อมูลปิดงาน (รูปแบบเดียวกับ Export — 9 คอลัมน์บนเว็บ) ┐ │
│  │ Order │ Op │ Wrk Ctr │ Act.Work │ unit │ Start… │ End… │  │ │
│  │ 4001571110 │ 10 │ UTI008 │ 60.00 │ Min │ 27052026 │ … │   │ │
│  │ 4001571110 │ 10 │ PRO019 │ 90.00 │ Min │ 27052026 │ … │   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [ดูรูป]  [Confirm]  [Reject]   (ต่อ WO หรือต่อแถวที่เลือก)      │
├─ Export Confirmation ──────────────────────────────────────────┤
│  ตารางเดียวกัน — เฉพาะแถวที่ Planner Confirm แล้ว              │
│  [Export To Excel]  [CSV]                                      │
└───────────────────────────────────────────────────────────────┘
```

### หลัก UI

| หลัก | รายละเอียด |
|------|-------------|
| ตารางหลัก | หัวคอลัมน์ + zebra แบบภาพลูกค้า (พื้นหัวเข้ม · แถวสลับสี) |
| Act.Work | ทศนิยม 2 ตำแหน่ง (เช่น `60.00`) |
| วันที่ | `DDMMYYYY` ไม่มีคั่น (เช่น `27052026`) |
| เวลา | `HH:mm` (เช่น `15:00`) |
| รูป | แกลเลอรี before/after จาก `tbconfirmimg` |
| Confirm / Reject | ใช้ flow QC ที่มี (`confirm_qc_status` → `approved` / `rejected`) |
| Export | แยก section ล่าง — แสดงเฉพาะแถวที่อนุมัติแล้ว |

---

## คอลัมน์ — เว็บ vs ไฟล์ Excel

### บนเว็บ (ตามภาพลูกค้า — 9 คอลัมน์)

| # | Header (EN) | ตัวอย่าง |
|---|-------------|----------|
| 1 | Order | `4001571110` |
| 2 | Operation | `10` |
| 3 | Wrk Ctr | `UTI008` |
| 4 | Act.Work | `60.00` |
| 5 | unit | `Min` |
| 6 | Start date Exe. | `27052026` |
| 7 | End Date Exe. | `27052026` |
| 8 | Start Execute | `15:00` |
| 9 | End Execute | `16:00` |

> ภาพลูกค้าสะกด **End Daate Exe.** — บนเว็บใช้ **End Date Exe.** (ตรง template Excel ลูกค้า)

### ไฟล์ Export Excel (บังคับ — 14 คอลัมน์ ตาม template)

จาก `Export_Confirm (26May).xlsx` แถว header:

| Col | Header | หมายเหตุ |
|-----|--------|----------|
| A | *(ว่าง)* | เลขลำดับแถว `1, 2, 3…` |
| B | **Comfirmation** | สะกดตามไฟล์ลูกค้า (ไม่แก้เป็น Confirmation) |
| C | Order | |
| D | Operation | |
| E | SubO | ว่างได้ |
| F | Ca.. | ว่างได้ |
| G | Split | ว่างได้ |
| H | Wrk Ctr | |
| I | Act.Work | ตัวเลข (นาที) |
| J | unit | `Min` |
| K | Start date Exe. | `DDMMYYYY` |
| L | End Date Exe. | `DDMMYYYY` |
| M | Start Execute | `HH:mm` |
| N | End Execute | `HH:mm` |

**Sheet name:** `Worksheet` (ในไฟล์ลูกค้า) — ตอน export ปัจจุบันใช้ `Export Confirm` → **ต้องปรับให้ตรงลูกค้า**

**ชื่อไฟล์แนะนำ:** `Export_Confirm.xlsx` (หรือตามวันที่ export)

---

## แหล่งข้อมูล

| ส่วน UI | แหล่ง | หมายเหตุ |
|---------|-------|----------|
| แถวตาราง (preview) | `tbwrkclose` / personnel close + join `tbiw37n` | หลังช่างปิด — **ก่อน** Planner Confirm |
| สถานะ QC | `tbiw37n.confirm_qc_status` | `pending` / `approved` / `rejected` |
| รูป | `tbconfirmimg` (BYTEA WebP) | phase before/after |
| แถว Export | `app.view_exportconfirm` | หลัง `confirm_qc_status = approved` |
| % ปิด (เสริม) | `view_countpersonelclose` | อาจแสดง badge รอง — ไม่เป็นหัวหน้า |

---

## Sidebar / Route (เป้าหมาย)

| ก่อน | หลัง |
|------|------|
| `/personnel/confirm` — Personnel Confirmation (Admin) | **ยุบ/redirect** → `/confirmation` |
| `/confirmation` — Export Confirmation | **`/confirmation` — Confirmation** |
| เมนู 2 รายการ | **เมนูเดียว** `Confirmation` · `menuright: A:U` (Planner+) |

**Permission (ร่าง)**

| การกระทำ | Permission |
|----------|------------|
| ดูหน้า / ตาราง | `confirmation.read` |
| Confirm / Reject | `confirmation.import` (QC review — มีแล้ว) หรือ permission ใหม่ `confirmation.review` |
| Export Excel | `confirmation.export` |

---

## สถานะโค้ดปัจจุบัน vs ที่ต้องทำ

| หัวข้อ | มีแล้ว | ต้องทำ |
|--------|--------|--------|
| ตาราง 9 คอลัมน์บนเว็บ | `ConfirmationExportTablePanel` | ย้ายเป็นส่วนหลัก · แสดงแถว **รอตรวจ** ด้วย (ไม่ใช่แค่ approved) |
| Export Excel 14 คอลัมน์ | `GET /confirmation/export.xlsx` | ตรวจ sheet name · Act.Work format · regression กับ template |
| Confirm / Reject | `ConfirmQcPanel` · `POST .../qc/approve|reject` | ย้ายเข้า page หลัก · ผูกกับแถว/WO |
| ดูรูป | `ConfirmationImagesPanel` | เปิดใน drawer/modal จากหน้า Confirmation |
| Queue WO | `PersonnelConfirmPage` + `ConfirmQcPendingQueue` | รวมเป็นหน้าเดียว |
| Sidebar | `nav-config.ts` 2 เมนู | เหลือ **Confirmation** เดียว |

### Gap สำคัญ

1. **Preview vs Export** — ตอนนี้ `listConfirmationExportRows` กรอง `confirm_qc_status = approved` เท่านั้น · ลูกค้าต้องการเห็นข้อมูล**ทันทีหลังช่างปิด** → ต้อง API แยก `listConfirmationPreviewRows` (ทุก close ที่รอตรวจ)
2. **Sheet name** Excel — โค้ดใช้ `Export Confirm` · ลูกค้าใช้ `Worksheet`
3. **Route `/personnel/confirm`** — redirect Planner ไป `/confirmation`

---

## API ที่ต้องมี / ปรับ (ร่าง)

```text
GET  /api/v1/confirmation/preview          — แถวปิดงานรอ Planner (รูปแบบ 9/14 ฟิลด์)
GET  /api/v1/confirmation/export           — แถวที่ approved แล้ว (มีอยู่)
GET  /api/v1/confirmation/export.xlsx      — ไฟล์ตรง template (ปรับ sheet name)
POST /api/v1/confirmation/:idiw37/qc/approve
POST /api/v1/confirmation/:idiw37/qc/reject
GET  /api/v1/confirmation/:idiw37/images
```

---

## ไฟล์ที่จะแตะตอน implement

| ชั้น | ไฟล์ |
|------|------|
| Page | `ConfirmationPage.tsx` (เขียนใหม่/รวม) · ลดบทบาท `PersonnelConfirmPage.tsx` |
| Components | `ConfirmationExportTablePanel.tsx` · `ConfirmQcPanel.tsx` · `ConfirmationImagesPanel.tsx` |
| Nav | `nav-config.ts` · `nav.json` · migration `tbmenu` ถ้าต้อง sync DB |
| BE | `confirmation.ts` · `personnel-confirm.ts` · `routes/work-orders.ts` (export.xlsx) |
| i18n | `confirmation.json` — title `Confirmation` แทน `Export Confirmation` |

---

## Regression — Export ต้องผ่าน checklist

- [ ] Header 14 คอลัมน์ตรง `Export_Confirm (26May).xlsx` (รวมสะกด **Comfirmation**)
- [ ] ลำดับแถว column A = 1, 2, 3…
- [ ] วันที่ `DDMMYYYY` · เวลา `HH:mm` · unit = `Min`
- [ ] หนึ่ง Order หลายแถวได้ (หลาย Wrk Ctr) — ตามภาพ
- [ ] เปรียบเทียบ byte/structure กับไฟล์ลูกค้าหลัง export (UAT)

---

## อ้างอิง

- สรุปภาพรวม: [`MASTER-PLAN-MNTPLAN-BINDING.md`](MASTER-PLAN-MNTPLAN-BINDING.md)
- ช่างปิดงาน: [`CLOSE-WO-TAB-DESIGN.md`](CLOSE-WO-TAB-DESIGN.md)
- Parity: [`docs/PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) — `M_Confirm.php`, `M_Export_confirm.php`
- UAT: [`UAT-ROUND-3-TH.md`](UAT-ROUND-3-TH.md)
