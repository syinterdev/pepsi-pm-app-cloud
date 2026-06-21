# PM Vibration — หน้า 2 Comments and Findings (สเปกลูกค้า)

**อัปเดต:** 2026-06-21  
**สถานะ:** implement ✅ · รอ UAT ลูกค้า (Phase 4)  
**เกี่ยวข้อง:** [`PM-VIBRATION-IMPLEMENTATION-PHASES.md`](PM-VIBRATION-IMPLEMENTATION-PHASES.md) · [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](../customer-requirements/PM-MANUAL-ENTRY-WORK-ORDER-FORM.md) §4

---

## 1) สรุปฟิลด์ (จากภาพ markup ลูกค้า)

| ฟิลด์บนกระดาษ | การทำ | แหล่งข้อมูล |
|---------------|--------|-------------|
| **Comments:** | **ช่างกรอกเอง** | `tbwo_pm_note_entry` (thread) — มีแล้ว |
| **Activity Report** | **Auto** — แสดง Tech ID | ผู้ login ที่ปิดงาน · `wkctr` (เช่น `PRO015`) |
| **Completed by** | **Auto** — แสดงชื่อช่าง | ชื่อ-นามสกุลช่างที่ปิดงาน |
| **Date** | **Auto** | วันที่ช่างปิดงาน |
| **Subsequent Notification** | **เอาออก** | ลูกค้าไม่ใช้ |
| **Signature** | **Auto (text)** — `RECEIVED by {ชื่อ}` | ชื่อ Planner จาก `tbworkcenter` หลัง **Receive** / **Reject** · **ไม่ upload รูป** |
| Equipment Y/N | ช่างเลือก (คงจากสเปกเดิม) | manual · persist Phase 4 |

---

## 2) เงื่อนไขก่อนแสดง / บันทึก (ช่าง)

ช่างต้องผ่านเงื่อนไขเดียวกับ **Close WO** ก่อนที่ฟิลด์ auto จะมีค่า:

| เงื่อนไข | ตรวจจาก |
|----------|---------|
| **ถูก assign** งาน WO นั้น | `tbplangingwork` — `wkctr` = login |
| **รับงานแล้ว** (ack) | `ack_status = acknowledged` (Telegram หรือ Web) |

**โค้ดอ้างอิง:** `close-wo-access.ts` · `resolveCloseWoAccess()`

```text
Planner มอบหมาย → ช่าง ack → ช่างปิดงาน (personnel-close)
                              │
                              ├─ Activity Report  = wkctr ช่าง
                              ├─ Completed by     = ชื่อช่าง
                              └─ Date             = วันปิดงาน
```

---

## 3) รายละเอียดแต่ละฟิลด์

### 3.1 Comments — manual

| รายการ | ค่า |
|--------|-----|
| UI | Textarea / thread หลายบรรทัด |
| สิทธิ์ | `confirmation.write` + ผ่าน close access |
| เก็บ | `app.tbwo_pm_note_entry` (append-only) |
| สถานะ | **มีแล้ว** — `WorkOrderPmCommentThread` |

### 3.2 Activity Report — Tech ID (auto)

| รายการ | ค่า |
|--------|-----|
| แสดง | รหัสช่าง **`wkctr`** ของ session ที่ปิดงาน |
| ตัวอย่างภาพ | `PRO015` (annotation: `PRO015 -> Tech ID`) |
| ไม่ใช่ | ช่องกรอก manual |
| Trigger | บันทึก personnel-close / ปิด operation |

**API แนะนำ:** ดึงจาก `authUser.wkctr` ตอน close · เก็บ snapshot ใน `tbwo_pm_page2.activity_report_wkctr`

### 3.3 Completed by — ชื่อช่าง (auto)

| รายการ | ค่า |
|--------|-----|
| แสดง | ชื่อ-นามสกุลช่างที่ปิดงาน |
| แหล่ง | `tbworkcenter` / `personnel-close` → `displayName` |
| ตัวอย่างภาพ | annotation **Tech name** |

**API แนะนำ:** `displayNameFromRow()` pattern จาก `personnel-close.ts`

### 3.4 Date — วันปิดงาน (auto)

| รายการ | ค่า |
|--------|-----|
| แสดง | วันที่ช่างปิดงาน (ไม่ใช่วันที่ Planner receive) |
| แหล่ง | `personnel-close.cstdate` / `cendate` หรือ `closed_at` ตอนบันทึก |

### 3.5 Subsequent Notification — เอาออก

| รายการ | ค่า |
|--------|-----|
| UI | **ลบ** input + label ทั้งคู่ |
| DB | ไม่สร้างคอลัมน์ |

### 3.6 Signature — RECEIVED by Planner (auto · text)

| รายการ | ค่า |
|--------|-----|
| รูปแบบ | **`RECEIVED by {ชื่อ Planner}`** — **text read-only** (ไม่ upload รูปลายเซ็น) |
| Trigger | Planner กด **Receive (Approve)** หรือ **Reject** บนหน้า Confirmation |
| แหล่งชื่อ | `confirm_qc_by` (wkctr) → lookup **`tbworkcenter`** → ชื่อ-นามสกุล Planner |
| เก็บ | `tbwo_pm_page2.signature_planner_name` · API `page2Form.signatureText` |

**โค้ดอ้างอิง:** `getConfirmQcSnapshot()` ใน `work-orders.ts` → `reviewedBy`, `reviewedAt`

```text
ช่างปิดงาน → Planner ดู Confirmation → Approve / Reject
                                              │
                                              └─ Signature = RECEIVED by {planner name}
```

> ก่อน Planner review: แสดง `Signature: —` หรือว่าง

---

## 4) โครง UI เป้าหมาย

```text
┌─ Comments and Findings ─────────────────────────────┐
│ Comments: *                                         │
│ [textarea / thread — ช่างกรอก]                      │
│                                                     │
│ Damage, Cause & Activity Codes Must Be Recorded…    │
│                                                     │
│ Activity Report:  PRO015          (read-only, auto) │
│ Completed by:     สมชาย ใจดี       (read-only, auto) │
│ Date:             26.05.2026      (read-only, auto) │
│                                                     │
│ Signature:        RECEIVED by KAEW  (auto หลัง QC)  │
│                                                     │
│ Equipment back in operation … ?  ( ) Y  ( ) N       │
└─────────────────────────────────────────────────────┘

[ไม่มี Subsequent Notification]
```

---

## 5) โค้ดปัจจุบัน vs เป้าหมาย

| ฟิลด์ | `WorkOrderPmSapPage2Form` วันนี้ | เป้าหมาย |
|-------|----------------------------------|----------|
| Comments | thread ✅ | คงไว้ |
| Activity Report | manual input ❌ | auto `wkctr` |
| Completed by | manual input ❌ | auto ชื่อช่าง |
| Date | manual date picker ❌ | auto วันปิดงาน |
| Subsequent Notification | manual input ❌ | **ลบ** |
| Signature | disabled placeholder ❌ | `RECEIVED by {planner}` |
| Equipment Y/N | local state | persist + แสดง |

---

## 6) DB / API (Phase 4 แนะนำ)

### ตาราง `app.tbwo_pm_page2` (WO-level snapshot)

| คอลัมน์ | ค่า |
|---------|-----|
| `idiw37` | FK WO |
| `activity_report_wkctr` | Tech ID ตอนปิด |
| `completed_by_name` | ชื่อช่าง |
| `closed_date` | date |
| `equipment_ok` | `Y` / `N` |
| `signature_planner_name` | หลัง QC |
| `signature_at` | timestamp QC |
| `signature_action` | `approved` / `rejected` |

**Comments** คงแยกใน `tbwo_pm_note_entry`

### API

| Method | Endpoint | ใช้เมื่อ |
|--------|----------|----------|
| GET | `modal-detail` → `page2Form` | โหลดหน้า PM |
| POST | personnel-close (มีแล้ว) | trigger บันทึก Activity/Completed/Date |
| PUT | `pm-page2` | Equipment Y/N |
| — | confirm QC approve/reject (มีแล้ว) | trigger อัปเดต Signature |

---

## 7) Checklist implement

- [x] ลบ **Subsequent Notification** จาก UI + i18n
- [x] Activity Report → read-only · จาก `wkctr` ช่างที่ close
- [x] Completed by → read-only · จาก displayName
- [x] Date → read-only · จากวันปิดงาน
- [x] ตรวจ **assign + ack** ก่อนให้ปิดงาน (reuse `closeWoAccess`)
- [x] Signature → อ่านจาก confirm QC หลัง Approve/Reject (`tbwo_pm_page2`)
- [x] Migration `tbwo_pm_page2` — `115_wo_pm_page2.sql`
- [ ] UAT: ช่างไม่ assign → ไม่ปิดได้ · หลัง Planner Receive → Signature แสดงชื่อ *(รอลูกค้า)*

---

## 8) อ้างอิงโค้ด

| ไฟล์ | บทบาท |
|------|--------|
| `WorkOrderPmSapPage2Form.tsx` | UI หน้า 2 |
| `WorkOrderPmCommentThread.tsx` | Comments |
| `close-wo-access.ts` | assign + ack gate |
| `personnel-close.ts` | บันทึกปิดงานช่าง |
| `confirm-qc.ts` / Confirmation page | Planner Receive/Reject |
| `WoConfirmationTable.tsx` | Approve/Reject UI |

---

*สรุปจาก feedback + ภาพ markup ลูกค้า 2026-06-21*
