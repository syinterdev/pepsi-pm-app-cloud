# PM Vibration — UAT Phase 4 + Phase 6 Sign-off

**อัปเดต:** 2026-06-21  
**ขอบเขต:** Page 2 (Phase 4) + end-to-end flow (Phase 6)  
**อ้างอิง:** [`PM-VIBRATION-IMPLEMENTATION-PHASES.md`](PM-VIBRATION-IMPLEMENTATION-PHASES.md) · [`PM-VIBRATION-PAGE2-SPEC.md`](PM-VIBRATION-PAGE2-SPEC.md)

---

## 1) ก่อนเริ่ม UAT

### Migrations (รันบน DB เป้าหมาย)

```powershell
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/113_pm_reading_vibration_v3_null.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/114_pm_reading_kind_vibration_dst_db.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/115_wo_pm_page2.sql
```

### Dev servers

```powershell
# Terminal 1
cd PM-Pepsi-App\backend
npm run dev

# Terminal 2
cd PM-Pepsi-App\frontend
npm run dev
```

เปิด: http://localhost:5173/pm-vibration

### บัญชีทดสอบ (dev seed)

| บทบาท | Login | Password |
|--------|-------|----------|
| Planner / Admin | `ADMIN01` | `admin` |
| ช่าง | `WC001` | `wc001` |

### WO แนะนำ

| WO | ใช้เมื่อ |
|----|----------|
| `4001567009` | MP publish แล้ว · e2e default |
| `4001565681` | UAT กระดาษ 3 จุดกระแส (ถ้ามีใน DB) |
| WO จริงลูกค้า | Sign-off สุดท้าย |

---

## 2) Phase 4 — Page 2 Comments and Findings

**ผู้ทดสอบหลัก:** ช่าง + Planner  
**หน้า:** `/pm-vibration` → section **Comments and Findings**

### Dev verify แล้ว (2026-06-21)

| รายการ | หลักฐาน |
|--------|---------|
| API `page2Form` ใน modal-detail | unit test `work-orders-modal-detail.test.ts` |
| map signature / equipment | `wo-pm-page2.test.ts` |
| close gate assign+ack | `close-wo-access.test.ts` |
| ไม่มี Subsequent Notification | `WorkOrderPmSapPage2Form.tsx` |
| Backend health + DB | `GET /api/v1/health` → `db: ok` |

### Test cases — รอลูกค้า sign-off

| ID | ขั้นตอน | คาดหวัง | Pass | ผู้ทด | วันที่ | หมายเหตุ |
|----|---------|---------|:----:|-------|--------|----------|
| **4.1** | ช่าง **ไม่** assign → ลอง personnel-close | 403 · Page 2 auto = `—` | ☐ | | | |
| **4.2** | assign แต่ **ยังไม่ ack** → ลอง close | 403 · *กรุณารับงานก่อน* | ☐ | | | |
| **4.3** | assign + ack → personnel-close → เปิด PM Page 2 → refresh | Activity = wkctr · Completed by = ชื่อ · Date = DD.MM.YYYY | ☐ | | | |
| **4.4** | Planner **Approve** → refresh Page 2 | Signature = `RECEIVED by {ชื่อ Planner}` | ☐ | | | |
| **4.5** | (optional) Planner **Reject** WO อื่น | Signature แสดงชื่อ Planner (text) | ☐ | | | |
| **4.6** | ช่างเลือก Equipment **Y** หรือ **N** → refresh | ค่า Y/N คงอยู่ | ☐ | | | |
| **4.7** | เปิด Page 2 | **ไม่มี** Subsequent Notification | ☑ | Dev | 2026-06-21 | |
| **4.8** | กรอก Comments → refresh | thread ยังอยู่ | ☑ | Dev | 2026-06-21 | Phase ก่อนหน้า |

### SQL ตรวจ (optional)

```sql
SELECT * FROM app.tbwo_pm_page2 WHERE idiw37 = (
  SELECT idiw37 FROM app.tbiw37n WHERE wkorder = '4001567009' LIMIT 1
);
```

---

## 3) Phase 6 — UAT ครบ flow + Sign-off

### 3.1 Data & navigation

| ID | รายการ | Pass | ผู้ทด | วันที่ |
|----|--------|:----:|-------|--------|
| 6.1 | Master Plan import → publish | ☐ | | |
| 6.2 | IW37N import WO | ☐ | | |
| 6.3 | Master Plan row links → `/pm-vibration?wkorder=` (+ machine/pmlist ถ้ามี) | ☐ | | |
| 6.4 | Banner readiness ถูกต้อง (mntplan / tasklist / readings) | ☐ | | |

### 3.2 Header หน้า 1

| ID | รายการ | Pass | ผู้ทด | วันที่ |
|----|--------|:----:|-------|--------|
| 6.5 | ไม่มี WC / Priority / End Date ใน header grid | ☐ | | |
| 6.6 | มี **Man** (ตัวเลข) + **หยุด/เดิน** จาก task แรก | ☐ | | |
| 6.7 | **Work Centre** ยังอยู่ใน Operation row | ☐ | | |
| 6.8 | Header Short Text = mntplan | ☐ | | |

### 3.3 การวัด & กราฟ

| ID | รายการ | Pass | ผู้ทด | วันที่ |
|----|--------|:----:|-------|--------|
| 6.9 | กระแส 3 เฟส — กรอก · บันทึก · กราฟ R/S/T | ☐ | | |
| 6.10 | Vibration Dst/dB — ตาราง Time\|Dst\|dB · dual-axis chart | ☐ | | |
| 6.11 | Excel import/export readings | ☐ | | |

### 3.4 Page 2 & ปิดงาน

| ID | รายการ | Pass | ผู้ทด | วันที่ |
|----|--------|:----:|-------|--------|
| 6.12 | Page 2 ครบ (Phase 4.1–4.8) | ☐ | | |
| 6.13 | ปิดงานผ่าน personnel-close (ไม่ persist Completion block หน้า 1 แยก) | ☐ | | |
| 6.14 | RBAC: ช่าง W เขียนได้ · Supervisor H read-only | ☐ | | |

### 3.5 ข้อตกลงที่ยืนยันแล้ว (ไม่ต้อง UAT ซ้ำ)

| หัวข้อ | สถานะ |
|--------|--------|
| Man = ตัวเลข headcount | ✅ |
| WO หลาย task → Man/หยุด-เดิน จาก task แรก | ✅ |
| Signature = text `RECEIVED by {ชื่อ}` | ✅ |
| Completion block หน้า 1 ไม่ persist — ใช้ personnel-close + Page 2 | ✅ |
| Phase 5 ยกเลิก | ✅ |

---

## 4) สรุป sign-off

| Phase | ผลรวม | ลงชื่อลูกค้า | วันที่ |
|-------|--------|--------------|--------|
| **Phase 4** — Page 2 | ☐ Pass · ☐ Fail · ☐ Pass with notes | | |
| **Phase 6** — End-to-end | ☐ Pass · ☐ Fail · ☐ Pass with notes | | |

**หมายเหตุ / action items:**

```text
(ว่าง — กรอกหลัง meeting)
```

---

## 5) Automated tests (dev regression)

```powershell
# Backend
cd PM-Pepsi-App\backend
npm test -- --run wo-pm-page2 close-wo-access wo-pm-form-header work-orders-modal-detail

# Frontend e2e (ต้อง E2E_USE_DEV_SEED=1 + servers)
cd PM-Pepsi-App\frontend
$env:E2E_USE_DEV_SEED="1"
npx playwright test e2e/pm-vibration-phase1-uat.spec.ts e2e/pm-vibration-phase2-uat.spec.ts e2e/pm-vibration-rbac.spec.ts e2e/pm-vibration-workflow-technician.spec.ts
```

**ผลล่าสุด (2026-06-21):** backend Phase 4 unit tests **16/16 passed**

---

## 6) Open items หลัง sign-off (ถ้ามี)

| # | หัวข้อ | Owner |
|---|--------|-------|
| Q1 | Dst ความหมาย/หน่วย (assumption Distortion) | ลูกค้า |
| Q5 | Warning/Alarm dB thresholds | ลูกค้า confirm |
| R1 | PDF layout pixel-perfect | ลูกค้า |
