# ผลตรวจไฟล์ตัวอย่าง SAP (ลูกค้า)

อัปเดต: **2026-05-22** (IW37N auto-detect ใน `iw37n-parser.ts`)  
สคริปต์: `PM-Pepsi-App/backend/scripts/inspect-iw37n-sample.ts`, `inspect-confirm-sample.ts`

---

## สรุปสั้น

| ไฟล์ | รูปแบบ | Parser ปัจจุบัน | ต้องทำ |
|------|--------|-----------------|--------|
| `SAP data/Data/IW37N ล่าสุด.xlsx` | SAP ALV | **`sap_alv` → 1163 แถว** ✅ | — |
| `Test/IW37N (27May).xls` | Legacy header | **`legacy` → 1183 แถว** ✅ (Excel serial date) | — |
| `AcZB02,ZB05-Done.xlsx` | SAP ALV Confirm | **`sap_alv` → 749 OK** ✅ (137 err ส่วนใหญ่ END_BEFORE_START) | — |
| `SAP data/Data/Confirm WO.xls` | SAP ALV Confirm | **`sap_alv` → 49 OK** ✅ | — |

---

## IW37N — `IW37N ล่าสุด.xlsx`

```
path: from customer/SAP data/Data/IW37N ล่าสุด.xlsx
sheet: IW37N ล่าสุด
totalRows: 1177
row4 (header): S, MntPlan, Order, Type, MAT, Bsc start, ..., OpAc, ...
parseIw37nFileWithMeta (2026-05-22): layout `sap_alv`, **1163** rows, 0 missing bscstart
sample: wkorder=4000113383, opac=10, wkctr=PRO002, mntplan=610000004147
```

**กติกา ALV (probe):**

- แถว 1–3: banner / ว่าง
- แถว 4: header (มีคอลัมน์นำ `S`)
- ข้อมูล: offset คอลัมน์ **+2** จาก index มาตรฐาน PHP (`Order` ที่ index 3 ไม่ใช่ 1)

---

## IW37N — `Test/IW37N (27May).xls` (legacy header)

```
sheet: Sheet1
row1: MntPlan, Order, Type, ... (header ทันที)
parsedRows (current parser): 1183
alvProbeRows (ALV rule): 0
rowsWithoutBscstart: 468 (import อาจ skip)
```

ใช้เป็น regression สำหรับ **export แบบเก่า** (ไม่ใช่ ALV)

---

## Confirm — `AcZB02,ZB05-Done.xlsx`

```
sheet: AcZB02
totalRows: 890
parseConfirm (M_Confirm / skip 2 rows): ok=0, err=887
alvConfirmProbeRows (header row 4): 750
sample: confirm=3021735, order=4000073467, wkctr=PAC002, timewk=960, unit=MIN
```

**ไม่ใช่ไฟล์ IW37N** — เป็น Confirmation IN จาก SAP (ZB02/ZB05 done)

---

## Confirm — `Confirm WO.xls` (ชุดเล็ก · regression)

> **ชื่อไฟล์ทำให้เข้าใจผิด:** อยู่ในโฟลเดอร์ข้อมูลเก่า แต่รูปแบบคือ **SAP ALV** (แถว 1 มี `Dynamic List Display`) — **ไม่ใช่** layout `M_Confirm.php` (skip 2 แถว + index คงที่)

```
path: from customer/SAP data/Data/Confirm WO.xls
detectedLayout: sap_alv
parseConfirm: 49 OK / 0 err (2026-05-22)
```

**ต่างจาก `AcZB02,ZB05-Done.xlsx`:**

| รายการ | Confirm WO.xls | AcZB02,ZB05-Done.xlsx |
|--------|----------------|------------------------|
| แถวข้อมูล | ~49 | ~886 |
| คอลัมน์เวลา | `Act.start` / `Act.finish` สลับกับ `Act. start` + Excel serial | `Act. start` + เศษวัน (0.36…) |
| Parser | `pickDateTimeCells()` จับคู่วันที่/เวลาอัตโนมัติ | แมป header มาตรฐาน ALV |

ใช้เป็น **ไฟล์ regression** ยืนยันว่า confirm ALV รองรับหลายรูปแบบ header ไม่ใช่แค่ชุด ZB02 ใหญ่

---

## คำสั่งรันซ้ำ

```powershell
cd PM-Pepsi-App/backend
npx tsx scripts/inspect-iw37n-sample.ts "C:/Users/Chinchettha/Desktop/sap_241163/from customer/SAP data/Data/IW37N ล่าสุด.xlsx"
npx tsx scripts/inspect-confirm-sample.ts "C:/Users/Chinchettha/Desktop/sap_241163/from customer/AcZB02,ZB05-Done.xlsx"
npx tsx scripts/inspect-confirm-sample.ts "C:/Users/Chinchettha/Desktop/sap_241163/from customer/SAP data/Data/Confirm WO.xls"
```

---

## สถานะ implement (2026-05-22)

| Parser | สถานะ |
|--------|--------|
| IW37N `sap_alv` + `legacy` | ✅ `iw37n-parser.ts` |
| Confirm `sap_alv` + `legacy` | ✅ `confirmation-import.ts` |
| UAT บน `/integration` | ⏳ Phase 2 — [`WORK-PHASES.md`](../WORK-PHASES.md) |
