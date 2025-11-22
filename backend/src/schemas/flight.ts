import { z } from 'zod'

export const FlightOptionSchema = z.object({
  flightNo: z.string(),
  carrier: z.string().optional(),
  departAirport: z.string().optional(),
  arriveAirport: z.string().optional(),
  fromCity: z.string().optional(),
  toCity: z.string().optional(),
  departTime: z.string(),
  arriveTime: z.string(),
  cabin: z
    .array(z.object({ code: z.string(), price: z.number().optional(), remaining: z.number().optional() }))
    .optional(),
  onTimeRate: z.number().optional()
})

export type FlightOption = z.infer<typeof FlightOptionSchema>

