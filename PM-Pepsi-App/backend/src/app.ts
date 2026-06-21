import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { Pool } from 'pg'
import { registerAuthRoutes } from './routes/auth.js'
import { registerNavRoutes } from './routes/nav.js'
import { registerProfileRoutes } from './routes/profile.js'
import { registerDashboardRoutes } from './routes/dashboard.js'
import { registerPlanningRoutes } from './routes/planning.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerBacklogRoutes } from './routes/backlog.js'
import { registerCalendarRoutes } from './routes/calendar.js'
import { registerIw37nRoutes } from './routes/iw37n.js'
import { registerIntegrationRoutes } from './routes/integration.js'
import { registerMasterDataRoutes } from './routes/master-data.js'
import { registerMasterPlanRoutes } from './routes/master-plan.js'
import { registerSchedulingRoutes } from './routes/scheduling.js'
import { registerWorkOrderRoutes } from './routes/work-orders.js'
import { registerManhoursRoutes } from './routes/manhours.js'
import { registerPersonnelRoutes } from './routes/personnel.js'
import { registerReportsRoutes } from './routes/reports.js'
import { registerNotificationRoutes } from './routes/notifications.js'
import { registerAdminBrandingRoutes } from './routes/admin-branding.js'
import { registerAdminSettingsRoutes } from './routes/admin-settings.js'
import { registerAdminAuditRoutes } from './routes/admin-audit.js'
import { registerAdminHealthRoutes } from './routes/admin-health.js'
import { registerAdminUsersRoutes } from './routes/admin-users.js'
import { registerAdminRolesRoutes } from './routes/admin-roles.js'
import { registerAdminMenuRoutes } from './routes/admin-menu.js'
import { registerAdminBackupRoutes } from './routes/admin-backup.js'
import { registerAdminAnnouncementRoutes } from './routes/admin-announcement.js'
import { registerAnnouncementsRoutes } from './routes/announcements.js'
import { registerAdminSecurityRoutes } from './routes/admin-security.js'
import { registerAdminAboutRoutes } from './routes/admin-about.js'
import { registerAdminTelegramRoutes } from './routes/admin-telegram.js'
import { registerTelegramRoutes } from './routes/telegram.js'
import { registerBoardActivityRoutes } from './routes/board-activity.js'
import { registerBoardPmReadingsRoutes } from './routes/board-pm-readings.js'
import { registerPmReadingsRoutes } from './routes/pm-readings.js'
import { registerBoardKioskRoutes } from './routes/board-kiosk.js'
import { registerSettingsRoutes } from './routes/settings.js'
import { registerUserPrefRoutes } from './routes/user-pref.js'
import { registerUsersRoutes } from './routes/users.js'
import { registerPortalRoutes } from './routes/portal.js'
import { createMaintenanceMiddleware } from './middleware/maintenance-mode.js'
import { createUploadSizeGuard } from './middleware/enforce-upload-size.js'
import { registerBlockedIpGuard } from './middleware/blocked-ip.js'
import { registerApiMetrics } from './middleware/api-metrics.js'
import { rateLimitOptionsFromEnv, registerRateLimiters } from './middleware/rate-limit.js'

export function createApp(opts: {
  pool: Pool
  corsOrigin?: string
  sessionSecret: string
  databaseUrl: string
}): Express {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))

  if (opts.corsOrigin) {
    app.use(
      cors({
        origin: opts.corsOrigin,
        credentials: true,
      }),
    )
  }

  registerBlockedIpGuard(app, opts.pool)
  registerRateLimiters(app, opts.pool, rateLimitOptionsFromEnv())
  registerApiMetrics(app)
  app.use(createUploadSizeGuard(opts.pool))
  app.use(createMaintenanceMiddleware(opts.pool, opts.sessionSecret))

  registerHealthRoutes(app, opts.pool)
  registerSettingsRoutes(app, opts.pool)
  registerBoardKioskRoutes(app, opts.pool, opts.sessionSecret)
  registerBoardActivityRoutes(app, opts.pool, opts.sessionSecret)
  registerBoardPmReadingsRoutes(app, opts.pool, opts.sessionSecret)
  registerPmReadingsRoutes(app, opts.pool, opts.sessionSecret)
  registerAuthRoutes(app, opts.pool, opts.sessionSecret)
  registerPortalRoutes(app, opts.pool, opts.sessionSecret)
  registerUserPrefRoutes(app, opts.pool, opts.sessionSecret)
  registerUsersRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminBrandingRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminSettingsRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminAuditRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminHealthRoutes(app, opts.pool, opts.sessionSecret, opts.databaseUrl)
  registerAdminUsersRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminRolesRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminMenuRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminBackupRoutes(app, opts.pool, opts.sessionSecret, opts.databaseUrl)
  registerAdminAnnouncementRoutes(app, opts.pool, opts.sessionSecret)
  registerAnnouncementsRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminSecurityRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminAboutRoutes(app, opts.pool, opts.sessionSecret)
  registerAdminTelegramRoutes(app, opts.pool, opts.sessionSecret)
  registerTelegramRoutes(app, opts.pool, opts.sessionSecret)
  registerNavRoutes(app, opts.pool, opts.sessionSecret)
  registerProfileRoutes(app, opts.pool, opts.sessionSecret)
  registerMasterDataRoutes(app, opts.pool, opts.sessionSecret)
  registerMasterPlanRoutes(app, opts.pool, opts.sessionSecret)
  registerWorkOrderRoutes(app, opts.pool, opts.sessionSecret)
  registerSchedulingRoutes(app, opts.pool, opts.sessionSecret)
  registerDashboardRoutes(app, opts.pool, opts.sessionSecret)
  registerPlanningRoutes(app, opts.pool, opts.sessionSecret)
  registerCalendarRoutes(app, opts.pool, opts.sessionSecret)
  registerBacklogRoutes(app, opts.pool, opts.sessionSecret)
  registerIw37nRoutes(app, opts.pool, opts.sessionSecret)
  registerIntegrationRoutes(app, opts.pool, opts.sessionSecret)
  registerManhoursRoutes(app, opts.pool, opts.sessionSecret)
  registerPersonnelRoutes(app, opts.pool, opts.sessionSecret)
  registerReportsRoutes(app, opts.pool, opts.sessionSecret)
  registerNotificationRoutes(app, opts.pool, opts.sessionSecret)

  return app
}
