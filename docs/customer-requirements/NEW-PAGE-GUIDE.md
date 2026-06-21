# สร้างหน้าใหม่ (App / Admin)

อัปเดต: 2026-05-22  
อ้างอิง: [`UI-POLISH-PHASES.md`](UI-POLISH-PHASES.md) U0 · [`UI-DESIGN-TOKENS.md`](UI-DESIGN-TOKENS.md)

---

## หน้าแอปหลัก (ภายใน `AppShell`)

ใช้ **`PageHeader` + `app-page-content`** — ห้ามใส่ `<h1>` ดิบนอก header

### แบบย่อ (แนะนำ)

```tsx
import { AppPageShell } from '@/components/layout/AppPageShell'
import { AppCard } from '@/components/layout/AppCard'

export function MyFeaturePage() {
  return (
    <AppPageShell
      title="ชื่อหน้า"
      description="คำอธิบายสั้น"
      contentClassName="space-y-6"
      headerActions={<Button size="sm">Action</Button>}
    >
      <AppCard pad="compact">{/* ฟิลเตอร์ */}</AppCard>
      <div className="app-table-shell overflow-auto">
        <Table embedded stickyHeader zebra>{/* ... */}</Table>
      </div>
    </AppPageShell>
  )
}
```

### แบบแยกส่วน

```tsx
import { PageHeader } from '@/components/layout/PageHeader'
import { AppPageContent } from '@/components/layout/AppPageContent'

<>
  <PageHeader title="..." description="..." />
  <AppPageContent className="space-y-6">{children}</AppPageContent>
</>
```

### ลงทะเบียน route

1. เพิ่ม `Route` ใน [`App.tsx`](../../PM-Pepsi-App/frontend/src/App.tsx) ภายใต้ `<AppShell />`
2. เพิ่มเมนูใน [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) + สิทธิ์ RBAC ถ้ามี

---

## หน้า Admin (`/admin/*`)

ใช้ **`AdminPageShell`** (หรือ `AdminPageRoot` + `AdminPageHeader` + `AdminPageContent`)

```tsx
import { AdminPageShell } from '@/components/admin'

export function AdminFooPage() {
  return (
    <AdminPageShell
      tourTarget="admin-foo"
      title="ชื่อหน้า"
      description="คำอธิบาย"
      contentClassName="space-y-6"
    >
      {/* เนื้อหา */}
    </AdminPageShell>
  )
}
```

- `tourTarget` ต้องตรง `ADMIN_SECTIONS[].tourTarget` ใน [`admin-sections.ts`](../../PM-Pepsi-App/frontend/src/lib/admin-sections.ts)
- Breadcrumb บน toolbar มาจาก `AdminLayout` + `adminBreadcrumbTrail()`
- ไม่มีสิทธิ์ → `AdminPageRoot` + `AdminAccessDenied`

---

## Component ที่ควรใช้ซ้ำ

| งาน | Component |
|-----|-----------|
| การ์ด / ฟิลเตอร์ | `AppCard` (`pad="compact"`) · `AdminCard` |
| KPI สรุป (แอป) | `KpiStatCard` + `KpiStatGrid` · `FilterDetailSummary` |
| KPI สรุป (Admin) | `AdminKpiCard` + `AdminKpiGrid` · toolbar `AdminDensityToggle` |
| ตาราง | `app-table-shell` + `Table embedded stickyHeader zebra` |
| ฟอร์ม | `FormField` + `Input` / `Textarea` |
| สถานะ WO | `WoPmPhaseBadge` / `WoPmPhaseLegend` |
| ว่าง / โหลด | `EmptyState` · `Spinner` / `Skeleton` |
| แจ้งผล | `toastSuccess` / `toastError` จาก `lib/app-toast.ts` |

ห้ามใช้ Tailwind `zinc-*` / `violet-*` — ใช้ token ใน `index.css` (`.text-app`, `.app-card-pad`, ฯลฯ)

---

## ตัวอย่างสด (dev เท่านั้น)

```text
http://localhost:5173/dev/ui
```

เปิดได้เมื่อ `npm run dev` เท่านั้น — ไม่มีใน production build

---

## Checklist ก่อน PR

- [ ] มี `PageHeader` / `AdminPageHeader` (ไม่มี `<h1>` ลอย)
- [ ] เนื้อหาอยู่ใน `app-page-content` / `AdminPageContent`
- [ ] โหลดจาก API จริง (ไม่มี mock / ข้อความ "(mock)")
- [ ] รัน `node scripts/audit-hardcode-mock.mjs`
