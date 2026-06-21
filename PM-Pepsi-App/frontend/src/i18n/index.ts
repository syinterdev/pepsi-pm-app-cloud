import {
  DEFAULT_APP_LOCALE,
  readStoredAppLocale,
  resolveAppLocale,
  type AppLocale,
} from '@/lib/app-locale'
import enCommon from '@/i18n/locales/en/common.json'
import enHome from '@/i18n/locales/en/home.json'
import enNav from '@/i18n/locales/en/nav.json'
import enPlanning from '@/i18n/locales/en/planning.json'
import enScheduling from '@/i18n/locales/en/scheduling.json'
import enErrors from '@/i18n/locales/en/errors.json'
import enConfirmation from '@/i18n/locales/en/confirmation.json'
import enWorkOrders from '@/i18n/locales/en/workOrders.json'
import enPersonnel from '@/i18n/locales/en/personnel.json'
import enManhours from '@/i18n/locales/en/manhours.json'
import enReports from '@/i18n/locales/en/reports.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enIntegration from '@/i18n/locales/en/integration.json'
import enBoard from '@/i18n/locales/en/board.json'
import enPmVibration from '@/i18n/locales/en/pmVibration.json'
import enMasterData from '@/i18n/locales/en/masterData.json'
import enUserLog from '@/i18n/locales/en/userLog.json'
import enPortal from '@/i18n/locales/en/portal.json'
import thCommon from '@/i18n/locales/th/common.json'
import thHome from '@/i18n/locales/th/home.json'
import thNav from '@/i18n/locales/th/nav.json'
import thPlanning from '@/i18n/locales/th/planning.json'
import thScheduling from '@/i18n/locales/th/scheduling.json'
import thErrors from '@/i18n/locales/th/errors.json'
import thConfirmation from '@/i18n/locales/th/confirmation.json'
import thWorkOrders from '@/i18n/locales/th/workOrders.json'
import thPersonnel from '@/i18n/locales/th/personnel.json'
import thManhours from '@/i18n/locales/th/manhours.json'
import thReports from '@/i18n/locales/th/reports.json'
import thAdmin from '@/i18n/locales/th/admin.json'
import thIntegration from '@/i18n/locales/th/integration.json'
import thBoard from '@/i18n/locales/th/board.json'
import thPmVibration from '@/i18n/locales/th/pmVibration.json'
import thMasterData from '@/i18n/locales/th/masterData.json'
import thUserLog from '@/i18n/locales/th/userLog.json'
import thPortal from '@/i18n/locales/th/portal.json'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const I18N_STORAGE_EVENT = 'pm-app.locale-changed'

const initialLocale = resolveAppLocale(readStoredAppLocale())

void i18n.use(initReactI18next).init({
  lng: initialLocale,
  fallbackLng: DEFAULT_APP_LOCALE,
  supportedLngs: ['en', 'th'] satisfies AppLocale[],
  defaultNS: 'common',
  ns: [
    'common',
    'nav',
    'home',
    'planning',
    'scheduling',
    'confirmation',
    'workOrders',
    'errors',
    'personnel',
    'manhours',
    'reports',
    'admin',
    'integration',
    'board',
    'pmVibration',
    'masterData',
    'userLog',
    'portal',
  ],
  resources: {
    en: {
      common: enCommon,
      nav: enNav,
      home: enHome,
      planning: enPlanning,
      scheduling: enScheduling,
      confirmation: enConfirmation,
      workOrders: enWorkOrders,
      errors: enErrors,
      personnel: enPersonnel,
      manhours: enManhours,
      reports: enReports,
      admin: enAdmin,
      integration: enIntegration,
      board: enBoard,
      pmVibration: enPmVibration,
      masterData: enMasterData,
      userLog: enUserLog,
      portal: enPortal,
    },
    th: {
      common: thCommon,
      nav: thNav,
      home: thHome,
      planning: thPlanning,
      scheduling: thScheduling,
      confirmation: thConfirmation,
      workOrders: thWorkOrders,
      errors: thErrors,
      personnel: thPersonnel,
      manhours: thManhours,
      reports: thReports,
      admin: thAdmin,
      integration: thIntegration,
      board: thBoard,
      pmVibration: thPmVibration,
      masterData: thMasterData,
      userLog: thUserLog,
      portal: thPortal,
    },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export async function setAppLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'th' ? 'th' : 'en'
  }
  window.dispatchEvent(new CustomEvent(I18N_STORAGE_EVENT, { detail: locale }))
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLocale === 'th' ? 'th' : 'en'
}

export { i18n }
