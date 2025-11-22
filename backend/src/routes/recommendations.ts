import { Router } from 'express'
import { z } from 'zod'
import { buildCombos } from '../services/combo.js'

export const router = Router()

const ReqSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  date: z.string(),
  constraints: z.object({ maxTransfers: z.coerce.number().optional(), minComfort: z.coerce.number().optional(), avoidNightArrival: z.coerce.boolean().optional() }).optional()
})

router.post('/recommendations', async (req, res) => {
  try {
    const q = ReqSchema.parse(req.body)
    const combos = await buildCombos({ origin: q.origin, destination: q.destination, date: q.date, constraints: q.constraints })
    res.json({ schemes: combos })
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})
