import { Router } from 'express'
import { metricsText } from '../services/metrics.js'

export const router = Router()
router.get('/metrics', async (_req, res) => {
  const text = await metricsText()
  res.setHeader('Content-Type', 'text/plain; version=0.0.4')
  res.send(text)
})
