import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../middlewares/session.js'
import { saveScheme, getScheme, deleteScheme, listSchemes } from '../db/schemes.js'

export const router = Router()

router.post('/schemes/save', requireSession, async (req: any, res) => {
  try {
    const body = z.object({ name: z.string().min(1), scheme: z.record(z.any()) }).parse(req.body)
    const s = await saveScheme(Number(req.user.id), body.name, body.scheme)
    res.json(s)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.get('/schemes/:id', requireSession, async (req: any, res) => {
  const id = Number(req.params.id)
  const s = await getScheme(Number(req.user.id), id)
  if (!s) return res.status(404).json({ error: 'not_found' })
  res.json(s)
})

router.get('/schemes', requireSession, async (req: any, res) => {
  try {
    const q = z.object({ page: z.coerce.number().default(1), pageSize: z.coerce.number().default(20) }).parse(req.query)
    const data = await listSchemes(Number(req.user.id), q.page, q.pageSize)
    res.json(data)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.delete('/schemes/:id', requireSession, async (req: any, res) => {
  const ok = await deleteScheme(Number(req.user.id), Number(req.params.id))
  res.json({ ok })
})
