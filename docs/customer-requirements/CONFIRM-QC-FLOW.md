# Flow Admin QC ก่อน Dashboard / Personnel Confirm

**อัปเดต:** 2026-05-22  
**Migration:** `080_tbiw37n_confirm_qc.sql`, `081_view_countpersonelclose_qc.sql`

## ลำดับงาน

1. ช่าง/หัวหน้างานบันทึก **รูป Before/After**, **เวลาช่าง** (`tbwrkclose`), **ปิดงาน supervisor** (`tbcofirm`)
2. ระบบตั้ง `tbiw37n.confirm_qc_status = pending`
3. **Admin** (`confirmation.import`) ตรวจที่ `/confirmation` (คิวรอ QC) หรือ modal WO แท็บ Confirm
4. กด **อนุมัติ** → `approved` → นับใน:
   - **Dashboard** KPI「ปิดเดือนนี้」+ sparkline 7 วัน (`GET /dashboard/summary`)
   - Workflow ขั้น 4 (ปฏิทิน suffix `4`)
   - Personnel Confirm % (`view_countpersonelclose` — เฉพาะ `tbcofirm` หลังอนุมัติ)
   - Export Confirm SAP (เฉพาะ WO ที่ `approved`)
5. **ส่งกลับ** → `rejected` + หมายเหตุ — ช่างแก้แล้วบันทึกใหม่ → `pending` อีกครั้ง

## API

| Method | Path | สิทธิ์ |
|--------|------|--------|
| GET | `/api/v1/dashboard/summary` | `dashboard.read` — **ปิดเดือนนี้** นับเฉพาะ `confirm_qc_status=approved` |
| GET | `/api/v1/confirmation/qc/pending` | `confirmation.import` |
| GET | `/api/v1/confirmation/:idiw37/qc` | `confirmation.read` |
| POST | `/api/v1/confirmation/:idiw37/qc/approve` | `confirmation.import` |
| POST | `/api/v1/confirmation/:idiw37/qc/reject` | `confirmation.import` |
| POST | `/api/v1/confirmation/qc/approve-batch` | `confirmation.import` — อนุมัติ QC ทั้งชุดหลัง Mass Confirm |
| POST | `/api/v1/confirmation/export/mass-summary` | `confirmation.read` — สรุป QC/export ต่อชุด `idiw37n[]` |
| GET | `/api/v1/confirmation/export.csv?idiw37n=1,2,3` | `confirmation.read` — CONFIRM_OUT เฉพาะชุด (หลัง QC ผ่าน) |

## Mass Confirm → Export ชุดเดียว

1. `POST /api/v1/confirmation/closes/batch` (สูงสุด 44 WO)
2. UI `MassConfirmExportPanel` — แสดงสถานะ QC ต่อ WO ในชุด
3. Admin **อนุมัติ QC ทั้งชุด** → ดาวน์โหลด CSV/XLSX (`?idiw37n=`) → ส่ง SAP

## UI

- `ConfirmQcPanel` — ใน `WorkOrderDetailDialog` แท็บ Confirm
- `ConfirmQcPendingQueue` — หน้า `/confirmation` (Admin)
- `MassConfirmExportPanel` — หลัง Mass Confirm สำเร็จ (หน้า Mass Confirm)
- `/personnel/confirm` — แท็บ「รอ Admin QC」+ ป้ายสถานะ QC
