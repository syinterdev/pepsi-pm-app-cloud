import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Pool } from 'pg'
import { withIntegrationAdvisoryLock } from '../lib/integration-lock.js'
import { importConfirmFile } from './confirmation.js'
import {
  createIntegrationJob,
  failStaleIntegrationJobs,
  finishIntegrationJob,
  getLatestIntegrationJob,
  hasRunningIntegrationJob,
  type IntegrationJobItem,
} from './integration-job.js'
import {
  archiveInboundMonthDir,
  ensureIntegrationDirs,
  getIntegrationDirs,
  listConfirmInboundFileNames,
  listIw37nInboundFileNames,
  type IntegrationDirs,
} from './integration-paths.js'
import { getIntegrationWatchSettings } from './integration-settings.js'
import { importIw37nFile } from './iw37n.js'

export type IntegrationFileKind = 'iw37n' | 'confirm'

export type IntegrationFileResult = {
  kind: IntegrationFileKind
  fileName: string
  ok: boolean
  batchId?: string
  status?: string
  sha256?: string
  inserted?: number
  updated?: number
  skipped?: number
  errors?: number
  message?: string
}

export type IntegrationScanSummary = {
  filesFound: number
  filesProcessed: number
  filesFailed: number
  files: IntegrationFileResult[]
}

export type InboundIntegrationSummary = {
  iw37n: IntegrationScanSummary
  confirm: IntegrationScanSummary
  filesFound: number
  filesProcessed: number
  filesFailed: number
  files: IntegrationFileResult[]
}

function uniqueDestPath(dir: string, fileName: string): string {
  let dest = path.join(dir, fileName)
  if (!existsSync(dest)) return dest
  const ext = path.extname(fileName)
  const stem = path.basename(fileName, ext)
  let n = 1
  while (existsSync(dest)) {
    dest = path.join(dir, `${stem}_${n}${ext}`)
    n++
  }
  return dest
}

async function moveFile(src: string, dest: string): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true })
  await rename(src, dest)
}

async function writeErrorSidecar(
  dirs: IntegrationDirs,
  fileName: string,
  payload: { message: string; at: string; kind: IntegrationFileKind },
): Promise<void> {
  const base = path.basename(fileName, path.extname(fileName))
  const sidecar = path.join(dirs.error, `${base}.${payload.kind}.error.json`)
  await mkdir(dirs.error, { recursive: true })
  await writeFile(sidecar, JSON.stringify(payload, null, 2), 'utf8')
}

async function archiveInbound(
  dirs: IntegrationDirs,
  processingPath: string,
  fileName: string,
): Promise<void> {
  const archiveDir = archiveInboundMonthDir(dirs)
  const archived = uniqueDestPath(archiveDir, fileName)
  await moveFile(processingPath, archived)
}

async function handleInboundFailure(
  dirs: IntegrationDirs,
  opts: {
    kind: IntegrationFileKind
    fileName: string
    src: string
    processingPath: string
    message: string
  },
): Promise<void> {
  const { kind, fileName, src, processingPath, message } = opts
  try {
    if (existsSync(processingPath)) {
      const errPath = uniqueDestPath(dirs.error, fileName)
      await moveFile(processingPath, errPath)
    } else if (existsSync(src)) {
      const errPath = uniqueDestPath(dirs.error, fileName)
      await moveFile(src, errPath)
    }
    await writeErrorSidecar(dirs, fileName, {
      message,
      at: new Date().toISOString(),
      kind,
    })
  } catch {
    /* best-effort */
  }
}

async function processInboundIw37nFile(
  pool: Pool,
  dirs: IntegrationDirs,
  fileName: string,
): Promise<IntegrationFileResult> {
  const src = path.join(dirs.inboundIw37n, fileName)
  const processingPath = uniqueDestPath(dirs.processing, `iw37n_${Date.now()}_${fileName}`)

  try {
    await moveFile(src, processingPath)
    const buffer = await readFile(processingPath)
    const result = await importIw37nFile(pool, fileName, buffer, { source: 'sap_folder' })
    await archiveInbound(dirs, processingPath, fileName)
    return {
      kind: 'iw37n',
      fileName,
      ok: true,
      batchId: result.batch.id,
      status: result.batch.status,
      sha256: result.batch.sha256,
      message: result.batch.isDuplicate
        ? `Duplicate (batch #${result.batch.duplicateOfBatchId ?? result.batch.id})`
        : 'Imported',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await handleInboundFailure(dirs, { kind: 'iw37n', fileName, src, processingPath, message })
    return { kind: 'iw37n', fileName, ok: false, message }
  }
}

async function processInboundConfirmFile(
  pool: Pool,
  dirs: IntegrationDirs,
  fileName: string,
): Promise<IntegrationFileResult> {
  const src = path.join(dirs.inboundConfirm, fileName)
  const processingPath = uniqueDestPath(dirs.processing, `confirm_${Date.now()}_${fileName}`)

  try {
    await moveFile(src, processingPath)
    const buffer = await readFile(processingPath)
    const sha256 = createHash('sha256').update(buffer).digest('hex')
    const summary = await importConfirmFile(pool, fileName, buffer)
    await archiveInbound(dirs, processingPath, fileName)
    const ok = summary.inserted + summary.updated > 0 || (summary.errors === 0 && summary.totalRows > 0)
    return {
      kind: 'confirm',
      fileName,
      ok,
      sha256,
      inserted: summary.inserted,
      updated: summary.updated,
      skipped: summary.skipped,
      errors: summary.errors,
      message:
        summary.errors > 0
          ? `inserted=${summary.inserted} updated=${summary.updated} errors=${summary.errors}`
          : `inserted=${summary.inserted} updated=${summary.updated}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await handleInboundFailure(dirs, { kind: 'confirm', fileName, src, processingPath, message })
    return { kind: 'confirm', fileName, ok: false, message }
  }
}

export function summarizeScan(files: IntegrationFileResult[]): {
  status: IntegrationJobItem['status']
  summary: IntegrationScanSummary
  errorText: string | null
} {
  const filesFound = files.length
  const filesProcessed = files.filter((f) => f.ok).length
  const filesFailed = files.filter((f) => !f.ok).length
  const summary: IntegrationScanSummary = { filesFound, filesProcessed, filesFailed, files }

  if (filesFound === 0) {
    return { status: 'success', summary, errorText: null }
  }
  if (filesFailed === 0) {
    return { status: 'success', summary, errorText: null }
  }
  if (filesProcessed === 0) {
    return {
      status: 'failed',
      summary,
      errorText: files.find((f) => !f.ok)?.message ?? 'All files failed',
    }
  }
  return {
    status: 'partial',
    summary,
    errorText: `${filesFailed} file(s) failed`,
  }
}

function buildInboundSummary(
  iw37nResults: IntegrationFileResult[],
  confirmResults: IntegrationFileResult[],
): InboundIntegrationSummary {
  const iw37n = summarizeScan(iw37nResults).summary
  const confirm = summarizeScan(confirmResults).summary
  const files = [...iw37nResults, ...confirmResults]
  return {
    iw37n,
    confirm,
    filesFound: files.length,
    filesProcessed: files.filter((f) => f.ok).length,
    filesFailed: files.filter((f) => !f.ok).length,
    files,
  }
}

function statusFromInboundSummary(summary: InboundIntegrationSummary): IntegrationJobItem['status'] {
  if (summary.filesFound === 0) return 'success'
  if (summary.filesFailed === 0) return 'success'
  if (summary.filesProcessed === 0) return 'failed'
  return 'partial'
}

export type RunInboundScanOptions = {
  trigger: 'manual' | 'schedule'
  startedBy: string | null
  rootDir?: string
  scanIw37n?: boolean
  scanConfirm?: boolean
}

export async function runInboundIntegrationScan(
  pool: Pool,
  opts: RunInboundScanOptions,
): Promise<IntegrationJobItem> {
  await failStaleIntegrationJobs(pool)

  if (await hasRunningIntegrationJob(pool)) {
    throw new Error('INTEGRATION_JOB_ALREADY_RUNNING')
  }

  const scanIw37n = opts.scanIw37n !== false
  const scanConfirm = opts.scanConfirm !== false

  return withIntegrationAdvisoryLock(pool, async () => {
    const dirs = getIntegrationDirs(opts.rootDir)
    await ensureIntegrationDirs(dirs)

    const job = await createIntegrationJob(pool, {
      jobType: 'inbound_scan',
      trigger: opts.trigger,
      startedBy: opts.startedBy,
    })

    const iw37nResults: IntegrationFileResult[] = []
    const confirmResults: IntegrationFileResult[] = []

    if (scanIw37n) {
      for (const name of listIw37nInboundFileNames(dirs.inboundIw37n)) {
        iw37nResults.push(await processInboundIw37nFile(pool, dirs, name))
      }
    }

    if (scanConfirm) {
      for (const name of listConfirmInboundFileNames(dirs.inboundConfirm)) {
        confirmResults.push(await processInboundConfirmFile(pool, dirs, name))
      }
    }

    const inboundSummary = buildInboundSummary(iw37nResults, confirmResults)
    const status = statusFromInboundSummary(inboundSummary)
    const lastOk = [...inboundSummary.files].reverse().find((f) => f.ok)

    let errorText: string | null = null
    if (status === 'failed') {
      errorText = inboundSummary.files.find((f) => !f.ok)?.message ?? 'All files failed'
    } else if (status === 'partial') {
      errorText = `${inboundSummary.filesFailed} file(s) failed`
    }

    return finishIntegrationJob(pool, job.id, {
      status,
      summary: inboundSummary as unknown as Record<string, unknown>,
      errorText,
      fileName: lastOk?.fileName ?? (inboundSummary.files[0]?.fileName ?? null),
      sha256: lastOk?.sha256 ?? null,
      batchId: lastOk?.kind === 'iw37n' ? lastOk.batchId ?? null : null,
    })
  })
}

/** @deprecated alias — scans IW37N + CONFIRM_IN */
export async function runInboundIw37nScan(
  pool: Pool,
  opts: Omit<RunInboundScanOptions, 'scanIw37n' | 'scanConfirm'>,
): Promise<IntegrationJobItem> {
  return runInboundIntegrationScan(pool, { ...opts, scanIw37n: true, scanConfirm: true })
}

async function pendingFilesInDir(
  dir: string,
  listNames: (inboundDir: string) => string[],
) {
  const { stat } = await import('node:fs/promises')
  const names = listNames(dir)
  return Promise.all(
    names.map(async (name) => {
      const st = await stat(path.join(dir, name))
      return { name, sizeBytes: st.size }
    }),
  )
}

export async function getIntegrationStatus(pool: Pool, rootDir?: string) {
  const dirs = getIntegrationDirs(rootDir)
  await ensureIntegrationDirs(dirs)
  const watch = await getIntegrationWatchSettings(pool)
  const pendingIw37nFiles = await pendingFilesInDir(
    dirs.inboundIw37n,
    listIw37nInboundFileNames,
  )
  const pendingConfirmFiles = await pendingFilesInDir(
    dirs.inboundConfirm,
    listConfirmInboundFileNames,
  )
  const lastJob = await getLatestIntegrationJob(pool)
  return {
    rootDir: dirs.root,
    inboundIw37nDir: dirs.inboundIw37n,
    inboundConfirmDir: dirs.inboundConfirm,
    watchEnabled: watch.enabled,
    watchIntervalMinutes: watch.intervalMinutes,
    pendingIw37nFiles,
    pendingConfirmFiles,
    lastJob,
  }
}

export function sha256Buffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}
