# ลำดับที่ 1 — Auth / Shell / RBAC

**สถานะรวม:** เสร็จ (แกน parity) · 2026-05-16  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Checklist หลัก:** [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) §3.6, แถว `login.php`, `logout.php`, `left_menu.php`, `footer.php`  
**Migration:** `001`, `008` · **Seed:** `009` · **Import:** [`import-auth-from-mysql.ps1`](../../database/scripts/import-auth-from-mysql.ps1)

---

## ทำแล้ว (ครบแกนลำดับ 1)

### Auth & session
- [x] `POST/GET /api/v1/auth/login` — workcenter + member (`mode`)
- [x] `POST/GET /api/v1/auth/logout`, `GET /api/v1/auth/me`
- [x] บันทึก login/logout → `tbworkcenter_userlog` / `tbl_system_userlog` · อ่าน `GET /api/v1/user-log` → หน้า `/user-log` (เทียบ `M_UserLog.php`)
- [x] JWT + HttpOnly cookie, `RequireAuth` / `GuestOnly` / `NavRouteGuard`
- [x] bcrypt + legacy plain (อัปเกรด hash หลัง login)

### เมนู
- [x] `app.tbmenu` + `GET /api/v1/nav/menu`
- [x] สคริปต์นำเข้าจาก MySQL → `database/seeds/generated/import_tbmenu_pg.sql`
- [x] Sidebar จาก API (fallback `nav-config`)

### Shell
- [x] [`AppFooter.tsx`](../../PM-Pepsi-App/frontend/src/components/layout/AppFooter.tsx) — เทียบ `footer.php`
- [x] Route `/logout` — [`LogoutPage.tsx`](../../PM-Pepsi-App/frontend/src/features/auth/LogoutPage.tsx)
- [x] Login แท็บ Work center / สมาชิก (login-bk)

### โปรไฟล์
- [x] `GET /api/v1/auth/profile` — อายุ/อายุงาน (`timespan`), ข้อมูล member (bank ฯลฯ)
- [x] แท็บโปรไฟล์ใน `/settings` — [`ProfilePanel.tsx`](../../PM-Pepsi-App/frontend/src/features/settings/ProfilePanel.tsx)
- [x] `POST /api/v1/auth/change-password` — เทียบ `member_change_password_process.php` (WC + member, bcrypt, ล้าง `pass_must_change`)
- [x] [`ChangePasswordForm.tsx`](../../PM-Pepsi-App/frontend/src/features/settings/ChangePasswordForm.tsx) ในแท็บโปรไฟล์

### ข้อมูลทดสอบ
- [x] [`009_dev_auth_seed.sql`](../../database/seeds/009_dev_auth_seed.sql) — ADMIN01/admin, WC001/wc001, demo/demo

---

## ยังไม่ทำ (นอกขอบเขต “แกนเสร็จ”)

- [ ] Navbar แบบ `navbar.php` (รูป, dropdown เต็ม)

## บัญชี `member` vs Work center (ขั้นที่ 4)

| ชั้น | พฤติกรรม |
|------|----------|
| Login | `mode=member` → `tbl_member`; `mode=workcenter` → `tbworkcenter` |
| เมนู | กรอง `menuright` + RBAC `permissions` — member มักได้ `userst=U` ไม่เห็นเมนู Admin (`menuright: A`) |
| API Admin | `/api/v1/admin/*` ต้องมี permission เช่น `admin.users.read` — member ทั่วไป **403** |
| API ธุรกิจ | ตาม role ใน `tbl_role_permission` (เช่น planner `planning.assign`, technician ไม่มี `/iw37n`) |
| เปลี่ยนรหัสผ่าน | ผู้ใช้ล็อกอินเองที่ `/settings` — ไม่จำกัด account type |

ไม่มี middleware แยก “member ห้ามทุก route” แบบ global — ใช้ **RBAC per route** แทน (เทียบ PHP ที่กรองเมนูตาม `UserST` / สิทธิ์เมนู)

---

## เกณฑ์ §3 — Auth (ติ๊กใน checklist หลัก §3.6)

- [x] **3.1 UI** — login, logout, เมนู, footer, โปรไฟล์อ่านได้
- [x] **3.2 ข้อมูล** — session fields หลักใน Zod + PG
- [x] **3.3 กฎธุรกิจ** — menuright, bcrypt, userlog in/out
- [x] **3.4 Modal** — ไม่มี modal auth หลักใน PHP (ข้าม)
- [x] **3.5 ทดสอบ** — MSW + manual กับ PG

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ |
| 2026-05-16 | tbmenu API, bcrypt, member, /logout |
| 2026-05-16 | import script, seed 009, footer, profile — **สถานะรวม → เสร็จ (แกน)** |
| 2026-05-21 | ขั้นที่ 4 — `POST /api/v1/auth/change-password` + UI ใน `/settings` |
