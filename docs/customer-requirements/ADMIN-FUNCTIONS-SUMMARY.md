# Admin — สรุป function (สิ่งที่มี vs ต้องเพิ่ม)

**วันที่:** 9 มิ.ย. 2026  
**สถานะ:** สรุปก่อน Phase/Checklist — ยังไม่ implement รายการใหม่  
**อ้างอิงเต็ม:** [`docs/parity-pending/14-administrator.md`](../parity-pending/14-administrator.md)

---

## บทบาท Admin ใน PM Pepsi (ตกลงกับลูกค้า)

| Admin **ทำ** | Admin **ไม่ทำ** (Planner / ช่าง) |
|-------------|----------------------------------|
| จัดการบัญชี · สิทธิ์ · เมนู · ธีม/โลโก้ | จ่ายงานช่าง (แท็บ Planning) |
| Master Data Hub · backup · health · audit | อ่าน Task / มอบหมายตามแผน PM |
| ตั้งค่า Telegram กลุ่มแจ้งเตือน | ปิดงาน PM (แท็บ Close WO — ช่าง) |
| Import บุคลากร · ผูก Telegram ช่าง | **Confirm/Reject** งานปิด (ย้ายไป Planner ที่ `/confirmation`) |
| Publish แผน Master Plan (ร่วมกับ data owner) | ไม่ปรากฏใน pool ช่าง PM (`ADMIN01` ฯลฯ) |

> Admin = **ผู้ดูแลระบบ** · ไม่ใช่ผู้ปฏิบัติงาน PM ประจำวัน

---

## มีแล้วในระบบ (~90% — Admin Console)

หน้า `/admin/*` ครบ **14 ส่วน** (ดู [`admin-sections.ts`](../../PM-Pepsi-App/frontend/src/lib/admin-sections.ts)):

| Route | หน้าที่ | สถานะ |
|-------|---------|--------|
| `/admin` | Console + quick links | ✅ |
| `/admin/users` | บัญชี workcenter/member · รูป WebP · Telegram invite | ✅ |
| `/admin/roles` | RBAC matrix | ✅ |
| `/admin/menu` | แก้ `tbmenu` · DnD · sync จาก PHP | ✅ |
| `/admin/branding` | โลโก้ · สี Pepsi/Liquid Glass · login background | ✅ |
| `/admin/settings` | timezone · maintenance · session · feature flags | ✅ |
| `/admin/master` | Hub ลิงก์ master 17 entity | ✅ |
| `/admin/audit` | audit log · diff · export CSV | ✅ |
| `/admin/backup` | pg_dump · schedule · restore | ✅ |
| `/admin/health` | DB · disk D: · migration runner | ✅ (ยกเว้น Docker metrics) |
| `/admin/announcements` | ประกาศ + banner | ✅ |
| `/admin/telegram` | กลุ่มแจ้งเตือน · test send · link status ช่าง | ✅ โค้ด — รอ UAT |
| `/admin/security` | failed login · RBAC deny · block IP | ✅ |
| `/admin/about` | version · migration summary | ✅ |

**นอก Admin Console แต่ Admin ใช้บ่อย**

| Route | หน้าที่ |
|-------|---------|
| `/personnel/admin` | CRUD บุคลากร · import Excel |
| `/master-plan` | แก้แผน EE/ME/PK · Publish → Task list |
| `/iw37n` | นำเข้า IW37N |
| `/integration` | สแกน inbound · job log |
| `/master-data` | lookup tables |

---

## ต้องเพิ่ม / ปรับ — ตาม workflow PM ที่สรุปแล้ว

### กลุ่ม A — บังคับก่อน go-live PM (ลูกค้าใช้งานจริง)

| # | รายการ | เหตุผล | แนวทาง |
|---|--------|--------|--------|
| A1 | **รัน migration โรงงาน** | Telegram + ack ต้องมี `099`, `100` | `/admin/health` → Run migrate (maintenance mode) |
| A2 | **Telegram Bot บน server offline** | จ่ายงาน · รับงาน · แจ้ง Planner | BotFather + `setWebhook` + env ใน Admin settings/secrets |
| A3 | **ตั้งกลุ่ม Telegram** (`/admin/telegram`) | ลูกค้าจัดการเอง — ack → Planner | `ack_to_planner` · `assignment_to_tech` (DM รายคน) |
| A4 | **ผูก Telegram ช่าง** | แจ้งงาน + รับงาน | `/admin/users` invite หรือช่าง Settings → Telegram |
| A5 | **กรอง Admin ออกจาก pool ช่าง PM** | ลูกค้า: Admin ไม่เกี่ยว PM | กฎ `userrole≠admin` ใน API planning — ไม่ต้องหน้า Admin ใหม่ |
| A6 | **ฟิลด์ AA/BB บนบุคลากร** (เฟส 2) | ลูกค้า: AA/BB ผูกชื่อคน | เพิ่มใน `/personnel/admin` — shift day/night tag |
| A7 | **เมนู sidebar รวม Confirmation** | ลูกค้า: หน้าเดียว Planner | `/admin/menu` หรือ `nav-config` — ลบ Personnel Confirmation แยก |
| A8 | **Master Plan Publish** ชัดใน Hub | Task ว่างถ้าไม่ Publish | ลิงก์/คำแนะนำใน `/admin/master` + คู่มือ → `/master-plan` → Publish |

### กลุ่ม B — ปรับปรุงหลังแกน PM (ควรมี)

| # | รายการ | เหตุผล | แนวทาง |
|---|--------|--------|--------|
| B1 | **Integration settings ใน Admin** | SAP auto ยังไม่ครบ | ตั้ง path `inbound/` · `outbound/` · interval · แจ้ง fail ใน `/admin/settings` หรือ `/integration` |
| B2 | **CONFIRM_OUT อัตโนมัติ** | ตอนนี้ export มือจาก UI | job เขียน `Export_Confirm.xlsx` ลง `outbound/confirm` หลัง Planner Confirm |
| B3 | **Export ตรง template 100%** | ลูกค้าบังคับรูปแบบ | sheet `Worksheet` · header 14 คอลัมน์ · ดู [`CONFIRMATION-PAGE-DESIGN.md`](CONFIRMATION-PAGE-DESIGN.md) |
| B4 | **RBAC Planner บน Confirmation** | เดิม QC ผูก Admin | permission `confirmation.review` ให้ Planner (`U`) ไม่ต้อง `A` |
| B5 | **Admin Console KPI งาน PM** | ภาพรวมสำหรับ Admin | การ์ด: IW37N ล่าสุด · WO รอ QC · migration pending · backup ล่าสุด |
| B6 | **แจ้งเตือน job fail** | automation design | in-app + (optional) Telegram กลุ่ม ops |

### กลุ่ม C — ส่งมอบ / โครงสร้าง (ลำดับ 13–14)

| # | รายการ | สถานะ |
|---|--------|--------|
| C1 | `docker-compose.yml` + bind mount `D:` | ❌ ยังไม่ทำ |
| C2 | UAT มือ Admin (branding · backup · restore staging) | ❌ §15 ใน 14-administrator |
| C3 | Playwright admin tour ใน CI | ❌ |
| C4 | Docker CPU/RAM ใน `/admin/health` | ❌ มีแค่ process metrics |
| C5 | Role **auditor** read-only (optional) | ❌ ดู [`AUDITOR-REVISION-PLAN.md`](AUDITOR-REVISION-PLAN.md) |

### กลุ่ม D — ไม่ต้องเพิ่มหน้า Admin ใหม่

| รายการ | ทำที่ไหนแทน |
|--------|--------------|
| จ่ายงานการ์ดช่าง AA/BB/EE/UT | แท็บ Planning (Planner) |
| Close WO หลังรับงาน | Modal ช่าง |
| ตาราง Confirm + Export | `/confirmation` (Planner) |
| แก้ PM list / machine | `/master-plan` |

---

## Admin กับ flow ที่สรุปแล้ว (ไดอะแกรม)

```
Admin                          Planner                    ช่าง
  │                               │                        │
  ├─ Import IW37N ───────────────► Calendar/WO              │
  ├─ Master Plan + Publish ──────► Task list               │
  ├─ บุคลากร + Telegram ────────► Planning assign ────────► รับงาน
  ├─ Telegram กลุ่ม ack ─────────► (ได้แจ้งรับทราบ)         │
  │                               ├─ Confirmation QC        ├─ Close WO
  ├─ Backup / Health            │   Confirm/Reject         │
  └─ Audit / Security             └─ Export SAP ◄──────────┘
```

---

## Checklist สั้น — Admin ก่อนปิด Phase PM

- [ ] Migration 099/100 (+ อื่นที่ค้าง) บน DB โรงงาน
- [ ] Telegram Bot + webhook บน server offline
- [ ] กลุ่ม `ack_to_planner` ตั้งใน `/admin/telegram`
- [ ] ช่างทดสอบผูก Telegram ≥2 คน
- [ ] ยืนยัน Admin ไม่โผล่ใน Planning assign
- [ ] เมนู Confirmation รวม (ไม่แยก Personnel Confirmation)
- [ ] คู่มือ Admin: Publish Master Plan หลัง import แผนปี
- [ ] Backup schedule บน `D:/PM-Pepsi-App/backup`
- [ ] UAT branding + restore บน staging

---

## สรุปคำตอบ “Admin ต้องเพิ่มอะไรบ้าง?”

**ไม่ต้องสร้าง Admin Console ใหม่ทั้งก้อน** — แกน ~90% พร้อมแล้ว

**ต้องเพิ่มจริงๆ คือ:**

1. **ปฏิบัติการ + UAT** — Telegram, migration, backup บน D:, Bot offline  
2. **ข้อมูลบุคลากร** — ฟิลด์ AA/BB (เฟส 2) · ยืนยัน `userrole` ช่าง vs admin  
3. **เมนู/สิทธิ์** — รวม Confirmation ให้ Planner · ลดบท Admin ใน QC  
4. **Automation** — export ออกโฟลเดอร์ · แจ้ง job fail (ยังไม่มี UI ครบ)  
5. **Deploy** — Docker compose + UAT ส่งมอบ  

**ไม่ใช่หน้้า Admin แต่ Admin ต้องทำเป็นขั้นตอน:** Master Plan Publish · IW37N import

---

## อ้างอิง

- สเปก Admin เต็ม: [`14-administrator.md`](../parity-pending/14-administrator.md)
- Telegram: [`TELEGRAM-IMPLEMENTATION-CHECKLIST.md`](TELEGRAM-IMPLEMENTATION-CHECKLIST.md)
- Automation: [`AUTOMATION-DESIGN.md`](AUTOMATION-DESIGN.md)
- สรุปภาพรวม PM: [`MASTER-PLAN-MNTPLAN-BINDING.md`](MASTER-PLAN-MNTPLAN-BINDING.md)
