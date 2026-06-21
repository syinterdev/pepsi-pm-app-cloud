# PM Measurements (`/pm-vibration`) — การผูกข้อมูล Master Plan · IW37N · ค่าวัด

**อัปเดต:** 2026-06-21  
**หน้าเป้าหมาย:** http://localhost:5173/pm-vibration  
**เอกสารอ้างอิงลูกค้า:** `Image_20260621_0001.pdf` (ไม่พบใน repo — สเปกเทียบเท่าใน [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](../customer-requirements/PM-MANUAL-ENTRY-WORK-ORDER-FORM.md) · WO ตัวอย่าง **4001565681**)

---

## 1) สรุปผู้บริหาร

| หัวข้อ | สถานะ |
|--------|--------|
| **IW37N → หน้า PM** | ผูกผ่าน `tbiw37n` (ค้นหา WO / `?wkorder=`) → `modal-detail` |
| **Master Plan → หน้า PM** | **ไม่ตรง** — ต้อง **Publish** ไป `tbtasklist` ก่อน; ลิงก์จาก Master Plan เปิด `/pm-vibration?wkorder=` |
| **ค่าวัด PM** | เก็บใน `tbwo_pm_reading` ผูก `idiw37` + `(machine, pmlist, kind)` |
| **คีย์กลาง** | `mntplan` (Maintenance Plan / SAP code) |

```text
Master Plan (Excel row)
    │ publish
    ▼
tbtasklist (machine, pmlist, mpoint, mntplan, …)
    ▲
    │ mntplan
tbiw37n (IW37N import — wkorder, mntplan, …)
    │
    ▼
GET /work-orders/:id/modal-detail  →  taskList + pmExecution
    │
    ▼
/pm-vibration  →  POST pm-readings  →  tbwo_pm_reading
```

---

## 2) โฟลว์ข้อมูล (ละเอียด)

### 2.1 IW37N (`app.tbiw37n`)

| ขั้นตอน | รายละเอียด |
|---------|------------|
| นำเข้า | `/iw37n` — อัปโหลด Excel ALV → `tbiw37n` + `tbiw37n_import_batch` |
| ค้นหา WO | `POST /api/v1/work-orders/search` — หน้า PM ใช้ `q` ค้นหา `wkorder` / คำอธิบาย |
| Deep link | `/pm-vibration?wkorder=4001565681` — ตั้ง `orderId` จากพารามิเตอร์ URL |
| Resolve ID | `resolveWorkOrderIdiw37()` รับได้ทั้ง `idiw37` หรือ `wkorder` |

**ฟิลด์ IW37N ที่หน้า PM ใช้ (ผ่าน `modal-detail.woHeader`):**

| ฟิลด์ SAP / กระดาษ | คอลัมน์ / แหล่ง |
|--------------------|-----------------|
| Work Order | `wkorder` |
| Functional Location | `functionalloc` |
| Equipment | `mat` / equipment |
| Description | `equdescrip` |
| Work Centre | `wkctr` |
| Start / End Date | `bscstart` / `actfinish` |
| Activity Type | MaintActivityType / short text |
| Header / Operation text | `operationshorttext` |
| **Maintenance Plan** | **`mntplan`** ← สำคัญต่อ task list |

**ไฟล์หลัก**

- `PM-Pepsi-App/backend/src/services/work-orders.ts` — `getWorkOrderModalDetail`, `buildWoPmFormHeader`
- `PM-Pepsi-App/backend/src/routes/work-orders.ts`
- `PM-Pepsi-App/frontend/src/features/pm-vibration/PmVibrationPage.tsx`

---

### 2.2 Master Plan (`app.tb_master_plan_*`)

| ตาราง | บทบาท |
|-------|--------|
| `tb_master_plan_workbook` | เวอร์ชัน EE / ME / PK |
| `tb_master_plan_sheet` | ชีต + header JSON |
| `tb_master_plan_row` | แถว (`cells_json`) |

**Master Plan ไม่ join ตรงกับ `tbwo_pm_reading`**

การเชื่อมถึงหน้า PM ทำได้ 2 ทาง:

#### ทาง A — Publish → Task List (ทางหลัก)

```text
POST /api/v1/master-plan/publish
  → publishMasterPlanToTasklist()
  → detailSheetRowsToTasklist()   [master-plan-tasklist.ts]
  → importTasklists()
  → app.tbtasklist
```

| คอลัมน์ Master Plan | → `tbtasklist` |
|---------------------|----------------|
| Machine List / M/C | `machine` |
| PM List | `pmlist` |
| Measurement | `mpoint` |
| Maintenance Plan / SAP code | `mntplan` |
| Task List / Legacy | `tasklist`, `legacy` |

**ถ้าไม่ Publish** — WO ใน IW37N อาจมี `mntplan` แต่ **ไม่มีแถวใน `tbtasklist`** → หน้า PM ไม่มี task ให้ prefill

#### ทาง B — Row Links (นำทาง UI)

| API | ใช้ทำอะไร |
|-----|-----------|
| `GET /api/v1/master-plan/rows/:rowId/links` | นับ WO ใน IW37N, tasklist, equipment, แนะนำ PM 3-phase |

**คีย์ที่ดึงจากแถว Excel** (`master-plan-row-links.ts`):

| Key | คอลัมน์ที่ match |
|-----|------------------|
| `mntplan` | maintenance plan, sap code, mant, mnt plan |
| `machine` | m/c, mc |
| `pmlist` | pm list |
| `tasklist`, `legacy`, `zone`, `machineList` | ตามชื่อ |

**ช่องว่าง:** `mpoint` (Measurement) **ไม่ถูกใช้ใน row links** — ใช้แค่ตอน publish ไป tasklist

**UI ลิงก์ไป PM:**

- `MasterPlanRowLinksMenu.tsx` → ถ้า `pm3Phase.suggested` → `/pm-vibration?wkorder=<wkorder แรก>`
- **ไม่ส่ง** `machine` / `pmlist` ใน URL — ต้องโหลดจาก modal-detail หลังเลือก WO

**ไฟล์หลัก**

- `PM-Pepsi-App/backend/src/services/master-plan.ts`
- `PM-Pepsi-App/backend/src/lib/master-plan-tasklist.ts`
- `PM-Pepsi-App/backend/src/lib/master-plan-row-links.ts`
- `PM-Pepsi-App/frontend/src/features/master-plan/MasterPlanRowLinksMenu.tsx`

---

### 2.3 Task List → หน้า PM

เมื่อเลือก WO แล้ว เรียก:

```http
GET /api/v1/work-orders/:id/modal-detail
```

**Task list query** (ย่อ):

```sql
SELECT tl.machine, tl.pmlist, tl.mpoint, tl.ment, …
FROM app.tbtasklist tl
WHERE tl.mntplan = $mntplan   -- จาก tbiw37n.mntplan
```

**Inference ประเภทการวัด** (`pm-measurement-kind.ts` → `wo-pm-execution-data.ts`):

| Input | Output |
|-------|--------|
| `pmlist` + `mpoint` + `ment` | `measurementKind`: `current_3phase` \| `vibration_dst_db` \| `none` |
| ลำดับตรวจ | **กระแส 3 เฟสก่อน** vibration |

| `measurementKind` | หน่วย | แกน UI |
|-------------------|-------|--------|
| `current_3phase` | A | R / S / T |
| `vibration_dst_db` | — | Dst / dB |

---

### 2.4 บันทึกค่าวัด (`app.tbwo_pm_reading`)

**Migration:** `092_wo_pm_execution.sql`, `097_tbwo_pm_note_entry.sql`

| คอลัมน์ | ที่มา |
|---------|--------|
| `idiw37` | FK → WO ที่เลือก |
| `machine`, `pmlist` | จาก task / manual |
| `kind` | `current_3phase` \| `vibration_dst_db` |
| `v1`, `v2`, `v3` | R/S/T หรือ X/Y/Z |
| `measured_at` | วันเวลาวัด |
| `warning_limit`, `alarm_limit` | vibration (optional) |
| `wkctr` | ผู้บันทึก |

**Comments (หน้า 2 ฟอร์ม):** `tbwo_pm_note_entry` — thread ต่อ WO (ไม่ใช่ `tbwo_pm_note` legacy)

---

## 3) API ที่หน้า `/pm-vibration` เรียก

| Method | Endpoint | Permission | ใช้ใน UI |
|--------|----------|------------|----------|
| POST | `/api/v1/work-orders/search` | `work-orders.read` | ค้นหา WO |
| GET | `/api/v1/work-orders/:id/modal-detail` | `work-orders.read` | Header, tasks, readings |
| POST | `/api/v1/pm-readings/batch` | `confirmation.write` | SAP หน้า 1, manual table, trend |
| POST | `/api/v1/work-orders/:id/pm-readings` | `confirmation.write` | Per-task block |
| PUT | `/api/v1/work-orders/:id/pm-note` | `confirmation.write` | Comments thread (หน้า 2) |
| POST | `/api/v1/pm-readings/import` | `confirmation.write` | Excel upload |
| GET | `/api/v1/pm-readings/import-template.xlsx` | auth | Template |
| GET | `/api/v1/work-orders/:id/pm-readings/export.xlsx` | `confirmation.read` | Export WO |

**Master Plan (ไม่เรียกตรงจากหน้า PM — ผ่าน navigation เท่านั้น):**

| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/master-plan/rows/:rowId/links` |
| POST | `/api/v1/master-plan/publish` |

---

## 4) โครงสร้าง UI ปัจจุบัน (`PmVibrationPage.tsx`)

| # | Section | ข้อมูลจาก |
|---|---------|-----------|
| 0 | ค้นหา WO | IW37N search |
| 1 | Status banner | modal-detail |
| 2 | SAP Print Form หน้า 1 | `woHeader` + current tasks → `paperRows` |
| 3 | SAP Page 2 | Comments → `pm-note`; ฟิลด์อื่น **local only** |
| 4 | Trend กระแส 3 เฟส | `currentTasks` + `pmExecution.readings` |
| 5 | Trend Vibration | `vibrationTasks` (fallback → currentTasks) |
| 6 | Manual entry table | task prefill / กรอกเอง |
| 7 | Excel import | แยก resolve WO ต่อแถว Excel |
| 8 | Per-task blocks | `WorkOrderPmMeasurementBlock` |

**สิทธิ์เขียน:** `confirmation.write`

---

## 5) การแมปฟิลด์ — WO 4001565681 (เอกสารลูกค้า)

อ้างอิง [`PM-MEASUREMENTS-3PHASE-CURRENT.md`](../customer-requirements/PM-MEASUREMENTS-3PHASE-CURRENT.md) และ [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](../customer-requirements/PM-MANUAL-ENTRY-WORK-ORDER-FORM.md)

| จุดวัด (กระดาษ) | Phase R | Phase S | Phase T | ประเภท |
|----------------|---------|---------|---------|--------|
| Main Oil Pump | 97.5 | 97.6 | 96.2 | กระแส 3 เฟส (A) |
| Combustion Fan | 39.9 | 40.5 | 40.6 | กระแส 3 เฟส |
| Thermal Oil Circulating Pump | 143.2 | 151.1 | 150.2 | กระแส 3 เฟส |
| (Vibration bearing) | 2.1 | 3.6 | 1.9 | Vibration X/Y/Z (mm/s) |

**ใน DB:** แต่ละจุด = 1+ แถวใน `tbwo_pm_reading` (`machine` + `pmlist` + `kind` + `measured_at`)

---

## 6) ช่องว่าง / ความเสี่ยง (ก่อนปรับปรุง)

| # | ประเด็น | ผลกระทบ | แนวทางที่แนะนำ |
|---|---------|---------|----------------|
| G1 | ไม่มี FK Master Plan ↔ readings | ไล่ย้อนแถว MP ไม่ได้ | เก็บ `master_plan_row_id` optional หรือ audit log |
| G2 | Row links ไม่ใช้ `mpoint` | PM 3-phase hint ผิดจาก pmlist อย่างเดียว | เพิ่ม `mpoint` ใน `extractMasterPlanLinkKeys` |
| G3 | ต้อง Publish MP ก่อน | WO มี mntplan แต่ไม่มี task | แจ้ง UI / auto-check ใน banner |
| G4 | `filterReadingsForTask` ไม่กรอง `kind` | กราฟ per-task ปน current+vibration | เพิ่ม filter `kind` |
| G5 | Page 2 ฟิลด์ไม่ persist | Activity Report, signature ฯลฯ หาย refresh | ออกแบบตาราง / JSON ตามสเปกลูกค้า |
| G6 | Deep link `?wkorder=` vs `idiw37` | ทำงานได้แต่ state ไม่ส uniform | normalize เป็น wkorder ใน URL |
| G7 | Excel import ไม่ผูก WO ที่เลือก | import ข้าม WO อื่นได้ | validate / filter ตาม selection |
| G8 | Parser ซ้ำ FE/BE | drift คอลัมน์ MP | ยึด backend เป็นหลัก |
| G9 | `suggestsPm3Phase` match "vibration" | ลิงก์ PM 3-phase เกินจริง | แยก regex current vs vibration |
| G10 | ไม่มีลิงก์จาก WO modal → `/pm-vibration` | ช่างต้องเข้าเมนูเอง | เพิ่มปุ่มใน WO detail |
| G11 | WO 4001565681 ไม่มีใน seed | UAT ต้อง import IW37N จริง | ใช้ไฟล์ลูกค้าใน `from customer/` |

---

## 7) ลำดับ UAT / ตรวจสอบการผูกข้อมูล

1. **Master Plan** — import + publish EE sheet ที่มี `mntplan` + PM List กระแส 3 เฟส  
2. **IW37N** — import WO `4001565681` (หรือ WO จริง) ให้ `mntplan` ตรงกับ MP  
3. **Row links** — จากแถว MP → ตรวจ `workOrders.count` > 0, `pm3Phase.suggested`  
4. **เปิด** `/pm-vibration?wkorder=4001565681`  
5. **modal-detail** — มี `taskList.items[]` พร้อม `machine`, `pmlist`, `measurementKind`  
6. **บันทึก** R/S/T → ตรวจ `tbwo_pm_reading`  
7. **Trend / Export** — กราฟและ Excel ตรงแถวที่บันทึก  

**SQL ตรวจเร็ว:**

```sql
-- WO + mntplan
SELECT idiw37, wkorder, mntplan, equdescrip FROM app.tbiw37n WHERE wkorder = '4001565681';

-- Task list สำหรับ mntplan นั้น
SELECT machine, pmlist, mpoint, mntplan FROM app.tbtasklist WHERE TRIM(mntplan) = '<mntplan>';

-- ค่าวัดที่บันทึกแล้ว
SELECT r.* FROM app.tbwo_pm_reading r
JOIN app.tbiw37n i ON i.idiw37 = r.idiw37
WHERE i.wkorder = '4001565681'
ORDER BY r.measured_at DESC;
```

---

## 8) ไฟล์อ้างอิง (index)

| หมวด | Path |
|------|------|
| หน้า PM | `PM-Pepsi-App/frontend/src/features/pm-vibration/PmVibrationPage.tsx` |
| Components | `PM-Pepsi-App/frontend/src/components/pm-vibration/*` |
| Per-task UI | `PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderPmMeasurementBlock.tsx` |
| API client | `PM-Pepsi-App/frontend/src/lib/api-public.ts` |
| WO service | `PM-Pepsi-App/backend/src/services/work-orders.ts` |
| PM execution | `PM-Pepsi-App/backend/src/services/wo-pm-execution-data.ts` |
| PM routes | `PM-Pepsi-App/backend/src/routes/pm-readings.ts` |
| Master Plan | `PM-Pepsi-App/backend/src/services/master-plan.ts` |
| Row links | `PM-Pepsi-App/backend/src/lib/master-plan-row-links.ts` |
| Kind inference | `PM-Pepsi-App/backend/src/lib/pm-measurement-kind.ts` |
| DB | `database/migrations/092_wo_pm_execution.sql`, `108_master_plan_tables.sql`, `022_tbtasklist.sql` |
| สเปกลูกค้า | `docs/customer-requirements/PM-MEASUREMENTS-3PHASE-CURRENT.md` |
| ฟอร์ม WO | `docs/customer-requirements/PM-MANUAL-ENTRY-WORK-ORDER-FORM.md` |

---

## 9) ขั้นต่อไป (แผนปรับปรุงหน้า PM)

ลำดับที่แนะนำหลังอ่าน audit นี้:

1. **Data readiness banner** — แจ้งเตือนถ้า `mntplan` ว่าง / ไม่มี tasklist / ไม่มี readings  
2. **แก้ G4, G9** — กรอง kind + ปรับ PM link จาก Master Plan  
3. **Page 2 persist** — ตามสเปก PDF 4 หน้า (Comments + Activity Report)  
4. **Deep link** — รองรับ `?wkorder=&machine=&pmlist=` จาก Master Plan  
5. **UAT** — ใช้ WO 4001565681 + ไฟล์ IW37N ลูกค้า  

---

*เอกสารนี้จัดทำก่อนเริ่มแก้โค้ด `/pm-vibration` — อัปเดตเมื่อ implement แต่ละ phase*
