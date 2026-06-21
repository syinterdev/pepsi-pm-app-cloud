import { Button } from '@/components/ui/button'
import type { EngUtilizationChartRow } from '@/lib/eng-utilization-chart'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type Props = {
  people: EngUtilizationChartRow[]
  canManagePhotos: boolean
}

export function EngUtilizationMissingPhotos({ people, canManagePhotos }: Props) {
  const { t } = useTranslation('reports')
  const missing = people.filter((p) => !p.hasImage)
  if (missing.length === 0) return null

  return (
    <div className="app-callout app-callout--amber">
      <p className="text-body-sm font-medium">
        {t('engUtil.missingPhotoTitle', { count: missing.length })}
      </p>
      {canManagePhotos ? (
        <>
          <p className="mt-1 text-xs opacity-90">{t('engUtil.missingPhotoAdminHint')}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missing.slice(0, 12).map((p) => (
              <li key={p.idwkctr}>
                <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                  <Link to={`/admin/users?q=${encodeURIComponent(p.wkctr)}`}>{p.wkctr}</Link>
                </Button>
              </li>
            ))}
            {missing.length > 12 ? (
              <li className="self-center text-xs opacity-80">
                {t('engUtil.missingPhotoMore', { count: missing.length - 12 })}
              </li>
            ) : null}
            <li>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/users?photo=missing">{t('engUtil.missingPhotoOpenAdmin')}</Link>
              </Button>
            </li>
          </ul>
        </>
      ) : (
        <p className="mt-1 text-xs opacity-90">{t('engUtil.missingPhotoContactAdmin')}</p>
      )}
    </div>
  )
}
