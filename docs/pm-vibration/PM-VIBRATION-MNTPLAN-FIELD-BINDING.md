# PM Vibration — สรุปการผูกฟิลด์ MntPlan · IW37N · Master Plan

**อัปเดต:** 2026-06-21  
**สถานะ:** สรุปข้อกำหนดลูกค้า (ก่อน implement)  
**เกี่ยวข้อง:** [`PM-VIBRATION-IMPLEMENTATION-PHASES.md`](PM-VIBRATION-IMPLEMENTATION-PHASES.md) · [`MASTER-PLAN-MNTPLAN-BINDING.md`](../customer-requirements/MASTER-PLAN-MNTPLAN-BINDING.md)

---

## 1) สรุปสั้น (ที่ลูกค้ายืนยัน)

| ฟิลด์บนฟอร์ม PM (หน้า 1) | แหล่งข้อมูล | คอลัมน์ต้นทาง |
|---------------------------|------------|---------------|
| **Start Date** | IW37N | **`Bsc start`** → `tbiw37n.bscstart` |
| **Header Short Text** | IW37N | **`MntPlan`** → `tbiw37n.mntplan` |
| **Functional Location** | IW37N | **`Functional Loc.`** → `functionalloc` |
| **Description** (คู่ FL) | IW37N | **`FunctLocDescrip.`** → `funcdescrip` |
| **Equipment** | IW37N | **`Equipment`** → `equipment` |
| **Description** (คู่ Equipment) | IW37N | **`Equipment descriptn`** → `equdescrip` |
| **คีย์ผูกแผน** | IW37N = Master Plan | **`MntPlan`** = **`Maintenance Plan`** |
| **Operation** | IW37N | **`OpAc`** → `opac` |
| **Operation Text** | Master Plan (via `mntplan`) | `{days}W - {ข้อความ MntPlan/แผน}` |
| **Operation Long Text** | Master Plan | **`PM List`** ทุกแถวใต้ maintenance plan |
| **Completion Date / Duration** | ช่างกรอก (กระดาษ) | **ไม่ persist แยก** — ใช้ personnel-close → Page 2 |

**กฎคงที่:**

- เลข **MntPlan / Maintenance plan** เป็นตัวอ้างอิง **คงที่** ตาม SAP (ไม่เปลี่ยนทุกรอบ WO)
- เลข **Work Order** (`wkorder`) **เปลี่ยนทุกครั้ง** ที่ SAP ส่งใบงานรอบใหม่
- ค่า `mntplan` ใน IW37N มาจาก WO ชุดนั้น — ใช้จับคู่กับแผนใน Master Plan

### 1b) เอาออกจาก UI (ยืนยัน markup ภาพลูกค้า)

| ส่วน UI | การทำ |
|---------|--------|
| **Description** (บล็อกกลาง — ไม่ใช่คู่ FL/Equipment) | **ลบ** — เช่น `Sheeting & Cutting Unit` |
| **Object list:** + **No objects found** | **ลบทั้งบล็อก** |
| **Header Short Text** | **คงไว้** — แสดงค่าจาก **`MntPlan`** (`mntplan`) ไม่ใช่ `operationshorttext` |

```text
[เอาออก]  Description: Sheeting & Cutting Unit
[คงไว้]   Header Short Text: 345969          ← mntplan
[เอาออก]  Object list: / No objects found
```

```text
SAP (IW37N import)                    Master Plan (Excel)
─────────────────────                 ─────────────────────
wkorder        ← เปลี่ยนทุกรอบ        Maintenance Plan  ← คงที่
mntplan        ───── ค่าเดียวกัน ────► Maintenance Plan
Bsc start      → Start Date           Legacy              ← สาขา/zone ใต้ plan
Description    → (บริบท operation)    M/C · PM list · Man · หยุด/เดิน …
```

---

## 2) MntPlan — ตัวผูกหลัก

### 2.1 ค่าเดียวกัน 2 ระบบ

| ระบบ | คอลัมน์ Excel / UI | คอลัมน์ DB |
|------|---------------------|-----------|
| **IW37N** | `MntPlan` | `app.tbiw37n.mntplan` |
| **Master Plan** | `Maintenance Plan` (หรือ SAP Code / Mant) | ใน `cells_json` → publish → `app.tbtasklist.mntplan` |

**กฎ:** `TRIM(iw37n.mntplan) = TRIM(tasklist.mntplan)` — ใช้ join ดึง task list, PM readings prefill, ลิงก์จาก Master Plan

### 2.2 ความสัมพันธ์กับ Legacy และ Description

ภายใต้ **Maintenance plan เดียวกัน** ข้อมูลเรียงแบบนี้:

```text
mntplan (คงที่ · จาก SAP)
    │
    ├──► Legacy (Master Plan)     เช่น P17-HR-ME2 · SE0-MI-EE
    │         └── Machine (M/C) → PM list → Man · หยุด/เดิน …
    │
    └──► Description (IW37N)       คอลัมน์ Description → ostdescription
```

| ฟิลด์ | แหล่ง | บทบาท |
|-------|-------|--------|
| **Legacy** | Master Plan คอลัมน์ `Legacy` | รหัสสาขาช่าง / zone ใต้ `mntplan` — ใช้จับบริบทแผน (craft, wkctrtype) |
| **Description** | IW37N คอลัมน์ `Description` → `ostdescription` | ข้อความ operation จาก SAP ของ WO รอบนั้น — **สอดคล้อง/อธิบาย** งานใต้ plan เดียวกัน |

**จำง่าย:**

- **mntplan** = เชื่อม IW37N ↔ Master Plan ↔ Task list
- **Legacy** = บอกว่า plan นี้อยู่สาขา/ฝ่ายไหน (จากแผน)
- **Description** = ข้อความ SAP ของ operation (จาก WO รอบนั้น)

> ลูกค้าระบุ: mntplan **ผูกกับ Legacy จาก Master Plan** และ **ตรง/สัมพันธ์กับ Description จาก IW37N** — ไม่ใช่เลข WO

### 2.3 สิ่งที่เปลี่ยน vs ไม่เปลี่ยน

| รายการ | เปลี่ยนเมื่อไหร่ |
|--------|------------------|
| `mntplan` / Maintenance Plan | **คงที่** ตาม SAP · เปลี่ยนเมื่อลูกค้าอัปเดตแผนประจำปี / SAP master |
| `wkorder` | **ทุกรอบ PM** — import IW37N ใหม่ |
| `bscstart` (Start Date) | ตาม WO แต่ละใบจาก SAP |
| `ostdescription` (Description) | ตาม WO / operation จาก SAP |
| แถว PM (machine, pmlist, Man …) | แก้ที่ Master Plan + **Publish** — ไม่แก้ถาวรที่ WO |

---

## 3) Operation · Operation Text · Operation Long Text

*(ยืนยันจากภาพ markup ลูกค้า — Sheeting & Cutting Zone / PM list 5 รายการ)*

### 3.1 Operation (อ่านอย่างเดียว)

| ฟิลด์ UI | คอลัมน์ IW37N | DB | ตัวอย่าง |
|---------|---------------|-----|----------|
| **Operation** | `OpAc` | `opac` | `0010` |

**โค้ดวันนี้:** `operationNumber` ← `opac` ✅ ตรงแล้ว (default `0010` ถ้าว่าง)

### 3.2 Operation Text (อ่านอย่างเดียว · ประกอบจาก Master Plan)

**รูปแบบบนกระดาษ:**

```text
2W - EE Sheeting & Cutting Zone (ST3)
│      └────────────────────────────── ส่วนที่ 2
└─ ส่วนที่ 1
```

| ส่วน | แหล่ง | คอลัมน์ Master Plan | DB (หลัง Publish) |
|------|-------|----------------------|-------------------|
| **`2W`** (ความถี่) | Master Plan | **`days`** | `tbtasklist.pmday` → แสดงเป็น `{n}W` (= n สัปดาห์) |
| **`EE Sheeting & Cutting Zone (ST3)`** | Master Plan แถวที่ผูก `mntplan` | ข้อมูล **MntPlan / แผน** ใต้ maintenance plan เดียวกัน | จาก summary แถวแรก: `legacy` · `zone` · `machineList` · `wkctrtype` ฯลฯ |

**กฎ compose (แนะนำ implement):**

```text
operationText = formatDaysWeek(pmday) + " - " + formatPlanLabel(taskSummary)
```

| Helper | ตัวอย่าง |
|--------|----------|
| `formatDaysWeek(2)` | `2W` |
| `formatPlanLabel(...)` | `EE Sheeting & Cutting Zone (ST3)` |

> **หมายเหตุ:** ลูกค้าระบุส่วนหลังมาจาก **column MntPlan ใน Master Plan** ที่ผูก maintenance plan — ใน DB มัก map เป็น `machineList` / `zone` / `legacy` + craft (`EE`) จากแถว publish แรกของ `mntplan` นั้น · **UAT ต้องเทียบ Excel จริง**

**โค้ดวันนี้:** `buildOperationText()` ใช้ `ostdescription` + `operationshorttext` จาก IW37N ❌ **ต้องเปลี่ยนเป็น Master Plan**

### 3.3 Operation Long Text (อ่าน + กรอกค่าวัด)

**บนกระดาษ:** รายการ numbered list จาก **PM List** — แต่ละบรรทัด = 1 task ใต้ maintenance plan

| ลำดับ | ตัวอย่าง (จากภาพ) |
|-------|-------------------|
| 1 | Laminating Rolls (Rear) — ตรวจเช็คกระแสไฟฟ้าทั้ง 3 เฟส |
| 2 | Laminating Rolls (Front) — … |
| 3 | Laminating Roll Cooling Unit — … |
| 4 | Cutter Conveyor — … |
| 5 | Cutter Roller — … |

| แหล่ง | คอลัมน์ Master Plan | DB |
|-------|---------------------|-----|
| ข้อความแต่ละบรรทัด | **`PM List`** | `tbtasklist.pmlist` |
| จุดวัด / เครื่อง | **`M/C`** (ถ้ามี) | `tbtasklist.machine` |
| ผูก | **`Maintenance Plan`** = IW37N `mntplan` | join `WHERE tl.mntplan = iw37n.mntplan` |

**UI เป้าหมาย:**

1. แสดง **รายการ PM List** เป็น Operation Long Text (numbered / list)
2. แต่ละแถวที่เป็นกระแส 3 เฟส → ตารางกรอก R/S/T (มีอยู่แล้วใน `currentRows`)

**โค้ดวันนี้:** ตารางใช้ `machine` เป็นคอลัมน์หลัก · ควรแสดง **`pmlist`** ตามกระดาษ (หรือ `machine — pmlist`)

### 3.4 Completion — ช่างกรอกเอง

| ฟิลด์ | แหล่ง | Persist |
|-------|-------|---------|
| **Completion Date** | personnel-close → Page 2 **Date** | ✅ auto |
| **Duration** (เวลาเริ่ม–จบ) | **personnel-close** (Confirmation) | ✅ `tbwrkclose` |

**บล็อก Completion หน้า 1:** UI local optional — refresh ไม่เก็บ (ยืนยันลูกค้า ไม่ทำ Phase 5)

---

## 4) ฟิลด์ Header หน้า PM — แมปที่ต้องใช้

### 4.1 คู่ Functional Location · Equipment (SAP print 2 แถว)

บนฟอร์ม PM แสดง **2 แถวคู่กัน** — ซ้าย = รหัส · ขวา = Description:

| แถว UI | ฟิลด์ซ้าย | คอลัมน์ IW37N | DB | ฟิลด์ขวา (Description) | คอลัมน์ IW37N | DB |
|--------|-----------|---------------|-----|-------------------------|---------------|-----|
| 1 | **Functional Location** | `Functional Loc.` | `functionalloc` | **Description** | `FunctLocDescrip.` | `funcdescrip` |
| 2 | **Equipment** | `Equipment` | `equipment` | **Description** | `Equipment descriptn` | `equdescrip` |

```text
┌─ แถว 1 ─────────────────────────────────────────────┐
│ Functional Location: PI-TH-7151-FA-F1-P1            │
│              Description: (จาก FunctLocDescrip.)      │
├─ แถว 2 ─────────────────────────────────────────────┤
│ Equipment: 10049361                                 │
│              Description: (จาก Equipment descriptn) │
└─────────────────────────────────────────────────────┘
```

**หมายเหตุ:** Description 2 แถวนี้ **ไม่ใช่** คอลัมน์ `Description` (operation) — คอลัมน์ `Description` → `ostdescription` ใช้ในส่วน operation / บริบท mntplan (§2.2)

### 4.2 ตารางแมปรวม (ข้อกำหนดลูกค้า)

| ฟิลด์ UI | คอลัมน์ IW37N | DB | หมายเหตุ |
|---------|---------------|-----|----------|
| **Start Date** | `Bsc start` | `bscstart` (unix → dd.MM.yyyy) | วันเริ่มแผนจาก SAP |
| **Header Short Text** | `MntPlan` | `mntplan` | แสดงเลข plan — **ไม่ใช่** Operation short text |
| ~~Description (zone)~~ | — | ~~`description`~~ | **เอาออกจาก UI** |
| ~~Object list~~ | — | ~~`objectList`~~ | **เอาออกจาก UI** |
| Work Order | `Order` | `wkorder` | เปลี่ยนทุกรอบ |
| Functional Location | `Functional Loc.` | `functionalloc` | แถว 1 ซ้าย |
| Description (FL) | `FunctLocDescrip.` | `funcdescrip` | แถว 1 ขวา |
| Equipment | `Equipment` | `equipment` | แถว 2 ซ้าย (fallback `mat` ถ้าว่าง) |
| Description (Equipment) | `Equipment descriptn` | `equdescrip` | แถว 2 ขวา |
| Operation text | `Operation short text` | `operationshorttext` | ส่วน operation ด้านล่าง |
| Description (operation) | `Description` | `ostdescription` | สัมพันธ์ Legacy ใต้ mntplan (§2.2) |

### 4.3 ตัวอย่าง IW37N (SAP ALV)

จาก [`SAP-SAMPLE-PROBE.md`](../customer-requirements/SAP-SAMPLE-PROBE.md):

```
header: S | MntPlan | Order | Type | MAT | Bsc start | …
        | Operation short text | Description | …
        | … | Equipment | Equipment descriptn | Functional Loc. | FunctLocDescrip. | …
sample: wkorder=4000113383, mntplan=610000004147
```

(ลำดับคอลัมน์ตาม layout ALV / legacy อาจสลับ — parser ใช้ชื่อ header ไม่ใช่ index คงที่ · ดู `iw37n-column-map.ts`)

---

## 5) โค้ดปัจจุบัน vs ข้อกำหนด (Gap)

| ฟิลด์ | โค้ดวันนี้ | ต้องแก้ |
|-------|------------|---------|
| **Start Date** | `bscstart` → `woHeader.startDate` | ✅ **ตรงแล้ว** |
| **Functional Location** | `functionalloc` | ✅ **ตรงแล้ว** |
| **Description (แถว FL)** | `descriptionLine1` จาก `splitDescription(equdescrip, ostdescription)` | ❌ **ต้องเป็น `funcdescrip`** |
| **Equipment** | `equipment` \|\| `mat` | ✅ **ตรงแล้ว** (fallback mat) |
| **Description (แถว Equipment)** | `descriptionLine2` จาก split `equdescrip` / `ostdescription` | ❌ **ต้องเป็น `equdescrip` อย่างเดียว** |
| **Header Short Text** | `operationshorttext` | ❌ **ต้องเป็น `mntplan`** |
| **Description (บล็อกกลาง)** | `description` จาก zoneDesc/ost | ❌ **ลบออกจาก UI** |
| **Object list** | แสดงใน `WorkOrderPmSapPrintForm` | ❌ **ลบทั้งส่วน** |
| **funcdescrip ใน modal-detail** | `getWorkOrderViewRow` ไม่ SELECT `funcdescrip` | ❌ **เพิ่มใน query** |
| **Operation** | `opac` | ✅ **ตรงแล้ว** |
| **Operation Text** | `buildOperationText` จาก IW37N `ostdescription` | ❌ **ต้อง compose จาก MP `days` + ข้อมูลแผน** |
| **Operation Long Text** | ตารางจาก `machine` | ❌ **แสดง `pmlist` จาก MP · numbered list** |
| **Completion Date/Duration** | personnel-close → Page 2 | ✅ **ไม่ persist แยก (Phase 5 ยกเลิก)** |

| **MntPlan → task list** | join `tbtasklist` ON `mntplan` | ✅ **ตรงแล้ว** |

**ไฟล์ที่ต้องแก้ (Phase 1 + Operation):**

- `wo-pm-form-header.ts` — header fields + **`buildOperationText` → MP-based**
- `work-orders.ts` — ส่ง `pmday`, plan label, `pmlist[]` ใน modal-detail
- `WorkOrderPmSapPrintForm.tsx` — long text list · completion manual

---

## 6) ไหลข้อมูลเมื่อเปิด `/pm-vibration`

```text
1. เลือก WO (wkorder) — เปลี่ยนตาม SAP แต่ละรอบ
        │
        ▼
2. อ่าน tbiw37n
   · bscstart        → Start Date
   · mntplan         → Header Short Text + คีย์ join
   · functionalloc   → Functional Location
   · funcdescrip     → Description (แถว FL)
   · equipment       → Equipment
   · equdescrip      → Description (แถว Equipment)
   · ostdescription  → Description operation (§2.2)
        │
        ▼
3. JOIN tbtasklist ON mntplan
   · pmday           → Operation Text ส่วน {n}W
   · legacy/zone/…   → Operation Text ส่วนข้อความแผน
   · pmlist[]        → Operation Long Text (numbered)
   · machine, pmman, machinestatus …
        │
        ▼
4. แสดงฟอร์ม PM + task prefill + readings
```

**ถ้า `mntplan` ว่างใน IW37N** → ไม่ join tasklist ได้ → banner แจ้ง (Phase 2)

**ถ้า `mntplan` ไม่มีใน Master Plan / ยังไม่ Publish** → tasklist ว่าง → banner แจ้ง Publish

---

## 7) SQL ตรวจการผูก

```sql
-- 1) WO + ฟิลด์ header IW37N
SELECT
  wkorder,
  mntplan,
  functionalloc,
  funcdescrip,
  equipment,
  equdescrip,
  to_timestamp(bscstart) AT TIME ZONE 'Asia/Bangkok' AS bsc_start,
  operationshorttext,
  ostdescription
FROM app.tbiw37n
WHERE wkorder = '4001565681';

-- 2) Task list — Operation Text + Long Text
SELECT mntplan, pmday, legacy, machine, pmlist
FROM app.tbtasklist
WHERE TRIM(mntplan) = (
  SELECT TRIM(mntplan) FROM app.tbiw37n WHERE wkorder = '<wkorder>' LIMIT 1
)
ORDER BY machine, pmlist;

-- 3) ตรวจว่า mntplan มีในแผน
SELECT r.row_index, r.cells_json->>'Maintenance Plan' AS mp_mntplan,
       r.cells_json->>'Legacy' AS legacy
FROM app.tb_master_plan_row r
WHERE TRIM(r.cells_json->>'Maintenance Plan') = '<mntplan>';
```

---

## 8) Checklist ก่อน implement

- [ ] ยืนยันกับลูกค้า: Header Short Text = **เลข mntplan** (เช่น `342596`) ไม่ใช่ข้อความ `369039 & P14-NI-EE`
- [ ] แก้ `buildWoPmFormHeader`: `descriptionLine1=funcdescrip`, `descriptionLine2=equdescrip`, `headerShortText=mntplan`
- [ ] เพิ่ม `funcdescrip` ใน `getWorkOrderViewRow`
- [ ] อัปเดต Phase 1 ใน [`PM-VIBRATION-IMPLEMENTATION-PHASES.md`](PM-VIBRATION-IMPLEMENTATION-PHASES.md)
- [ ] Operation Text = `{days}W - {plan label}` จาก MP (ไม่ใช่ IW37N ostdescription)
- [ ] Operation Long Text = รายการ `PM List` ครบทุกแถวใต้ mntplan
- [x] Completion Date / Duration — **personnel-close + Page 2** (ไม่ persist บล็อกหน้า 1 แยก)

---

## 9) อ้างอิง

| เอกสาร / โค้ด |
|---------------|
| [`MASTER-PLAN-MNTPLAN-BINDING.md`](../customer-requirements/MASTER-PLAN-MNTPLAN-BINDING.md) |
| [`PM-VIBRATION-DATA-BINDING-AUDIT.md`](PM-VIBRATION-DATA-BINDING-AUDIT.md) |
| `iw37n-column-map.ts` — แมป `MntPlan`, `Bsc start`, `Description` |
| `wo-pm-form-header.ts` — สร้าง header ฟอร์ม PM |
| `master-plan-row-links.ts` — ดึง `mntplan`, `legacy` จากแถว MP |

---

*สรุปจาก feedback ลูกค้า 2026-06-21 — อัปเดตเมื่อ confirm Header Short Text กับตัวอย่าง PDF*
