import type { Pool } from 'pg'
import type { z } from 'zod'
import type {
  integrationJobItemSchema,
  integrationJobTypeSchema,
} from '../schemas/integration.js'

export type IntegrationJobItem = z.infer<typeof integrationJobItemSchema>
export type IntegrationJobType = z.infer<typeof integrationJobTypeSchema>

type JobRow = {
  id: string
  job_type: string
  status: string
  trigger_mode: string
  file_path: string | null
  file_name: string | null
  sha256: string | null
  batch_id: string | null
  summary: Record<string, unknown>
  error_text: string | null
  started_by: string | null
  started_at: Date
  finished_at: Date | null
}

export function isIntegrationTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('integration_job') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

function mapJob(row: JobRow): IntegrationJobItem {
  return {
    id: row.id,
    jobType: row.job_type as IntegrationJobType,
    status: row.status as IntegrationJobItem['status'],
    trigger: row.trigger_mode as IntegrationJobItem['trigger'],
    fileName: row.file_name,
    sha256: row.sha256,
    batchId: row.batch_id,
    summary: row.summary ?? {},
    errorText: row.error_text,
    startedBy: row.started_by,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
  }
}

export async function failStaleIntegrationJobs(pool: Pool): Promise<void> {
  await pool.query(
    `UPDATE app.integration_job
     SET status = 'failed',
         finished_at = now(),
         error_text = COALESCE(error_text, 'Stale running job (server restarted)')
     WHERE status = 'running'
       AND started_at < now() - interval '2 hours'`,
  )
}

export async function hasRunningIntegrationJob(pool: Pool): Promise<boolean> {
  const r = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM app.integration_job
       WHERE status = 'running'
         AND started_at > now() - interval '2 hours'
     ) AS ok`,
  )
  return Boolean(r.rows[0]?.ok)
}

export async function createIntegrationJob(
  pool: Pool,
  input: {
    jobType: IntegrationJobType
    trigger: 'manual' | 'schedule'
    startedBy: string | null
  },
): Promise<IntegrationJobItem> {
  const r = await pool.query<JobRow>(
    `INSERT INTO app.integration_job (job_type, status, trigger_mode, started_by, summary)
     VALUES ($1, 'running', $2, $3, '{}'::jsonb)
     RETURNING
       id::text,
       job_type,
       status,
       trigger_mode,
       file_path,
       file_name,
       sha256,
       batch_id::text,
       summary,
       error_text,
       started_by,
       started_at,
       finished_at`,
    [input.jobType, input.trigger, input.startedBy],
  )
  return mapJob(r.rows[0]!)
}

export async function finishIntegrationJob(
  pool: Pool,
  jobId: string,
  input: {
    status: IntegrationJobItem['status']
    summary: Record<string, unknown>
    errorText?: string | null
    fileName?: string | null
    sha256?: string | null
    batchId?: string | null
  },
): Promise<IntegrationJobItem> {
  const r = await pool.query<JobRow>(
    `UPDATE app.integration_job
     SET status = $2,
         summary = $3::jsonb,
         error_text = $4,
         file_name = COALESCE($5, file_name),
         sha256 = COALESCE($6, sha256),
         batch_id = COALESCE($7::bigint, batch_id),
         finished_at = now()
     WHERE id = $1::bigint
     RETURNING
       id::text,
       job_type,
       status,
       trigger_mode,
       file_path,
       file_name,
       sha256,
       batch_id::text,
       summary,
       error_text,
       started_by,
       started_at,
       finished_at`,
    [
      jobId,
      input.status,
      JSON.stringify(input.summary),
      input.errorText ?? null,
      input.fileName ?? null,
      input.sha256 ?? null,
      input.batchId ?? null,
    ],
  )
  return mapJob(r.rows[0]!)
}

export async function listIntegrationJobs(
  pool: Pool,
  limit = 50,
): Promise<IntegrationJobItem[]> {
  const r = await pool.query<JobRow>(
    `SELECT
       id::text,
       job_type,
       status,
       trigger_mode,
       file_path,
       file_name,
       sha256,
       batch_id::text,
       summary,
       error_text,
       started_by,
       started_at,
       finished_at
     FROM app.integration_job
     ORDER BY started_at DESC
     LIMIT $1`,
    [limit],
  )
  return r.rows.map(mapJob)
}

export async function getLatestIntegrationJob(pool: Pool): Promise<IntegrationJobItem | null> {
  const r = await pool.query<JobRow>(
    `SELECT
       id::text,
       job_type,
       status,
       trigger_mode,
       file_path,
       file_name,
       sha256,
       batch_id::text,
       summary,
       error_text,
       started_by,
       started_at,
       finished_at
     FROM app.integration_job
     ORDER BY started_at DESC
     LIMIT 1`,
  )
  const row = r.rows[0]
  return row ? mapJob(row) : null
}
