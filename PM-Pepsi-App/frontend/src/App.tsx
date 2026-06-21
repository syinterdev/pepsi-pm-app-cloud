import { AppShell } from '@/components/layout/AppShell'
import { GuestOnly, NavRouteGuard, RequireAuth, RequireRole } from '@/features/auth/AuthGuards'
import { LoginPage } from '@/features/auth/LoginPage'
import { LogoutPage } from '@/features/auth/LogoutPage'
import { BacklogPage } from '@/features/backlog/BacklogPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { HttpErrorPage } from '@/features/errors/HttpErrorPage'
import { HomePage } from '@/features/home/HomePage'
import { IntegrationPage } from '@/features/integration/IntegrationPage'
import { Iw37nPage } from '@/features/iw37n/Iw37nPage'
import { ManhoursHrPage } from '@/features/manhours/ManhoursHrPage'
import { ManhoursPage } from '@/features/manhours/ManhoursPage'
import { WorktimePage } from '@/features/manhours/WorktimePage'
import { MasterDataPage } from '@/features/master-data/MasterDataPage'
import { MasterPlanPage } from '@/features/master-plan/MasterPlanPage'
import { PersonnelPage } from '@/features/personnel/PersonnelPage'
import { PlanCalendarPage } from '@/features/plan-calendar/PlanCalendarPage'
import { PlanningPage } from '@/features/planning/PlanningPage'
import { ConfirmationPage } from '@/features/confirmation/ConfirmationPage'
import { ActivityLogPage } from '@/features/reports/ActivityLogPage'
import { AuditorHubPage } from '@/features/reports/AuditorHubPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SummaryWeeklyChartFullPage } from '@/features/reports/SummaryWeeklyChartFullPage'
import { SummaryWeeklyPage } from '@/features/reports/SummaryWeeklyPage'
import {
  AdminAboutPage,
  AdminAnnouncementsPage,
  AdminAuditPage,
  AdminBackupPage,
  AdminBrandingPage,
  AdminConsolePage,
  AdminHealthPage,
  AdminLayout,
  AdminMasterHubPage,
  AdminMenuPage,
  AdminRolesPage,
  AdminSecurityPage,
  AdminSettingsPage,
  AdminTelegramPage,
  AdminUsersPage,
} from '@/features/admin'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { UserLogPage } from '@/features/user-log/UserLogPage'
import { EngineeringBoardPage } from '@/features/board/EngineeringBoardPage'
import { WorkOrdersPage } from '@/features/work-orders/WorkOrdersPage'
import { PmVibrationPage } from '@/features/pm-vibration/PmVibrationPage'
import { PortalPage } from '@/features/portal/PortalPage'
import { UiPlaygroundPage } from '@/features/dev/UiPlaygroundPage'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/error/:code" element={<HttpErrorPage />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/board" element={<EngineeringBoardPage />} />
      <Route element={<RequireAuth />}>
        <Route path="portal" element={<PortalPage />} />
        <Route path="summary-weekly/chart/full" element={<SummaryWeeklyChartFullPage />} />
        <Route element={<AppShell />}>
          <Route element={<NavRouteGuard />}>
          <Route index element={<HomePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="calendar/wc/:code" element={<CalendarPage />} />
          <Route path="plan-calendar" element={<PlanCalendarPage />} />
          <Route path="line-calendar" element={<Navigate to="/plan-calendar" replace />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="work-orders/:id" element={<WorkOrdersPage />} />
          <Route path="pm-vibration" element={<PmVibrationPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
          <Route path="confirmation/export" element={<Navigate to="/confirmation" replace />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="integration" element={<IntegrationPage />} />
          <Route path="iw37n" element={<Iw37nPage />} />
          <Route path="master-plan" element={<MasterPlanPage />} />
          <Route path="master-data" element={<MasterDataPage />} />
          <Route path="manhours" element={<ManhoursPage />} />
          <Route path="manhours/admin" element={<Navigate to="/manhours" replace />} />
          <Route path="worktime" element={<WorktimePage />} />
          <Route path="personnel" element={<PersonnelPage />} />
          <Route path="personnel/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="personnel/confirm" element={<Navigate to="/confirmation" replace />} />
          <Route path="reports" element={<Outlet />}>
            <Route index element={<ReportsPage />} />
            <Route path="audit" element={<AuditorHubPage />} />
          </Route>
          <Route path="activity-log" element={<ActivityLogPage />} />
          <Route path="manhours-hr" element={<ManhoursHrPage />} />
          <Route path="summary-weekly" element={<SummaryWeeklyPage />} />
          <Route path="user-log" element={<UserLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {import.meta.env.DEV ? (
            <Route path="dev/ui" element={<UiPlaygroundPage />} />
          ) : null}
          <Route
            path="admin"
            element={
              <RequireRole role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminConsolePage />} />
            <Route path="branding" element={<AdminBrandingPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="master" element={<AdminMasterHubPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="health" element={<AdminHealthPage />} />
            <Route path="backup" element={<AdminBackupPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="telegram" element={<AdminTelegramPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="about" element={<AdminAboutPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
          </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HttpErrorPage forcedCode={404} />} />
    </Routes>
  )
}
