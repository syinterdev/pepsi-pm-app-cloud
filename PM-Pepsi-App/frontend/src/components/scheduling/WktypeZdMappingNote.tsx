import { WKTYPE_ZD_ZB_ROWS } from '@/lib/wktype-zd-mapping'
import { useTranslation } from 'react-i18next'

/** Note under wktype filter — ZD definitions from customer meeting · filter by ZB in IW37N */
export function WktypeZdMappingNote() {
  const { t } = useTranslation('scheduling')

  return (
    <details className="app-tone-info-callout mt-1 rounded-lg border px-2 py-2 text-xs">
      <summary className="cursor-pointer font-medium text-app">{t('wktype.filterNote.summary')}</summary>
      <p className="mt-1 text-app-muted">{t('wktype.mappingSource')}</p>
      <ul className="mt-2 space-y-1 pl-1 text-app">
        {WKTYPE_ZD_ZB_ROWS.map((r) => (
          <li key={r.zb}>
            {t('wktype.filterNote.item', {
              zd: r.zd,
              zdLabel: t(`wktype.zd.${r.zb}`),
              zb: r.zb,
              iw37nLabel: t(`wktype.iw37n.${r.zb}`),
            })}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-app-muted">{t('wktype.filterNote.docHint')}</p>
    </details>
  )
}
