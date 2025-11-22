import { Router } from 'express'
export const router = Router()
router.get('/user/profile', async (req, res) => {
  res.status(501).json({ message: 'not_implemented' })
})
router.put('/user/profile', async (req, res) => {
  res.status(501).json({ message: 'not_implemented' })
})

