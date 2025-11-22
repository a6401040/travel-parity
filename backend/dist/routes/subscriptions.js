import { Router } from 'express';
export const router = Router();
router.get('/subscriptions/plans', async (req, res) => {
    res.status(501).json({ message: 'not_implemented' });
});
router.post('/subscriptions/subscribe', async (req, res) => {
    res.status(501).json({ message: 'not_implemented' });
});
