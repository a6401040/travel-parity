import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../middlewares/session.js'
import { listHistory, insertHistory, deleteHistory, getHistory } from '../db/history.js'

export const router = Router()

router.get('/history', requireSession, async (req: any, res) => {
  try {
    const q = z.object({ page: z.coerce.number().default(1), pageSize: z.coerce.number().default(20) }).parse(req.query)
    const data = await listHistory(Number(req.user.id), q.page, q.pageSize)
    res.json(data)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.get('/history/:id', requireSession, async (req: any, res) => {
  const id = Number(req.params.id)
  const row = await getHistory(Number(req.user.id), id)
  if (!row) return res.status(404).json({ error: 'not_found' })
  res.json(row)
})

router.post('/history', requireSession, async (req: any, res) => {
  try {
    const body = z.object({ title: z.string().optional(), request: z.record(z.any()).optional(), response: z.record(z.any()).optional() }).parse(req.body)
    const row = await insertHistory(Number(req.user.id), body.title || null, body.request, body.response)
    res.json(row)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.delete('/history/:id', requireSession, async (req: any, res) => {
  const ok = await deleteHistory(Number(req.user.id), Number(req.params.id))
  res.json({ ok })
})
