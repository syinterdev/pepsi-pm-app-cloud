# โครงสร้างโปรเจกต์เก่า (`sap`)

> **สำเนาที่รากโปรเจกต์** — ต้นฉบับคู่กัน: [`sap/STRUCTURE.md`](sap/STRUCTURE.md) (แก้โครงสร้างแล้วควรอัปเดตทั้งสองไฟล์ให้ตรงกัน)

เอกสารนี้สรุปโครงสร้างโฟลเดอร์และแนวทางการทำงานของแอป PHP เดิม (Preventive maintenance / planning / work order ที่เชื่อมกับข้อมูล SAP ผ่านไฟล์ เช่น IW37N) ใช้อ้างอิงตอนย้ายไปสถาปัตยกรรมใหม่ตาม `skills.md`

---

## 1) สรุปเทคโนโลยี

| ชั้น | รายละเอียด |
|------|-------------|
| ภาษา / เซิร์ฟเวอร์ | PHP (แบบ monolith ฝัง HTML), รันบนเว็บเซิร์ฟเวอร์ที่รองรับ PHP + MySQL (เช่น XAMPP) |
| ฐานข้อมูล | **MySQL** — การเชื่อมต่อหลักใน `include/connection.php` (mysqli `$link` + PDO `$bdd` สำหรับส่วนปฏิทิน) |
| Excel | **PhpSpreadsheet** (`composer.json` → `phpoffice/phpspreadsheet`) |
| PDF | โฟลเดอร์ `mypdf-master/` (ชุด mPDF / FPDI ฯลฯ ผ่าน Composer ย่อย) |
| UI เทมเพลต | **Start Bootstrap — SB Admin** (`package.json`, โฟลเดอร์ `src/` + `scripts/` สำหรับ build Pug/SCSS) |
| ส่วนหน้า | Bootstrap 4, jQuery, DataTables, Chart.js, bootstrap-select ฯลฯ — ส่วนหนึ่งอยู่ใน `pages/js`, `pages/css` และ CDN ใน `index.php` / `index2.php` |
| ปลั๊กอิน | `plugins/` (เช่น fileinput, sweetalert, jquery, fontawesome-free) |

---

## 2) จุดเข้าแอปและการโหลดหน้า

| ไฟล์ | บทบาท |
|------|--------|
| `index.php` | Shell หลัก: `session_start`, include `connection.php`, `function.php`, `define.php` — โหลดเนื้อหาจาก `pages/{module}.php` โดยค่าเริ่มต้น `module=line_calendar` |
| `index2.php` | Shell แบบเดียวกัน (มี `function_calc_birthday.php` เพิ่ม) — ค่าเริ่มต้น `module=content` |

พารามิเตอร์ **`?module=ชื่อไฟล์`** (ไม่มี `.php`) จะ map เป็น **`sap/pages/ชื่อไฟล์.php`** (เมื่อรันจากโฟลเดอร์ `sap/`)

ตัวอย่าง: `index2.php?module=login` → `pages/login.php`

เมนูด้านข้าง (`pages/left_menu.php`) ดึงจากตาราง **`tbmenu`** และกรองสิทธิ์จาก `$_SESSION['UserST']` เทียบกับฟิลด์สิทธิ์ในเมนู

---

## 3) โครงสร้างโฟลเดอร์ระดับบนสุด

```
sap/
├── index.php                 # entry หลัก (default module: line_calendar)
├── index2.php                # entry สำรอง / โหมดที่ใช้ login-logout ในเมนู
├── composer.json             # PhpSpreadsheet
├── package.json              # SB Admin build (Bootstrap 4 template)
│
├── include/                  # config, DB, ฟังก์ชันกลาง
├── pages/                    # โมดูลหน้าหลัก (~200+ ไฟล์ .php)
├── modalPages/               # ฟรagment สำหรับ modal / AJAX / แท็บย่อย (~37 ไฟล์)
│
├── uploads/                  # ไฟล์อัปโหลด (รวม .xls จาก SAP / PM)
├── download/                 # ไฟล์ส่งออกหรือดาวน์โหลด (ตามการใช้งาน)
├── img/                      # รูปทั่วไป (เช่น favicon/logo)
├── imgComfirm/               # รูปยืนยันงาน (สะกดชื่อโฟลเดอร์ตามโค้ดเดิม)
├── imgMember/                # รูปผู้ใช้/สมาชิก
│
├── assets/                   # สินทรัพย์เพิ่มเติม (เช่น charts_canvasjs)
├── js/                       # สคริปต์ระดับราก (ถ้ามี)
├── calendar/                 # สคริปต์/ตัวอย่างปฏิทิน (PHP + SQL + ตัวอย่าง xlsx)
├── plugins/                  # ปลั๊กอิน jQuery / fileinput / sweetalert ฯลฯ
├── scripts/                  # Node scripts สำหรับ build SB Admin (clean, build-*, start)
├── src/                      # ซอร์สเทมเพลต SB Admin: pug, scss, js, assets
│
├── vendor/                   # Composer — PhpSpreadsheet + dependencies
├── mypdf-master/             # โปรเจกต์ย่อยสำหรับ PDF (vendor ภายใน)
└── STRUCTURE.md              # เอกสารโครงสร้าง (สำเนาที่ราก: sap-legacy-STRUCTURE.md)
```

---

## 4) โฟลเดอร์สำคัญ (รายละเอียด)

### `sap/include/` (7 ไฟล์ .php)

| ไฟล์ | หน้าที่โดยสังเขป |
|------|-------------------|
| `connection.php` | ค่า host / user / password / database name; `connect_db()` → `$link` (mysqli); PDO `$bdd` สำหรับส่วนที่ใช้ PDO |
| `define.php` | ค่าคงที่ระบบ (`SYS`, `COMPANY`, timezone `Asia/Bangkok`, รหัสโรงงาน `Factory_code`, สีสถานะย้ายข้ามเดือนจาก `tbwkstatus` ฯลฯ) |
| `function.php` | ฟังก์ชันกลางของระบบ |
| `function_calc_birthday.php` | คำนวณอายุ/เกิด (ใช้กับ `index2.php`) |
| `Update_iw37.php` | อัปเดตข้อมูลชุด IW37N |
| `jquery_fileinput.php` | ช่วยอัปโหลดไฟล์กับปลั๊กอิน |
| `define_bk*.php` | สำเนา config สำรอง |

> **ความปลอดภัย:** อย่า commit credential จริงจาก `connection.php` ลง Git — โปรเจกต์ใหม่ควรใช้ `.env` และค่าเริ่มต้นใน `.env.example` เท่านั้น

### `sap/pages/`

โฟลเดอร์หลักของทุกหน้าที่โหลดผ่าน `?module=...` รวมทั้ง layout ย่อย:

- **`navbar.php`**, **`left_menu.php`**, **`footer.php`** — โครง UI
- **การตั้งชื่อแบบกลุ่ม (ไม่ครบทุกไฟล์):**
  - **`M_*.php`** — จัดการ master / import-export / หน้าจอบริหาร (เช่น `M_iw37n.php`, `M_equipment.php`, `M_planwork_*.php`, `M_manhour_*`, `M_personel_*`)
  - **`W_*.php`** — workflow ฝั่งงาน / ปฏิทิน / manhour / ยืนยันปิดงาน (เช่น `W_calendar.php`, `W_confirm_*`, `W_planwork_view*.php`)
  - **`tb*.php`** — ฟอร์ม/ตารางอ้างอิง work centre, zone, equipment, functional location ฯลฯ
  - **`user_*.php`**, **`member*.php`**, **`login.php`**, **`register.php`** — ผู้ใช้และสมาชิก
  - **`iw37n.php`** — เกี่ยวกับรายงาน/ชุด IW37N
  - **`calendar.php`**, **`workorder.php`**, **`charts.php`** — หน้าฟีเจอร์รวม
  - **ไฟล์ `*_bk*.php`**, **`Test_*.php`**, **`test_*.php`** — สำรองหรือทดสอบ — พิจารณาไม่ยกไป production ใหม่แบบตรงๆ
- **`pages/js/`**, **`pages/css/`**, **`pages/assets/`** — สไตล์และสคริปต์เฉพาะหน้า + vendor ที่ copy มาแทน CDN บางส่วน

### `sap/modalPages/`

โหลดเป็นส่วนย่อย / modal (แท็บ work order, แผน, ปิดงาน, อัปโหลดรูป, filter, autocomplete ฯลฯ) ใช้คู่กับหน้าใน `pages/`

### `sap/uploads/`

เก็บไฟล์ Excel และไฟล์ที่ผู้ใช้อัปโหลดจากการใช้งานจริง — ใน repo อาจมีตัวอย่าง `.xls` ควรกันไม่ให้ข้อมูลจริงของลูกค้ารั่วในระบบควบคุมเวอร์ชัน

### `sap/vendor/`

ผลลัพธ์ `composer install` — หลักคือ **PhpSpreadsheet** สำหรับอ่าน/เขียน Excel

### `sap/mypdf-master/`

โปรเจกต์ย่อยสำหรับสร้าง PDF (mPDF และ dependency)

### `sap/scripts/` + `sap/src/`

- **`src/`** — ซอร์ส SB Admin: `pug/`, `scss/`, `js/`, `assets/`
- **`scripts/`** — `build-*.js`, `clean.js`, `start.js` — pipeline ของเทมเพลต (โปรเจกต์รัน PM จริงมักใช้ `pages/css/styles.css` ที่ build แล้วมากกว่ารัน npm บนเซิร์ฟเวอร์)

### `sap/calendar/`

สคริปต์ PHP ตัวอย่างปฏิทิน (`addEvent.php`, `editEvent*.php`), `bdd.php`, `calendar.sql`, ตัวอย่าง `*.xlsx`

### `sap/plugins/`

ชุดปลั๊กอิน front-end (fileinput, sweetalert, jquery, fontawesome ฯลฯ) — บางโฟลเดอร์มี `composer.json` / `package.json` ของตัวเอง

---

## 5) การอ้างอิงธุรกิจจากโค้ด

- ชื่อระบบ/บริษัทใน `define.php`: Planning / PM–CM, รหัสโรงงานใน `$Factory_code`
- เมนูและสิทธิ์ผูกกับ **MySQL** ตาราง `tbmenu` และ session (`UserST`, `username`, `mem_id` ฯลฯ)
- ข้อมูล SAP มักเข้าเป็นชุด **IW37N** (ไฟล์ Excel) และโมดูล import/update ที่เกี่ยวข้องใน `pages/M_*`, `include/Update_iw37.php`

---

## 6) สถิติไฟล์โดยประมาณ (อ้างอิงขณะจัดทำเอกสาร)

| พื้นที่ | จำนวน .php (ประมาณ) |
|---------|----------------------|
| `sap/pages/` | ~204 |
| `sap/modalPages/` | ~37 |
| `sap/include/` | 7 |
| รวม `sap/vendor/` | จำนวนมาก (third-party; ไม่ต้องทำความเข้าใจทีละไฟล์) |

---

## 7) แนวทางเมื่อย้ายไปโปรเจกต์ใหม่ (ตาม `skills.md`)

| หัวข้อในโปรเจกต์เก่า | ทิศทางใหม่ที่สอดคล้องเอกสารโครงการ |
|----------------------|--------------------------------------|
| หน้าเดียว `?module=` + PHP ฝัง HTML | แยก **React (Vite) + Express API** |
| MySQL (`sap_lay`) | **PostgreSQL** เป็นฐานหลักของแอป PM (ยกเว้น SRS กำหนดอย่างอื่น) |
| Session + `tbmenu` | **RBAC ฝั่ง API** + โครงเมนูใน frontend |
| PhpSpreadsheet บน PHP | Parser/import บน **Node.js** + validation (เช่น Zod) + checksum ไฟล์ |
| CDN ใน index | สำหรับ **offline** ควร vendor ทุกอย่างใน bundle หรือ image |

---

*จัดทำจากการสแกนโครงสร้างจริงภายใต้ `sap/` — หากเพิ่มไฟล์ใหม่ให้อัปเดตตารางและจำนวนในเอกสารนี้เป็นครั้งคราว*
