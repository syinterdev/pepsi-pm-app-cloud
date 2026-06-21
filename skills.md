โปรแกรมนี้เป็นโปรแกรม preventive maintenance web application ของ บริษัท เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง จำกัด
จัดทำโดย บริษัท เอส.วาย. อินเตอร์แอคทีฟ ดีเวลลอปเมนท์ จำกัด (S.Y. Interactive Development Limited)

#
server  ของทางลูกค้าเป็นแบบ offline ไม่มีการเชื่อมต่อ internet
เราต้องทำการพัฒนาให้เสร็จแล้วนำไปติดตั้ง
จัดเก็บในไดร์ D เพราะไดร์ C ลูกค้าใกล้เต็มแล้วต้องการใช้พื้นที่ 300G ไม่รวม backup ที่เราจะทำเป็นระบบ auto backup
server ลูกค้าคือ Windows Server 2019 Standard
- Processor: intel xeon silver 4214 CPU@2.20Ghz 219Ghz(2peocessors)
Ram: 32Gb
System type: 64bit
Drive C: Free 211GB
Drive D: Free 1.23TB

***ภายในมี 
SQL Server2008,2016
Xammp Server
Mysql
PostgreSQL*** ที่ทำงานอยู่ ณ ตอนนี้

Theme/Skin จากลูกค้า
ลูกค้าต้องการ
Base color โทนสีขาว ส้ม ฟ้า เขียว (ล่าสุดของ บ.เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง จำกัด)

สามารถ cutomize เปลี่ยนแปลงโลโก้ของ application ได้

**คู่มือ UI ฉบับเต็ม (wireframe, ตารางสี hex, ก่อน/หลัง, motion):** [`skill-theme.md`](skill-theme.md) — §11 Admin Console wireframe · §12 token map · §13 ก่อน/หลัง

***อันดับแรกให้ทำ frontend ของโปรเจคใหม่ ให้ทุก function, component ทำงานได้เหมือนโปรเจคเก่าก่อน***

### สัญญา API และ MSW (ล็อก contract — หลีกเลี่ยง logic ระบบจริงใน mock)

เมื่อพัฒนา frontend ก่อน backend ให้ถือข้อตกลงนี้เพื่อไม่ให้ phase หลัง refactor แพงเกินจำเป็น

| หลักการ | ทำอย่างไรใน repo นี้ |
|---------|----------------------|
| **ล็อก shape ของ request/response** | นิยามด้วย Zod ใน [`PM-Pepsi-App/frontend/src/api/schemas.ts`](PM-Pepsi-App/frontend/src/api/schemas.ts) — path ใช้ prefix **`/api/v1/...`** ให้ตรงกับที่ Express จะ implement ภายหลัง |
| **Mock บาง — ไม่ใช่ backend จำลอง** | Handlers ใน [`PM-Pepsi-App/frontend/src/mocks/handlers.ts`](PM-Pepsi-App/frontend/src/mocks/handlers.ts) คืน JSON ผ่าน [`jsonFromSchema.ts`](PM-Pepsi-App/frontend/src/mocks/jsonFromSchema.ts) (`safeParse` กับ Zod) — ถ้า fixture คลาดจาก schema จะ throw ตอน dev; ทำได้แค่ delay, กรอง fixture, HTTP status พื้นฐาน |
| **ห้าม** ซ้อนกฎธุรกิจหนักใน MSW | ไม่ใส่ workflow หลายขั้น, RBAC จริง, validation ซับซ้อน, หรือ logic ที่ต้องซิงค์กับ SAP/DB — ส่วนนั้นไว้ที่ **Node/Express + PostgreSQL** |
| **UI เรียก API ชั้นเดียว** | ใช้ client / TanStack Query ชุดเดียวกันทั้งตอน mock และ production (สลับด้วย base URL หรือ env) — component ไม่แยก logic ว่า “ตอนนี้เป็น mock” |

### สีและโลโก้ตามบรีฟลูกค้า (Pepsi)

- **พาเลตต์หลัก:** แดง — ขาว — น้ำเงิน  
- **รูปทรงโลโก้:** วงกลม แบ่งครึ่งด้วยแถบสี**ขาว**ตรงกลาง — ด้านบนเป็น**แดง** ด้านล่างเป็น**น้ำเงิน** (เมื่อมีไฟล์ vector/PNG จากลูกค้า ให้ใช้เป็นต้นทางสุดท้ายแทนการประมาณเฉดจากเอกสาร)

**ความหมายของสีและองค์ประกอบ (ตามบรีฟลูกค้า):**

| องค์ประกอบ | ความหมายที่ใช้สื่อสาร |
|------------|------------------------|
| สีแดง | พลังงาน ความหลงใหล และความกระตือรือร้น |
| สีน้ำเงิน | ความสดชื่น ความลึกซึ้ง และความน่าเชื่อถือ |
| สีขาว | ความบริสุทธิ์ และเป็นตัวเชื่อมความสมดุล |
| รูปทรงวงกลม | โลก สนามแม่เหล็กโลก และเส้นศูนย์สูตร |

1) สรุปสถาปัตยกรรม (Logical + Docker)
1.1 โครงสร้าง logical
- **Frontend:** React (Vite) — เรียก API ผ่าน HTTPS (หรือ HTTP ภายในเมื่ออยู่หลัง reverse proxy ตามนโยบายลูกค้า)
- **Backend:** Node.js (Express) — RBAC, validation, นำเข้า/แปลงไฟล์ SAP, เขียนอ่าน PostgreSQL
- **Database:** PostgreSQL — ฐานข้อมูลหลักของแอป PM (ไม่ใช้ SQL Server / MySQL ของ XAMPP เป็นค่าเริ่มต้นของแอป นอกจากมีข้อตกลง SRS เป็นอย่างอื่น)
- **แผน migration + middleware + backend (เทียบระบบเก่า):** [`docs/PM-BACKEND-DATABASE-DESIGN.md`](docs/PM-BACKEND-DATABASE-DESIGN.md) — อ้างอิง MySQL `sap_lay`, [`sap/db_lays.sql`](sap/db_lays.sql), [`sap/include/connection.php`](sap/include/connection.php)

1.2 โมเดล Docker (โปรเจกต์เดียว หลายบริการ)
- ใช้ **ไฟล์ `docker-compose.yml` ชุดเดียว** เป็น “root” ของการ deploy — ภายในมี **บริการแยกคอนเทนเนอร์** อย่างน้อย:
  - `db` — PostgreSQL
  - `api` — Backend (เมื่อมี image/โค้ดพร้อม)
  - `web` — Frontend static ผ่าน nginx หรือเทียบเท่า (เมื่อมี build พร้อม)
- **ไม่** รวม DB + API + Web ใน **คอนเทนเนอร์เดียว** (ลดความเสี่ยง, อัปเดตเป็นอิสระ, สอดคล้องแนวทาง Docker)
- คอนเทนเนอร์ใน compose เดียวกันใช้ **Docker network เดียวกัน** — API ต่อ DB ด้วยชื่อ service (เช่น `db`) และพอร์ตภายในมาตรฐานของ Postgres

1.3 การจัดเก็บบนไดรฟ์ D:
| รายการ | แนวทาง |
|--------|--------|
| Docker Engine / Desktop disk image | ตั้งค่าใน Docker Desktop ให้เก็บ disk image บน **D:** (ลดการใช้พื้นที่ C:) |
| ข้อมูล PostgreSQL ของแอป PM | **Bind mount** ไปที่ **`{PROJECT_ROOT}/database/postgres`** บน D: — โฟลเดอร์หลักเดียวรวม `database` / `backend` / `frontend` (ตั้ง `PROJECT_ROOT` ใน `.env`) |
| ไฟล์ส่งมอบ offline | เก็บชุด `.tar`, manifest, checksum บน D: หรือสื่อถอดได้ตามข้อตกลงลูกค้า |

1.4 พอร์ตเริ่มต้นใน repo (ล็อกให้ตรงกับ `docker-compose.yml` / `.env.example`)

| บริการ | พอร์ตภายในคอนเทนเนอร์ | พอร์ตบน host (default) | หมายเหตุ |
|--------|----------------------|-------------------------|----------|
| PostgreSQL (`db`) | `5432` | **`55432`** (`POSTGRES_PORT`) | แอป/ไคลเอนต์บน host (เช่น GUI, migration ทดสอบ) ใช้ `localhost:55432` |
| Adminer (optional) | `8080` | **`8080`** (`ADMINER_PORT`) | เฉพาะ dev/support — เปลี่ยนพอร์ตได้ถ้าชน |

ภายใน Docker network เดียวกัน backend ยังต่อ DB ที่ **`db:5432`** (ไม่ใช้ 55432).

2) Technology Stack (ตารางรวม)

| Category | Component | Technology Stack | Details / Custom Features (ภาษาไทย) | Owner |
|----------|-----------|------------------|--------------------------------------|--------|
| Core Framework | Frontend Framework | React Latest (Vite) | ประสิทธิภาพสูง, HMR ระหว่างพัฒนา | S.Y. Interactive Development Limited |
| Language | Type Safety | TypeScript | ลดข้อผิดพลาดในข้อมูลใบงาน/เครื่องจักร | S.Y. Interactive Development Limited |
| UI & Styling | Design System | Shadcn/ui | UI มาตรฐาน ปรับธีมได้ | S.Y. Interactive Development Limited |
| UI & Styling | CSS Framework | Tailwind CSS | Responsive เดสก์ท็อป/มือถือ | S.Y. Interactive Development Limited |
| UI & Styling | Icons | Lucide React | ไอคอนเบา สอดคล้อง Shadcn | S.Y. Interactive Development Limited |
| Animations | Smooth Transitions | Framer Motion | Transition หน้าจอ / Modal | S.Y. Interactive Development Limited |
| Animations | Micro-Interactions | Anime.js | Animation เฉพาะจุดที่ต้องการประสิทธิภาพสูง | S.Y. Interactive Development Limited |
| Interactions | Gestures & DnD | React-use-gesture / Dnd-kit | ลากวางบนปฏิทิน, รองรับทัช | S.Y. Interactive Development Limited |
| UX Technique | Perceived Speed | Skeleton Screens | ลดความรู้สึกรอข้อมูลจาก SAP | S.Y. Interactive Development Limited |
| UX Technique | Instant Feedback | Optimistic UI | ตอบสนองทันทีแล้วซิงก์หลังบ้าน | S.Y. Interactive Development Limited |
| Forms | Form handling | React Hook Form | แบบฟอร์มประสิทธิภาพ ลด re-render | S.Y. Interactive Development Limited |
| Feedback | Toasts | Sonner | แจ้งผลการทำงานมาตรฐานในแอป | S.Y. Interactive Development Limited |
| Onboarding | Guided tour | React Joyride | แนะนำผู้ใช้รอบแรก (ตามแผน UX) | S.Y. Interactive Development Limited |
| Data & State | State Management | TanStack Query (React Query) | Cache และ sync กับ API | S.Y. Interactive Development Limited |
| Visualization | Dashboard Charts | Highcharts / Chart.js | KPI, utilization, backlog | S.Y. Interactive Development Limited |
| Offline Strategy | Local Storage | IndexedDB | แคชรูป/ประวัติในเครื่องช่าง เมื่อเน็ตหรือเซิร์ฟเวอร์ไม่พร้อม | S.Y. Interactive Development Limited |
| Backend & API | Runtime & Gateway | Node.js (Express) | API หลัก, RBAC enforcement, เชื่อม DB | S.Y. Interactive Development Limited |
| Backend & API | SAP Data Parser | Custom Node.js Parser | แปลง Excel SAP; ตรวจไฟล์ซ้ำด้วย SHA256 | S.Y. Interactive Development Limited |
| Database | Core DB | PostgreSQL | ฐานข้อมูลหลักของแอป; ข้อมูลบน **D:** ที่ `{PROJECT_ROOT}/database/postgres` | S.Y. Interactive Development Limited |
| Code Quality | Linting | ESLint | มาตรฐานโค้ด FE/BE | S.Y. Interactive Development Limited |
| Quality & CI | Pipeline | Lint + typecheck + unit test + build | เกณฑ์ก่อน merge/release ตามแผนโครงการ | S.Y. Interactive Development Limited |
| Testing (แนะนำ) | Unit / integration | Vitest (FE/BE ตามโครงสร้าง repo) + Supertest หรือเทียบเท่าสำหรับ API | รายละเอียด lock กับทีมเมื่อเริ่ม repo แอปจริง | S.Y. Interactive Development Limited |
| Infrastructure | Deployment | Docker Compose + `docker save` / `docker load` | ส่งมอบ offline; image ระบุ tag/digest ใน manifest | S.Y. Interactive Development Limited |
| Dev DB Tool (optional) | Admin UI | Adminer | เฉพาะสภาพพัฒนา/ซัพพอร์ต ไม่เปิดสู่สาธารณะ | S.Y. Interactive Development Limited |



## 3) Security & Cybersecurity

หลักการ: **defense in depth** — ยืนยันตัวตนและสิทธิ์ที่เซิร์ฟเวอร์, ลดพื้นที่โจมตีของคอนเทนเนอร์, ควบคุมข้อมูลอ่อนไหว, รองรับ **air-gap**

**การเข้าถึงเครือข่าย:** โครงการนี้ **ไม่** ใช้ VPN หรือ Tailscale — ลูกค้าไม่เปิดทาง remote จากอินเทอร์เน็ตเข้าเซิร์ฟเวอร์; ผู้ใช้และผู้ดูแลเข้าผ่านเครือข่ายภายในโรงงานตามที่ลูกค้ากำหนด

**การอัปเดตและซัพพอร์ต:** ดำเนินการ **on-site ที่โรงงานเท่านั้น** — รวมการติดตั้งเวอร์ชันใหม่ แก้ไขปัญหา และ handover ตามขั้นตอนที่ตกลง (ไม่ remote เข้าเซิร์ฟเวอร์จากภายนอก ยกเว้นมีข้อตกลง SRS เป็นอย่างอื่น)

| Category | Component | Technology / Practice | Details (ภาษาไทย) | Owner |
|----------|-----------|----------------------|---------------------|--------|
| Access Control | Authentication & RBAC | Backend RBAC (F10) + รูปแบบ auth ที่ลูกค้าอนุมัติ | ตรวจทุก API ฝั่ง Express; ไม่ไว้ใจ UI อย่างเดียว | S.Y. Interactive Development Limited |
| Secrets | Credentials | `.env` / ระบบ secret ลูกค้า | ไม่ commit secret; ใช้ `.env.example` เป็นตัวอย่าง | S.Y. Interactive Development Limited |
| Transport | TLS | HTTPS / TLS termination | การเข้ารหัสระหว่าง client–server ใน production | S.Y. Interactive Development Limited |
| API Hardening | Express | Helmet, CORS แคบ, rate limit, จำกัดขนาด body/upload | ลด misconfiguration และการโจมตีเชิงปริมาณ | S.Y. Interactive Development Limited |
| Input & Files | Validation | Zod (หรือเทียบเท่า) + whitelist ชนิดไฟล์ + ขนาดสูงสุด | คู่ SHA256; พิจารณาสแกนมัลแวร์ตามนโยบายลูกค้า | S.Y. Interactive Development Limited |
| Frontend | Browser | CSP, หลีกเลี่ยง HTML ดิบ | ลด XSS; ตั้ง CSP ให้สอดคล้อง proxy | S.Y. Interactive Development Limited |
| Session | Tokens | HttpOnly Secure cookie หรือ JWT อายุสั้น + refresh | ตามดีไซน์ auth ที่ล็อก | S.Y. Interactive Development Limited |
| Database | PostgreSQL | Least privilege, รหัสแข็ง, จำกัดโฮสต์/พอร์ต | ไม่ใช้ superuser ในแอป | S.Y. Interactive Development Limited |
| Audit | Logging | Audit trail กิจกรรมสำคัญ | login, import, confirm WO, แก้ข้อมูลสำคัญ — ระยะเวลาเก็บตามลูกค้า | S.Y. Interactive Development Limited |
| Supply Chain | Dependencies | Lockfile + audit ใน CI | ลดความเสี่ยงแพ็กเกจ | S.Y. Interactive Development Limited |
| Container | Hardening | Non-root, image เล็ก, pin tag/digest | ระบุในเอกสารส่งมอบ | S.Y. Interactive Development Limited |
| Offline Delivery | Integrity | Manifest + SHA256 ของ `.tar` | ตรวจสอบก่อน `docker load` | S.Y. Interactive Development Limited |
| Network | Perimeter | Firewall + การแบ่งโซนเครือข่ายภายในโรงงาน | **ไม่** ใช้ VPN หรือ Tailscale — ลูกค้าไม่เปิดทาง remote เข้าเซิร์ฟเวอร์จากอินเทอร์เน็ต; เปิดเฉพาะพอร์ตจำเป็นภายใน perimeter ที่ตกลง | S.Y. Interactive Development Limited |
| Client cache | IndexedDB | เก็บขั้นต่ำ, นโยบายล้าง | PDPA / นโยบายโรงงาน | S.Y. Interactive Development Limited |
| Operations | Runbook | Monitoring, alert, rollback | สอดคล้อง phase go-live / handover | S.Y. Interactive Development Limited |

4) Deploy บนเซิร์ฟเวอร์ลูกค้า (Offline + ไดรฟ์ D: + โฮสต์ที่มีบริการอื่น)
4.1 ขั้นตอนส่งมอบแบบ offline (สรุป)

1. บนเครื่อง build ที่มีเน็ต: build/pull image → `docker save` เป็นไฟล์ `.tar` ต่อ image (หรือรวมเป็นชุดตามขั้นตอนที่ตกลง)
2. สร้าง **manifest**: ชื่อ image, tag, digest (ถ้ามี), เวอร์ชันแอป, วันที่ build
3. คำนวณ **SHA256** ของแต่ละไฟล์ `.tar` และบันทึกใน manifest
4. ที่ลูกค้า: ตรวจแฮช → `docker load` → วาง `docker-compose.yml` + `.env` → `docker compose up -d` **โดยไม่ pull**

4.2 การอยู่ร่วมกับ SQL Server / XAMPP / PostgreSQL เดิม

- แอป PM ใช้ **PostgreSQL ในคอนเทนเนอร์** เป็นค่าเริ่มต้น — **ไม่สับสนกับ instance อื่นบนเครื่อง**
- **ชนกันที่พอร์ต host:** repo ตั้ง **พอร์ต host เริ่มต้นเป็น `55432`** (`POSTGRES_PORT`) เพื่อเลี่ยง Postgres/SQL อื่นที่มักใช้ `5432` บน OS — ถ้ายังชน ให้เปลี่ยนค่าใน `.env` และบันทึกใน runbook
- **Dev บน host โดยติดตั้ง PostgreSQL เอง:** ถ้า `5432` ถูก instance เดิม (เช่น PostgreSQL 11 ของโปรเจกต์อื่น) ใช้แล้ว ให้ตั้ง instance สำหรับแอป PM ให้ฟังพอร์ตว่าง (เช่น **`5433`**) ใน `postgresql.conf` แล้วใส่พอร์ตนั้นใน `DATABASE_URL` / DBeaver — ไม่จำเป็นต้องปิด PG 11
- XAMPP มักใช้ 80/443/3306 — ตรวจสอบว่าไม่ชนกับพอร์ตที่ใช้ serve frontend หรือ reverse proxy
- SQL Server ใช้พอร์ตของตัวเอง (เช่น 1433) — โดยทั่วไปไม่ชน Postgres แต่ต้องบันทึกในแผนผังพอร์ตของลูกค้า

4.3 ตารางพอร์ต (ค่า default ใน repo )

| บริการ | พอร์ตภายใน Docker | พอร์ตบน host (default repo) | หมายเหตุ |
|--------|-------------------|-----------------------------|----------|
| PostgreSQL (แอป PM) | 5432 | **`55432`** (`POSTGRES_PORT`) | คอนเทนเนอร์อื่นใน compose ใช้ `db:5432`; จากเครื่อง host ใช้ `localhost:55432` |
| Adminer (optional dev) | 8080 | **`8080`** (`ADMINER_PORT`) | เปลี่ยนได้ถ้าชน |
| Frontend / reverse proxy | — | **TBD** (เช่น 3000 ตาม F12) | เพิ่มเมื่อมี service `web` / nginx |
| Backend API | — | **TBD** หรือ internal-only | เพิ่มเมื่อมี service `api` |

 5) Configuration & Secrets (หมวดที่ต้องมีใน `.env` — ไม่ใส่ค่าลับในเอกสารนี้)

| หมวด | ตัวอย่างตัวแปร (ไม่ระบุค่าจริง) | หมายเหตุ |
|------|-------------------------------|----------|
| โฟลเดอร์หลักโปรเจกต์ | `PROJECT_ROOT` | path เดียวบน **D:** ที่มี `database/`, `backend/`, `frontend/` (ตัวอย่างลูกค้า `D:/PM-Pepsi-App`) |
| Database | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | ข้อมูล PG อยู่ที่ `{PROJECT_ROOT}/database/postgres`; default **`POSTGRES_PORT=55432`** |
| App | `API_PORT`, `NODE_ENV`, connection string ภายใน compose | ล็อกตอนมี repo แอป |
| Auth | ค่าที่เกี่ยวกับ JWT/session/AD | ตามดีไซน์ที่ลูกค้าอนุมัติ |
| TLS | path หรือตัวแปรสำหรับ reverse proxy | ถ้า terminate ที่ลูกค้า |

---

**โครงสร้างโปรเจกต์ใหม่ (โฟลเดอร์ / เฟสงาน / Docker):** ดู [`PROJECT-STRUCTURE.md`](PROJECT-STRUCTURE.md)

