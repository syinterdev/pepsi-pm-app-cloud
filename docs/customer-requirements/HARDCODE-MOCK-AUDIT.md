# Audit — Hard-code & Mock data (ทุกหน้า)

**วันที่:** 2026-05-22  
**สคริปต์ซ้ำ:** `PM-Pepsi-App/frontend/scripts/audit-hardcode-mock.mjs`

---

## สรุปผู้บริหาร

| หมวด | ผล | หมายเหตุ |
|------|-----|----------|
| **Mock data ใน production route** | ผ่าน | ไม่พบ array ข้อมูลปลอมใน `*Page.tsx` — หน้าหลักใช้ `useQuery` / `fetch*` จาก API |
| **ข้อความ "(mock)"** | ผ่าน (2026-05-22) | ลบจาก `MasterDataPage` + parity แล้ว — `npm run audit:ui` = 0 mock labels |
| **ไฟล์ `SidebarParityPages.tsx`** | ชื่อเก่า | `/confirmation` ใช้ **API จริง** ไม่ใช่ mock — มีแค่บล็อก `PlaceholderBlock` อ้างอิง PHP |
| **Hard-code สี hex ในหน้า** | ยอมรับได้บางจุด | ส่วนใหญ่อยู่ branding defaults / สีสถานะจาก DB (`wkstcolor`) / kiosk board CSS |
| **Tailwind `zinc-*`** | ยังเยอะ | ~1,500+ ใน `features/` — ควรค่อยๆ แทนด้วย `--app-*` / `--admin-*` (U2) |
| **Tailwind `violet-*`** | แก้แล้ว (2026-05-22) | ใช้ `.app-tone-info*` / `.app-badge-accent` แทน |

**Backend:** mock มีเฉพาะใน `*.test.ts` / `vi.mock` — ไม่รวม production handler

**Confirmation export scope (2026-05-26):** ไม่ hardcode `PAC007`/`PRO005` แล้ว — ใช้ permission `confirmation.export.all` ใน `tbl_role_permission` (migration `084_confirmation_export_all_permission.sql`); ค่าเริ่มต้น grant ให้ role `A` และ `H`; ปรับสิทธิ์ได้ที่ Admin → Roles

---

## 1) ทุก route ใน `App.tsx` — แหล่งข้อมูล

| Route | หน้า | API / DB |
|-------|------|----------|
| `/` | `HomePage` | `fetchDashboard` (React Query) |
| `/calendar` | `CalendarPage` | calendar API |
| `/plan-calendar` | `PlanCalendarPage` | planning API |
| `/line-calendar` | `LineCalendarPage` | line calendar API |
| `/backlog` | `BacklogPage` | backlog API |
| `/work-orders` | `WorkOrdersPage` | work-orders API |
| `/confirmation` | `ConfirmationParityPage`* | confirmation / WO / planning API |
| `/confirmation/export` | `ConfirmationExportParityPage`* | `fetchConfirmationExport` |
| `/planning` | `PlanningPage` | planning API |
| `/integration` | `IntegrationPage` | integration jobs API |
| `/iw37n` | `Iw37nPage` | IW37N import API |
| `/master-data` | `MasterDataPage` | master-data API (ทุก tab `backend: true`) |
| `/manhours` … | Manhours* | manhours API |
| `/personnel` … | Personnel* | personnel API |
| `/reports` … | Reports* | reports API |
| `/summary-weekly` | `SummaryWeeklyPage` | summary API |
| `/settings` | `SettingsPage` | settings / health API |
| `/admin/*` | Admin* | admin API |
| `/board` | `EngineeringBoardPage` | board KPI API |
| `/login` | `LoginPage` | auth API |

\* อยู่ไฟล์ `parity/SidebarParityPages.tsx` แต่ **ไม่ใช่ mock** — ชื่อไฟล์/Placeholder เป็นเอกสารเทียบ PHP

### ไม่ได้ผูก route (dead Shell)

| Export | สถานะ |
|--------|--------|
| `LineCalendarParityPage` | Shell + ลิงก์ไป `/calendar` — ใช้ `LineCalendarPage` แทน |
| `SummaryWeeklyParityPage` | Shell — ใช้ `/summary-weekly` แทน |

---

## 2) Mock / placeholder ที่พบ

| ที่ | ประเภท | แนะนำ |
|-----|--------|--------|
| ~~`MasterDataPage` ข้อความ `ไม่มีข้อมูล (mock)`~~ | แก้แล้ว | — |
| ~~`SidebarParityPages` ลิงก์ "(mock)"~~ | แก้แล้ว | — |
| `PlaceholderBlock` ใน confirmation | เอกสาร PHP parity | เก็บได้จนกว่าจะย้ายไป doc — ไม่ใช่ mock data |
| `placeholderData: keepPreviousData` | React Query | ไม่ใช่ mock data |
| `SettingsPage` `PlaceholderBlock` "Base URL" | แสดง config จริง | เปลี่ยนชื่อเป็น `AppCard` ใน U2 |

---

## 3) Hard-code สี (hex)

| ไฟล์ | เหตุผล | แนะนำ |
|------|--------|--------|
| `branding-constants.ts`, `TypographyCard`, `ColorPickerCard` | ค่า default branding | เก็บ — เป็น seed ของ Admin Branding |
| `PersonnelConfirmPage` / `PersonnelAdminPage` | fallback เมื่อไม่มี `wkstcolor` จาก DB | ใช้ `var(--app-surface-muted)` แทน `#e2e8f0` |
| `HomePage` Joyride `primaryColor: '#004c97'` | ไลบรารีไม่รับ CSS var | ใช้ `getComputedStyle` หรือค่าจาก theme hook |
| `engineering-board.css` | kiosk dark theme | แยกไฟล์ — ไม่ใช้ในแอปหลัก |
| `var(--app-accent,#007AFF)` fallback | defensive | เปลี่ยน fallback เป็น `#004c97` |

---

## 4) Tailwind off-token (ไม่ใช่ mock แต่ผิด U0)

- [x] **`zinc-*` ใน TS/TSX** — ไล่ครบทุกโมดูลด้วย `node scripts/migrate-zinc-pages.mjs <module|all>` (ดูรายการโมดูลด้วย `list`)
- [x] **`violet-*`** → `.app-tone-info`, `.app-badge-accent` (`index.css`)
- [x] **`zinc-*` โมดูลหลัก** — integration · iw37n · master-data · personnel · work-orders · parity · admin · scheduling · ui · confirmation · calendar · manhours · reports · settings · auth · backlog · layout · errors
- [ ] **`index.css`** — ยังอ้าง `bg-zinc-900` ใน override สำหรับ legacy class (ไม่ใช่ Tailwind ใน TSX)

---

## 5) เกณฑ์ผ่าน (สำหรับ U2 checklist)

- [x] ไม่มีข้อความ "(mock)" ใน UI production
- [x] ทุก route ใน `App.tsx` โหลดข้อมูลจาก API (ยกเว้น static error/login · `/dev/ui` dev-only)
- [ ] หน้าใหม่ไม่ใส่ hex ใน TSX (ยกเว้น branding admin) — hex บางจุดยังรอ U2
- [x] `npm run audit:ui` ผ่านโดยไม่มี mock label (hex = แจ้งเตือน non-blocking)
- [ ] ย้าย `ConfirmationParityPage` ออกจาก `parity/` → `features/confirmation/` (ชื่อโฟลเดอร์)

---

## 6) คำสั่งตรวจซ้ำ

```bash
cd PM-Pepsi-App/frontend
npm run audit:ui
```
