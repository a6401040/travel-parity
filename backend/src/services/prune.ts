type Train = {
  trainNo: string
  departStation: string
  arriveStation: string
  departTime: string
  arriveTime: string
  seatTypes: { type: string; price?: number; remaining?: number }[]
}

type Flight = {
  flightNo: string
  carrier?: string
  departAirport?: string
  arriveAirport?: string
  fromCity?: string
  toCity?: string
  departTime: string
  arriveTime: string
  cabin?: { code: string; price?: number; remaining?: number }[]
  onTimeRate?: number
}

function parseHour(t: string): number {
  const m = /(\d{2}):(\d{2})/.exec(t)
  if (m) return Number(m[1])
  const d = new Date(t)
  if (!isNaN(d.getTime())) return d.getHours()
  return 12
}

function isNight(h: number) {
  return h >= 23 || h < 6
}

function comfortOf(code: string) {
  const c = code.toUpperCase()
  if (c.startsWith('F')) return 90
  if (c.startsWith('C') || c.includes('BUS')) return 85
  if (c.startsWith('Y') || c.includes('ECO')) return 60
  return 65
}

export function pruneTrains(list: Train[], opts: { avoidNightArrival?: boolean; maxTransfers?: number }) {
  const out = list.filter((t) => {
    const hasSeat = Array.isArray(t.seatTypes) ? t.seatTypes.some((s) => s.remaining == null || Number(s.remaining) > 0) : true
    const h = parseHour(t.arriveTime)
    const nightOk = !opts.avoidNightArrival || !isNight(h)
    return hasSeat && nightOk
  })
  return out
}

export function pruneFlights(list: Flight[], opts: { avoidNightArrival?: boolean; minComfort?: number }) {
  const out = list.filter((f) => {
    const h = parseHour(f.arriveTime)
    const nightOk = !opts.avoidNightArrival || !isNight(h)
    const cabins = Array.isArray(f.cabin) ? f.cabin : []
    const comfortOk = opts.minComfort == null ? true : cabins.some((c) => comfortOf(String(c.code || '')) >= Number(opts.minComfort))
    return nightOk && comfortOk
  })
  const sorted = out.sort((a, b) => {
    const ap = priceOf(a)
    const bp = priceOf(b)
    if (ap != null && bp != null && ap !== bp) return ap - bp
    const ad = timeVal(a.departTime)
    const bd = timeVal(b.departTime)
    return ad - bd
  })
  return sorted
}

function priceOf(f: Flight): number | null {
  const cabins = Array.isArray(f.cabin) ? f.cabin : []
  const prices = cabins.map((c) => Number(c.price || 1e9))
  const p = Math.min(...(prices.length ? prices : [1e9]))
  return p === 1e9 ? null : p
}

function timeVal(s: string): number {
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.getTime()
  const m = /(\d{2}):(\d{2})/.exec(s)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  return Number.MAX_SAFE_INTEGER
}
