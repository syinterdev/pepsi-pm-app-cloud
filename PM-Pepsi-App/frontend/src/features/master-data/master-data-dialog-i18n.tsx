import { Button } from '@/components/ui/button'
import { DialogFooter, DialogTitle } from '@/components/ui/dialog'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

export type MasterDataFormMode = 'create' | 'edit' | 'delete'

export type MasterDataEntityKey =
  | 'department'
  | 'equipment'
  | 'functional'
  | 'reason'
  | 'worktype'
  | 'zb'
  | 'level'
  | 'position'
  | 'group'
  | 'tasklist'
  | 'workstatus'
  | 'lineproduct'
  | 'lineschdul'
  | 'zone'
  | 'machine'
  | 'material'

export function masterDataEntityDialogTitle(
  t: TFunction<'masterData'>,
  entity: MasterDataEntityKey,
  mode: MasterDataFormMode,
): string {
  return t(`entities.${entity}.${mode}`)
}

export function MasterDataEntityDialogTitle({
  entity,
  mode,
}: {
  entity: MasterDataEntityKey
  mode: MasterDataFormMode
}) {
  const { t } = useTranslation('masterData')
  return <DialogTitle>{masterDataEntityDialogTitle(t, entity, mode)}</DialogTitle>
}

export function MasterDataImportDialogTitle({ entity }: { entity: MasterDataEntityKey }) {
  const { t } = useTranslation('masterData')
  return <DialogTitle>{t(`entities.${entity}.import`)}</DialogTitle>
}

export function MasterDataConfirmDelete({
  entity,
  name,
}: {
  entity: MasterDataEntityKey
  name?: string
}) {
  const { t } = useTranslation('masterData')
  const message = name
    ? t('dialogs.confirmDeleteNamed', { name })
    : t(`entities.${entity}.confirmDelete`)
  return <p className="text-body-sm text-form-error">{message}</p>
}

export function MasterDataFormDialogFooter({
  mode,
  onCancel,
  onSubmit,
  pending,
  disabled,
}: {
  mode: MasterDataFormMode
  onCancel: () => void
  onSubmit: () => void
  pending?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation('masterData')
  const submitLabel =
    mode === 'create' ? t('actions.create') : mode === 'edit' ? t('actions.update') : t('actions.delete')
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        {t('actions.cancel')}
      </Button>
      <Button
        type="button"
        variant={mode === 'delete' ? 'destructive' : 'default'}
        disabled={disabled || pending}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </DialogFooter>
  )
}

export function MasterDataImportDialogFooter({
  onClose,
  onImport,
  pending,
}: {
  onClose: () => void
  onImport: () => void
  pending?: boolean
}) {
  const { t } = useTranslation('masterData')
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose}>
        {t('actions.close')}
      </Button>
      <Button type="button" disabled={pending} onClick={onImport}>
        {t('actions.import')}
      </Button>
    </DialogFooter>
  )
}

export function MasterDataImportResult({
  inserted,
  updated,
  failed,
  skipped,
}: {
  inserted: number
  updated: number
  failed: number
  skipped?: number
}) {
  const { t } = useTranslation('masterData')
  return (
    <p className="text-body-sm app-tone-success-icon">
      {skipped != null
        ? t('import.resultFull', { inserted, updated, failed, skipped })
        : t('import.resultShort', { inserted, updated, failed })}
    </p>
  )
}
