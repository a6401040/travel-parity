import { Router } from 'express';
import { z } from 'zod';
import { requireSession } from '../middlewares/session.js';
import { getUserById, updateUserProfile, updateUserPassword, softDeleteUser } from '../db/users.js';
import { getDownloadSettings, upsertDownloadSettings } from '../db/userSettings.js';
import fs from 'fs';
export const router = Router();
router.get('/settings/profile', requireSession, async (req, res) => {
    try {
        const u = await getUserById(Number(req.user.id));
        if (!u)
            return res.status(404).json({ error: 'not_found' });
        res.json(u);
    }
    catch (e) {
        res.status(500).json({ error: 'server_error', message: e?.message || 'error' });
    }
});
router.put('/settings/profile', requireSession, async (req, res) => {
    try {
        const body = z.object({ email: z.string().email().optional(), phone: z.string().min(6).optional() }).parse(req.body);
        const u = await updateUserProfile(Number(req.user.id), body);
        res.json(u);
    }
    catch (e) {
        res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' });
    }
});
router.put('/settings/password', requireSession, async (req, res) => {
    try {
        const body = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(8) }).parse(req.body);
        await updateUserPassword(Number(req.user.id), body.currentPassword, body.newPassword);
        res.json({ ok: true });
    }
    catch (e) {
        const msg = String(e?.message || '');
        if (msg === 'password_mismatch')
            return res.status(401).json({ error: 'unauthorized', message: 'password_mismatch' });
        res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' });
    }
});
router.get('/settings/download', requireSession, async (req, res) => {
    const cur = await getDownloadSettings(Number(req.user.id));
    res.json({ default_format: cur.default_export_format, filename_rule: cur.filename_rule, include_segments_detail: cur.include_segments_detail, download_path: cur.download_path });
});
router.put('/settings/download', requireSession, async (req, res) => {
    try {
        const body = z
            .object({ default_format: z.enum(['json', 'markdown', 'pdf']), filename_rule: z.string().min(3), include_segments_detail: z.boolean(), download_path: z.string().min(1).optional() })
            .parse(req.body);
        const out = await upsertDownloadSettings(Number(req.user.id), {
            default_export_format: body.default_format,
            filename_rule: body.filename_rule,
            include_segments_detail: body.include_segments_detail,
            download_path: body.download_path || 'Desktop'
        });
        res.json({ default_format: out.default_export_format, filename_rule: out.filename_rule, include_segments_detail: out.include_segments_detail, download_path: out.download_path });
    }
    catch (e) {
        res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' });
    }
});
router.post('/settings/download/verify', requireSession, async (req, res) => {
    try {
        const body = z.object({ path: z.string().min(1) }).parse(req.body);
        const p = String(body.path);
        const isDefault = p === 'Desktop' || p === 'Downloads';
        const exists = isDefault ? true : (p.startsWith('/') ? fs.existsSync(p) : false);
        res.json({ exists });
    }
    catch (e) {
        res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' });
    }
});
router.delete('/settings/account', requireSession, async (req, res) => {
    try {
        await softDeleteUser(Number(req.user.id));
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: 'server_error', message: e?.message || 'error' });
    }
});
