# แท็บ Close WO — สรุป + ออกแบบ (สิทธิ์ช่าง)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** implement แล้ว (P3 — 9 มิ.ย. 2026)  
**ผู้ใช้หลัก:** **ช่าง** ที่ได้รับมอบหมายและกดรับงานแล้ว (Telegram **หรือ** Web)

---

## กฎจากลูกค้า

> **Close WO จะเป็นช่างที่ได้รับการ assign งานและกดรับงานผ่าน Telegram หรือ Web application แล้วเท่านั้นถึงจะมีสิทธิ์เห็น**

สรุปเป็นเงื่อนไข 2 ชั้น (ต้องครบทั้งคู่):

| # | เงื่อนไข | แหล่งข้อมูล |
|---|----------|-------------|
| 1 | **ถูก assign** ให้ WO นี้ (รายบุคคล) | `app.tbplangingwork` — `idiw37` + `wkctr` ตรง login · `pwteam <> 'G'` |
| 2 | **กดรับงานแล้ว** | `ack_status = 'acknowledged'` · `ack_channel` = `telegram` **หรือ** `web` |

ถ้าไม่ครบ → **ไม่แสดงแท็บ Close WO** (หรือแสดงข้อความชี้แจงแทนเนื้อหาปิดงาน)

---

## ช่องทางรับงาน (เทียบเท่ากัน)

| ช่องทาง | การกระทำ | API / โค้ด |
|---------|----------|------------|
| **Telegram** | กดปุ่ม「รับทราบงาน」ในแชท Bot | `telegram-webhook.ts` → `acknowledgePlanningAssignment(..., 'telegram')` |
| **Web** | กด「รับทราบ」บนหน้า `/planning` หรือใน modal WO | `POST /api/v1/planning/orders/:idiw37/ack` → `ack_channel=web` |

ทั้งสองช่องทางตั้ง `ack_status=acknowledged` — **เปิดสิทธิ์ Close WO เท่ากัน**

---

## Flow ช่าง (ภาพรวม)

```
Planner จ่ายงาน (แท็บ Planning)
        ↓
แจ้ง Telegram (ถ้าช่างผูกบัญชีแล้ว) + ช่างเห็นงานบน /planning
        ↓
ช่างกดรับงาน — ทางใดทางหนึ่ง:
  · Telegram → ack_channel=telegram
  · Web app  → ack_channel=web
        ↓
ช่างเปิด WO จาก /plan-calendar (modal: Task · Planning · Close WO)
        ↓
เห็นแท็บ Close WO → บันทึกปิดงาน / รูป / comment
```

**ก่อนรับงาน:** ช่างอาจเห็นแท็บ Task (อ่านรายการ PM) แต่ **ยังไม่เห็น Close WO**

---

## บทบาทอื่น

| บทบาท | แท็บ Close WO ใน modal ปฏิทิน (`tabLayout=assigned`) |
|--------|--------------------------------------------------------|
| **ช่าง** — assign + รับงานแล้ว (TG/Web) | **เห็น** + ใช้งานได้ (ต้องมี `confirmation.write`) |
| **ช่าง** — ไม่ได้ assign / ยังไม่ ack | **ไม่เห็น** |
| **Planner** | **ไม่เห็น** — ใช้ Task + Planning เท่านั้น |
| **Admin** | **ไม่เห็น** ใน flow PM ปกติ — ใช้ `/confirmation` / Admin tools แยก (ถ้ามีสิทธิ์) |

---

## สถานะโค้ดปัจจุบัน vs ที่ต้องการ

| หัวข้อ | ปัจจุบัน | ที่ลูกค้าต้องการ |
|--------|----------|------------------|
| แสดงแท็บ Close WO | ~~แสดงเสมอใน `tabLayout=assigned`~~ → กรองตาม `closeWoAccess.canView` | แสดงเฉพาะช่างที่ assign + `acknowledged` |
| สิทธิ์เขียน | ~~`confirmation.write` (RBAC)~~ → `closeWoAccess.canWrite` | RBAC **และ** assign + รับงานแล้ว |
| รับงานทาง Web | `POST .../planning/orders/:idiw37/ack` พร้อมแล้ว | **นับ** — เปิด Close WO ได้ |
| รับงานทาง Telegram | callback + `planning-ack.ts` พร้อมแล้ว | **นับ** — เปิด Close WO ได้ |
| ปิดงานย่อ Telegram | `telegram-close.ts` ตรวจ `ack_status=acknowledged` | สอดคล้อง |
| ข้อมูล ack | `modal-detail.planning.assignees[].ackStatus/ackChannel` | มีแล้ว — ใช้ตรวจฝั่ง UI ได้ |

**Gap หลัก:** ~~ยังไม่กรองการแสดงแท็บตาม assign + ack~~ — implement แล้ว (`close-wo-access.ts` + `WorkOrderDetailDialog`)

**ไฟล์อ้างอิง**

- Modal: `WorkOrderDetailDialog.tsx` — แท็บ `confirm` ใน `assignedLayout`
- Web ack: `PlanningPage.tsx` ปุ่ม「รับทราบ」· `routes/planning.ts`
- Telegram ack: `telegram-webhook.ts` · `planning-ack.ts`
- Telegram close: `telegram-close.ts` (`not_acknowledged`)

---

## ออกแบบ — การแสดงแท็บ

### เงื่อนไข (ร่าง logic)

```ts
// ช่าง login = authUser.wkctr
const myAssignment = planning.assignees.find(
  (a) => a.kind === 'person' && a.code === authUser.wkctr && a.pwteam !== 'G',
)

const canSeeCloseWoTab =
  authUser.userrole === 'technician' &&
  myAssignment != null &&
  myAssignment.ackStatus === 'acknowledged'
  // ackChannel: 'telegram' | 'web' — ไม่แยกสิทธิ์
```

### Wireframe — modal ช่าง

**กรณี A — ยังไม่ได้ assign / ยังไม่กดรับงาน**

```
┌──────────────────────────────────────────────┐
│  WO 4001560529                               │
│  [ Task ]  [ Planning ]                      │  ← ไม่มีแท็บ Close WO
├──────────────────────────────────────────────┤
│  (เนื้อหา Task / Planning ตามเดิม)            │
│                                              │
│  ℹ️ กดรับงานก่อน (Telegram หรือหน้า Planning) │  ← optional banner
└──────────────────────────────────────────────┘
```

**กรณี B — assign แล้ว + รับงานแล้ว (TG หรือ Web)**

```
┌──────────────────────────────────────────────┐
│  WO 4001560529                               │
│  [ Task ]  [ Planning ]  [ Close WO ]        │
├──────────────────────────────────────────────┤
│  Personnel close · รูปหลังงาน · Supervisor close │
└──────────────────────────────────────────────┘
```

**กรณี C — Planner เปิด WO เดียวกัน**

```
┌──────────────────────────────────────────────┐
│  [ Task ]  [ Planning ]                      │  ← ไม่มี Close WO
└──────────────────────────────────────────────┘
```

---

## API / Backend ที่ต้องปรับ (ก่อน implement)

### 1) ส่งสถานะสิทธิ์ใน `modal-detail`

เพิ่มใน response (ตัวอย่าง):

```ts
planning: {
  // ...
  closeWoAccess: {
    canView: boolean
    canWrite: boolean  // canView && confirmation.write
    reason?: 'not_assigned' | 'pending_ack' | 'not_technician'
    myAssignment?: { ackStatus, ackChannel, ackAt }
  }
}
```

คำนวณฝั่ง backend จาก `authUser.wkctr` — ไม่ให้ UI ไว้ใจ client อย่างเดียว

### 2) บังคับ API ปิดงาน

`POST /api/v1/confirmation/:idiw37/close` และ endpoints ที่เกี่ยวข้อง:

- ตรวจว่า `wkctr` ใน body ตรง user login
- ตรวจ assign row + `ack_status = acknowledged` (ไม่จำกัด channel)
- คืน `403 FORBIDDEN` + ข้อความภาษาไทยถ้าไม่ผ่าน

### 3) i18n

คีย์ตัวอย่าง:

- `woDialog.closeWoLockedNotAssigned`
- `woDialog.closeWoLockedPendingAck` — กรุณากดรับงานก่อน (Telegram หรือหน้า Planning)

---

## ความสัมพันธ์กับแท็บอื่น

| แท็บ | ช่างที่ยังไม่กดรับงาน |
|------|----------------------|
| **Task** | เห็นได้ — อ่านรายการ PM |
| **Planning** | อ่านอย่างเดียว — ดู assign / สถานะ ack · ปุ่ม「รับทราบ」ถ้ามีงานของตัวเอง |
| **Close WO** | **ซ่อน** |

---

## Gap / คำถามเปิด

| # | หัวข้อ | แนวทางชั่วคราว |
|---|--------|----------------|
| 1 | ช่าง assign ผ่าน **กลุ่ม** (`pwteam=G`) | กฎลูกค้าระบุ "ช่างที่ assign" — กลุ่มอาจต้องแตกเป็นรายบุคคลก่อนปิดงาน หรือยกเว้นกลุ่มจาก Close WO |
| 2 | ช่างรับงานแล้ว แต่ไม่มี `confirmation.write` | แสดงแท็บ read-only + ข้อความติดต่อ Admin |
| 3 | WO ปิดแล้ว (TECO) | แสดง Close WO แบบ review อย่างเดียวสำหรับช่างที่เคย ack? — ยืนยันกับลูกค้า |
| 4 | ปุ่มรับงานบน Web อยู่ที่ไหนใน modal | แนะนำ: แท็บ Planning หรือ banner บน Task เมื่อ `pending_ack` |

---

## อ้างอิง

- สรุปภาพรวม: [`MASTER-PLAN-MNTPLAN-BINDING.md`](MASTER-PLAN-MNTPLAN-BINDING.md)
- แท็บ Task / Planner: [`CALENDAR-WO-TASK-DESIGN.md`](CALENDAR-WO-TASK-DESIGN.md)
- แท็บ Planning: [`PLANNING-TAB-DESIGN.md`](PLANNING-TAB-DESIGN.md)
- Flow Telegram: [`TELEGRAM-ASSIGNMENT-FLOW.md`](TELEGRAM-ASSIGNMENT-FLOW.md) §3.4–3.5
- Ack DB: migration `099_telegram_notify.sql` · `planning-ack.ts`
