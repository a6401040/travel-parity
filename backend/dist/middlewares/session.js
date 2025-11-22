import { cacheGet, cacheSet, cacheDel } from '../services/cache.js';
export async function requireSession(req, res, next) {
    try {
        const sid = extractSID(req);
        if (!sid)
            return res.status(401).json({ error: 'unauthorized', message: '未登录或会话已过期' });
        const key = `session:${sid}`;
        const sess = await cacheGet(key);
        if (!sess || !sess.uid)
            return res.status(401).json({ error: 'unauthorized', message: '未登录或会话已过期' });
        req.user = { id: sess.uid, username: sess.username, role: sess.role };
        next();
    }
    catch {
        res.status(401).json({ error: 'unauthorized', message: '未登录或会话已过期' });
    }
}
export function extractSID(req) {
    const h = req.headers['x-session-id'];
    if (h && typeof h === 'string' && h.trim())
        return h.trim();
    const cookie = String(req.headers['cookie'] || '');
    const m = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    return m ? decodeURIComponent(m[1]) : null;
}
export async function createSession(uid, username, role) {
    const sid = randomSID();
    const key = `session:${sid}`;
    const ttlSeconds = 86400;
    await cacheSet(key, { uid, username, role }, ttlSeconds);
    return { sid, ttlSeconds };
}
export async function destroySession(sid) {
    await cacheDel(`session:${sid}`);
}
function randomSID() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
