import { createClient } from 'redis'

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const client = createClient({ url })
let ready = false
client.on('error', () => {})
client.connect().then(() => (ready = true)).catch(() => (ready = false))

const mem = new Map<string, { value: any; expire: number }>()

export async function cacheGet<T>(key: string): Promise<T | null> {
  const now = Date.now()
  const m = mem.get(key)
  if (m && m.expire > now) return m.value as T
  if (ready) {
    const v = await client.get(key)
    if (v) return JSON.parse(v) as T
  }
  return null
}

export async function cacheSet(key: string, value: any, ttlSeconds: number) {
  const expire = Date.now() + ttlSeconds * 1000
  mem.set(key, { value, expire })
  if (ready) {
    await client.setEx(key, ttlSeconds, JSON.stringify(value))
  }
}

export async function rateLimit(name: string, key: string, limitPerMin: number): Promise<boolean> {
  const k = `rl:${name}:${key}`
  const now = Math.floor(Date.now() / 1000)
  if (ready) {
    const cnt = await client.incr(k)
    if (cnt === 1) await client.expire(k, 60)
    return cnt <= limitPerMin
  }
  const m = mem.get(k)
  if (!m || m.expire < now) {
    mem.set(k, { value: 1, expire: now + 60 })
    return true
  }
  ;(m as any).value++
  return (m as any).value <= limitPerMin
}

export async function cacheDel(key: string) {
  mem.delete(key)
  if (ready) await client.del(key)
}
