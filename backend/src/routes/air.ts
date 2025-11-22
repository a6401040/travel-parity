import { Router } from 'express'
import { z } from 'zod'
import { fetchFlightsByCityDate } from '../db/flights.js'

export const router = Router()

router.get('/air/flights', async (req, res) => {
  try {
    const q = z.object({ date: z.string(), fromCity: z.string(), toCity: z.string(), limit: z.coerce.number().optional() }).parse(req.query)
    const data = await fetchFlightsByCityDate(q)
    res.json({ flights: data })
  } catch (e: any) {
    res.status(500).json({ error: 'db_error', message: e?.message || 'error' })
  }
})

