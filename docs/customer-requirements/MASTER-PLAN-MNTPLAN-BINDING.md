# Master Plan — สรุปความหมาย (ร่าง)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** สรุปครบ — ดู Phase implement ที่ [`PM-WORKFLOW-PHASE-CHECKLIST.md`](PM-WORKFLOW-PHASE-CHECKLIST.md)  
**จุดประสงค์:** ให้ทีมเข้าใจตรงกันก่อนลงรายละเอียดทีละ function

---

## ไฟล์ลูกค้า 3 ชุด

| ไฟล์ | แท็บในแอป | ใครใช้ |
|------|-----------|--------|
| `01-MASTER PM PROCESS EE 2026.xlsx` | EE | ช่างไฟฟ้า — ฝั่ง Process |
| `02-MASTER PM PROCESS ME 2026.xlsx` | ME | ช่างเครื่องกล — ฝั่ง Process |
| `03-MASTER PM PACKING 2026.xlsx` | PK | ช่างแผนก Packing |

หน้า **`/master-plan`** แสดง Excel เหล่านี้ — ไม่รวมเป็นไฟล์เดียว

---

## สิ่งที่ลูกค้าต้องการให้เข้าใจ (สั้นๆ)

### 1) Maintenance plan — ตัวหลัก · คงที่

- เลข **Maintenance plan** (`mntplan`) มาจาก **SAP**
- **โดยปกติไม่เปลี่ยน** ระหว่างปี (อนาคตอาจเปลี่ยนเมื่อลูกค้าส่งแผน Excel ใหม่)
- ใช้เป็น **ตัวผูก** ว่า WO นี้ต้องทำ PM ชุดไหน

### 2) Work Order — เปลี่ยนเรื่อยๆ

- เลข **WO** (`wkorder`) **เปลี่ยนทุกรอบ** ตาม SAP / IW37N
- WO = ใบงานรอบนั้น · **ไม่ใช่** ที่เก็บรายการ PM ถาวร
- WO หนึ่งใบมี `mntplan` หนึ่งค่า → เอาไปหารายการ PM จากแผน

### 3) รายการ PM ผูกแบบนี้

ภายใต้ **Maintenance plan เดียวกัน** ข้อมูลเรียงความสำคัญแบบนี้:

```
Maintenance plan  (mntplan)     ← คงที่ จาก SAP
    → Legacy                      ← สาขาช่าง / zone (เช่น P17-HR-ME2)
        → Machine (M/C)           ← เครื่องจักร
            → PM list             ← ข้อความงาน PM (ภาษาไทย)
```

**หนึ่งแถวใน Excel** = หนึ่งคู่ **Machine + PM list** ใต้ `mntplan` เดียวกัน  
ถ้ามีหลายแถว = หลายงาน PM ใต้ plan เดียวกัน

**ตัวอย่าง**

| mntplan | จำนวนแถวในแผน | ความหมาย |
|---------|----------------|----------|
| `342596` | 1 แถว | Task tab แสดง 1 รายการ |
| `610000004061` | หลายแถว | Task tab แสดงหลายเครื่อง / หลายข้อความ PM |

---

## ไหลข้อมูลในระบบ (ภาพเดียว)

```
Excel ลูกค้า (EE / ME / PK)
        ↓  seed / import
   Master Plan ในแอป          ← แก้แผนที่นี่ + log
        ↓  Publish
   Task list (tbtasklist)     ← ข้อมูลที่ช่างเห็นในแท็บ Task
        ↑
   จับคู่ด้วย mntplan
        ↑
   IW37N / WO จาก SAP         ← wkorder เปลี่ยนได้ · mntplan ซ้ำได้
```

**จำง่าย:** แผนอยู่ที่ Master Plan · ใบงานอยู่ที่ WO · **เชื่อมกันด้วย mntplan**

---

## กฎที่จะใช้ตอนปรับ function

1. แท็บ **Task** ใน WO → ดึงจาก **`mntplan` ของ WO** ไม่ใช่เลข WO
2. รายการที่แสดง = ทุกแถว publish แล้วของ `mntplan` นั้น (legacy → machine → pmlist)
3. แก้ข้อความ PM / เครื่อง → แก้ที่ **Master Plan** แล้ว **Publish** (ไม่แก้ถาวรที่ WO)
4. ถ้าไม่มี `mntplan` ในแผน หรือยังไม่ Publish → Task ว่าง (ต้องไปเติมแผนก่อน)

---

## สรุป Function — แท็บ Task (Task List)

**สถานะ:** สรุป + ออกแบบเบื้องต้น (รอ function อื่นก่อน Phase/Checklist)  
**ผู้ใช้หลัก:** **Planner** (มอบหมายงาน) · ช่างดูรายการเดียวกันก่อนทำงาน

### ใครใช้ · เปิดจากไหน

| บทบาท | หน้าที่เปิด WO | แท็บใน modal | ทำอะไรบน Task |
|--------|----------------|--------------|----------------|
| **Planner** | `/calendar` · `/planning` · `/plan-calendar` | **Task** (ค่าเริ่มต้น) → **Planning** (จ่ายงาน) | อ่านรายการ PM ก่อนจ่ายงาน |
| ช่าง | `/plan-calendar` | Task → Close WO | อ่าน checklist · บันทึกค่าวัด/comment |

Modal จากปฏิทินใช้ layout **Task · Planning · Close WO** (`tabLayout=assigned`)

### ข้อมูลบนจอ — มาจากไหน

| ส่วน UI | แหล่งข้อมูล | หมายเหตุ |
|---------|-------------|----------|
| เลข WO · วันแผน · สถานะ SAP | **IW37N** (`tbiw37n`) หลัง upload | WO เปลี่ยนทุกรอบ |
| **Maintenance plan** | IW37N + แสดงซ้ำใน Task | ตัวผูกหลัก |
| Legacy · Machine · PM list | **Task list** (`tbtasklist`) หลัง Publish | ผูกด้วย `mntplan` |
| จ่ายงาน (ช่าง/กลุ่ม) | แท็บ **Planning** — ไม่ใช่แท็บ Task | Planner มอบหมายที่นี่ |

### สิ่งที่ Planner ต้องเห็น (สรุปจากที่ตกลง)

1. **รู้ใบงาน SAP** — WO + วัน + สถานะ + `mntplan`
2. **รู้ชุด PM** — ตัวใหญ่ = **Maintenance plan** ไม่ใช่ Task list (`596`)
3. **บริบทแผน** — Legacy · Zone · Work center type (ME/EE/PK)
4. **รายการงาน** — checklist แต่ละแถว = `Machine — PM list` (ภาษาไทยเต็ม)
5. **สรุปจำนวน** — เช่น `3 รายการ · เดิน 2 · หยุด 1`
6. **ทางไปจ่ายงาน** — ปุ่ม/ลิงก์ไปแท็บ **Planning** หลังอ่าน Task แล้ว

### ตัวอย่าง (WO `4001560529` · mntplan `342596`)

| ฟิลด์ | ค่า |
|--------|-----|
| Maintenance plan | `342596` |
| Task list (รอง) | `596` |
| Legacy | `P17-HR-ME2` |
| Zone / Craft | P17 · ME |
| รายการ | `1. SSN Dust Collector — เปลี่ยน Bearing เพลาขับ Dust collector` [หยุด] |

### กรณีว่าง / ผิดพลาด (Planner ต้องเข้าใจ)

| สถานะ | Planner เห็นอะไร | แนะนำ action |
|--------|------------------|--------------|
| Upload IW37N แล้ว · Publish แล้ว | Task ครบ | ไปแท็บ Planning จ่ายงาน |
| มี IW37N · **ยังไม่ Publish** | Task ว่าง + ข้อความชัด | Admin → Master Plan → Publish |
| `mntplan` **ไม่มีในแผน** | Task ว่าง + ระบุเลข plan | ตรวจ Master Plan / สอบถามลูกค้า |
| ไม่มี `mntplan` ใน IW37N | Task ว่าง | ตรวจข้อมูล SAP |

### สิ่งที่ Planner **ไม่ทำ** บนแท็บ Task

- ไม่แก้ PM list / machine (แก้ที่ Master Plan + Publish)
- ไม่จ่ายงาน (ทำที่แท็บ Planning)
- ไม่ปิดงาน (แท็บ Close WO — เฉพาะช่างที่ assign + รับงานแล้ว ผ่าน Telegram หรือ Web)

---

## ออกแบบ — แท็บ Task (Planner)

รายละเอียด wireframe: [`CALENDAR-WO-TASK-DESIGN.md`](CALENDAR-WO-TASK-DESIGN.md)

### โครงหน้าจอ (บน → ล่าง)

```
┌─ 1. แถบ WO (จาก IW37N) ─────────────────────────────┐
│ WO · วันแผน · สถานะ SAP · mntplan (ลิงก์ Master Plan) │
├─ 2. การ์ดแผน PM ────────────────────────────────────┤
│ 342596  ← ตัวใหญ่ (Maintenance plan)                │
│ Legacy P17-HR-ME2 · ME · P17 · Task list 596        │
│ 1 รายการ · หยุด 1                                   │
├─ 3. PM job list (checklist) ────────────────────────┤
│ 1. SSN Dust Collector — เปลี่ยน Bearing...  [หยุด]   │
├─ 4. ทาง Planner ────────────────────────────────────┤
│ [ไปแท็บ Planning — มอบหมายงาน]                      │
├─ 5. Comment (ยุบได้ / ล่าง) ────────────────────────┤
└─────────────────────────────────────────────────────┘
```

### หลัก UI

| หลัก | รายละเอียด |
|------|-------------|
| mntplan ใหญ่ | Task list เป็นข้อมูลรอง |
| บรรทัดเดียวต่องาน | `Machine — PM list` |
| แยก WO กับแผน | ไม่เน้นเลข 596 เป็นหัวข้อหลัก |
| CTA Planner | ชัดว่าจ่ายงานที่แท็บ Planning |
| Empty state | บอกสาเหตุ + ขั้นตอนแก้ (Publish / Master Plan) |

### API ที่ต้องมีก่อน implement

เพิ่มใน `GET .../modal-detail` → `taskList`:

- `summary.legacy`
- `items[].displayLine` (= `machine — pmlist`)

---

## สรุป Function — แท็บ Planning (มอบหมายงาน)

**สถานะ:** สรุป + ออกแบบเบื้องต้น (รอ function อื่นก่อน Phase/Checklist)  
**ผู้ใช้หลัก:** **Planner** (`planning.assign`) · ช่างอ่านอย่างเดียว

### ใครใช้ · เปิดจากไหน

| บทบาท | หน้าที่เปิด WO | แท็บ | ทำอะไร |
|--------|----------------|------|--------|
| **Planner** | `/calendar` · `/planning` · `/plan-calendar` | **Planning** (หลังอ่าน Task) | มอบหมายช่างหลายคนให้ WO |
| ช่าง | `/plan-calendar` | Planning | ดูว่าใครได้รับงาน |
| Admin | — | — | **ไม่แสดงในรายชื่อช่าง PM** |

### สิ่งที่ลูกค้าต้องการ (9 มิ.ย. 2026)

1. **การ์ดช่าง** — ชื่อชัด (รหัส + ชื่อ-นามสกุล) แทนรายการ checkbox ธรรมดา
2. **เลือกหลายคน** — multi-select แล้วบันทึกครั้งเดียว (`planning/batch`)
3. **ไม่เอา Admin** — บัญชี Admin ไม่เกี่ยวกับงาน PM (เช่น ไม่แสดง `ADMIN01`)
4. **Checkbox หมวด** — **AA** Shift Day · **BB** Shift Night · **EE** Electrical · **UT** Utility  
   - ลูกค้ายืนยัน: **AA/BB จะผูกชื่อคนทีหลัง** — เฟส 1 เน้น UI + กรอง · เฟส 2 ผูก master บุคลากร

### ข้อมูลบนจอ

| ส่วน | แหล่ง | หมายเหตุ |
|------|-------|----------|
| Pool ช่าง | `tbworkcenter` (กรอง) | ตอนนี้โค้ดดึงทุกคน — ต้องตัด admin |
| จ่ายแล้ว | `tbplangingwork` | แสดง ASSIGNED บนการ์ด |
| ชม.ว่าง | HR − แผนที่จ่ายแล้ว | มีใน `PlanningQuickAssign` แล้ว |
| จ่ายกลุ่ม | `tbwkctrgroup` | คงตารางกลุ่มแยกจากรายบุคคล |

### แมปรหัสทีม (UI ลูกค้า ↔ DB)

| UI | ความหมาย | ค่าใน `tbiw37n.team` ปัจจุบัน |
|----|----------|-------------------------------|
| AA | Shift Day | `A` |
| BB | Shift Night | `B` |
| EE | Electrical | `EE` |
| UT | Utility | `UT` |

### โครงหน้าจอ (สั้น)

```
หมายเหตุแผน → Checkbox AA/BB/EE/UT → การ์ดช่าง (ค้นหา + multi-select)
→ [มอบหมายที่เลือก] → ตารางรายชื่อจ่ายแล้ว → มอบหมายกลุ่ม
```

รายละเอียด wireframe + gap API: [`PLANNING-TAB-DESIGN.md`](PLANNING-TAB-DESIGN.md)

### สิ่งที่ Planner **ไม่ทำ** บนแท็บ Planning

- ไม่แก้รายการ PM (แท็บ Task / Master Plan)
- ไม่ปิดงาน (แท็บ Close WO — ฝั่งช่างที่รับงานแล้ว ผ่าน Telegram หรือ Web)
- ไม่เลือก Admin เป็นผู้รับงาน PM

---

## สรุป Function — แท็บ Close WO (ปิดงาน)

**สถานะ:** สรุป + ออกแบบเบื้องต้น (รอ function อื่นก่อน Phase/Checklist)  
**ผู้ใช้หลัก:** **ช่าง** ที่ถูกมอบหมายและกดรับงานแล้ว (Telegram **หรือ** Web)

### กฎจากลูกค้า (9 มิ.ย. 2026)

> Close WO **เห็นได้เฉพาะ** ช่างที่ (1) **ถูก assign** งาน WO นั้น และ (2) **กดรับงานผ่าน Telegram หรือ Web application** แล้ว

| เงื่อนไข | ตรวจจาก |
|----------|---------|
| ถูก assign | `tbplangingwork` — `wkctr` = login · `pwteam <> 'G'` |
| รับงานแล้ว | `ack_status = acknowledged` · `ack_channel` = `telegram` หรือ `web` |

### ใครเห็นแท็บ Close WO (modal ปฏิทิน)

| บทบาท | Close WO |
|--------|----------|
| ช่าง — assign + รับงานแล้ว (TG/Web) | **เห็น** (+ `confirmation.write` เพื่อบันทึก) |
| ช่าง — ยังไม่ ack / ไม่ได้ assign | **ไม่เห็น** |
| Planner | **ไม่เห็น** — ใช้ Task + Planning |
| Admin | **ไม่เห็น** ใน flow PM ปกติ |

### Flow สั้น

```
จ่ายงาน (Planning) → ช่างกดรับงาน (Telegram หรือ /planning) → เปิด WO → แท็บ Close WO ปรากฏ
```

### โค้ดปัจจุบัน (gap)

- แท็บ Close WO แสดง**เสมอ**ใน `tabLayout=assigned` — ยังไม่กรอง assign + ack
- API รับงาน Web (`POST .../planning/orders/:idiw37/ack`) และ Telegram ack **พร้อมแล้ว** — ต้องนำไปผูกสิทธิ์แท็บ

รายละเอียด wireframe + API: [`CLOSE-WO-TAB-DESIGN.md`](CLOSE-WO-TAB-DESIGN.md)

---

## สรุป Function — Confirmation (Planner)

**สถานะ:** สรุป + ออกแบบเบื้องต้น  
**ผู้ใช้หลัก:** **Planner** — ตรวจปิดงานช่าง · Confirm/Reject · Export SAP

### สิ่งที่ลูกค้าต้องการ (9 มิ.ย. 2026)

1. หลังช่างปิดงาน → หน้า **Confirmation** แสดงตารางข้อมูลเบื้องต้น (Order · Wrk Ctr · Act.Work · วันเวลา — ตามภาพ)
2. **ทำหน้าใหม่** + **เมนู sidebar เดียว** ชื่อ **Confirmation** (รวม `/personnel/confirm` + `/confirmation` เดิม)
3. Planner ดูรูป · กด **Confirm** / **Reject**
4. **Export Confirmation** → ไฟล์ตรง [`Export_Confirm (26May).xlsx`](../../docs%20from%20customer/Export_Confirm%20(26May).xlsx) เท่านั้น (14 คอลัมน์ · สะกด Comfirmation)

### Flow สั้น

```
ช่างปิดงาน → Planner เห็นแถวในตาราง → ดูรูป → Confirm/Reject → Export Excel → upload SAP
```

### Gap หลัก

- ตอนนี้แยก 2 หน้า/2 เมนู · export แสดงเฉพาะ QC approved — ยังไม่แสดง preview ทันทีหลังช่างปิด
- Excel sheet name โค้ด ≠ template ลูกค้า (`Worksheet`)

รายละเอียด: [`CONFIRMATION-PAGE-DESIGN.md`](CONFIRMATION-PAGE-DESIGN.md)

---

## รอสรุป function อื่น (ยังไม่ครบทั้งโปรเจกต์)

- Master Plan (อ่าน / ค้นหา / แก้ / Publish) — แกนมีแล้ว รอสรุป function doc
- IW37N / Calendar (นอกเหนือจาก Task tab)
- ~~Admin~~ → สรุปแล้ว: [`ADMIN-FUNCTIONS-SUMMARY.md`](ADMIN-FUNCTIONS-SUMMARY.md)
- Import แผนประจำปี / Automation outbound

---

## อ้างอิงเพิ่ม

- **Phase + Checklist implement:** [`PM-WORKFLOW-PHASE-CHECKLIST.md`](PM-WORKFLOW-PHASE-CHECKLIST.md) ← เริ่มทำที่นี่
- สเปกเทคนิค: [`docs/superpowers/specs/2026-06-09-master-plan-design.md`](../superpowers/specs/2026-06-09-master-plan-design.md)
- Checklist Master Plan UX: [`docs/superpowers/plans/2026-06-09-master-plan-ux-phase2-checklist.md`](../superpowers/plans/2026-06-09-master-plan-ux-phase2-checklist.md)
