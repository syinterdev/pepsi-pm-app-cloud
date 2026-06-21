# UI i18n (English default)

- **Library:** `i18next` + `react-i18next`
- **Locales:** `en` (default), `th`
- **User preference:** `localStorage` key `pm-app.locale`
- **Switch:** top bar (EN / ไทย) and Settings → Profile

## Namespaces

| Namespace | Scope |
|-----------|--------|
| `common` | Shell, auth, settings, theme, toast, calendar months, RBAC |
| `nav` | Sidebar route + heading labels (`localize-nav.ts`) |
| `home` | Dashboard |
| `planning` | PM/CM planning |
| `scheduling` | Calendars, backlog, WO dialog, filters |
| `confirmation` | Export confirmation, mass confirm, QC |
| `workOrders` | WO list / confirmation table |
| `errors` | HTTP error pages |
| `personnel` | Dashboard, confirm, admin CRUD |
| `manhours` | Manhours, HR, worktime |
| `reports` | Reports hub, audit, activity, utilization |
| `admin` | `/admin/*` console |
| `integration` | SAP CSV + IW37N |
| `board` | Engineering board kiosk |
| `pmVibration` | PM measurements |
| `masterData` | Master data hub |
| `userLog` | User activity log |

## Adding strings

1. Add keys to `locales/en/<namespace>.json`.
2. Mirror in `locales/th/<namespace>.json`.
3. Register new namespace in `index.ts` if needed.
4. Use `const { t } = useTranslation('planning')` → `t('list.title')`.
5. Non-React code: `import { i18n } from '@/i18n'` → `i18n.t(key, { ns })`.

## Navigation

Fallback menu (`nav-config.ts`) uses English labels. `lib/localize-nav.ts` applies `nav.json` per locale. New routes: add `routes` entry in both `nav.json` files.

## Dates / calendar

Use `useI18nFormat()` for `date-fns` and FullCalendar. Month names: `getCalendarMonthNames()` from `calendar-period-utils.ts` or `common.calendar.monthsLong`.

## Do not translate

WO numbers, MAT/ZB codes, API `error.message`, technician names from DB.

## Plan

Full-app checklist: [`docs/superpowers/plans/2026-06-03-i18n-full-app.md`](../../../../docs/superpowers/plans/2026-06-03-i18n-full-app.md)
