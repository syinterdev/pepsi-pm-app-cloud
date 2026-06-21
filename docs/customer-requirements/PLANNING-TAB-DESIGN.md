# แท็บ Planning — สรุป + ออกแบบ (มอบหมายงาน)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** สรุป + wireframe — ยังไม่ implement  
**ผู้ใช้หลัก:** **Planner** (มีสิทธิ์ `planning.assign`)

---

## บริบท

Planner อ่านรายการ PM ที่แท็บ **Task** แล้วไปแท็บ **Planning** เพื่อ **มอบหมายช่าง** ให้ WO นั้น

Modal จาก `/calendar` · `/planning` · `/plan-calendar` ใช้ layout **Task · Planning · Close WO** (`tabLayout=assigned`) — แท็บ Close WO แสดงเฉพาะช่างที่ assign + รับงานแล้ว (Telegram หรือ Web) ([`CLOSE-WO-TAB-DESIGN.md`](CLOSE-WO-TAB-DESIGN.md))

---

## สิ่งที่ลูกค้าต้องการ (9 มิ.ย. 2026)

| หัวข้อ | ความต้องการ |
|--------|-------------|
| รูปแบบ UI | **การ์ด** แสดงชื่อช่างให้ชัดเจน (รหัส + ชื่อ-นามสกุล) |
| เลือกช่าง | **หลายคนได้** (multi-select) แล้วบันทึกครั้งเดียว |
| Admin | **ไม่แสดง** ในรายชื่อช่าง PM — Admin ไม่เกี่ยวกับงาน PM |
| หมวดงาน | มี **checkbox** กำหนด/กรอง **AA · BB · EE · UT** |

### ความหมายหมวด (ยืนยันจากลูกค้า LINE)

| รหัส UI | ความหมาย | หมายเหตุ |
|---------|----------|----------|
| **AA** | Shift Day (กะกลางวัน) | ลูกค้าพิมพ์ "Shitf Day" — ใช้คำว่า Shift Day ในแอป |
| **BB** | Shift Night (กะกลางคืน) | |
| **EE** | Electrical (ช่างไฟฟ้า) | |
| **UT** | Utility (ช่างยูทิลิตี้) | |

> **ลูกค้า:** "เพราะ AA, BB จะไปผูกชื่อคน อีกที" — การผูกชื่อคนกับ AA/BB เป็น **เฟสถัดไป** (ข้อมูล master บุคลากร) ตอนนี้ออกแบบ checkbox + กรองการ์ดช่างให้พร้อมต่อยอด

---

## สถานะโค้ดปัจจุบัน

| ส่วน | ไฟล์ / API | ปัญหาเทียบลูกค้า |
|------|------------|-------------------|
| การ์ดจ่ายทีละคน | `PlanningQuickAssign.tsx` | มีการ์ดแล้ว แต่คลิก = assign ทันที (ไม่ใช่ multi-select) |
| จ่ายหลายคน | `PlanningMultiAssign.tsx` | เป็น **รายการ checkbox** ไม่ใช่การ์ด |
| รายชื่อช่าง | `GET .../modal-detail` → `planning.workcenters` | ดึง **ทุกแถว** `tbworkcenter` — รวม Admin (`ADMIN01`, `userst=A`) |
| ทีม WO | `WorkOrderSummaryPanel` แท็บ Work Order | ปุ่ม **A / B / EE / UT** (ไม่ใช่ AA/BB) — คนละจุดกับแท็บ Planning |
| บันทึกหลายคน | `POST /api/v1/work-orders/:id/planning/batch` | พร้อมใช้ — ไม่ต้องเปลี่ยน flow หลัก |

**ภาพจากลูกค้า:** การ์ด "Individual assign" แสดง `ADMIN01` + `WC001` เป็น ASSIGNED — ลูกค้าไม่ต้องการ Admin ใน pool นี้

---

## สรุป Function — แท็บ Planning

### ใครทำอะไร

| บทบาท | แท็บ Planning |
|--------|----------------|
| **Planner** | เลือกช่างหลายคน · บันทึก · ดูรายชื่อที่จ่ายแล้ว · ลบ assignee |
| ช่าง | อ่านอย่างเดียว (ไม่มี `planning.assign`) |
| **Admin** | **ไม่ปรากฏ** ในรายการช่าง PM |

### ข้อมูลบนจอ — มาจากไหน

| ส่วน UI | แหล่งข้อมูล |
|---------|-------------|
| วันที่วางแผน / ชม.ว่าง | `modal-detail.date` + `planning.workcenters[].availableHours` |
| รายชื่อช่าง (pool) | `tbworkcenter` (กรองแล้ว) + ชื่อจาก `titlewkctr` / `namewkctr` / `surnamewkctr` |
| รายชื่อจ่ายแล้ว | `tbplangingwork` (`pwteam <> 'G'`) |
| จ่ายกลุ่ม | `tbwkctrgroup` + `pwteam = 'G'` (คงไว้ — คนละ flow กับรายบุคคล) |
| หมายเหตุแผน | `pwcomment` บน `tbplangingwork` |

### กฎธุรกิจ

1. **Pool ช่าง PM** = บุคลากรที่ `userrole = technician` (หรือ `userst = W`) และ **active** — **ไม่รวม** `admin` / `userst = A`
2. **เลือกได้หลายคน** แล้วกดปุ่มเดียว → `planning/batch`
3. การ์ดที่จ่ายแล้วแสดงสถานะ **ASSIGNED** (disabled) — คลิกซ้ำไม่ assign ซ้ำ
4. Checkbox **AA / BB / EE / UT** ใช้ **กรองการ์ดช่าง** (AND ระหว่างหมวดที่ติ๊ก — ถ้าไม่ติ๊กอะไร = แสดงทั้งหมดใน pool)
5. **AA / BB ผูกชื่อคน** — รอ master data (เฟส 2); เฟส 1 อาจกรองจากฟิลด์ชั่วคราวหรือแสดงทุกคนจนกว่าจะมี mapping

### การแมป AA/BB กับระบบเดิม

ระบบเก็บทีม WO ที่ `tbiw37n.team` เป็น **`A` · `B` · `EE` · `UT`** (ไม่ใช่ `AA`/`BB`)

| แสดงบน UI (ลูกค้า) | ค่าใน DB / API (ปัจจุบัน) |
|--------------------|---------------------------|
| AA (Shift Day) | `A` |
| BB (Shift Night) | `B` |
| EE | `EE` |
| UT | `UT` |

ตอน implement: แสดงป้าย **AA / BB** ให้ผู้ใช้ · แปลง ↔ `A`/`B` ฝั่ง API ถ้าจำเป็น

---

## ออกแบบ UI — wireframe

```
┌─ แท็บ Planning ─────────────────────────────────────────────┐
│ วันที่แผน · ชม.ว่าง (info callout)                            │
├─ หมายเหตุแผน (comment) ─────────────────────────────────────┤
├─ หมวดงาน [checkbox หลายตัวเลือกได้] ─────────────────────────┤
│  ☐ AA  Shift Day    ☐ BB  Shift Night                       │
│  ☐ EE  Electrical   ☐ UT  Utility                           │
│  (ติ๊กแล้วกรองการ์ดช่างด้านล่าง — ไม่ติ๊ก = ทั้งหมด)          │
├─ มอบหมายรายบุคคล (การ์ด) ────────────────────────────────────┤
│  [ค้นหารหัส/ชื่อ...]  [ขยาย] [เต็มจอ]     badge: N คน         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ ✓ นาย...     │ │ ○ นาย...     │ │ ○ นาย...     │           │
│  │   WC001      │ │   ME042      │ │   EE015      │           │
│  │   ASSIGNED   │ │   8.5 hr     │ │   12 hr      │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│  เลือกแล้ว 2 คน  [มอบหมายที่เลือก]  [ล้างการเลือก]            │
├─ รายชื่อจ่ายแล้ว (ตารางย่อ) ──────────────────────────────────┤
│  รหัส · ชื่อ · ลบ (ถ้าแก้ได้)                                 │
├─ มอบหมายกลุ่ม (ตาราง — คงเดิม) ───────────────────────────────┤
└───────────────────────────────────────────────────────────────┘
```

### หลัก UI

| หลัก | รายละเอียด |
|------|-------------|
| การ์ดเป็นหลัก | รวม `PlanningQuickAssign` + `PlanningMultiAssign` เป็นคอมโพเนนต์เดียว — **การ์ด + multi-select + ปุ่ม batch** |
| ชื่อชัด | บรรทัด 1 = คำนำหน้า+ชื่อ (หรือ initials) · บรรทัด 2 = รหัส `wkctr` monospace |
| ไม่มี Admin | ไม่โหลด / ไม่แสดง `userrole=admin` ใน pool |
| Checkbox หมวด | 4 ตัว · label สองบรรทัด (รหัส + คำอธิบาย EN/TH) |
| ASSIGNED | ขอบ/ป้ายเขียว · ไม่เลือกซ้ำได้ |
| ลบ checkbox list เก่า | ไม่แสดง `PlanningMultiAssign` แบบ list คู่กับการ์ด |

---

## API / Backend ที่ต้องปรับ (ก่อน implement)

### 1) กรอง pool ช่างใน `modal-detail`

```sql
-- แนวทาง (ร่าง)
SELECT wkctr, titlewkctr, namewkctr, surnamewkctr, ...
FROM app.tbworkcenter wc
WHERE COALESCE(wc.userrole, '') <> 'admin'
  AND COALESCE(UPPER(wc.userst), '') <> 'A'
  AND (wc.workstatus IS NULL OR wc.workstatus IN ('ACTIVE','INACTIVE','LEAVE') ...)
ORDER BY wkctr
```

เพิ่มฟิลด์ใน response (ถ้ามีข้อมูล):

- `shiftTags: ('AA'|'BB')[]` — เฟส 2
- `craftTags: ('EE'|'UT')[]` — จาก `wkctrtype` / `cat` / craft ของ WO

### 2) Schema `workcenterItemSchema`

ขยาย optional:

```ts
shiftTags?: ('AA' | 'BB')[]
craftTags?: ('EE' | 'UT')[]
```

### 3) i18n

คีย์ใหม่ใน `scheduling.json`:

- `planning.categoryAA` = "AA — Shift Day"
- `planning.categoryBB` = "BB — Shift Night"
- `planning.categoryEE` = "EE — Electrical"
- `planning.categoryUT` = "UT — Utility"
- `planning.assignSelected` = "Assign selected"
- `planning.excludeAdminNote` (tooltip ถ้าต้องการ)

---

## Gap / คำถามเปิด (ก่อน Phase)

| # | หัวข้อ | แนวทางชั่วคราว |
|---|--------|----------------|
| 1 | AA/BB ผูกชื่อคนที่ฟิลด์ไหน? | รอลูกค้า / ดู Excel บุคลากร — อาจใช้ `cat` หรือคอลัมน์ใหม่ |
| 2 | EE/UT กรองจาก craft WO หรือ craft ช่าง? | แนะนำ: กรองช่างจาก `wkctrtype` + default ติ๊ก EE/UT ตาม craft ของ WO (`mntplan` zone) |
| 3 | ทีม WO (`A/B`) กับ checkbox Planning | อาจ sync: เลือก AA บน Planning → ตั้ง `team=A` บน WO (optional — ยืนยันกับลูกค้า) |
| 4 | ช่าง inactive / ลาออก | ไม่แสดงใน pool (ใช้ `tbwkctrstatus.is_active`) |

---

## ไฟล์ที่จะแตะตอน implement

| ชั้น | ไฟล์ |
|------|------|
| UI | `PlanningQuickAssign.tsx` (หรือ `PlanningTechnicianCards.tsx` ใหม่) |
| UI | `WorkOrderDetailDialog.tsx` — ลบ/รวม `PlanningMultiAssign` |
| BE | `work-orders.ts` → `getWorkOrderModalDetail` query workcenters |
| Schema | `schemas/work-orders.ts` → `workcenterItemSchema` |
| i18n | `en/th scheduling.json` |
| Test | กรอง admin ออกจาก pool · batch assign ยังทำงาน |

---

## อ้างอิง

- สรุปภาพรวม: [`MASTER-PLAN-MNTPLAN-BINDING.md`](MASTER-PLAN-MNTPLAN-BINDING.md)
- แท็บ Task: [`CALENDAR-WO-TASK-DESIGN.md`](CALENDAR-WO-TASK-DESIGN.md)
- Parity Planning: [`docs/PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) — `AddPlan.php`, `ShowPlanGroup.php`
