# PM Pepsi App — คำแนะนำสำหรับ AI Agent

โปรเจกต์นี้ใช้ **Superpowers** เป็น workflow หลักสำหรับงานฟีเจอร์/แก้บั๊กที่ซับซ้อน  
แหล่ง skills ใน repo: [`superpowers-main/`](superpowers-main/)

## โครงสร้างโปรเจกต์

| โฟลเดอร์ | บทบาท |
|----------|--------|
| `PM-Pepsi-App/frontend/` | React + Vite + TypeScript |
| `PM-Pepsi-App/backend/` | Express API + PostgreSQL (`pg`) |
| `database/migrations/` | SQL migrations (รันตามลำดับ) |
| `docs/` | แผนงาน, คู่มือผู้ใช้, parity, customer requirements |
| `from customer/` | เอกสาร/ตัวอย่าง SAP จากลูกค้า (อ้างอิง ไม่ commit ทั้งก้อนถ้าไม่จำเป็น) |

## เอกสารที่ต้องอ่านก่อนงานใหญ่

- [`docs/WORK-PHASES.md`](docs/WORK-PHASES.md) — แผน phase / checklist
- [`docs/PRE-UAT-MASTER-PHASES.md`](docs/PRE-UAT-MASTER-PHASES.md) — **Master ก่อน UAT** (SAP · Deploy · handoff)
- [`docs/customer-requirements/PRE-UAT-UI-PHASES.md`](docs/customer-requirements/PRE-UAT-UI-PHASES.md) — **U4 UI ก่อน UAT** (ทำ UI ก่อน)
- [`docs/USER-MANUAL-TH.md`](docs/USER-MANUAL-TH.md) — คู่มือผู้ใช้ทุกหน้า
- [`docs/customer-requirements/UI-POLISH-PHASES.md`](docs/customer-requirements/UI-POLISH-PHASES.md) — UI polish U0–U3
- [`docs/SUPERPOWERS-PM-APP.md`](docs/SUPERPOWERS-PM-APP.md) — วิธีใช้ Superpowers กับโปรเจกต์นี้

## Superpowers — บังคับใช้เมื่อเหมาะสม

1. อ่าน [`superpowers-main/skills/using-superpowers/SKILL.md`](superpowers-main/skills/using-superpowers/SKILL.md) เมื่อเริ่มงานใหม่
2. ใช้ **Skill tool** (หรืออ่านไฟล์ skill โดยตรงใน Cursor) ก่อนตอบหรือเขียนโค้ด — อย่าข้ามเพราะงานดูเล็ก
3. ลำดับ skill ทั่วไป:
   - ฟีเจอร์ใหม่ / ไม่ชัด → `brainstorming` → `writing-plans` → `executing-plans` หรือ `subagent-driven-development`
   - แก้บั๊ก → `systematic-debugging` → `verification-before-completion`
   - ก่อนจบ branch → `finishing-a-development-branch`
4. แผน implement บันทึกที่: `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
5. สเปก brainstorm บันทึกที่: `docs/superpowers/specs/`

**ลำดับความสำคัญ:** คำสั่งผู้ใช้ชัดเจน > Superpowers skills > ค่าเริ่มต้นของ agent

## มาตรฐานโค้ดโปรเจกต์นี้

- ข้อความ UI: **ภาษาอังกฤษเป็นค่าเริ่มต้น** (`i18next`, สลับ EN/ไทยที่แถบบนและ Settings → Profile) — เพิ่มคีย์ใน `PM-Pepsi-App/frontend/src/i18n/locales/`
- RBAC: ตรวจ permission ก่อนแสดงปุ่ม/เรียก API (`usePermission`, `CanPermission`)
- รูป: เก็บใน PostgreSQL (BYTEA/WebP) ไม่ใช่โฟลเดอร์ `imgMember/` แบบ PHP
- React Query: ตาราง/filter หนักใช้ `placeholderData: keepPreviousData`
- อย่า commit git จนกว่าผู้ใช้จะสั่ง · อย่า push force main
- แก้เฉพาะ scope ที่ขอ — ไม่ refactor แถวข้าง

## Dev ท้องถิ่น

```text
Backend:  cd PM-Pepsi-App/backend && npm run dev   # :4000
Frontend: cd PM-Pepsi-App/frontend && npm run dev  # :5173, proxy /api → 4000
```

`VITE_API_URL` ว่าง = same-origin + Vite proxy (ดู `frontend/.env.example`)
