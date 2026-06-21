import type { Pool } from 'pg'

type DbExec = Pick<Pool, 'query'>
import {
  isTelegramBotConfigured,
  isTelegramNotifyEnabled,
  sendTelegramMessage,
} from '../lib/telegram-bot.js'
import type {
  CreateTelegramGroupBody,
  PatchTelegramGroupBody,
  TelegramGroupItem,
  TelegramLinkStatusResponse,
  TelegramSummaryResponse,
} from '../schemas/admin-telegram.js'

export function isTelegramSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_telegram_notify_group') ||
    message.includes('telegram_chat_id') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

/** GET admin telegram — คืน 200 แทน 503 เมื่อ schema ยังไม่ migrate (ลด console noise + empty UI) */
export function telegramSummaryWhenSchemaMissing(): TelegramSummaryResponse {
  return {
    botConfigured: false,
    notifyEnabled: false,
    totalGroups: 0,
    enabledGroups: 0,
    linkedTechnicians: 0,
    activeTechnicians: 0,
    wkctrGroups: [],
    pmTeams: ['A', 'B', 'EE', 'UT'],
  }
}

export function telegramLinkStatusWhenSchemaMissing(): TelegramLinkStatusResponse {
  return { linked: 0, unlinked: 0, items: [] }
}

type GroupRow = {
  id: string
  code: string
  name: string
  notify_kind: string
  link_type: string
  link_ref: string | null
  telegram_chat_id: string | null
  enabled: boolean
  note: string | null
  created_at: Date
  updated_at: Date
}

function chatIdToString(value: string | number | bigint | null | undefined): string | null {
  if (value == null || value === '') return null
  return String(value)
}

function mapGroupRow(row: GroupRow, memberWkctrs?: string[]): TelegramGroupItem {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    notifyKind: row.notify_kind as TelegramGroupItem['notifyKind'],
    linkType: row.link_type as TelegramGroupItem['linkType'],
    linkRef: row.link_ref,
    telegramChatId: row.telegram_chat_id,
    enabled: row.enabled,
    note: row.note,
    memberWkctrs,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function loadMemberWkctrs(pool: Pool, groupId: number): Promise<string[]> {
  const { rows } = await pool.query<{ wkctr: string }>(
    `SELECT wkctr FROM app.tbl_telegram_notify_group_member
     WHERE group_id = $1 ORDER BY wkctr`,
    [groupId],
  )
  return rows.map((r) => r.wkctr)
}

async function replaceMemberWkctrs(
  db: DbExec,
  groupId: number,
  wkctrs: string[] | undefined,
): Promise<void> {
  if (wkctrs === undefined) return
  const unique = [...new Set(wkctrs.map((c) => c.trim()).filter(Boolean))]
  await db.query(`DELETE FROM app.tbl_telegram_notify_group_member WHERE group_id = $1`, [groupId])
  if (unique.length === 0) return
  await db.query(
    `INSERT INTO app.tbl_telegram_notify_group_member (group_id, wkctr)
     SELECT $1, unnest($2::text[])`,
    [groupId, unique],
  )
}

export async function listTelegramGroups(pool: Pool): Promise<TelegramGroupItem[]> {
  const { rows } = await pool.query<GroupRow>(
    `SELECT id, code, name, notify_kind, link_type, link_ref, telegram_chat_id::text,
            enabled, note, created_at, updated_at
     FROM app.tbl_telegram_notify_group
     ORDER BY enabled DESC, notify_kind, code`,
  )
  const items: TelegramGroupItem[] = []
  for (const row of rows) {
    const members =
      row.link_type === 'workcenters' ? await loadMemberWkctrs(pool, Number(row.id)) : undefined
    items.push(mapGroupRow(row, members))
  }
  return items
}

export async function getTelegramGroup(pool: Pool, id: number): Promise<TelegramGroupItem | null> {
  const { rows } = await pool.query<GroupRow>(
    `SELECT id, code, name, notify_kind, link_type, link_ref, telegram_chat_id::text,
            enabled, note, created_at, updated_at
     FROM app.tbl_telegram_notify_group WHERE id = $1`,
    [id],
  )
  const row = rows[0]
  if (!row) return null
  const members =
    row.link_type === 'workcenters' ? await loadMemberWkctrs(pool, id) : undefined
  return mapGroupRow(row, members)
}

export async function createTelegramGroup(
  pool: Pool,
  body: CreateTelegramGroupBody,
): Promise<TelegramGroupItem> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<GroupRow>(
      `INSERT INTO app.tbl_telegram_notify_group
         (code, name, notify_kind, link_type, link_ref, telegram_chat_id, enabled, note)
       VALUES ($1, $2, $3, $4, $5, $6::bigint, $7, $8)
       RETURNING id, code, name, notify_kind, link_type, link_ref, telegram_chat_id::text,
                 enabled, note, created_at, updated_at`,
      [
        body.code.trim(),
        body.name.trim(),
        body.notifyKind,
        body.linkType ?? 'none',
        body.linkRef?.trim() || null,
        chatIdToString(body.telegramChatId),
        body.enabled ?? true,
        body.note?.trim() || null,
      ],
    )
    const row = rows[0]!
    const id = Number(row.id)
    await replaceMemberWkctrs(client, id, body.memberWkctrs)
    await client.query('COMMIT')
    const members =
      row.link_type === 'workcenters' ? await loadMemberWkctrs(pool, id) : undefined
    return mapGroupRow(row, members)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function patchTelegramGroup(
  pool: Pool,
  id: number,
  body: PatchTelegramGroupBody,
): Promise<TelegramGroupItem | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (body.code !== undefined) {
    fields.push(`code = $${i++}`)
    values.push(body.code.trim())
  }
  if (body.name !== undefined) {
    fields.push(`name = $${i++}`)
    values.push(body.name.trim())
  }
  if (body.notifyKind !== undefined) {
    fields.push(`notify_kind = $${i++}`)
    values.push(body.notifyKind)
  }
  if (body.linkType !== undefined) {
    fields.push(`link_type = $${i++}`)
    values.push(body.linkType)
  }
  if (body.linkRef !== undefined) {
    fields.push(`link_ref = $${i++}`)
    values.push(body.linkRef?.trim() || null)
  }
  if (body.telegramChatId !== undefined) {
    fields.push(`telegram_chat_id = $${i++}::bigint`)
    values.push(chatIdToString(body.telegramChatId))
  }
  if (body.enabled !== undefined) {
    fields.push(`enabled = $${i++}`)
    values.push(body.enabled)
  }
  if (body.note !== undefined) {
    fields.push(`note = $${i++}`)
    values.push(body.note?.trim() || null)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (fields.length > 0) {
      fields.push(`updated_at = now()`)
      values.push(id)
      const { rowCount } = await client.query(
        `UPDATE app.tbl_telegram_notify_group SET ${fields.join(', ')} WHERE id = $${i}`,
        values,
      )
      if (!rowCount) {
        await client.query('ROLLBACK')
        return null
      }
    }
    await replaceMemberWkctrs(client, id, body.memberWkctrs)
    await client.query('COMMIT')
    return getTelegramGroup(pool, id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteTelegramGroup(pool: Pool, id: number): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM app.tbl_telegram_notify_group WHERE id = $1`, [
    id,
  ])
  return (rowCount ?? 0) > 0
}

export async function getTelegramSummary(pool: Pool): Promise<TelegramSummaryResponse> {
  const counts = await pool.query<{
    total_groups: string
    enabled_groups: string
    linked_technicians: string
    active_technicians: string
  }>(
    `SELECT
       (SELECT COUNT(*)::text FROM app.tbl_telegram_notify_group) AS total_groups,
       (SELECT COUNT(*)::text FROM app.tbl_telegram_notify_group WHERE enabled) AS enabled_groups,
       (SELECT COUNT(*)::text FROM app.tbworkcenter
        WHERE telegram_chat_id IS NOT NULL AND COALESCE(workstatus, 'A') = 'A') AS linked_technicians,
       (SELECT COUNT(*)::text FROM app.tbworkcenter
        WHERE COALESCE(workstatus, 'A') = 'A') AS active_technicians`,
  )
  const c = counts.rows[0]!

  const { rows: groupRows } = await pool.query<{ wkctrgroup: string; wkctrdescription: string | null }>(
    `SELECT wkctrgroup, wkctrdescription FROM app.tbwkctrgroup ORDER BY wkctrgroup`,
  )

  return {
    botConfigured: isTelegramBotConfigured(),
    notifyEnabled: isTelegramNotifyEnabled(),
    totalGroups: Number(c.total_groups),
    enabledGroups: Number(c.enabled_groups),
    linkedTechnicians: Number(c.linked_technicians),
    activeTechnicians: Number(c.active_technicians),
    wkctrGroups: groupRows.map((g) => ({
      code: g.wkctrgroup,
      description: g.wkctrdescription,
    })),
    pmTeams: ['A', 'B', 'EE', 'UT'],
  }
}

export async function getTelegramLinkStatus(pool: Pool): Promise<TelegramLinkStatusResponse> {
  const { rows } = await pool.query<{
    wkctr: string
    wkctrdescription: string | null
    telegram_chat_id: string | null
    telegram_username: string | null
    telegram_linked_at: Date | null
  }>(
    `SELECT wkctr, wkctrdescription, telegram_chat_id::text, telegram_username, telegram_linked_at
     FROM app.tbworkcenter
     WHERE COALESCE(workstatus, 'A') = 'A'
     ORDER BY wkctr`,
  )
  const items = rows.map((r) => ({
    wkctr: r.wkctr,
    displayName: r.wkctrdescription,
    telegramChatId: r.telegram_chat_id,
    telegramUsername: r.telegram_username,
    telegramLinkedAt: r.telegram_linked_at?.toISOString() ?? null,
  }))
  const linked = items.filter((i) => i.telegramChatId).length
  return { linked, unlinked: items.length - linked, items }
}

export async function testTelegramGroupSend(
  pool: Pool,
  id: number,
  message?: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const group = await getTelegramGroup(pool, id)
  if (!group) return { ok: false, error: 'Group not found' }
  if (!group.telegramChatId) {
    return { ok: false, error: 'telegram_chat_id is empty' }
  }
  const text =
    message?.trim() ||
    `✅ PM App test — group "${group.name}" (${group.code})\nnotify_kind: ${group.notifyKind}`
  const result = await sendTelegramMessage(group.telegramChatId, text)
  if (!result.ok) return result
  return { ok: true, message: text }
}
