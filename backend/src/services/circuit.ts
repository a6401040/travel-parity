type State = { failures: number; openUntil: number }
const states = new Map<string, State>()

export function circuitAllow(name: string): boolean {
  const s = states.get(name)
  if (!s) return true
  return Date.now() >= s.openUntil
}

export function circuitFail(name: string, threshold = 3, openMs = 30000) {
  const s = states.get(name) || { failures: 0, openUntil: 0 }
  s.failures += 1
  if (s.failures >= threshold) s.openUntil = Date.now() + openMs
  states.set(name, s)
}

export function circuitOk(name: string) {
  states.set(name, { failures: 0, openUntil: 0 })
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 200): Promise<T> {
  let attempt = 0
  let lastErr: any
  while (attempt <= retries) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      if (attempt === retries) break
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 50)
      await new Promise((r) => setTimeout(r, delay))
      attempt += 1
    }
  }
  throw lastErr
}
