# โครงสร้างโปรเจกต์ใหม่ (PM Web — React + Node + PostgreSQL)

เอกสารนี้สอดคล้องกับ [`skills.md`](skills.md) และใช้คู่กับโครงโปรเจกต์เก่า [`sap-legacy-STRUCTURE.md`](sap-legacy-STRUCTURE.md) / [`sap/STRUCTURE.md`](sap/STRUCTURE.md)

---

## 0) ลำดับงานที่ล็อกจาก `skills.md`

แผนเดิมใน `skills.md` เน้น **UI parity ก่อน** ด้วย mock — ทีมสามารถ **สลับลำดับ** เป็น **Database + Backend + Middleware ก่อน** เมื่อต้องการล็อกข้อมูลจริงและลด rework ฝั่ง UI โดยยังยึดสัญญา API ใน `frontend/src/api/schemas.ts` และ MSW แบบบาง

| เฟส | เป้าหมาย |
|-----|----------|
| **1 — UI / UX parity** | หน้าจอ ฟลูว์เมนู ฟอร์ม ปฏิทิน ตาราง import/export (ฝั่ง UI) ให้พฤติกรรมเดียวกับระบบ PHP เดิม — ใช้ **mock API** (เช่น MSW, fixture JSON, หรือ stub client) จนกว่า `api` พร้อม |
| **2 — API + DB** | Express: RBAC, validation (Zod), SAP Excel parser, เขียนอ่าน PostgreSQL |
| **3 — Deploy** | `docker-compose.yml` แยก `db` / `api` / `web`; ส่งมอบ offline + manifest |

**ออกแบบ DB + middleware + backend (เทียบ MySQL `sap_lay` + `db_lays.sql`):** ดู [`docs/PM-BACKEND-DATABASE-DESIGN.md`](docs/PM-BACKEND-DATABASE-DESIGN.md)

---

## 1) โครงรากโปรเจกต์ (แนะนำ — สอดคล้อง `PROJECT_ROOT` บน D:)

โฟลเดอร์หลักบนลูกค้า (ตัวอย่าง `D:/PM-Pepsi-App`) ควรมีอย่างน้อย: `frontend/` · `backend/` · `database/` — ตั้งค่า **`PROJECT_ROOT`** ใน `.env` ให้ชี้ path นี้

```
PROJECT_ROOT/                    # ตัวอย่าง D:/PM-Pepsi-App
├── .env                         # ไม่ commit — สร้างจาก .env.example
├── .env.example                 # ตัวแปรตัวอย่าง (ไม่มีความลับ)
├── docker-compose.yml           # root ของ deploy — บริการแยกคอนเทนเนอร์
├── README.md                    # คำสั่ง dev / build / deploy (ตามที่ทีมกำหนด)
│
├── frontend/                    # React (Vite) + TypeScript
├── backend/                     # Node.js (Express)
├── database/
│   └── postgres/                # bind mount ข้อมูล PG (ข้อมูลจริง — อยู่ใน .gitignore)
│
├── docs/                        # runbook, แผนผังพอร์ต, matrix สิทธิ์ (F10), ADR
├── scripts/                     # offline: manifest, checksum, ช่วย docker save/load
├── nginx/                       # (ถ้าใช้) config สำหรับ service `web`
└── skills.md                    # หรือเก็บที่ราก repo ตามที่มีอยู่
```

**หมายเหตุ:** ใน repo บนเครื่องพัฒนาอาจใช้ชื่อโฟลเดอร์เดียวกับ workspace (เช่น `sap_241163`) — บนเซิร์ฟเวอร์ลูกค้าให้ยึด **`PROJECT_ROOT`** ตามที่ตกลง

**ตำแหน่ง frontend ใน workspace นี้:** [`PM-Pepsi-App/frontend/`](PM-Pepsi-App/frontend/) — โปรเจกต์ Vite + React ตาม `skills.md` (ดู `README.md` ในโฟลเดอร์นั้น)

**ตำแหน่ง backend ใน workspace นี้:** [`PM-Pepsi-App/backend/`](PM-Pepsi-App/backend/) — Express + TypeScript (`GET /api/v1/health`); dev ใช้ proxy ใน Vite (`/api` → พอร์ต API)

---

## 2) `frontend/` — React (Vite) + TypeScript

สอดคล้องตาราง stack ใน `skills.md`: Shadcn/ui, Tailwind, Lucide, Framer Motion, Anime.js (เฉพาะจุด), DnD / gesture, React Hook Form, Sonner, React Joyride, TanStack Query, Chart.js หรือ Highcharts (ตามลิขสิทธิ์), IndexedDB ตามนโยบาย

```
frontend/
├── public/                      # static ที่ไม่ผ่าน bundler
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json              # Shadcn
├── package.json
├── package-lock.json            # lock สำหรับ offline reproducible build
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes/                  # React Router (หรือโครงเทียบเท่า)
    │
    ├── components/              # UI ใช้ซ้ำ (layout, data-table, form primitives)
    ├── ui/                      # ชิ้นส่วน Shadcn ที่ generate
    │
    ├── features/                # แยกตามโดเมน — map จากโปรเจกต์เก่า (sap/pages)
    │   ├── auth/
    │   ├── calendar/
    │   ├── work-orders/         # W_*, workorder, confirm/close
    │   ├── planning/            # M_planwork*, scheduling
    │   ├── iw37n/               # import IW37N, filter, export
    │   ├── master-data/         # equipment, zone, work centre, material, … (M_*, tb*)
    │   ├── manhours/
    │   ├── personnel/
    │   ├── reports-dashboards/
    │   └── settings/
    │
    ├── lib/
    │   ├── api-client.ts        # baseURL จาก env; interceptors
    │   ├── query-keys.ts        # TanStack Query
    │   └── utils.ts
    │
    ├── hooks/
    ├── types/                   # DTO / domain types ให้ตรงกับ API & DB
    │
    ├── mocks/                   # เฟส 1: MSW handlers — path เดียวกับ API จริงในอนาคต
    └── assets/
```

**หลักการเฟส 1:** แต่ละ `feature/*` มี route + component + query/mutation ที่เรียก **mock หรือ API จริง** ผ่าน abstraction เดียว (`lib/api-client` หรือ repository pattern) เพื่อไม่รื้อ UI เมื่อต่อ backend

---

## 3) `backend/` — Node.js (Express)

```
backend/
├── package.json
├── package-lock.json
├── tsconfig.json
├── Dockerfile                   # non-root, image เล็ก, pin base image
│
└── src/
    ├── index.ts                 # bootstrap server
    ├── app.ts                   # express app, helmet, cors, rate limit, body limit
    │
    ├── config/                  # โหลด env, validation ด้วย Zod
    ├── routes/                  # แยกตามโดเมน (auth, work-orders, imports, …)
    ├── middleware/              # auth, rbac (F10 / matrix ที่ลูกค้าอนุมัติ), audit
    ├── services/
    │   ├── sap-parser/          # Excel IW37N / GR — SHA256 ซ้ำ, whitelist MIME
    │   └── ...
    ├── db/
    │   ├── pool.ts              # pg client
    │   └── migrations/          # หรือใช้เครื่องมือ migration ที่ทีมเลือก
    └── types/
```

**Security:** Helmet, CORS แคบ, rate limit, Zod บน input; ไม่ไว้ใจ RBAC จาก UI อย่างเดียว — สอดคล้อง `skills.md` §3

---

## 4) `database/` และ Docker

| รายการ | แนวทาง |
|--------|--------|
| ข้อมูล PG บนลูกค้า | **Bind mount** `{PROJECT_ROOT}/database/postgres` |
| ภายใน network | API ใช้ **`db:5432`** |
| บน host (default repo) | **`localhost:55432`** (`POSTGRES_PORT`) เลี่ยงชนกับ Postgres/SQL อื่นบน OS |
| Migration + อ้างอิง MySQL | โฟลเดอร์ **[`database/`](../database/)** — ดู [`database/README.md`](../database/README.md) |

ไฟล์ **`docker-compose.yml`** (ราก) บริการแยกอย่างน้อย:

| Service | บทบาท |
|---------|--------|
| `db` | PostgreSQL — volume → `./database/postgres` |
| `api` | Backend Express (เมื่อมี image) |
| `web` | Static frontend + nginx (หรือเทียบเท่า) เมื่อมี build |

**ไม่** รวม DB + API + Web ในคอนเทนเนอร์เดียว

ตัวเลือก dev/support: **Adminer** — พอร์ต host default `8080` (`ADMINER_PORT`); ไม่เปิดสู่สาธารณะ

พอร์ต **`web` / `api` บน host:** ล็อกเป็น `API_PORT` / `WEB_PORT` ใน `.env.example` เมื่อนิยามใน repo (ปัจจุบัน TBD ใน `skills.md`)

---

## 5) `docs/` และ `scripts/`

| โฟลเดอร์ | ใช้ทำอะไร |
|-----------|-----------|
| `docs/` | Runbook, [`PHP-REACT-PARITY-CHECKLIST.md`](docs/PHP-REACT-PARITY-CHECKLIST.md), งานค้างแยกลำดับ [`docs/parity-pending/`](docs/parity-pending/README.md), [`PM-BACKEND-DATABASE-DESIGN.md`](docs/PM-BACKEND-DATABASE-DESIGN.md) |
| `scripts/` | สร้าง manifest ส่งมอบ offline, SHA256 ของ `.tar`, checklist หลัง `docker load` |

---

## 6) Configuration — อ้างอิง `skills.md` §5

ตัวแปรหลัก: `PROJECT_ROOT`, `POSTGRES_*`, `API_PORT`, `NODE_ENV`, auth/TLS ตามดีไซน์ — ระบุชื่อใน **`.env.example`** เท่านั้น; ค่าจริงอยู่ใน `.env` บนเซิร์ฟเวอร์ลูกค้า

---

## 7) CI / คุณภาพโค้ด (จาก `skills.md` §2)

- ESLint (FE + BE), typecheck (`tsc`), Vitest (+ Supertest ฝั่ง API ตามโครงสร้างที่ล็อก)
- ก่อน merge/release: lint + typecheck + unit test + build frontend + build backend image (ตามแผน)

---

## 8) แมปโดเมนโปรเจกต์เก่า → `frontend/src/features`

ใช้เป็นตารางอ้างอิงเวลาทำ parity UI (ไม่ครบทุกไฟล์ — ดูรายละเอียดใน `sap/pages`)

| กลุ่มในโปรเจกต์เก่า (`sap/pages`) | โฟลเดอร์แนะนำใน `features/` |
|-----------------------------------|----------------------------|
| `M_*` master / import-export | `master-data/`, `iw37n/`, `planning/` |
| `W_*` workflow / calendar / confirm | `work-orders/`, `calendar/`, `manhours/` |
| `user_*`, `member*`, `login` | `auth/` |
| `tb*` อ้างอิง WC / zone / equipment | `master-data/` |

---

## 9) ข้อจำกัดสภาพแวดล้อม (สรุปจาก `skills.md`)

- **Offline / air-gap** บน Windows Server 2019; ไม่พึ่ง pull ระหว่าง deploy ที่ลูกค้า
- **ไม่** VPN / Tailscale; **อัปเดตและซัพพอร์ต on-site** ที่โรงงาน
- อยู่ร่วมกับ SQL Server / XAMPP / MySQL / PG เดิมบน host — ยึดแผนผังพอร์ตและ `POSTGRES_PORT=55432` default

---

*เมื่อสร้างโฟลเดอร์จริงใน repo แล้ว ให้อัปเดตไฟล์นี้ให้ path ตรงกับชื่อโมดูลและสคริปต์ที่ใช้จริง*
