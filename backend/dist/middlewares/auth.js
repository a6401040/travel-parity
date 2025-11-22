import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function requireAuth(req, res, next) {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/.exec(String(h));
    if (!m || !env.JWT_SECRET)
        return res.status(401).json({ error: 'unauthorized', message: 'missing_token' });
    try {
        const payload = jwt.verify(m[1], env.JWT_SECRET);
        req.user = { id: payload?.uid, username: payload?.username, role: payload?.role };
        if (!req.user?.id)
            return res.status(401).json({ error: 'unauthorized', message: 'invalid_token' });
        next();
    }
    catch {
        res.status(401).json({ error: 'unauthorized', message: 'invalid_token' });
    }
}
