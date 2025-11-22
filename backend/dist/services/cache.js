import { createClient } from 'redis';
const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const client = createClient({ url });
let ready = false;
client.on('error', () => { });
client.connect().then(() => (ready = true)).catch(() => (ready = false));
const mem = new Map();
export async function cacheGet(key) {
    const now = Date.now();
    const m = mem.get(key);
    if (m && m.expire > now)
        return m.value;
    if (ready) {
        const v = await client.get(key);
        if (v)
            return JSON.parse(v);
    }
    return null;
}
export async function cacheSet(key, value, ttlSeconds) {
    const expire = Date.now() + ttlSeconds * 1000;
    mem.set(key, { value, expire });
    if (ready) {
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
    }
}
export async function rateLimit(name, key, limitPerMin) {
    const k = `rl:${name}:${key}`;
    const now = Math.floor(Date.now() / 1000);
    if (ready) {
        const cnt = await client.incr(k);
        if (cnt === 1)
            await client.expire(k, 60);
        return cnt <= limitPerMin;
    }
    const m = mem.get(k);
    if (!m || m.expire < now) {
        mem.set(k, { value: 1, expire: now + 60 });
        return true;
    }
    ;
    m.value++;
    return m.value <= limitPerMin;
}
export async function cacheDel(key) {
    mem.delete(key);
    if (ready)
        await client.del(key);
}
