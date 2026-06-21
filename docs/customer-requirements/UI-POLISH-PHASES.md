# แผน Phase + Checklist — ปรับ UI ให้สวยงามและทันสมัย (ทุกหน้า)

> **ใช้ไฟล์นี้ติ๊กงาน UI/UX** คู่กับ [`skill-theme.md`](../../skill-theme.md) (สี Pepsi · wireframe · motion) และ [`WORK-PHASES.md`](../WORK-PHASES.md)

**อัปเดต:** 2026-06-09 · **U0–U3 + Dark ปิดแล้ว** · **U4 = [`PRE-UAT-UI-PHASES.md`](PRE-UAT-UI-PHASES.md)** (ทำ UI ก่อน UAT)

---

## เป้าหมาย

| หลัก | รายละเอียด |
|------|-------------|
| **หนึ่งภาษา design** | Token สี/ระยะ/เงาเดียวกันทั้งแอป + Admin |
| **macOS / Liquid Glass** | Sidebar, topbar, card โปร่ง · สอดคล้อง Pepsi (ขาว · ส้ม · ฟ้า · เขียว · แดงโลโก้) |
| **ทุกหน้าเท่ากัน** | PageHeader · spacing · ตาราง · empty/loading · ไทยอ่านง่าย |
| **Branding จาก Admin** | โลโก้ · wallpaper login · favicon — ไม่ hard-code |

**Dark mode (2026-06):** ค่าเริ่มต้น Admin = **`system`** (ตาม OS) · ผู้ใช้สลับ light/dark ได้ที่ topbar · spec: [`docs/superpowers/specs/2026-06-02-dark-mode-ui-design.md`](../superpowers/specs/2026-06-02-dark-mode-ui-design.md)

---

## ภาพรวม Phase

```text
[✓] U0  Design system
[✓] U1  App shell
[✓] U2  หน้าตามเมนู — AppPageShell + hints ทุก route หลัก
[✓] U3  Polish ข้ามหน้า — motion · a11y · responsive · print

[ ] U4  ก่อน UAT — **→ [`PRE-UAT-UI-PHASES.md`](PRE-UAT-UI-PHASES.md)**  
      · AlertDialog/Sheet · dialog sizes · 15× window.confirm  
      · animation WO/planning · brand sweep ~40 ไฟล์ · ไล่ทีละหน้า

[✓] D0  Dark foundation — Input/Textarea/Tabs
[✓] D1  Dark shell — login · error · logout
[✓] D2  Dark หน้าหลัก — calendar · WO · confirm · planning · master
[✓] D3  Dark รอง + admin + reports
[✓] D4  Board / print
```

| Phase | ชื่อ | สถานะ | เกณฑ์ผ่านสั้นๆ |
|-------|------|--------|----------------|
| **U0** | Design system | **เสร็จ** | doc token · component มาตรฐาน · `/dev/ui` · `npm run audit:ui` ไม่มี `(mock)` |
| **U1** | Shell | **เสร็จ** | Login + sidebar + Admin + board + error/logout |
| **U2** | ทุกหน้า | **เสร็จ** | AppPageShell/AdminPageShell + hints + stack |
| **U3** | Cross-cutting | **เสร็จ** | responsive · a11y · print · keepPreviousData |

---

## U0 — Design system (พื้นฐาน) ✓

> Phase U0 ผ่านเกณฑ์ checklist ด้านล่างแล้ว — งาน hex ค้างบางจุดอยู่ใน U2 / `HARDCODE-MOCK-AUDIT.md`

### Token & ธีม

- [x] สรุป CSS variables — [`UI-DESIGN-TOKENS.md`](UI-DESIGN-TOKENS.md) · [`skill-theme.md`](../../skill-theme.md) §12 · `index.css` `:root` + `.macos-sidebar` + `.macos-admin`
- [x] สีหลัก (บรีฟ `skills.md`): **ขาว** · **ฟ้า** `#004c97` · **แดง** `#e31837` · **ส้ม** `--brand-pepsi-orange` · **เขียว** `--brand-pepsi-green` — ไม่ใช้ indigo/violet เป็นหลัก
- [x] Typography: ฟอนต์เดียวทั้งแอป · ขนาด heading/body/caption ชัด — [`typography-tokens.ts`](../../PM-Pepsi-App/frontend/src/lib/typography-tokens.ts) · utilities ใน `index.css` · migrate `text-sm`/`text-[11px]` → utilities (`migrate-typography.mjs`) · [`UI-DESIGN-TOKENS.md`](UI-DESIGN-TOKENS.md)
- [x] Radius / shadow มาตรฐาน: card `12px`, button `8px`, dialog `16px` — `index.css` tokens · `rounded-card|button|dialog` · [`migrate-radius.mjs`](../../PM-Pepsi-App/frontend/scripts/migrate-radius.mjs)
- [x] Spacing scale: `4/8/12/16/24/32` — `@theme` + `.app-stack*` · [`migrate-spacing.mjs`](../../PM-Pepsi-App/frontend/scripts/migrate-spacing.mjs) · [`spacing-scale.ts`](../../PM-Pepsi-App/frontend/src/lib/spacing-scale.ts)

### Component มาตรฐาน (ใช้ซ้ำ ไม่เขียนใหม่ทุกหน้า)

- [x] `PageHeader` — title, description, actions ขวา (typography utilities)
- [x] `AppCard` / `AdminCard` — padding เท่ากัน (`--app-card-padding*` · `card-padding.ts` · `normalize-app-card-padding.mjs`)
- [x] `FilterDetailSummary` / KPI แถว — `KpiStatCard` + `KpiStatGrid` (calendar & WO ใช้ `FilterDetailSummary`)
- [x] ตาราง: `Table` + `embedded stickyHeader zebra` ใน `.app-table-shell` (ตัวอย่าง `WorkOrdersPage`)
- [x] Form: `FormField` — label บน · error/hint ใต้ field
- [x] `Badge` สถานะ WO — `WoPmPhaseBadge` / `WoStatusBadge` + `WoPmPhaseLegend` (`wo-pm-phase.ts`)
- [x] `Skeleton` / `Spinner` — `Spinner` · `SpinnerBlock` (+ Skeleton เดิม)
- [x] `EmptyState` — ไอคอน + ข้อความไทย + CTA
- [x] Toast — `lib/app-toast.ts` (`toastSuccess` / `toastError` / `toastSaved`) + sonner ใน `main.tsx`

### Admin เฉพาะ

- [x] `AdminPageRoot` + `AdminPageHeader` + `AdminBreadcrumb` — `AdminPageContent` · `AdminPageShell` · `admin-breadcrumb.ts` · `AdminAccessDenied`
- [x] `AdminKpiCard` · `AdminKpiGrid` · `AdminDensityToggle` (สบาย/กระชับ · `localStorage` + CSS compact)
- [x] `AdminTour` tooltip สวย — `AdminTourTooltip` + `admin-tour.css` (Pepsi stripe, progress, dark mode) · [`ADMIN-TOUR-E2E.md`](ADMIN-TOUR-E2E.md)

### เอกสาร & tooling

- [x] หน้าตัวอย่าง component — `/dev/ui` (dev only) · [`NEW-PAGE-GUIDE.md`](NEW-PAGE-GUIDE.md)
- [x] กฎหน้าใหม่ — `AppPageShell` / `AdminPageShell` + `PageHeader` + `app-page-content` (ดู NEW-PAGE-GUIDE)
- [x] ไม่มี mock data / ข้อความ "(mock)" ใน production — [`HARDCODE-MOCK-AUDIT.md`](HARDCODE-MOCK-AUDIT.md) · `npm run audit:ui`

**เกณฑ์ผ่าน U0:** นักพัฒนาเปิด `skill-theme.md` + `index.css` แล้วสร้างหน้าใหม่ได้โดยไม่ invent สีใหม่

---

## U1 — Shell & กรอบหน้า

| หน้า / โซน | Path | Checklist |
|------------|------|-----------|
| **Login** | `/login` | [x] wallpaper จาก branding + cache bust · [x] overlay อ่านข้อความง่าย · [x] ฟอร์มกลางการ์ด glass · [x] โลโก้ลูกค้า |
| **App shell** | (ทุก route auth) | [x] `macos-sidebar` + `macos-topbar` ทุกเมนู · [x] active state ชัด · [x] กลุ่ม heading เมนู · [x] collapse/mobile |
| **Command palette** | Ctrl+K | [x] ไอคอน + shortcut hint · [x] กลุ่มตามเมนู |
| **Announcement** | banner | [x] ไม่บัง sidebar · [x] ปิดได้ |
| **Footer** | ล่าง content | [x] เวอร์ชันแอป · [x] ไม่ชน dock |
| **Admin layout** | `/admin/*` | [x] `macos-admin` + stripe Pepsi · [x] breadcrumb ทุกหน้า (`AdminLayout`) · [x] ทัวร์ Admin (`AdminTour` + ปุ่ม Compass) |
| **Engineering Board** | `/board` | [x] kiosk เต็มจอ · KPI 3m · ไม่มี sidebar · V2 โซน A–D → [ENGINEERING-BOARD-V2-REQUIREMENTS.md](ENGINEERING-BOARD-V2-REQUIREMENTS.md) |
| **HTTP errors** | `/error/*`, 404 | [x] ภาพ/ข้อความไทย · glass + animation · [x] ปุ่มกลับ home/login · [x] ThemeToggle dark |
| **Logout** | `/logout` | [x] glass card + glow · [x] spinner · redirect login |

**เกณฑ์ผ่าน U1:** สลับ 5 route หลักแล้วรู้สึกว่า “แอปเดียวกัน” ไม่ใช่หลายธีม

---

## U2 — Checklist รายหน้า (ติ๊กเมื่อผ่าน)

**สัญลักษณ์ — ติ๊ก `[x]` เมื่อผ่านเกณฑ์คอลัมน์นั้น:**

| คอลัมน์ | เกณฑ์ผ่าน (U2) |
|--------|----------------|
| **Layout** | หัวหน้า + เนื้อหาแยกชั้น · padding จาก token · scroll อยู่ใน content ไม่ดัน shell — ดูรายละเอียดด้านล่าง |
| **Data** | ทุก query หลักมี **loading** (Skeleton/Spinner) · **empty** (ข้อความไทย) · **error** (แสดงข้อความ ไม่เงียบ) |
| **Visual** | token สี Pepsi · ตาราง `app-table-shell` / zebra · ปุ่ม primary ชัด · ไม่ hex สุ่ม |
| **TH** | label, ปุ่ม, empty, toast, validation — **ภาษาไทย** (ไม่ปน EN โดยไม่จำเป็น) |
| **RBAC** | ปุ่ม/ลิงก์แก้ไขซ่อนด้วย `CanPermission` / `usePermission` · หน้าอ่านอย่างเดียวไม่มี action เกินสิทธิ์ |

**ข้อยกเว้น:** `/board` (kiosk) ไม่ใช้ `PageHeader` — ใช้ header/kiosk layout แทน · ไม่มีปุ่มแก้ไข (read-only) — RBAC = gate `dashboard.read` หรือ kiosk token

#### เกณฑ์ **Layout** (ติ๊ก `[x]` เมื่อครบ)

| ประเภทหน้า | โครงสร้างที่ต้องใช้ | ห้าม |
|------------|---------------------|------|
| แอปหลัก (`AppShell`) | [`AppPageShell`](../../PM-Pepsi-App/frontend/src/components/layout/AppPageShell.tsx) = `PageHeader` + `AppPageContent` (`app-page-content`) | `<h1>` ลอยนอก header · padding มั่ว `p-4` ซ้ำรอบ |
| Admin (`/admin/*`) | `AdminPageShell` = `AdminPageHeader` + `AdminPageContent` | breadcrumb/tour แตกนอก layout |
| Kiosk `/board` | `engineering-board__header` + `__body` (เต็มจอ ไม่มี sidebar) | บังคับ `PageHeader` |
| Dashboard `/` | `dashboard-hero` (หัวเต็มความกว้าง) + `AppPageContent` | บังคับ `PageHeader` แบบมาตรฐาน |

**ตรวจ Layout ผ่านเมื่อ:**

1. มี **หัวหน้าหนึ่งชั้น** — ชื่อหน้า + คำอธิบายสั้น (ถ้ามี) + ปุ่ม action ขวาใน `PageHeader` / Admin เทียบเท่า  
2. เนื้อหาอยู่ใน **`app-page-content`** (หรือ `admin-page-content`) — ระยะซ้ายขวาเท่ากับ header (`--app-page-padding` / admin token)  
3. **ไม่ชน sidebar / topbar** — scroll แนวตั้งอยู่ใน main content (`AppShell` จัดให้แล้ว) ไม่มี horizontal scroll ทั้งหน้า  
4. การ์ด/ตารางใช้ **`AppCard`** / **`app-table-shell`** ไม่เว้น margin สุ่มระหว่างบล็อก  

→ ตัวอย่างโค้ด: [`NEW-PAGE-GUIDE.md`](NEW-PAGE-GUIDE.md)

### จอมอนิเตอร์ & สาธารณะ

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| Engineering Board (Kiosk) | `/board` | [x] kiosk header + โซน A–D | [x] skeleton/empty/error ทุกโซน | [x] glass · ธีมมืด/สว่าง · ตาราง/legend | [x] | [x] kiosk token · `dashboard.read` |

### ปฏิทิน & ใบงาน

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| Dashboard / หน้าแรก | `/` | [x] hero + `AppPageContent` | [x] Skeleton · EmptyState · retry | [x] KPI glass · token | [x] | [x] `CanPermission` · quickLinks ตามเมนู |
| Plan Calendar | `/plan-calendar` | [x] `AppPageShell` | [x] Skeleton · empty hint · retry | [x] `AppCard` · ปฏิทิน | [x] | [x] ลิงก์ `CanPermission` |
| ปฏิทิน Work scheduling | `/calendar` | [x] `AppPageShell` | [x] Skeleton · EmptyState · keepPreviousData | [x] `AppCard` · token | [x] | [x] ลิงก์ `CanPermission` |
| ปฏิทิน Line | `/line-calendar` | [x] `AppPageShell` | [x] Skeleton · EmptyState · retry | [x] `AppCard` | [x] | [x] อ่านอย่างเดียว · `master-data.write` |
| Backlog | `/backlog` | [x] | [x] | [x] | [x] | [x] |
| ใบงาน WO | `/work-orders` | [x] | [x] | [x] | [x] | [x] |
| รับรอง Confirmation | `/confirmation` | [x] | [x] | [x] | [x] | [x] |
| Export Confirm | `/confirmation/export` | [x] | [x] | [x] | [x] | [x] |

**จุดเน้น UX (legacy):**

- [x] `/calendar` — `FilterDetailSummary` + เลือกปี/เดือน · สีทีม A/B · U2 polish
- [x] `/work-orders` — bulk team + สรุป live · modal `task-list` tab · U2 `AppPageShell`
- [x] `/confirmation` — mass ≤44 · รูป before/after · QC badge · U2 `AppPageShell`

### แผน & นำเข้า SAP

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| แผน PM/CM | `/planning` | [x] | [x] | [x] | [x] | [x] |
| SAP Integration | `/integration` | [x] | [x] | [x] | [x] | [x] |
| IW37N import | `/iw37n` | [x] | [x] | [x] | [x] | [x] |
| Master data | `/master-data` | [x] | [x] | [x] | [x] | [x] |

**จุดเน้น:**

- [x] `/integration` — แท็บชัด · สถานะ job · ป้าย duplicate/error · U2 `AppPageShell`
- [x] `/iw37n` — `Iw37nImportReviewPanel` อ่านง่าย · U2 `AppPageShell`

### ชั่วโมง & บุคลากร

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| Manhours | `/manhours` | [x] | [x] | [x] | [x] | [x] |
| Manhour Admin | `/manhours/admin` | [x] | [x] | [x] | [x] | [x] |
| Worktime | `/worktime` | [x] | [x] | [x] | [x] | [x] |
| Personal Dashboard | `/personnel` | [x] | [x] | [x] | [x] | [x] |
| Personnel Confirm | `/personnel/confirm` | [x] | [x] | [x] | [x] | [x] |

### รายงาน

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| รายงานรวม | `/reports` | [x] | [x] | [x] | [x] | [x] |
| Auditor Hub | `/reports/audit` | [x] | [x] | [x] | [x] | [x] |
| Activity Log | `/activity-log` | [x] | [x] | [x] | [x] | [x] |
| Manhour HR | `/manhours-hr` | [x] | [x] | [x] | [x] | [x] |
| Eng Utilization | `/summary-weekly` | [x] | [x] | [x] | [x] | [x] |
| Chart full screen | `/summary-weekly/chart/full` | [x] | [x] | [x] | [x] | [x] |

**จุดเน้น:**

- [x] `/summary-weekly` — กริดรูปช่าง · กรองไม่มีรูป · กราฟ responsive
- [x] `/manhours-hr` — utilization + ช่วงวันที่ ISO

### ผู้ดูแลระบบ (`/admin`)

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| Admin Console | `/admin` | [x] | [x] | [x] | [x] | [x] |
| ผู้ใช้งาน | `/admin/users` | [x] | [x] | [x] | [x] | [x] |
| บทบาท & สิทธิ์ | `/admin/roles` | [x] | [x] | [x] | [x] | [x] |
| เมนู | `/admin/menu` | [x] | [x] | [x] | [x] | [x] |
| Branding | `/admin/branding` | [x] | [x] | [x] | [x] | [x] |
| ตั้งค่าระบบ | `/admin/settings` | [x] | [x] | [x] | [x] | [x] |
| Master hub | `/admin/master` | [x] | [x] | [x] | [x] | [x] |
| Audit | `/admin/audit` | [x] | [x] | [x] | [x] | [x] |
| Health | `/admin/health` | [x] | [x] | [x] | [x] | [x] |
| Backup | `/admin/backup` | [x] | [x] | [x] | [x] | [x] |
| ประกาศ | `/admin/announcements` | [x] | [x] | [x] | [x] | [x] |
| Security | `/admin/security` | [x] | [x] | [x] | [x] | [x] |
| About | `/admin/about` | [x] | [x] | [x] | [x] | [x] |

**จุดเน้น Admin:**

- [x] KPI cards แถวเดียวบน console
- [x] ตาราง users: รูปช่าง thumbnail · bulk role
- [x] Branding: preview ทันทีหลังอัปโหลด

### ระบบ & อื่นๆ

| หน้า | Path | Layout | Data | Visual | TH | RBAC |
|------|------|:------:|:----:|:------:|:--:|:----:|
| User Log | `/user-log` | [x] | [x] | [x] | [x] | [x] |
| ตั้งค่า (ผู้ใช้) | `/settings` | [x] | [x] | [x] | [x] | [x] |
| Logout | `/logout` | [x] | [x] | [x] | [x] | [x] |

### Modals / overlays (ทุกหน้าที่เรียกใช้)

| Component | Checklist |
|-----------|-----------|
| `WorkOrderDetailDialog` | [x] แท็บชัด · [x] รูป confirm · [x] QC · [x] ไม่ overflow mobile |
| `ConfirmPhraseDialog` (Admin) | [x] ยืนยันวลี · [x] โทนอันตราย (backup/delete) |
| Date/filter drawers | [x] ปิดด้วย Esc · [x] ปุ่ม Apply ชัด |

---

## U3 — Polish ข้ามทุกหน้า

### Responsive & อุปกรณ์

- [x] Sidebar → drawer บน `< lg`
- [x] ตารางกว้าง → horizontal scroll + คอลัมน์สำคัญ sticky
- [x] ปฏิทิน — touch drag ใช้ได้บน tablet
- [x] `/board` — 1080p / 4K TV ไม่แตก layout (`engineering-board-display.css`)

### Motion & feedback

- [x] transition sidebar / dialog ≤ 200ms
- [x] ปุ่ม primary มี hover/active (ไม่กระพริบ)
- [x] Optimistic UI ที่มีแล้ว (team batch) — ไม่กระตุกหลัง save

### Accessibility

- [x] focus ring เห็นชัดบนปุ่มและลิงก์
- [x] contrast ข้อความบนพื้น glass ≥ WCAG AA (ตัวอย่าง)
- [x] `aria-label` ปุ่มไอคอนล้วน
- [x] ไม่พึ่งสีอย่างเดียวบอกสถานะ (มีข้อความ/badge)

### Performance รู้สึก

- [x] `keepPreviousData` บนตาราง/filter หนัก
- [x] รูปช่าง lazy + placeholder ตัวอักษร
- [x] ไม่โหลดรูป confirm ทั้งก้อนใน list — เฉพาะใน modal

### Print / export

- [x] `/summary-weekly/chart/full` — พิมพ์ได้
- [x] รายงานที่มีปุ่ม export — ไอคอน + ข้อความไทย

**เกณฑ์ผ่าน U3:** ทดสอบ 1280×720 และ 1920×1080 · keyboard ใช้ calendar/WO ได้ · ไม่มี horizontal scroll บน login

---

## ลำดับทำแนะนำ (ไม่ต้องตาม route)

| สัปดาห์ | โฟกัส | หน้า |
|---------|--------|------|
| 1 | U0 + U1 | token · login · shell · admin layout |
| 2 | ใช้งานบ่อย | `/`, `/calendar`, `/work-orders`, `/confirmation` |
| 3 | SAP + รายงาน | `/integration`, `/iw37n`, `/summary-weekly`, `/manhours-hr` |
| 4 | Admin + ที่เหลือ | `/admin/*`, backlog, planning, master |
| 5 | U3 | responsive · a11y · board TV |

---

## แมปกับเอกสารอื่น

| เอกสาร | เรื่อง |
|--------|--------|
| [`skill-theme.md`](../../skill-theme.md) | สี hex · wireframe Admin · motion |
| [`parity-pending/14-administrator.md`](../parity-pending/14-administrator.md) | spec Admin UI |
| [`AUTOMATION-PHASES.md`](AUTOMATION-PHASES.md) | ไม่ปน — งานไฟล์ SAP แยกไฟล์นี้ |
| [`LEGACY-ISSUES-CHECKLIST.md`](LEGACY-ISSUES-CHECKLIST.md) | UX บั๊กระบบเก่า |

---

## สรุปความคืบหน้า (อัปเดตมือ)

| Phase | หน้าที่ผ่านครบ 5 คอลัมน์ | รวมหน้า |
|-------|-------------------------|--------|
| U0 | **ผ่าน** | design |
| U1 | **7 / 7** | shell |
| U2 | **~35 / ~35** | หน้าหลัก |
| U3 | **ผ่าน** | cross |
| D0–D4 | **ปิด** | dark + board + print |

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-22 | สร้าง U0–U3 + ตารางทุก route จาก `App.tsx` / `nav-config.ts` |
| 2026-05-22 | **U0 ปิด** — zinc/violet migrate · component มาตรฐาน · Admin shell · `audit:ui` · ภาพรวม Phase → โฟกัส U1 |
| 2026-05-22 | **U1 Login** — wallpaper เต็มจอ + การ์ด glass กลาง · เงา/แสง · framer-motion + shine |
| 2026-05-22 | **U1 HTTP errors** — `ErrorPageShell` glass · ตัวเลข stagger · icon float · shine |
| 2026-05-22 | **U1 App shell** — active bar · group heading · collapsed tooltip · mobile drawer |
| 2026-05-22 | **U2 `/board`** — ผ่านครบ 5 คอลัมน์ (kiosk layout · data states · visual · TH · RBAC gate) · ขยายนิยามคอลัมน์ U2 |
| 2026-05-22 | **U2 `/` Dashboard** — `AppPageContent` · EmptyState/error/retry · `CanPermission` ปุ่ม header · ไทย |
| 2026-05-22 | **U2 `/plan-calendar`** — `AppPageShell` · EmptyState · `AppCard` · ไทย · RBAC ลิงก์ |
| 2026-05-22 | **U2 `/calendar`** — `AppPageShell` · ตัวกรอง/ปฏิทิน `AppCard` · EmptyState · ไทย · RBAC |
| 2026-05-22 | **U2 `/line-calendar`** — `AppPageShell` · dialog ไทย · RBAC write/read |
| 2026-05-22 | **U2 `/work-orders`** — `AppPageShell` · `AppCard` · EmptyState/retry · ไทย · `CanPermission` · bulk team live |
| 2026-05-22 | **U2 `/confirmation`** — `AppPageShell` · Mass confirm ≤44 · QC queue · แท็บไทย · RBAC read/write/import |
| 2026-05-22 | **U2 `/confirmation/export`** — preview `view_exportconfirm` · EmptyState · ดาวน์โหลด Excel/CSV · RBAC export/import |
| 2026-05-22 | **U2 `/planning`** — `AppPageShell` · งานเปิด/ปิด · จ่ายงาน dialog · `planning.read` / `planning.assign` |
| 2026-05-22 | **U3 responsive** — sidebar drawer `<lg` · `tableStickyClass` + scroll shell · ปฏิทิน touch long-press drag |
| 2026-05-22 | **U3 motion** — dialog/sidebar ≤200ms · primary hover/active · WO team batch cache ไม่กระตุกหลัง save |
| 2026-05-22 | **U3 a11y** — focus ring · glass contrast · `IconButton`/`aria-label` · สถานะ WO/QC มีข้อความ |
| 2026-05-22 | **U3 performance** — `keepPreviousData` (plan/line calendar, home, mass confirm) · `PersonnelAvatar` lazy+initials · รูป confirm โหลดเมื่อแท็บรูปใน WO modal |
| 2026-05-22 | **U3 print/export** — พิมพ์กราฟ `/summary-weekly/chart/full` · `ReportExportButton` (ไอคอน+ไทย) บน confirm/IW37N/integration/audit |
| 2026-06-02 | **U2 app-wide** — `AppPageShell` + `hints` + `SchedulingPageStack` ทุก route หลัก · Admin 12 หน้า + `/admin/users` · chart full · build green |
| 2026-06-02 | **D1 shell dark** — login/error card glass · `text-form-error` · error `ThemeToggle` · logout glass card · board loading skeleton |
| 2026-06-02 | **D2 หน้าหลัก** — Input/Textarea/Tabs token · `app-surface-panel` · scheduling hero links · FullCalendar dark · WO/calendar/confirm components |
| 2026-06-02 | **D3 admin/reports** — `app-callout`/`admin-callout` · PermissionMatrix sticky · AuditDiff · Worktime tokens · admin banners |
| 2026-06-02 | **D4 board/print** — gate glass panel · global `@media print` · admin breadcrumb dark |
| 2026-06-02 | **ปิด UI polish** — `app-surface-panel--success` · `text-form-error` sweep · EngUtilizationMissingPhotos · อัปเดตสรุป U/D ครบ |
