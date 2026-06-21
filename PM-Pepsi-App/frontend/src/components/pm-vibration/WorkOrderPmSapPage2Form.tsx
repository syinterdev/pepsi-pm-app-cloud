import type { WoPmExecution, WoPmPage2Form } from '@/api/schemas'
import { SapPrintFormBrandLogo } from '@/components/pm-vibration/SapPrintFormBrandLogo'
import { WorkOrderPmCommentThread } from '@/components/scheduling/WorkOrderPmCommentThread'
import { putWorkOrderPmPage2 } from '@/lib/api-public'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './sap-wo-print-form.css'

type Props = {
  orderId: string | null
  wkorder: string
  pmExecution?: WoPmExecution
  page2Form?: WoPmPage2Form
  canWrite: boolean
  onSaved?: () => void
}

const emptyPage2: WoPmPage2Form = {
  activityReportWkctr: null,
  completedByName: null,
  closedDate: null,
  signatureText: null,
  signatureAt: null,
  signatureAction: null,
  equipmentOk: null,
}

function displayAuto(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed || '—'
}

export function WorkOrderPmSapPage2Form({
  orderId,
  wkorder,
  pmExecution,
  page2Form,
  canWrite,
  onSaved,
}: Props) {
  const { t } = useTranslation('pmVibration')
  const enabled = Boolean(orderId && canWrite && pmExecution?.canEdit)
  const form = page2Form ?? emptyPage2

  const [equipmentOk, setEquipmentOk] = useState<'' | 'Y' | 'N'>(form.equipmentOk ?? '')

  useEffect(() => {
    setEquipmentOk(form.equipmentOk ?? '')
  }, [form.equipmentOk, orderId])

  const equipmentMut = useMutation({
    mutationFn: (value: 'Y' | 'N') => {
      if (!orderId) return Promise.reject(new Error('NO_ORDER'))
      return putWorkOrderPmPage2(orderId, { equipmentOk: value })
    },
    onSuccess: () => onSaved?.(),
  })

  const dotted = 'sap-wo-print__input sap-wo-print__input--left w-full'
  const readOnly = `${dotted} cursor-default`

  const handleEquipmentChange = (value: 'Y' | 'N') => {
    if (!enabled || !orderId) return
    setEquipmentOk(value)
    equipmentMut.mutate(value)
  }

  return (
    <section className="sap-wo-print" aria-label={t('page2.sectionAria')}>
      <div className="sap-wo-print__top">
        <div>
          <span className="sap-wo-print__wo-label">{t('formHeader.workOrder')}:</span>{' '}
          <span className="sap-wo-print__wo-number">{wkorder || '—'}</span>
        </div>
        <SapPrintFormBrandLogo />
      </div>
      <p className="sap-wo-print__meta">{t('page2.metaLine')}</p>

      <hr className="sap-wo-print__rule" />

      <p className="sap-wo-print__longtext-title">{t('page2.title')}</p>

      <div className="sap-wo-print__row sap-wo-print__row--stack">
        <span>{t('page2.comments')}:</span>
        {orderId && pmExecution ? (
          <WorkOrderPmCommentThread
            orderId={orderId}
            pmExecution={{
              ...pmExecution,
              canEdit: enabled,
            }}
            onSaved={() => onSaved?.()}
            variant="inline"
          />
        ) : (
          <p className="text-xs text-neutral-600">{t('page2.selectWoHint')}</p>
        )}
      </div>

      <p className="sap-wo-print__meta text-center">{t('page2.damageCodesNote')}</p>

      <div className="sap-wo-print__row">
        <label className="sap-wo-print__pair flex items-center gap-2">
          <span>{t('page2.activityReport')}:</span>
          <input
            className={readOnly}
            value={displayAuto(form.activityReportWkctr)}
            readOnly
            tabIndex={-1}
            aria-readonly
          />
        </label>
        <label className="sap-wo-print__pair sap-wo-print__pair--right flex items-center gap-2">
          <span>{t('page2.completedBy')}:</span>
          <input
            className={readOnly}
            value={displayAuto(form.completedByName)}
            readOnly
            tabIndex={-1}
            aria-readonly
          />
        </label>
      </div>

      <div className="sap-wo-print__row">
        <label className="sap-wo-print__pair flex items-center gap-2">
          <span>{t('page2.date')}:</span>
          <input
            className={readOnly}
            value={displayAuto(form.closedDate)}
            readOnly
            tabIndex={-1}
            aria-readonly
          />
        </label>
        <label className="sap-wo-print__pair sap-wo-print__pair--right flex items-center gap-2">
          <span>{t('page2.signature')}:</span>
          <input
            className={readOnly}
            value={displayAuto(form.signatureText)}
            readOnly
            tabIndex={-1}
            aria-readonly
          />
        </label>
      </div>

      <p className="text-xs text-neutral-500">{t('page2.autoFieldsHint')}</p>

      <hr className="sap-wo-print__rule" />

      <div className="sap-wo-print__row sap-wo-print__row--stack">
        <p>{t('page2.equipmentQuestion')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name={`equipment-ok-${orderId ?? 'none'}`}
              checked={equipmentOk === 'Y'}
              disabled={!enabled || equipmentMut.isPending}
              onChange={() => handleEquipmentChange('Y')}
            />
            Y
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name={`equipment-ok-${orderId ?? 'none'}`}
              checked={equipmentOk === 'N'}
              disabled={!enabled || equipmentMut.isPending}
              onChange={() => handleEquipmentChange('N')}
            />
            N
          </label>
          {equipmentMut.isPending ? (
            <span className="text-xs text-neutral-500">{t('page2.savingEquipment')}</span>
          ) : null}
        </div>
      </div>
    </section>
  )
}
