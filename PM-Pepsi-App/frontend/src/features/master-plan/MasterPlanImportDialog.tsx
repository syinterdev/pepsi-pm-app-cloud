import { Badge } from '@/components/ui/badge'
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
import {
  assessMasterPlanFileForDiscipline,
  MASTER_PLAN_REFERENCE_FILES,
} from '@/lib/master-plan-discipline-guard'
import type { MasterPlanDiscipline } from '@/lib/master-plan-api'
import { AlertTriangle, FileSpreadsheet, Info } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const DISCIPLINE_TAB_LABEL: Record<MasterPlanDiscipline, string> = {
  EE: 'pm-master-ee',
  ME: 'pm-master-me',
  PK: 'pm-master-pk',
}

type Props = {
  discipline: MasterPlanDiscipline
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => void
  importing?: boolean
}

export function MasterPlanImportDialog({
  discipline,
  open,
  onOpenChange,
  onConfirm,
  importing = false,
}: Props) {
  const { t } = useTranslation('masterData')
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [confirmed, setConfirmed] = useState(false)

  const referenceFile = MASTER_PLAN_REFERENCE_FILES[discipline]
  const tabLabel = t(`tabs.${DISCIPLINE_TAB_LABEL[discipline]}` as 'tabs.pm-master-ee')

  const reset = () => {
    setFile(null)
    setBlockMessage(null)
    setWarnings([])
    setConfirmed(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const validateAndSet = (next: File | null) => {
    setFile(next)
    setConfirmed(false)
    if (!next) {
      setBlockMessage(null)
      setWarnings([])
      return
    }

    const check = assessMasterPlanFileForDiscipline(next, discipline)
    if (!check.ok) {
      if (check.reason === 'packingOnProcess') {
        setBlockMessage(
          t('masterPlan.importDialog.blockPackingOnProcess', {
            fileName: next.name,
            expectedTab: t('tabs.pm-master-pk'),
          }),
        )
      } else {
        setBlockMessage(
          t('masterPlan.importDialog.blockProcessOnPacking', {
            fileName: next.name,
            detected: check.detected ?? discipline,
            expectedTab: t(
              `tabs.${DISCIPLINE_TAB_LABEL[check.detected ?? 'EE']}` as 'tabs.pm-master-ee',
            ),
          }),
        )
      }
      setWarnings([])
      return
    }

    setBlockMessage(null)
    const nextWarnings: string[] = []
    if (check.warnings.includes('FILENAME_HINT_MISMATCH') && check.detectedHint) {
      nextWarnings.push(
        t('masterPlan.importDialog.warnFilenameHint', {
          fileName: next.name,
          detected: check.detectedHint,
          discipline,
          detectedTab: t(
            `tabs.${DISCIPLINE_TAB_LABEL[check.detectedHint]}` as 'tabs.pm-master-ee',
          ),
        }),
      )
    }
    if (check.warnings.includes('FILENAME_UNKNOWN')) {
      nextWarnings.push(
        t('masterPlan.importDialog.warnUnknownFilename', {
          fileName: next.name,
          discipline,
        }),
      )
    }
    setWarnings(nextWarnings)
  }

  const needsConfirm = warnings.length > 0
  const canSubmit = file != null && !blockMessage && (!needsConfirm || confirmed) && !importing

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('masterPlan.importDialog.title', { discipline })}</DialogTitle>
          <DialogDescription>{t('masterPlan.importDialog.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border-2 border-[#2f5597]/40 bg-[#dae3f3]/25 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#2f5597] text-white hover:bg-[#2f5597]">{discipline}</Badge>
              <span className="text-sm font-medium text-app">{tabLabel}</span>
            </div>
            <p className="mt-2 text-xs text-app-muted">{t('masterPlan.importDialog.slotNote')}</p>
            <p className="mt-2 flex items-start gap-2 text-xs text-app-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t('masterPlan.importDialog.referenceFile', { referenceFile })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="master-plan-import-file">{t('masterPlan.importDialog.pickFile')}</Label>
            <Input
              id="master-plan-import-file"
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.xlsm"
              disabled={importing}
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null
                validateAndSet(picked)
              }}
            />
            {file && !blockMessage && warnings.length === 0 ? (
              <p className="text-xs text-green-700 dark:text-green-400">
                {t('masterPlan.importDialog.fileReady', { name: file.name, discipline })}
              </p>
            ) : null}
            {blockMessage ? (
              <p className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {blockMessage}
              </p>
            ) : null}
            {warnings.map((w) => (
              <p
                key={w}
                className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {w}
              </p>
            ))}
          </div>

          {needsConfirm && !blockMessage ? (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-app">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                disabled={importing}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>{t('masterPlan.importDialog.confirmSlot', { discipline, tabLabel })}</span>
            </label>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={importing} onClick={() => handleClose(false)}>
            {t('masterPlan.actions.cancel')}
          </Button>
          <Button
            type="button"
            className="bg-[#2f5597] hover:bg-[#254878]"
            disabled={!canSubmit}
            onClick={() => {
              if (file) onConfirm(file)
            }}
          >
            {importing ? t('masterPlan.actions.importing') : t('masterPlan.importDialog.confirmImport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
