# Checklist — ปัญหาและ UX จากระบบเก่า

อัปเดต: 2026-05-21  
แหล่ง: `from customer/Problem PM App*.xlsx` · screenshot + note ลูกค้า (ระบบ `lay.rtc32.org`) · [**MEETING-MINUTES.md**](MEETING-MINUTES.md) (ประชุม 28 เม.ย. / 7 พ.ค. 2569)

**สถานะ:** `[ ]` ยังไม่ทำ · `[~]` มีบางส่วนใน React · `[x]` ปิดแล้ว

---

## A) จาก Problem PM App (ก.ย. 2020)

### A.1 Move แผนสีเขียว (3 Sep)

| ID | ปัญหา | Must | React วันนี้ | หมายเหตุ |
|----|--------|------|--------------|----------|
| A.1 | แผนสีเขียว (งานที่ปิด/TECO แล้ว) **ยัง Move ได้** — ควร Move ไม่ได้ | **Must** | [x] | `canMovePlan` บน event · ห้าม drag · API `STATUS_NOT_MOVABLE` |

### A.2 หลัง confirm — ดูรูป/เวลาใน WO (4 Sep)

| ID | ปัญหา | Must | React วันนี้ | หมายเหตุ |
|----|--------|------|--------------|----------|
| A.2a | หลังช่าง confirm ปิดงาน (WO สีเขียว/สถานะ 4) หัวหน้าต้องเห็น **รูป + เวลาทำงาน** ใน WO | **Must** | [x] | แถบ「ปิดงานแล้ว」+ ปุ่มเวลาช่าง/ปิดงาน/รูป ใน modal |
| A.2b | เพิ่ม **แท็บหรือปุ่ม** ไปหน้า confirm / แสดงรูป+เวลาโดยไม่ต้องไปเมนูอื่น | Should | [x] | ปุ่มใน modal + ลิงก์ `/confirmation` (ส่ง `state.wkorder`) |

### A.3 แก้ Task list (8 Sep)

| ID | ปัญหา | Must | React วันนี้ | หมายเหตุ |
|----|--------|------|--------------|----------|
| A.3a | แก้ task list ทีละบรรทัดของ 1 เลข task list | — | [~] | ตาม master/task list UI |
| A.3b | หลัง Save **ไม่เด้งกลับหน้าแรก** — ค้างหน้าเดิมที่แก้ | **Must** | [x] | Task list: dialog ค้างหลัง Update · ไฮไลต์แถว · `?entity=tasklist` |
| A.3c | ไม่ต้องรอโหลดทั้งหน้าแล้วกลับ index 0 | Should | [~] | `keepPreviousData` + refetch แทน invalidate ปิด dialog |

### A.4 สรุป WO ไม่ตรง filter (15 Sep)

| ID | ปัญหา | Must | React วันนี้ | หมายเหตุ |
|----|--------|------|--------------|----------|
| A.4 | **เวลา / จำนวน WO** ในกล่องสรุปต้องตรงกับ filter ที่เลือก | **Must** | [~] | `FilterDetailSummary` หลัง Search — ตรวจ calendar + work-orders |

---

## B) จาก screenshot ระบบเก่า (note ภาษาไทย)

### B.1 ปฏิทิน + กล่องสรุป

| ID | ความต้องการ | Must | React | หมายเหตุ |
|----|-------------|------|-------|----------|
| B.1 | กล่องสรุป: WorkOrder, **Completion % + จำนวน WO ที่ปิดแล้ว**, TeamA/TeamB Work | **Must** | [x] | `/calendar` — `FilterDetailSummary` + `POST /api/v1/calendar/filter-detail` |
| B.1b | ปฏิทินแสดง WO สีเขียว/แดง/น้ำเงิน ตามสถานะ/ทีม | Should | [~] | ยืนยัน mapping สีกับลูกค้า |

### B.2 ค้นหาแล้วข้อมูลหาย

| ID | ความต้องการ | Must | React | หมายเหตุ |
|----|-------------|------|-------|----------|
| B.2 | กรอง Type=ZB02 (และ filter อื่น) **ต้องไม่ทำให้ปฏิทินว่างผิดๆ** | **Must** | [x] | Regression API ผ่าน 2026-05-22 · ว่างมักเพราะปีผิด (2026) หรือไม่มี 7151 ใน functionalloc — ใช้ dropdown ปี + import May-Jun |
| B.2b | ตัวเลขสรุปไม่เป็น 0 ทั้งหมดเมื่อมีข้อมูล | **Must** | [~] | `FilterDetailSummary` หลัง Search — ตรวจมือบน `/work-orders` |

### B.3 Personnel

| ID | ความต้องการ | Must | React | หมายเหตุ |
|----|-------------|------|-------|----------|
| B.3 | Username ผิด (เช่น `0`) **แก้และลบได้** | **Must** | [~] | `/admin/users` — ตรวจ disabled rules |
| B.3b | นำเข้า/ส่งออก Excel บุคลากร | Should | [~] | เทียบ M_personel |

### B.4 Assign Team A/B (ตาราง WO)

| ID | ความต้องการ | Must | React | หมายเหตุ |
|----|-------------|------|-------|----------|
| B.4 | **ไม่** popup สำเร็จทีละ WO | **Must** | [x] | bulk save — toast เดียว (`WorkOrdersPage`) |
| B.4b | เลือก Team A/B ทั้งหน้า (เช่น 50 แถว) → **Save ครั้งเดียว** | **Must** | [x] | checkbox + `บันทึกทีมครั้งเดียว` · `patchWorkOrderTeamBatch` |
| B.4c | กล่อง TeamA/TeamB **อัปเดตทันที** เมื่อเลือก radio (ไม่ refresh) | **Must** | [x] | `/work-orders` — `filter-detail-team-live.ts` delta จาก radio ก่อน Save |
| B.4d | Modal WO: แท็บ **Task List เป็นค่าเริ่มต้น** | **Must** | [x] | `initialTab="task-list"` จาก `/work-orders`, `/plan-calendar` |

---

## C) แมป route / เอกสาร parity

| หัวข้อ | Route / ไฟล์ | Parity doc |
|--------|--------------|------------|
| ปฏิทิน | `/calendar`, `/plan-calendar` | `04`, `08` |
| Work Order + team | `/work-orders` | `06` |
| Planning assign | `/planning` | `08` |
| Confirm + รูป | `/confirmation`, modal WO | `09` |
| Personnel | `/admin/users`, `/personnel` | `10`, `14` |
| Import SAP | `/integration`, `/iw37n` | `07`, `15` |
| รายงาน | `/summary-weekly`, `/reports` | `12` |

---

## D) จากรายงานประชุม (ครั้งที่ 1–2)

| ID | ความต้องการ | Must | หมายเหตุ |
|----|-------------|------|----------|
| M.1 | Import/Export Excel SAP · Scheduling/Tracking | **Must** | ครั้งที่ 1 §3 · ครั้งที่ 2 วาระ 3 |
| M.2 | ไม่ผูก UX แค่รอบ SAP 07:00/19:00 — อัปโหลด/ใช้งานได้ยืดหยุ่น | **Must** | watch folder + manual upload |
| M.3 | **Mass Confirm 44** — bulk ไม่ทีละ 1 รายการ | **Must** | [x] | `POST /api/v1/confirmation/closes/batch` · `/personnel/confirm` · `/confirmation` |
| M.4 | สถานะ REL / Confirm / Create ใน UI | **Must** | [x] `WoPmPhaseBadge` — CRTD→Create, REL, อื่น→Confirm |
| M.5 | Real-time Job Assignment + Weekly Report | **Must** | ครั้งที่ 1 §1, §4 |
| M.6 | Confirm + รูป ~5 · Admin ตรวจก่อน dashboard | Should | ครั้งที่ 1 §6 · ลงนามจำนวน: [CONFIRM-IMAGE-LIMITS.md](CONFIRM-IMAGE-LIMITS.md) |
| M.7 | Telegram · Engineering Board | Later | ครั้งที่ 1 §2 |
| M.8 | Vibration / Predictive | Future | ครั้งที่ 1 §5 |

---

## E) ลำดับ implement แนะนำ

1. **P0** Parser ALV (ดู [SAP-SAMPLE-PROBE.md](SAP-SAMPLE-PROBE.md)) — ไม่งั้น B.2 ทดสอบไม่ได้
2. **P1** B.4 bulk assign + B.4c real-time summary
3. **P1** B.4d Task List default tab + A.2 รูป/เวลาใน WO
4. **P1** B.1 widget ปฏิทิน + A.4 สรุปตรง filter
5. **P2** A.3b ค้างหน้าหลัง save task list · B.3 personnel · A.1 move เขียว

---

## F) อ้างอิงต้นฉบับ

- `from customer/Problem PM App2  (4Sep).xlsx`
- `from customer/Problem PM App3  (8Sep).xlsx`
- `from customer/Problem PM App4  (15 Sep).xlsx`
