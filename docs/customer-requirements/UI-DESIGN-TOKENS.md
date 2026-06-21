# สรุป CSS Design Tokens (`index.css`)

อัปเดต: 2026-06-09  
ไฟล์ต้นทาง: [`PM-Pepsi-App/frontend/src/index.css`](../../PM-Pepsi-App/frontend/src/index.css)  
อ้างอิง: [`skill-theme.md`](../../skill-theme.md) §12 · [`skills.md`](../../skills.md) (ขาว · ส้ม · ฟ้า · เขียว)

---

## แมปบรีฟลูกค้า → Token

| บรีฟลูกค้า (โลโก้ใหม่) | Token หลัก | Hex (ค่าเริ่มต้น) | ใช้ใน UI |
|--------------------------|------------|------------------|---------|
| **ขาว** | `--brand-logo-white`, `--brand-pepsi-white` | `#FFFFFF` | การ์ด, พื้นผิว, glass, hero text |
| **น้ำเงินเข้ม** | `--brand-logo-blue-dark`, `--brand-pepsi-blue`, `--app-accent` | `#003366` | หัวข้อ, ลิงก์, Admin primary, hero gradient |
| **ส้ม** | `--brand-logo-orange`, `--brand-pepsi-red`, `--app-primary` | `#F7941D` | ปุ่มหลัก (CTA), accent Admin, KPI warning |
| **เขียวเข้ม** | `--brand-logo-green-dark` | `#1E6B34` | stripe โลโก้, accent เสริม |
| **เขียวอ่อน** | `--brand-logo-green-light`, `--brand-pepsi-green`, `--admin-success` | `#7AC943` | สำเร็จ, health OK, KPI success |
| **ฟ้า** | `--brand-logo-sky`, `--admin-info` | `#4DA6FF` | info, gradient orb, role color เริ่มต้น |
| **แดง (semantic)** | `--admin-danger` | `#FF3B30` | ลบ, ข้อผิดพลาด — ไม่อยู่ในโลโก้ |

> **60/30/10 (Admin):** พื้น 60% = `--admin-bg` · ผิว 30% = `--admin-surface` / sidebar · เน้น 10% = `--admin-primary` / `--admin-accent`

---

## 1) `:root` — แบรนด์ + แอปทั่วไป

### `--brand-logo-*` (source of truth · โลโก้ใหม่)

| Variable | ค่า | หมายเหตุ |
|----------|-----|----------|
| `--brand-logo-blue-dark` | `#003366` | น้ำเงินเข้ม |
| `--brand-logo-orange` | `#f7941d` | ส้ม |
| `--brand-logo-green-dark` | `#1e6b34` | เขียวเข้ม |
| `--brand-logo-green-light` | `#7ac943` | เขียวอ่อน |
| `--brand-logo-sky` | `#4da6ff` | ฟ้า |
| `--brand-logo-white` | `#ffffff` | ขาว |

### `--brand-pepsi-*` (alias · compat โค้ดเก่า)

| Variable | ค่า | หมายเหตุ |
|----------|-----|----------|
| `--brand-pepsi-blue` | `var(--brand-logo-blue-dark)` | เดิม corporate blue |
| `--brand-pepsi-red` | `var(--brand-logo-orange)` | เดิมแดงโลโก้ → ส้มใหม่ |
| `--brand-pepsi-white` | `var(--brand-logo-white)` | ขาว |
| `--brand-pepsi-orange` | `var(--brand-logo-orange)` | ส้ม |
| `--brand-pepsi-green` | `var(--brand-logo-green-light)` | เขียวอ่อน |

### `--sys-*` (macOS semantic · ส้ม/เขียว/ฟ้า/แดง UI)

| Variable | Light | Dark |
|----------|-------|------|
| `--sys-orange-light` / `-dark` | `#ff9500` | `#ff9f0a` |
| `--sys-green-light` / `-dark` | `#34c759` | `#30d158` |
| `--sys-blue-light` / `-dark` | `#007aff` | `#0a84ff` |
| `--sys-red-light` / `-dark` | `#ff3b30` | `#ff453a` |

### `--app-*` (ทุกหน้า · override ได้จาก Admin Branding API)

| Variable | ค่าเริ่มต้น | บทบาท |
|----------|-------------|--------|
| `--app-primary` | → `--brand-logo-orange` (จาก Admin `accentColor`) | ปุ่มหลัก CTA |
| `--app-accent` | → `--brand-logo-blue-dark` (จาก Admin `primaryColor`) | หัวข้อ, ลิงก์, focus ring |
| `--app-heading-color` | → `--brand-logo-blue-dark` | h1–h3 |
| `--app-primary-rgb` | `247, 148, 29` | gradient / rgba (ส้ม) |
| `--app-accent-rgb` | `0, 76, 151` | gradient / rgba |
| `--app-bg` | `#eef2f7` | พื้นหลังหน้า (`liquid-glass-bg`) |
| `--app-surface` | `#ffffff` | การ์ด `.app-card` |
| `--app-surface-muted` | `#f4f4f5` | พื้นรอง |
| `--app-text` | `#18181b` | ข้อความหลัก |
| `--app-text-muted` | `#71717a` | คำอธิบาย |
| `--app-border` | `#e4e4e7` | เส้นขอบ |
| `--app-heading-color` | → `--app-primary` | หัวข้อ |
| `--app-sidebar` | `#eaeaea` | พื้น sidebar (ไม่ใช่แผงน้ำเงินเต็ม) |
| `--app-sidebar-fg` | `#1f2937` | ข้อความเมนู |
| `--app-sidebar-fg-muted` | `#5b6470` | heading เมนูจาง (WCAG AA บน sidebar) |
| `--app-sidebar-border` | `#d4d4d8` | เส้นแบ่ง |
| `--app-sidebar-hover` | mix primary 10% | hover รายการ |
| `--app-sidebar-active` | mix primary 16% | active รายการ |
| `--app-glass-bg` | `rgba(255,255,255,0.7)` | glass panel |
| `--app-glass-border` | `rgba(255,255,255,0.18)` | ขอบ glass |

### Typography `--app-font-*` (ฟอนต์เดียวทั้งแอป)

| ระดับ | Variable | ค่าเริ่มต้น (comfortable 15px) | ใช้เมื่อ |
|-------|----------|--------------------------------|----------|
| Caption | `--app-font-size-caption` | `13px` | คำอธิบายใต้หัวข้อ, hint, `small` |
| Body | `--app-font-size-base` | `15px` | ข้อความหลัก, ตาราง, form |
| Body sm | `--app-font-size-sm` | `13px` | แท็บเมนู, eyebrow |
| Section (h3) | `--app-font-size-lg` | `17px` | หัวข้อย่อยในการ์ด |
| Section (h2) | `--app-font-size-xl` | `20px` | หัวข้อส่วน |
| Page (h1) | `--app-font-size-page-title` | `24px` | `PageHeader` / `AdminPageHeader` |
| Nav | `--app-nav-link-size` | `15px` | ลิงก์ sidebar |

| อื่น ๆ | Variable | ค่า |
|--------|----------|-----|
| ฟอนต์ | `--app-font-family` | `"Sarabun", "Segoe UI", system-ui` |
| บรรทัด | `--app-line-height-tight` / `body` / `relaxed` | `1.25` / `1.5` / `1.6` |
| สีหัวข้อ | `--app-heading-color` | `--app-primary` (หรือจาก branding) |

**Scale:** `deriveTypographyScale()` ใน `frontend/src/lib/typography-tokens.ts` — preset `compact` 14px · `comfortable` 15px · `large` 17px

**CSS utilities** (`index.css`): `.text-caption` · `.text-body` · `.text-body-sm` · `.text-heading-section` · `.text-heading-page` · `.text-eyebrow` · `.text-sidebar-muted` · `.text-code` · `.text-badge` — ภายใน `.app-page-content` ใช้ `h1`–`h4` อัตโนมัติตาม scale

**Migration:** แทน `text-[10–11px]` / Tailwind `text-sm` ด้วย utilities ข้างบน — สคริปต์ `frontend/scripts/migrate-typography.mjs` (รันซ้ำได้ถ้ามีไฟล์ใหม่)

**Override:** `applyTypographyToDocument()` จาก `GET /api/v1/settings/public` (Branding → Typography)

### Semantic status (U4a · แทน `emerald-*` / `amber-*` / `violet-*`)

**Source:** `brand-palette.ts` → `apply-theme.ts` เขียน `--status-*` บน `:root` · utilities ใน `index.css`

| Variable | ค่าเริ่มต้น | ใช้เมื่อ |
|----------|-------------|----------|
| `--status-success` | `--brand-logo-green-light` (`#7AC943`) | สำเร็จ · หลัง PM · TECO |
| `--status-warning` | `--brand-logo-orange` (`#F7941D`) | เตือน · legacy · QC pending |
| `--status-danger` | `--sys-red-light` (`#FF3B30`) | ลบ · reject · error |
| `--status-info` | `--brand-logo-blue-dark` (`#003366`) | info · planning · close timeline |
| `--phase-before` | `--status-warning` | รูป/เฟสก่อน PM (read-only) |
| `--phase-after` | `--status-success` | รูปหลัง PM · อัปโหลดใหม่ได้ |

**Override:** Admin Branding → `successColor` / `warningColor` / `infoColor` + `dangerColor` ใน `apply-theme.ts`

**Utility families** (ใช้ใน TSX แทน Tailwind สีดิบ):

| Pattern | ตัวอย่าง | บทบาท |
|---------|----------|--------|
| Surface | `.app-tone-success` · `.app-tone-warning` · `.app-tone-danger` | พื้น+ขอบ+ข้อความ |
| Soft fill | `.app-tone-*-soft` | พื้นอ่อนใน panel |
| Text parts | `.app-tone-*-icon` · `-label` · `-strong` | ไอคอน / caption / ตัวเลข |
| Badge | `.app-tone-*-badge` · `-fill` | Badge สถานะ |
| Section | `.app-tone-*-section` · `-panel` · `-callout` | การ์ดเตือน / QC / รูปปิดงาน |
| Callout (alias) | `.app-callout--amber` · `.app-callout--emerald` | แทน `bg-amber-50` / `bg-emerald-50` |
| Admin callout | `.admin-callout--amber` · `--danger` | หน้า `/admin/*` |

> **ไม่ใช้** `--callout-info` / `--callout-warn` แยก — ใช้ `.app-tone-*` / `.app-callout--*` แทน (dark mode ผ่าน `color-mix` + `--app-surface`)

**ไฟล์อ้างอิง:** `kpi-tone.ts` · `wo-pm-phase.ts` · `ConfirmationImagesPanel` (after-only) · §E ใน [`PRE-UAT-UI-PHASES.md`](PRE-UAT-UI-PHASES.md)

### Radius / shadow `--app-radius-*` · `--app-shadow-*`

| องค์ประกอบ | Variable | ค่า | Tailwind utility |
|------------|----------|-----|------------------|
| Card / table shell / KPI | `--app-radius-card` | `12px` | `rounded-card` · `.app-card` |
| Button / input / select | `--app-radius-button` | `8px` | `rounded-button` |
| Dialog | `--app-radius-dialog` | `16px` | `rounded-dialog` · `.macos-dialog-glass` |

| Shadow | Variable | ใช้กับ |
|--------|----------|--------|
| Card | `--app-shadow-card` | `.app-card`, `.app-table-shell`, `shadow-app-card` |
| Card hover | `--app-shadow-card-hover` | `.app-card:hover`, `.admin-card:hover` |
| Button | `--app-shadow-button` | `Button`, outline variant |
| Dialog | `--app-shadow-dialog` | `DialogContent`, `.macos-dialog-glass` |

**Migration:** `node scripts/migrate-radius.mjs` — แทน `rounded-xl/md/lg` ใน features (ไม่แตะ `ui/dialog.tsx`)

### Spacing `--app-space-*`

| Step | Variable | px | Tailwind (หลัง `@theme`) |
|------|----------|-----|---------------------------|
| 1 | `--app-space-1` | 4 | `1`, `0.5` |
| 2 | `--app-space-2` | 8 | `2`, `1.5` |
| 3 | `--app-space-3` | 12 | `3`, `2.5` |
| 4 | `--app-space-4` | 16 | `4`, `3.5`, `5` |
| 5 | `--app-space-5` | 24 | `6`, `7` |
| 6 | `--app-space-6` | 32 | `8`…`32` (สูงสุด) |

**Layout:** ใช้ `gap-*` / `.app-stack` / `.app-stack-tight` แทน `margin-top` สุ่ม · `.app-page-content` / `.admin-page-content` ใช้ token padding

**Migration:** `node scripts/migrate-spacing.mjs` · ค่าอ้างอิง [`spacing-scale.ts`](../../PM-Pepsi-App/frontend/src/lib/spacing-scale.ts)

### Card padding `--app-card-padding*`

| โหมด | Variable | px | ใช้เมื่อ |
|------|----------|-----|----------|
| default | `--app-card-padding` | 24 (`--app-space-5`) | `AppCard` / `AdminCard` + `CardHeader` / `CardContent` |
| compact | `--app-card-padding-compact` | 16 (`--app-space-4`) | แถบฟิลเตอร์ · KPI แถว · `app-card-pad-compact` |
| gap หัวข้อ | `--app-card-inner-gap` | 8 | ระหว่าง title / description ใน header |

**Component:** [`AppCard.tsx`](../../PM-Pepsi-App/frontend/src/components/layout/AppCard.tsx) · [`AdminCard.tsx`](../../PM-Pepsi-App/frontend/src/components/admin/AdminCard.tsx) — prop `pad="default" | "compact" | "none"`

**CSS:** `.app-card-pad` · `.app-card-pad-compact` · Admin compact density ลด `--app-card-padding` ทั้งหน้า

**Migration:** `node scripts/normalize-app-card-padding.mjs` — แทน `app-card p-4` / `p-6` แบบ hard-code

---

## 2) Sidebar — `--app-sidebar-*` + `--sb-menu-*` (U4g)

> **Audit baseline:** 2026-06-09 (U4g.0) · Preview: `/dev/ui` → **Sidebar states** · รายละเอียด gap: [`PRE-UAT-UI-PHASES.md`](PRE-UAT-UI-PHASES.md) §U4g

### Token hierarchy

```text
:root / html.dark
  └── --app-sidebar, --app-sidebar-fg, --app-sidebar-fg-muted,
      --app-sidebar-border, --app-sidebar-hover, --app-sidebar-active
        └── apply-theme.ts (Admin branding override)
.macos-sidebar
  └── --sb-menu-text, --sb-menu-muted, --sb-menu-accent,
      --sb-menu-highlight, --sb-menu-active-surface
      └── --sidebar-ease, --sidebar-motion (300ms)
.macos-admin .macos-sidebar
  └── re-maps --sb-menu-* → --admin-*
```

### `--app-sidebar-*` (`:root` + dark)

| Variable | Light | Dark | ใช้ใน |
|----------|-------|------|--------|
| `--app-sidebar` | `#eaeaea` | `#1e293b` | พื้น shell (mix 92% ใน `.macos-sidebar`) |
| `--app-sidebar-fg` | `#1f2937` | `rgba(255,255,255,0.94)` | ข้อความเมนู active · brand title · footer |
| `--app-sidebar-fg-muted` | `#6b7280` | `rgba(255,255,255,0.72)` | heading · รายการ idle · pin ghost |
| `--app-sidebar-border` | `#d4d4d8` | `rgba(255,255,255,0.14)` | brand/footer `border-t/b` · drawer |
| `--app-sidebar-hover` | mix primary 10% | `rgba(255,255,255,0.1)` | hover ปุ่ม footer |
| `--app-sidebar-active` | mix primary 16% | `rgba(255,255,255,0.18)` | logout outline hover |
| `--app-sidebar-inner-highlight` | `rgba(255,255,255,0.72)` | `rgba(255,255,255,0.06)` | `::after` ขอบขวาใน shell |
| `--app-sidebar-elevated` | 2-layer shadow | inset + dark elevation | พื้นฐาน (ไม่มี `data-pinned`) |
| `--app-sidebar-elevated-pinned` | เบากว่า | inset + soft | `data-pinned="true"` |
| `--app-sidebar-elevated-hover` | ลึกกว่า | inset + strong | `data-pinned="false"` (hover-expand) |

**Branding:** `apply-theme.ts` เขียนทับ fg/muted/border/hover/active เมื่อ Admin ตั้ง primary/accent · elevation tokens อยู่ใน CSS

**Surface (U4g.1):** gradient แนวตั้ง `color-mix(--app-sidebar, --app-surface)` · `::after` inner highlight · ไม่ใช้ `backdrop-filter` บน desktop

### `--sb-menu-*` (scoped บน `.macos-sidebar`)

| Variable | App default | Admin override | บทบาท |
|----------|-------------|----------------|--------|
| `--sb-menu-text` | `--app-sidebar-fg` | `--admin-text` | label active / hover |
| `--sb-menu-muted` | `--app-sidebar-fg-muted` | mix admin-text 65% | idle link · group heading |
| `--sb-menu-accent` | `--app-primary` | `--admin-primary` | hover bg 8% · active bg 16% |
| `--sb-menu-highlight` | `--app-accent` | `--admin-accent` | active `::before` bar · collapsed ring |
| `--sb-menu-active-surface` | `--app-sidebar` | `--admin-surface` | active pill background |
| `--sidebar-ease` | `cubic-bezier(0.22,1,0.36,1)` | — | width · label fade |
| `--sidebar-motion` | `300ms var(--sidebar-ease)` | — | collapse expand (≤300ms ตามสเปก) |

### Layout constants (TSX — ยังไม่เป็น CSS var)

| ค่า | Class | ไฟล์ |
|-----|-------|------|
| Expanded `15rem` | `w-60` | `AppNavShell.tsx` |
| Collapsed `3.5rem` | `w-14` | `AppNavShell.tsx` |
| Drawer max | `min(100vw-2rem, 18rem)` | `AppNavShell.tsx` |
| Pin pref | `pm_sidebar_pinned` | `sidebar-prefs.ts` |

### CSS class map (`index.css`)

| Class | บทบาท | บรรทัดโดยประมาณ |
|-------|--------|----------------|
| `.nav-menu-group-heading*` | group label (sidebar + navbar) | ~225 |
| `.sidebar-group-marker*` | collapsed group divider | ~252 |
| `.macos-sidebar` | shell surface + `--sb-menu-*` | ~3050 |
| `.app-sidebar-brand*` | logo + title zone | ~3090 |
| `.macos-sidebar .sidebar-nav a*` | link hover/active/`::before` | ~3365 |
| `.app-sidebar--drawer` | mobile shadow | ~3463 |
| `.macos-admin .macos-sidebar` | admin token remap | ~3075 |

**กฎ U4g.0:** กฎ sidebar ใหม่ใส่ในบล็อก `§ Sidebar Premium (U4g)` ใน `index.css` — ไม่กระจายไฟล์อื่น

### WCAG contrast (computed 2026-06-09)

พื้น = `color-mix(--app-sidebar 92%, white|#111113)` ตาม `.macos-sidebar`

| คู่ | Ratio | AA normal (4.5) | หมายเหตุ |
|-----|-------|-------------------|----------|
| Light `--app-sidebar-fg` | **12.4** | PASS | ข้อความเมนู active |
| Light `--app-sidebar-fg-muted` | **5.08** | PASS | `#5b6470` (U4g.1) |
| Dark `--app-sidebar-fg` | **13.2** | PASS | |
| Dark `--app-sidebar-fg-muted` | **7.6** | PASS | |

### Gap vs wireframe (U4g.0 audit)

| เป้า wireframe | Baseline ปัจจุบัน | Phase แก้ |
|----------------|-------------------|-----------|
| Pepsi stripe บาง | `PepsiStripe variant="sidebar"` · `pepsi-stripe--sidebar` | `[x]` U4g.2 |
| Logo glass frame | `app-sidebar-brand__mark` + `SidebarBrandZone` | `[x]` U4g.2 |
| Module chip `PM` | `showPortalLink` → `app-sidebar-brand__module-chip` | `[x]` U4g.2 |
| Active pill **เลื่อน** | `SidebarNavIndicator` · 150ms | `[x]` U4g.3 |
| Scroll fade mask | ไม่มี `mask-image` บน `<nav>` | U4g.4 |
| Collapsed active dot | icon ring + `icon-slot::after` dot | `[x]` U4g.4 |
| Footer avatar initials | `SidebarFooter` + `ProfileAvatar` | `[x]` U4g.6 |
| Portal link ใน footer | `showPortalLink` → footer NavLink | `[x]` U4g.6 |
| Mobile `backdrop-blur` | `SidebarMobileDrawer` Sheet · `bg-black/40` blur · z-60 | `[x]` U4g.7 |
| `useReducedMotion` width | `data-reduced-motion` + `prefers-reduced-motion` ไม่มี width transition | `[x]` U4g.5 |
| Admin preview pixel-match | `MenuNavLayoutPreview` · shared `SidebarNavPreviewPanel` | `[x]` U4g.8 |

### ไฟล์ ownership

| ไฟล์ | บทบาท |
|------|--------|
| `AppNavShell.tsx` | shell layout · drawer · `SidebarPanel` |
| `SidebarBrandZone.tsx` | brand stripe · mark · title · module chip |
| `SidebarFooter.tsx` | user avatar · role badge · portal · pin · logout |
| `SidebarMobileDrawer.tsx` | Sheet `side=left` · overlay · focus return hamburger |
| `SidebarNavPreview.tsx` | shared preview · `MenuNavLayoutPreview` · `/dev/ui` |
| `SidebarNavIndicator.tsx` | sliding active pill + accent bar |
| `NavMenuList.tsx` | รายการเมนู · tooltip collapsed |
| `use-sidebar-state.ts` | pin · hover expand · mobile open |
| `sidebar-prefs.ts` | `pm_sidebar_pinned` · `pm_sidebar_density` · `pm_sidebar_width` |
| `SidebarPreferencePanel.tsx` | Settings → Profile sidebar prefs (U4g.9) |
| `apply-theme.ts` | inject `--app-sidebar-*` จาก branding |
| `SidebarPlaygroundStates.tsx` | `/dev/ui` mock 5–8 รายการ |
| `MenuNavLayoutCard.tsx` | Admin shell mode (preview จริงใน U4g.8) |

**CSS ที่ใช้:** `.macos-sidebar .sidebar-nav a` — hover/active ใช้ `--sb-menu-accent` · แถบซ้าย active ใช้ `--sb-menu-highlight`

---

## 3) `.macos-admin` — `--admin-*` + `--pepsi-*`

| Variable | Light | บทบาท |
|----------|-------|--------|
| `--admin-primary` | Pepsi blue | ปุ่มหลัก Admin, ลิงก์, KPI info |
| `--admin-accent` | Pepsi red | ไฮไลต์, stripe |
| `--admin-success` | `--pepsi-green` | `data-tone="success"` |
| `--admin-warning` | `--pepsi-orange` | `data-tone="warning"` |
| `--admin-danger` | `--sys-red-light` | `data-tone="danger"` |
| `--admin-info` | `--sys-blue-light` | `data-tone="info"` |
| `--admin-bg` | `#eef2f7` | พื้นหลัง Admin |
| `--admin-surface` | `#ffffff` | การ์ด `.admin-card` |
| `--admin-surface-muted` | `#f8fafc` | zebra / muted |
| `--admin-border` | `#dce3ed` | ขอบ |
| `--admin-text` | `#1e293b` | ข้อความ |
| `--admin-text-muted` | `#64748b` | รอง |
| `--admin-shadow` | multi-layer | การ์ด + layout glass |

**Dark:** `html.dark .macos-admin` — `--admin-bg: #0f172a`, surface `#1c1c1e`, ข้อความขาว 92%

---

## 4) คลาสที่ consume token (ไม่ต้องจำ hex ใน TSX)

| Class | Token หลัก |
|-------|------------|
| `.liquid-glass-bg` | `--app-bg` + radial `--app-accent` / `--app-primary` |
| `.app-card` | `--app-surface`, `--app-border`, shadow accent |
| `.app-table-shell` | เหมือนการ์ด ไม่ hover lift |
| `.app-page-header` | `--app-surface`, `--app-border` |
| `.app-page-content` | padding `--app-space-4/5/6` |
| `.app-stack` / `.app-stack-tight` / `.app-stack-loose` | vertical gap 16 / 8 / 24px |
| `.app-tone-info` / `.app-tone-info-row` / `.app-badge-accent` | พื้นหลัง/แถบ info — Pepsi blue (แทน `violet-*`) |
| `.app-tone-success|warning|danger` + `-*-badge/icon/label/callout/section` | สถานะ semantic — แทน `emerald-*` / `amber-*` (U4a) |
| `.app-callout--amber` / `.app-callout--emerald` | callout ข้อความเตือน/สำเร็จ (dark-safe) |
| `.admin-callout--amber` / `--danger` | callout ใน Admin shell |
| `.text-app` / `.text-app-muted` / `.border-app` / `.bg-app-muted` / `.bg-app-subtle` | แทน `text-zinc-*`, `border-zinc-*`, `bg-zinc-50/100` |
| `.ring-app` / `.focus-app-ring` | แทน `ring-zinc-*`, focus ring |
| `.macos-admin .text-app` ฯลฯ | map เป็น `--admin-*` ใน Admin |
| `.admin-card` | `--admin-surface`, `--admin-shadow` |
| `.admin-kpi-card[data-tone]` | `--admin-success/warning/danger/info` |
| `.macos-sidebar` | `--sb-menu-*` |
| `.macos-topbar` | `--app-surface`, `--app-border` |
| `.dashboard-kpi--pepsi-blue` | `--brand-pepsi-blue` |

---

## 5) กฎสำหรับนักพัฒนา

1. **ห้าม** hard-code `#004c97` ใน component — ใช้ `var(--brand-pepsi-blue)` หรือ Tailwind ที่ map จาก theme  
2. หน้า **ใหม่** ใช้ `PageHeader` + `app-page-content` + `app-card`  
3. หน้า **`/admin/*`** ใช้ `AdminPageHeader` + `admin-card` + `admin-page-content`  
4. สถานะ: `data-tone="success|warning|danger|info"` บน KPI / badge · หรือ `.app-tone-*` / `.app-callout--*` ใน TSX (ห้าม `emerald-*` / `amber-*` / `violet-*` / `teal-*`)  
5. สีจากลูกค้า: ปรับที่ **Admin → Branding** → `apply-theme.ts` เขียน `--app-primary`, `--app-accent`, `--app-bg`

---

## 6) ตรวจค่าบนเบราว์เซอร์

```js
// DevTools Console
getComputedStyle(document.documentElement).getPropertyValue('--brand-pepsi-blue').trim()
getComputedStyle(document.querySelector('.macos-sidebar')).getPropertyValue('--sb-menu-accent').trim()
```

---

## 7) Checklist U0 (`UI-POLISH-PHASES.md`)

- [x] สรุป token ในไฟล์นี้ + [`skill-theme.md`](../../skill-theme.md) §12  
- [x] สีหลัก: ขาว · ฟ้า `#004c97` · แดง `#e31837` · ส้ม/เขียว ผ่าน `--sys-*` / `--admin-*`  
- [x] Radius/shadow scale — `--app-radius-card|button|dialog` + `--app-shadow-*` · `rounded-card|button|dialog`
- [x] Spacing scale `4/8/12/16/24/32` — `@theme` spacing · `.app-stack*` · `migrate-spacing.mjs`
