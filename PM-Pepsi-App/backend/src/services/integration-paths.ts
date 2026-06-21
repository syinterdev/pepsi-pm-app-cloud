import { existsSync, readdirSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const INBOUND_EXTS = new Set(['.csv', '.xlsx', '.xls'])

export type IntegrationDirs = {
  root: string
  inboundIw37n: string
  inboundConfirm: string
  outboundConfirm: string
  processing: string
  archiveInbound: string
  archiveOutbound: string
  error: string
}

function defaultIntegrationRoot(): string {
  const fromEnv = process.env.INTEGRATION_DATA_DIR?.trim()
  if (fromEnv) return path.resolve(fromEnv)
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '../../data/integration')
}

export function getIntegrationDirs(rootOverride?: string): IntegrationDirs {
  const root = path.resolve(rootOverride?.trim() || defaultIntegrationRoot())
  const archiveInbound = path.join(root, 'archive', 'inbound')
  const archiveOutbound = path.join(root, 'archive', 'outbound')
  return {
    root,
    inboundIw37n: path.join(root, 'inbound', 'iw37n'),
    inboundConfirm: path.join(root, 'inbound', 'confirm'),
    outboundConfirm: path.join(root, 'outbound', 'confirm'),
    processing: path.join(root, 'processing'),
    archiveInbound,
    archiveOutbound,
    error: path.join(root, 'error'),
  }
}

export async function ensureIntegrationDirs(dirs: IntegrationDirs): Promise<void> {
  const all = [
    dirs.inboundIw37n,
    dirs.inboundConfirm,
    dirs.outboundConfirm,
    dirs.processing,
    dirs.archiveInbound,
    dirs.archiveOutbound,
    dirs.error,
  ]
  await Promise.all(all.map((d) => mkdir(d, { recursive: true })))
}

export function archiveInboundMonthDir(dirs: IntegrationDirs, at = new Date()): string {
  const ym = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`
  return path.join(dirs.archiveInbound, ym)
}

export function isInboundDataFileName(name: string): boolean {
  const lower = name.toLowerCase()
  if (lower.startsWith('.')) return false
  const ext = path.extname(lower)
  return INBOUND_EXTS.has(ext)
}

/** @deprecated use isInboundDataFileName */
export const isIw37nInboundFileName = isInboundDataFileName

function listInboundFileNames(inboundDir: string): string[] {
  if (!existsSync(inboundDir)) return []
  return readdirSync(inboundDir, { withFileTypes: true })
    .filter((e) => e.isFile() && isInboundDataFileName(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
}

export function listIw37nInboundFileNames(inboundDir: string): string[] {
  return listInboundFileNames(inboundDir)
}

export function listConfirmInboundFileNames(inboundDir: string): string[] {
  return listInboundFileNames(inboundDir)
}
