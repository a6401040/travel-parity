import { Router } from 'express'
import { z } from 'zod'
import { fetchTrainOptions } from '../mcp/rail.js'
import { fetchFlightsByCityDate } from '../db/flights.js'
import { searchHotels, searchPoi } from '../mcp/amap.js'

const ReqSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  date: z.string(),
  timeFlex: z.coerce.number().optional(),
  passengers: z.coerce.number().optional(),
  classPref: z.string().optional(),
  earliestStartTime: z.coerce.number().optional(),
  latestStartTime: z.coerce.number().optional(),
  sortFlag: z.enum(['startTime', 'arriveTime', 'duration', 'price']).optional(),
  sortReverse: z.coerce.boolean().optional(),
  limit: z.coerce.number().optional(),
  includeHotels: z.coerce.boolean().optional(),
  includePoi: z.coerce.boolean().optional(),
  budget: z.coerce.number().optional(),
  hotelRatingMin: z.coerce.number().optional(),
  poiRatingMin: z.coerce.number().optional()
})

export const router = Router()
router.get('/options', async (req, res) => {
  try {
    const q = ReqSchema.parse(req.query)
    const [trains, flights] = await Promise.all([
      fetchTrainOptions({ origin: q.origin, destination: q.destination, date: q.date, timeFlex: q.timeFlex }),
      fetchFlightsByCityDate({
        date: q.date,
        fromCity: q.origin,
        toCity: q.destination,
        earliestStartTime: q.earliestStartTime,
        latestStartTime: q.latestStartTime,
        sortFlag: q.sortFlag,
        sortReverse: q.sortReverse,
        limit: q.limit ?? 200
      })
    ])
    let hotels: any[] = []
    let poi: any[] = []
    if (q.includeHotels && process.env.GAODE_MCP_BASE_URL) {
      const nextDay = (() => {
        const d = new Date(`${q.date}T00:00:00`)
        d.setDate(d.getDate() + 1)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      })()
      hotels = await searchHotels({ city: q.destination, checkin: q.date, checkout: nextDay, budgetMax: q.budget, ratingMin: q.hotelRatingMin, limit: 30 }).catch(() => [])
    }
    if (q.includePoi && process.env.GAODE_MCP_BASE_URL) {
      poi = await searchPoi({ city: q.destination, interests: undefined, ratingMin: q.poiRatingMin, limit: 50 }).catch(() => [])
    }
    res.json({ trains, flights, hotels, poi, meta: { origin: q.origin, destination: q.destination, date: q.date, timeFlex: q.timeFlex, passengers: q.passengers, classPref: q.classPref } })
  } catch (e: any) {
    res.status(500).json({ error: 'mcp_error', message: e?.message || 'error' })
  }
})
