export class MaintenanceModeError extends Error {
  readonly code = 'MAINTENANCE' as const

  constructor(message: string) {
    super(message)
    this.name = 'MaintenanceModeError'
  }
}

export function isMaintenanceModeError(err: unknown): err is MaintenanceModeError {
  return err instanceof MaintenanceModeError
}
