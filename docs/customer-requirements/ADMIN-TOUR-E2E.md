# Admin Joyride tour — E2E & manual QA

ทัวร์ผู้ดูแล (react-joyride) นำทาง **14 ขั้น**: Command palette → Admin Console → 12 หน้า admin ที่ implement แล้ว

## ส่วนประกอบ

| ไฟล์ | บทบาท |
|------|--------|
| `frontend/src/components/admin/AdminTour.tsx` | Joyride + navigate ตามขั้น |
| `frontend/src/components/admin/admin-tour-steps.tsx` | นิยามขั้น + `ADMIN_TOUR_STEP_COUNT` |
| `frontend/src/components/admin/AdminTourTooltip.tsx` | Tooltip custom: Pepsi stripe, progress bar ไล่สี, pill ขั้น, ปุ่มไทย, `kbd` shortcut |
| `frontend/src/components/admin/admin-tour.css` | Token `--admin-tour-*` · light/dark · spotlight overlay |
| `frontend/e2e/admin-tour.spec.ts` | Playwright |
| `frontend/e2e/helpers/admin-tour.ts` | Page object + locators |

## รัน E2E

1. Backend ที่ `:4000` และ frontend ที่ `:5173` (หรือให้ Playwright เปิด webServer เอง)
2. คัดลอก `frontend/e2e/.env.example` → `frontend/e2e/.env` แล้วตั้ง:

```env
E2E_ADMIN_USER=<workcenter ที่มีสิทธิ admin>
E2E_ADMIN_PASSWORD=<รหัสผ่าน>
E2E_API_URL=http://127.0.0.1:4000
E2E_BASE_URL=http://127.0.0.1:5173
```

3. ถ้า dev server รันอยู่แล้ว:

```bash
cd PM-Pepsi-App/frontend
set PLAYWRIGHT_SKIP_WEBSERVER=1
npm run test:e2e -- e2e/admin-tour.spec.ts
```

## เช็คลิสต์ manual

- [ ] ปุ่ม **ทัวร์ Admin** บน Admin layout เปิด tooltip ขั้น 1/14
- [ ] Progress bar และ pill `n / 14` อัปเดตเมื่อกดถัดไป
- [ ] ข้ามทัวร์ → ไม่ auto-start ครั้งถัดไป (localStorage `pm_seen_admin_tour`)
- [ ] กดถัดไปจาก Console → ไป `/admin/users` และ spotlight `[data-tour="admin-users"]`
- [ ] จบทัวร์ → toast สำเร็จ + บันทึก seen

## Unit tests

```bash
cd PM-Pepsi-App/frontend && npm test
```

ครอบคลุม `admin-tour.test.ts` และ `buildAdminTourSteps()` ผ่าน `ADMIN_TOUR_STEP_COUNT`
