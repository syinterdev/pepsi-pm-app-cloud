# แท็บ Task — Task List (ออกแบบ)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** ออกแบบ (คู่กับสรุปใน [`MASTER-PLAN-MNTPLAN-BINDING.md`](MASTER-PLAN-MNTPLAN-BINDING.md))  
**ผู้ใช้หลัก:** **Planner** — อ่าน Task แล้วไปมอบหมายที่แท็บ Planning

---

## Flow Planner (หลัง upload IW37N)

```
Planner upload / ดู IW37N
    → /calendar หรือ /planning เห็น WO บนปฏิทิน
    → คลิก WO → modal เปิดแท็บ Task (ค่าเริ่มต้น)
    → อ่าน Maintenance plan + รายการ PM
    → สลับแท็บ Planning → มอบหมายช่าง/กลุ่ม
```

| ขั้น | แท็บ | ข้อมูล |
|------|------|--------|
| 1 | **Task** | `mntplan` → legacy → machine → PM list (จาก Publish) |
| 2 | **Planning** | ช่างที่รับผิดชอบ · comment จ่ายงาน |
| 3 | Close WO | ช่างปิดงาน — **เฉพาะ** ผู้ถูก assign + รับงานแล้ว (Telegram หรือ Web) ([`CLOSE-WO-TAB-DESIGN.md`](CLOSE-WO-TAB-DESIGN.md)) |

---

## Wireframe — แท็บ Task

```
┌──────────────────────────────────────────────────────────────┐
│  Work order 4001560529                          [Expand] [×] │
│  [ Task ]  [ Planning ]  [ Close WO ]                          │
├──────────────────────────────────────────────────────────────┤
│ ① WO context                                                 │
│    WO 4001560529 · 12 May 2026 · REL · mntplan 342596 ↗      │
├──────────────────────────────────────────────────────────────┤
│ ② Plan card                                                  │
│    MAINTENANCE PLAN                                          │
│    342596                                                    │
│    P17-HR-ME2 · ME · Zone P17 · Task list 596                │
│    1 item · Stopped 1                                        │
├──────────────────────────────────────────────────────────────┤
│ ③ PM job list                                                │
│    ┌────────────────────────────────────────────────────────┐  │
│    │ 1  SSN Dust Collector — เปลี่ยน Bearing เพลาขับ...   │  │
│    │                                        [ Stopped ]   │  │
│    └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ ④ Planner action                                             │
│    [ ไปมอบหมายงาน (Planning) → ]                              │
├──────────────────────────────────────────────────────────────┤
│ ⑤ Comment (collapsed หรือล่าง)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## รายละเอียดแต่ละบล็อก

### ① WO context (จาก IW37N)

Compact bar — ไม่ซ้ำหัว modal มากเกินไป

| ฟิลด์ | ตัวอย่าง |
|--------|----------|
| Work order | `4001560529` |
| Planned date | จาก `contextDate` ปฏิทิน |
| SAP status | badge |
| Maintenance plan | `342596` + ลิงก์ค้นหาใน `/master-plan` |

### ② Plan card (hero)

| ลำดับแสดง | ฟิลด์ | ขนาด |
|-----------|--------|------|
| 1 | **Maintenance plan** | ใหญ่ |
| 2 | Legacy · Craft · Zone | บรรทัดรอง |
| 3 | Task list code | เล็ก (รอง) |
| 4 | สรุปรายการ · เดิน/หยุด | badge |

**ไม่ใช้** Task list `596` เป็นตัวเลขหัวข้อหลัก

### ③ PM job list

- แต่ละแถว: `{ลำดับ}. {Machine} — {PM list}`
- PM list ภาษาไทย — ไม่ตัดข้อความ
- Badge เดิน/หยุด ด้านขวา
- **Planner:** อ่านอย่างเดียว (ไม่กรอกค่าวัด — ค่าวัดเป็นของช่างตอนปิดงาน)

### ④ Planner action

- ปุ่มเด่น: **ไปมอบหมายงาน** → สลับแท็บ Planning
- แสดงเมื่อมีสิทธิ์ `planning.assign` (หรือเทียบเท่า)

### ⑤ Comment

- ยุบได้ (Planner ไม่จำเป็นต้อง comment บน Task)
- ช่างอาจใช้มากกว่า — เก็บไว้ล่าง checklist

---

## Empty states

| สถานะ | ข้อความ (ตัวอย่าง) | ปุ่ม |
|--------|-------------------|------|
| ยังไม่ Publish | ยังไม่มี Task list สำหรับ mntplan นี้ | ไป Master Plan |
| ไม่มีในแผน | ไม่พบ mntplan xxx ใน Master Plan | ค้นหาใน Master Plan |
| ไม่มี mntplan ใน WO | WO นี้ไม่มี Maintenance plan | — |

---

## หน้าที่ใช้ layout เดียวกัน

| Route | Modal | แท็บ Task |
|-------|-------|-----------|
| `/calendar` | assigned | § wireframe |
| `/plan-calendar` | assigned | เหมือนกัน |
| `/planning` | ตามที่เปิด WO | เหมือนกัน |

Component กลาง: `WorkOrderTaskListPanel` + strip WO context ใน `WorkOrderDetailDialog`

---

## รอ confirm

- [ ] ปุ่ม “ไป Planning” บนแท็บ Task — ต้องการหรือไม่
- [ ] Planner เห็นค่าวัด PM หรือซ่อนไว้ (แนะนำ: ซ่อนสำหรับ Planner)
- [ ] Comment บน Task — Planner ใช้หรือไม่
