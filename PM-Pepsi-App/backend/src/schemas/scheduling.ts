import { z } from 'zod'

export const movePlanReasonSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const movePlanReasonsResponseSchema = z.object({
  items: z.array(movePlanReasonSchema),
})

export const movePlanRequestSchema = z.object({
  idiw37: z.string().min(1),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reasonCode: z.string().optional(),
  comment: z.string().optional(),
})

export const movePlanResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  mpcount: z.number(),
})

export const workOrderSuggestionSchema = z.object({
  id: z.string(),
  wkorder: z.string(),
  wktype: z.string(),
  label: z.string(),
})

export const workOrderSuggestionsResponseSchema = z.object({
  items: z.array(workOrderSuggestionSchema),
})
