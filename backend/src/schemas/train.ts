import { z } from 'zod'

export const TrainOptionSchema = z.object({
  trainNo: z.string(),
  departStation: z.string(),
  arriveStation: z.string(),
  departTime: z.string(),
  arriveTime: z.string(),
  seatTypes: z.array(z.object({ type: z.string(), price: z.number().optional(), remaining: z.number().optional() })).optional()
})

export type TrainOption = z.infer<typeof TrainOptionSchema>

