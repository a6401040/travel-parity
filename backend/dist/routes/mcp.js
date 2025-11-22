import { Router } from 'express';
import { z } from 'zod';
import { fetchTrainOptions } from '../mcp/rail.js';
const ReqSchema = z.object({ origin: z.string(), destination: z.string(), date: z.string(), timeFlex: z.coerce.number().optional() });
export const router = Router();
router.get('/mcp/selftest', async (req, res) => {
    try {
        const q = ReqSchema.parse({ origin: '广州', destination: '保定', date: '2025-12-01' });
        const trains = await fetchTrainOptions(q);
        res.json({ ok: true, sample: { trains } });
    }
    catch (e) {
        res.status(500).json({ error: 'mcp_selftest_failed', message: e?.message || 'error' });
    }
});
