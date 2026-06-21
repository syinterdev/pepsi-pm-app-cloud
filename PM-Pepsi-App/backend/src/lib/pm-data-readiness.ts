import { z } from 'zod'
import type { PmMeasurementKind } from './pm-measurement-kind.js'

export const pmDataReadinessSchema = z.object({
  mntplan: z.string(),
  tasklistPublished: z.boolean(),
  taskCount: z.number().int(),
  currentTaskCount: z.number().int(),
  vibrationTaskCount: z.number().int(),
  readingCount: z.number().int(),
})

export type PmDataReadiness = z.infer<typeof pmDataReadinessSchema>

type TaskLike = { measurementKind: PmMeasurementKind }

export function buildPmDataReadiness(input: {
  mntplan: string
  tasks: readonly TaskLike[]
  readingCount: number
}): PmDataReadiness {
  const mntplan = input.mntplan.trim()
  const taskCount = input.tasks.length
  let currentTaskCount = 0
  let vibrationTaskCount = 0
  for (const task of input.tasks) {
    if (task.measurementKind === 'current_3phase') currentTaskCount += 1
    else if (task.measurementKind === 'vibration_dst_db') vibrationTaskCount += 1
  }
  return {
    mntplan,
    tasklistPublished: taskCount > 0,
    taskCount,
    currentTaskCount,
    vibrationTaskCount,
    readingCount: Math.max(0, input.readingCount),
  }
}
