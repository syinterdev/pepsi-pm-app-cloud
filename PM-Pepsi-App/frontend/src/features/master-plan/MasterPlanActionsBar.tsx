import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MasterPlanImportDialog } from '@/features/master-plan/MasterPlanImportDialog'
import {
  downloadMasterPlanExport,
  importMasterPlanExcel,
  publishMasterPlan,
  type MasterPlanDiscipline,
} from '@/lib/master-plan-api'
import { useMasterDataPermissions } from '@/lib/master-data-permissions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Upload, Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type Props = {
  discipline: MasterPlanDiscipline
}

export function MasterPlanActionsBar({ discipline }: Props) {
  const { t } = useTranslation('masterData')
  const { canWrite } = useMasterDataPermissions()
  const queryClient = useQueryClient()
  const [importOpen, setImportOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  const importMut = useMutation({
    mutationFn: (file: File) => importMasterPlanExcel(discipline, file),
    onSuccess: (data) => {
      setImportOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['master-plan'] })
      toast.success(
        t('masterPlan.actions.importSuccess', {
          changed: data.diff.totalRowsChanged + data.diff.totalRowsAdded + data.diff.totalRowsRemoved,
        }),
      )
    },
    onError: (err: Error) => {
      const msg = err.message.includes('STRUCTURE_MISMATCH')
        ? t('masterPlan.actions.importStructureError')
        : err.message.includes('DISCIPLINE') || err.message.includes('เป็นของ') || err.message.includes('เนื้อหา')
          ? err.message
          : err.message || t('masterPlan.actions.importFailed')
      toast.error(msg, { duration: 12_000 })
    },
  })

  const exportMut = useMutation({
    mutationFn: () => downloadMasterPlanExport(discipline, 'published'),
    onError: () => toast.error(t('masterPlan.actions.exportFailed')),
  })

  const publishMut = useMutation({
    mutationFn: () => publishMasterPlan(discipline),
    onSuccess: (data) => {
      setPublishOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['master-plan'] })
      toast.success(
        t('masterPlan.actions.publishSuccess', {
          inserted: data.tasklist.inserted,
          updated: data.tasklist.updated,
        }),
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || t('masterPlan.actions.publishFailed'), { duration: 12_000 })
    },
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={exportMut.isPending}
        onClick={() => exportMut.mutate()}
      >
        <Download className="size-3.5" aria-hidden />
        {exportMut.isPending ? t('masterPlan.actions.exporting') : t('masterPlan.actions.export')}
      </Button>

      {canWrite ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={importMut.isPending}
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3.5" aria-hidden />
            {importMut.isPending ? t('masterPlan.actions.importing') : t('masterPlan.actions.import')}
          </Button>

          <MasterPlanImportDialog
            discipline={discipline}
            open={importOpen}
            onOpenChange={setImportOpen}
            importing={importMut.isPending}
            onConfirm={(file) => importMut.mutate(file)}
          />

          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 bg-[#2f5597] text-xs text-white hover:bg-[#254878]"
            disabled={publishMut.isPending}
            onClick={() => setPublishOpen(true)}
          >
            <Send className="size-3.5" aria-hidden />
            {publishMut.isPending ? t('masterPlan.actions.publishing') : t('masterPlan.actions.publish')}
          </Button>
        </>
      ) : (
        <span className="text-xs text-app-muted">{t('masterPlan.actions.needWrite')}</span>
      )}

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('masterPlan.actions.publishConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('masterPlan.actions.publishConfirmBody', { discipline })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
              {t('masterPlan.actions.cancel')}
            </Button>
            <Button
              type="button"
              className="bg-[#2f5597] hover:bg-[#254878]"
              disabled={publishMut.isPending}
              onClick={() => publishMut.mutate()}
            >
              {t('masterPlan.actions.confirmPublish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
