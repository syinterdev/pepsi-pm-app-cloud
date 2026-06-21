import type { Pool } from 'pg'
import type { TelegramGroupItem } from '../schemas/admin-telegram.js'

type TelegramLinkType = TelegramGroupItem['linkType']

export type TelegramNotifyContext = {
  pmTeam: string | null
  wkctrGroups: Set<string>
  wkctrs: Set<string>
}

type GroupRow = {
  id: string
  notify_kind: string
  link_type: string
  link_ref: string | null
  telegram_chat_id: string | null
  enabled: boolean
}

export function groupMatchesLink(
  linkType: TelegramLinkType,
  linkRef: string | null,
  memberWkctrs: string[] | undefined,
  ctx: TelegramNotifyContext,
): boolean {
  switch (linkType) {
    case 'none':
      return true
    case 'pm_team':
      return !!linkRef && linkRef === (ctx.pmTeam ?? '')
    case 'wkctrgroup':
      return !!linkRef && ctx.wkctrGroups.has(linkRef)
    case 'workcenters':
      return (memberWkctrs ?? []).some((w) => ctx.wkctrs.has(w))
    default:
      return false
  }
}

export async function loadMemberWkctrsForGroup(
  pool: Pool,
  groupId: number,
): Promise<string[]> {
  const { rows } = await pool.query<{ wkctr: string }>(
    `SELECT wkctr FROM app.tbl_telegram_notify_group_member
     WHERE group_id = $1`,
    [groupId],
  )
  return rows.map((r) => r.wkctr)
}

export async function resolveNotifyGroupChatIds(
  pool: Pool,
  notifyKind: string,
  ctx: TelegramNotifyContext,
): Promise<string[]> {
  const { rows } = await pool.query<GroupRow>(
    `SELECT id, notify_kind, link_type, link_ref, telegram_chat_id::text, enabled
     FROM app.tbl_telegram_notify_group
     WHERE notify_kind = $1 AND enabled AND telegram_chat_id IS NOT NULL`,
    [notifyKind],
  )

  const chatIds: string[] = []
  for (const row of rows) {
    const members =
      row.link_type === 'workcenters'
        ? await loadMemberWkctrsForGroup(pool, Number(row.id))
        : undefined
    if (
      groupMatchesLink(
        row.link_type as TelegramLinkType,
        row.link_ref,
        members,
        ctx,
      ) &&
      row.telegram_chat_id
    ) {
      chatIds.push(row.telegram_chat_id)
    }
  }
  return [...new Set(chatIds)]
}

export async function buildNotifyContextForWo(
  pool: Pool,
  idiw37: number,
  wkctrs: string[],
): Promise<TelegramNotifyContext> {
  const woR = await pool.query<{ team: string | null }>(
    `SELECT team FROM app.tbiw37n WHERE idiw37 = $1`,
    [idiw37],
  )
  const pmTeam = woR.rows[0]?.team?.trim() || null

  const unique = [...new Set(wkctrs.map((w) => w.trim()).filter(Boolean))]
  const groups = new Set<string>()
  if (unique.length > 0) {
    const gR = await pool.query<{ idwkctrgroup: string | null }>(
      `SELECT DISTINCT idwkctrgroup FROM app.tbworkcenter WHERE wkctr = ANY($1::text[])`,
      [unique],
    )
    for (const r of gR.rows) {
      const g = r.idwkctrgroup?.trim()
      if (g) groups.add(g)
    }
  }

  return {
    pmTeam,
    wkctrGroups: groups,
    wkctrs: new Set(unique),
  }
}
