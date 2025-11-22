import { z } from 'zod'

export const SegmentSchema = z.object({
  mode: z.enum(['train', 'flight']),
  optionId: z.string(),
  departTime: z.string(),
  arriveTime: z.string(),
  price: z.number(),
  booking: z
    .object({ provider: z.string().optional(), url: z.string().optional(), notes: z.string().optional() })
    .optional()
})

export const SchemeSchema = z.object({
  segments: z.array(SegmentSchema),
  totalTimeMinutes: z.number(),
  totalPrice: z.number(),
  transfers: z.number(),
  riskScore: z.number().optional(),
  comfortScore: z.number().optional(),
  score: z.number(),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export const HotelSchema = z.object({
  hotelId: z.string().optional(),
  name: z.string(),
  rating: z.number().optional(),
  price: z.number().optional(),
  location: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
  score: z.number().optional(),
  reason: z.string().optional()
})

export const RouteSchema = z.object({
  name: z.string(),
  city: z.string().optional(),
  days: z.number().optional(),
  dailyPlan: z
    .array(
      z.object({
        day: z.number().optional(),
        items: z
          .array(
            z.object({ timeSlot: z.string().optional(), poiId: z.string().optional(), poiName: z.string().optional(), transport: z.string().optional(), notes: z.string().optional() })
          )
          .optional()
      })
    )
    .optional(),
  budgetRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  notes: z.string().optional()
})

export const LLMOutputSchema = z.object({
  schemes: z.object({ timeFirst: z.array(SchemeSchema), priceFirst: z.array(SchemeSchema), balanced: z.array(SchemeSchema) }),
  hotels: z.array(HotelSchema).optional(),
  routes: z.array(RouteSchema).optional(),
  needs_more_data: z.array(z.string()).optional()
})

export type LLMOutput = z.infer<typeof LLMOutputSchema>

