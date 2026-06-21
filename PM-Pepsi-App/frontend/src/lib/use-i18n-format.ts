import { appLocaleToBcp47, type AppLocale } from '@/lib/app-locale'
import { enUS, th } from 'date-fns/locale'
import enFullCalendar from '@fullcalendar/core/locales/en-gb'
import thFullCalendar from '@fullcalendar/core/locales/th'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export function useI18nFormat() {
  const { i18n } = useTranslation()
  const locale = (i18n.language === 'th' ? 'th' : 'en') as AppLocale

  return useMemo(
    () => ({
      locale,
      bcp47: appLocaleToBcp47(locale),
      dateFns: locale === 'th' ? th : enUS,
      fullCalendar: locale === 'th' ? thFullCalendar : enFullCalendar,
    }),
    [locale],
  )
}
