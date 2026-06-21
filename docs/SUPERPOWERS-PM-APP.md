# ใช้ Superpowers กับโปรเจกต์ PM Pepsi

โฟลเดอร์ [`superpowers-main/`](../superpowers-main/) คือ **Superpowers v5** — ชุด skills + workflow สำหรับ agent (brainstorm → plan → TDD → review)

---

## ติดตั้งใน Cursor (แนะนำ)

### วิธีที่ 1 — Marketplace (ง่ายสุด · มี hook อัตโนมัติ)

ใน **Agent chat** พิมพ์:

```text
/add-plugin superpowers
```

หรือเปิด **Cursor Settings → Plugins → Marketplace** แล้วค้นหา `superpowers`

หลังติดตั้ง ทุก session ใหม่จะโหลด skill `using-superpowers` อัตโนมัติ (ผ่าน session hook)

### วิธีที่ 2 — ใช้ copy ใน repo นี้ (อัปเดตตาม git)

Repo มี `superpowers-main/` อยู่แล้ว — agent อ่าน skill จาก path นี้ได้โดยตรง:

```text
superpowers-main/skills/<ชื่อ-skill>/SKILL.md
```

ไฟล์ [`AGENTS.md`](../AGENTS.md) ที่ root บอก agent ให้ทำตาม workflow นี้

ถ้าต้องการให้ Cursor โหลด plugin จากโฟลเดอร์ local (ถ้า UI รองรับ): เลือกโฟลเดอร์ `superpowers-main` ตอน Install plugin from disk

---

## Workflow สำหรับงาน PM App

| สถานการณ์ | Skill ที่ใช้ | ผลลัพธ์ |
|-----------|-------------|---------|
| ฟีเจอร์ใหม่ / ลูกค้าขอเพิ่ม | `brainstorming` | สเปกใน `docs/superpowers/specs/` |
| อนุมัติแนวทางแล้ว | `writing-plans` | แผนใน `docs/superpowers/plans/` |
| ลงมือทำ | `executing-plans` หรือ `subagent-driven-development` | PR / commit ตามที่ผู้ใช้สั่ง |
| แก้บั๊ก production | `systematic-debugging` | root cause ก่อนแก้ |
| ก่อนบอกว่าเสร็จ | `verification-before-completion` | รัน test/build จริง |
| UI polish ตาม checklist | อ่าน `UI-POLISH-PHASES.md` + `writing-plans` | tick `[x]` ใน doc |

### แมปกับเอกสารโปรเจกต์

| Superpowers | เอกสาร PM |
|-------------|-----------|
| brainstorming | `docs/customer-requirements/`, `MEETING-MINUTES.md` |
| writing-plans | `docs/WORK-PHASES.md`, `parity-pending/` |
| verification | `PM-Pepsi-App/frontend` vitest, backend `npm test` |
| ส่งมอบลูกค้า | `docs/USER-MANUAL-TH.md` |

---

## ตัวอย่างคำสั่งใน Cursor Agent

**ฟีเจอร์ใหม่**

```text
ใช้ superpowers brainstorming ออกแบบหน้า demo online สำหรับลูกค้าทดสอบ
แล้ว writing-plans ลง docs/superpowers/plans/
```

**แก้บั๊ก**

```text
ใช้ systematic-debugging ไล่ /settings โหลด users ไม่ได้
อย่าแก้จนกว่ารู้ root cause
```

**UI polish รายการเดียว**

```text
ทำรายการ U3 print/export ใน UI-POLISH-PHASES.md
scope เฉพาะ PM-Pepsi-App/frontend แล้ว verification-before-completion
```

---

## Skills ที่ใช้บ่อยในโปรเจกต์นี้

| Skill | path |
|-------|------|
| using-superpowers | `superpowers-main/skills/using-superpowers/` |
| brainstorming | `superpowers-main/skills/brainstorming/` |
| writing-plans | `superpowers-main/skills/writing-plans/` |
| executing-plans | `superpowers-main/skills/executing-plans/` |
| systematic-debugging | `superpowers-main/skills/systematic-debugging/` |
| test-driven-development | `superpowers-main/skills/test-driven-development/` |
| verification-before-completion | `superpowers-main/skills/verification-before-completion/` |

---

## สิ่งที่ Superpowers **ไม่** แทน

- ไม่แทน **เอกสารลูกค้า** ใน `from customer/` — ยังต้องอ่าน requirement จริง
- ไม่แทน **migration DB** — ยังต้องรัน `database/migrations` เอง
- ไม่ commit/push ให้ — ตามกฎโปรเจกต์ ต้องสั่งชัด

---

## อัปเดต Superpowers

- Marketplace: อัปเดต plugin ใน Cursor Settings
- Copy ใน repo: `git pull` ที่ upstream `obra/superpowers` หรือแทนที่โฟลเดอร์ `superpowers-main/`

---

## อ้างอิง

- [Superpowers README](../superpowers-main/README.md)
- [AGENTS.md](../AGENTS.md) — คำสั่งถาวรสำหรับ agent ใน repo นี้
