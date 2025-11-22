import { Router } from 'express';
export const router = Router();
router.get('/app/about', async (req, res) => {
    res.json({ name: '出行助手', version: '0.1.0' });
});
