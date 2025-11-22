const states = new Map();
export function circuitAllow(name) {
    const s = states.get(name);
    if (!s)
        return true;
    return Date.now() >= s.openUntil;
}
export function circuitFail(name, threshold = 3, openMs = 30000) {
    const s = states.get(name) || { failures: 0, openUntil: 0 };
    s.failures += 1;
    if (s.failures >= threshold)
        s.openUntil = Date.now() + openMs;
    states.set(name, s);
}
export function circuitOk(name) {
    states.set(name, { failures: 0, openUntil: 0 });
}
export async function withRetry(fn, retries = 2, baseDelayMs = 200) {
    let attempt = 0;
    let lastErr;
    while (attempt <= retries) {
        try {
            return await fn();
        }
        catch (e) {
            lastErr = e;
            if (attempt === retries)
                break;
            const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 50);
            await new Promise((r) => setTimeout(r, delay));
            attempt += 1;
        }
    }
    throw lastErr;
}
