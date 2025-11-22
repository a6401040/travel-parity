import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createUser, getUserByUsername, softDeleteUser, updateUserPassword } from '../db/users.js'
import { requireSession, createSession, destroySession, extractSID } from '../middlewares/session.js'

export const router = Router()

router.post('/auth/register', async (req, res) => {
  try {
    const body = z.object({ username: z.string().min(3), password: z.string().min(8), email: z.string().email().optional(), phone: z.string().min(6).optional() }).parse(req.body)
    const u = await createUser(body)
    res.json({ id: u?.id, username: u?.username })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg === 'username_taken') return res.status(400).json({ error: 'invalid_params', message: 'username_taken' })
    if (msg === 'email_taken') return res.status(400).json({ error: 'invalid_params', message: 'email_taken' })
    if (msg === 'phone_taken') return res.status(400).json({ error: 'invalid_params', message: 'phone_taken' })
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.post('/auth/login', async (req, res) => {
  try {
    const body = z.object({ username: z.string(), password: z.string() }).parse(req.body)
    const u = await getUserByUsername(body.username)
    if (!u) return res.status(401).json({ error: 'unauthorized', message: 'invalid_credentials' })
    const ok = await bcrypt.compare(body.password, String(u.password_hash))
    if (!ok) return res.status(401).json({ error: 'unauthorized', message: 'invalid_credentials' })
    const { sid, ttlSeconds } = await createSession(Number(u.id), String(u.username), String(u.role))
    res.setHeader('Set-Cookie', `sid=${encodeURIComponent(sid)}; Max-Age=${ttlSeconds}; HttpOnly; SameSite=Lax; Path=/`)
    res.json({ sid, ttlSeconds, user: { id: u.id, username: u.username, role: u.role } })
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.post('/auth/logout', requireSession, async (req: any, res) => {
  const sid = extractSID(req)
  if (sid) await destroySession(sid)
  res.setHeader('Set-Cookie', `sid=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/`)
  res.json({ ok: true })
})

router.post('/auth/change-password', requireSession, async (req: any, res) => {
  try {
    const body = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(8) }).parse(req.body)
    await updateUserPassword(Number(req.user.id), body.currentPassword, body.newPassword)
    res.json({ ok: true })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg === 'password_mismatch') return res.status(401).json({ error: 'unauthorized', message: 'password_mismatch' })
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.delete('/auth/account', requireSession, async (req: any, res) => {
  try {
    await softDeleteUser(Number(req.user.id))
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: 'server_error', message: e?.message || 'error' })
  }
})
