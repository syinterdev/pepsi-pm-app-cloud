# ตรวจ `functionalloc` กับ filter โรงงาน `7151`

อัปเดต: 2026-05-22  
สคริปต์: `PM-Pepsi-App/backend/scripts/probe-functionalloc-7151.ts`

---

## สรุปหนึ่งย่อหน้า

| แหล่งข้อมูล | แถว parse | มี `7151` ใน `functionalloc` | ปฏิทิน/WO เห็นงาน? |
|-------------|-----------|--------------------------------|-------------------|
| **`IW37N ล่าสุด.xlsx`** (SAP ALV) | 1163 | **0 (0%)** | **ไม่** — filter `LIKE %7151%` กรองหมด |
| **`IW37N May-Jun.xls`** (legacy) | 2560 | **2560 (100%)** | **ได้** — โค้ดแบบ `PI-TH-7151-FA-PK-02` |
| DB หลัง `uat:reset-iw37n` | 0 | 0 | — |

**สาเหตุ:** ไฟล์ SAP ALV **ไม่มีคอลัมน์ Functional loc.** (รหัส) — มีแค่ **FunctLocDescrip.** (คำอธิบาย)  
Parser จึงใส่คำอธิบายลง `functionalloc` เช่น `FACTORY 1 PC50MZ` แทน `PI-TH-7151-...`

---

## ระบบกรองอย่างไร

PHP (`M_filter_iw37.php`) ใช้:

```sql
functionalloc LIKE '%7151%'
```

React backend ใช้ `sqlFactoryScope()` ใน `scheduling-shared.ts` (กว้างกว่า PHP เล็กน้อย):

```sql
(functionalloc ILIKE '%7151%' OR funcdescrip ILIKE '%7151%')
```

ค่าโรงงาน: `FACTORY_CODE = '7151'` (เทียบ `$Factory_code` ใน `define.php`)

**ใช้ใน:** `calendar.ts`, `backlog.ts`, `work-orders.ts`, `scheduling-move.ts` (อัปเดต 2026-05-22)  
**ไม่ใช้ใน:** `plan-calendar` (`view_planwork`), `line-calendar` (`tblineschdul`), `master-data`

---

## ผล probe ไฟล์ลูกค้า

### SAP ALV — `from customer/SAP data/Data/IW37N ล่าสุด.xlsx`

หัวคอลัมน์ (แถว header):

```
… | 17:Equipment descriptn | 18:FunctLocDescrip.
```

**ไม่มี** `Functional loc.` / `Equipment` (รหัส)

ตัวอย่างหลัง parse:

| wkorder | functionalloc (ใน DB) | มี 7151? |
|---------|----------------------|----------|
| 4000113383 | `FACTORY 1 PC50MZ` | ไม่ |
| 4000113397 | `FACTORY 2 RBS` | ไม่ |

### Legacy — `from customer/SAP data/Jul/IW37N May-Jun.xls`

หัวคอลัมน์:

```
… | 16:Equipment | 17:Equipment descriptn | 18:Functional loc. | 19:FunctLocDescrip.
```

ตัวอย่าง:

| functionalloc |
|---------------|
| `PI-TH-7151-FA-PK-02` |
| `PI-TH-7151-FA-PK-05` |

---

## วิธีตรวจซ้ำ

```powershell
cd PM-Pepsi-App\backend
npm run probe:functionalloc
# หรือไฟล์เดียว:
npx tsx scripts/probe-functionalloc-7151.ts "C:\path\to\file.xlsx"
```

หลัง import แล้ว ดูใน DB:

```sql
SELECT COUNT(*) FROM app.tbiw37n;
SELECT COUNT(*) FROM app.tbiw37n WHERE functionalloc ILIKE '%7151%';
SELECT COUNT(*) FROM app.view_order
 WHERE functionalloc LIKE '%7151%' AND bscstart IS NOT NULL AND bscstart > 0;
```

---

## แนวทางแก้ (เลือกอย่างใดอย่างหนึ่ง)

### A) UAT / dev ทันที (แนะนำ)

1. Import **`IW37N May-Jun.xls`** ที่ `/integration` (legacy layout)
2. บนปฏิทินเลือกปี **2020** เดือน **พ.ค.–มิ.ย.**
3. รัน `npm run probe:functionalloc` → ต้องเห็น `view_order` > 0

### B) ฝั่ง SAP (production)

ขอ export IW37N ALV ให้มีคอลัมน์ **Functional loc.** (รหัส) เหมือน legacy — ไม่ใช่แค่ FunctLocDescrip.

### C) Parser + import (ทำแล้ว 2026-05-23)

- แมปคอลัมน์จาก **ชื่อ header** (`iw37n-column-map.ts`)
- ALV: `Equipment descriptn` → `equdescrip`, `FunctLocDescrip.` → `funcdescrip`
- ถ้าไม่มีคอลัมน์ `Functional loc.` → ใส่ `functionalloc = 7151-{funcdescrip}` ตอน import (`ensureFactoryScopeFunctionalloc`)
- ปฏิทินใช้ `(functionalloc OR funcdescrip) LIKE %7151%`

**แก้ข้อมูลที่นำเข้าไปแล้ว (ไม่ต้อง import ใหม่):**

```powershell
cd PM-Pepsi-App\backend
npx tsx scripts/fix-functionalloc-7151.ts
```

---

## Checklist AUTOMATION-PHASES A1

- [x] **ตรวจแล้ว** — ALV ล่าสุด: 0% มี 7151 (เอกสารนี้)
- [ ] **ผ่าน UAT ปฏิทิน/WO** — ใช้ไฟล์ legacy หรือ SAP export ที่มี Functional loc.
- [ ] ตกลงกับลูกค้าเรื่อง layout ALV ใน SAP
