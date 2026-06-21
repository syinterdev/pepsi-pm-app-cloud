import type {
  CreateTelegramGroupBody,
  TelegramGroupItem,
  TelegramLinkType,
  TelegramNotifyKind,
} from '@/api/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type TelegramGroupFormState = {
  code: string
  name: string
  notifyKind: TelegramNotifyKind
  linkType: TelegramLinkType
  linkRef: string
  telegramChatId: string
  enabled: boolean
  note: string
  memberWkctrsText: string
}

const selectClass =
  'flex h-10 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 text-body-sm text-app focus-app-ring focus-visible:outline-none'

const NOTIFY_KINDS: TelegramNotifyKind[] = [
  'ack_to_planner',
  'close_to_planner',
  'ack_summary',
  'confirm_reminder',
  'custom',
  'assignment_to_tech',
]

const LINK_TYPES: TelegramLinkType[] = ['none', 'wkctrgroup', 'pm_team', 'workcenters']

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: TelegramGroupItem | null
  form: TelegramGroupFormState
  onFormChange: (patch: Partial<TelegramGroupFormState>) => void
  wkctrGroupOptions: { code: string; description?: string | null }[]
  pmTeamOptions: string[]
  saving: boolean
  onSave: () => void
  notifyKindLabel: (kind: TelegramNotifyKind) => string
  linkTypeLabel: (lt: TelegramLinkType) => string
}

function Fieldset({
  legend,
  children,
}: {
  legend: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-app/60 bg-app-subtle/25 p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-app-muted">
        {legend}
      </legend>
      {children}
    </fieldset>
  )
}

export function TelegramGroupDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  wkctrGroupOptions,
  pmTeamOptions,
  saving,
  onSave,
  notifyKindLabel,
  linkTypeLabel,
}: Props) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? t('telegram.editGroup') : t('telegram.addGroup')}
          </DialogTitle>
          <DialogDescription>{t('telegram.dialogDesc')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Fieldset legend={t('telegram.fieldset.identity')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="tg-code">{t('telegram.field.code')}</Label>
                <Input
                  id="tg-code"
                  value={form.code}
                  onChange={(e) => onFormChange({ code: e.target.value })}
                  disabled={!!editing || saving}
                  placeholder="PLANNER_ACK"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="tg-name">{t('telegram.field.name')}</Label>
                <Input
                  id="tg-name"
                  value={form.name}
                  onChange={(e) => onFormChange({ name: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>
          </Fieldset>

          <Fieldset legend={t('telegram.fieldset.routing')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="tg-kind">{t('telegram.field.notifyKind')}</Label>
                <select
                  id="tg-kind"
                  className={selectClass}
                  value={form.notifyKind}
                  onChange={(e) =>
                    onFormChange({ notifyKind: e.target.value as TelegramNotifyKind })
                  }
                  disabled={saving}
                >
                  {NOTIFY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {notifyKindLabel(k)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="tg-link-type">{t('telegram.field.linkType')}</Label>
                <select
                  id="tg-link-type"
                  className={selectClass}
                  value={form.linkType}
                  onChange={(e) =>
                    onFormChange({
                      linkType: e.target.value as TelegramLinkType,
                      linkRef: '',
                    })
                  }
                  disabled={saving}
                >
                  {LINK_TYPES.map((lt) => (
                    <option key={lt} value={lt}>
                      {linkTypeLabel(lt)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.linkType === 'wkctrgroup' ? (
              <div className="grid gap-1">
                <Label htmlFor="tg-link-ref">{t('telegram.field.wkctrGroup')}</Label>
                <select
                  id="tg-link-ref"
                  className={selectClass}
                  value={form.linkRef}
                  onChange={(e) => onFormChange({ linkRef: e.target.value })}
                  disabled={saving}
                >
                  <option value="">—</option>
                  {wkctrGroupOptions.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.code}
                      {g.description ? ` — ${g.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {form.linkType === 'pm_team' ? (
              <div className="grid gap-1">
                <Label htmlFor="tg-pm-team">{t('telegram.field.pmTeam')}</Label>
                <select
                  id="tg-pm-team"
                  className={selectClass}
                  value={form.linkRef}
                  onChange={(e) => onFormChange({ linkRef: e.target.value })}
                  disabled={saving}
                >
                  <option value="">—</option>
                  {pmTeamOptions.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {form.linkType === 'workcenters' ? (
              <div className="grid gap-1">
                <Label htmlFor="tg-wkctrs">{t('telegram.field.memberWkctrs')}</Label>
                <Textarea
                  id="tg-wkctrs"
                  rows={3}
                  value={form.memberWkctrsText}
                  onChange={(e) => onFormChange({ memberWkctrsText: e.target.value })}
                  placeholder="PAC006, PAC007"
                  disabled={saving}
                />
              </div>
            ) : null}
          </Fieldset>

          <Fieldset legend={t('telegram.fieldset.delivery')}>
            <div className="grid gap-1">
              <Label htmlFor="tg-chat">{t('telegram.field.chatId')}</Label>
              <Input
                id="tg-chat"
                value={form.telegramChatId}
                onChange={(e) => onFormChange({ telegramChatId: e.target.value })}
                disabled={saving}
                placeholder="-1001234567890"
              />
              <p className="text-xs text-app-muted">{t('telegram.field.chatIdHint')}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[var(--app-accent)]"
                checked={form.enabled}
                onChange={(e) => onFormChange({ enabled: e.target.checked })}
                disabled={saving}
              />
              {t('telegram.field.enabled')}
            </label>
            <div className="grid gap-1">
              <Label htmlFor="tg-note">{t('telegram.field.note')}</Label>
              <Textarea
                id="tg-note"
                rows={2}
                value={form.note}
                onChange={(e) => onFormChange({ note: e.target.value })}
                disabled={saving}
              />
            </div>
          </Fieldset>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || !form.code.trim() || !form.name.trim()}
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
            {tc('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function formToTelegramGroupBody(form: TelegramGroupFormState): CreateTelegramGroupBody {
  const body: CreateTelegramGroupBody = {
    code: form.code.trim(),
    name: form.name.trim(),
    notifyKind: form.notifyKind,
    linkType: form.linkType,
    linkRef: form.linkRef.trim() || null,
    telegramChatId: form.telegramChatId.trim() || null,
    enabled: form.enabled,
    note: form.note.trim() || null,
  }
  if (form.linkType === 'workcenters') {
    body.memberWkctrs = [
      ...new Set(
        form.memberWkctrsText
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ]
  }
  return body
}
