import { geo, directionTransit, directionDriving, planWalking, weather } from '../mcp/amap.js'
import { cacheGet, cacheSet } from './cache.js'

type Loc = { lat: number; lng: number }

async function geocode(city: string, name: string): Promise<Loc | null> {
  try {
    const ck = `geo:${city}:${name}`
    const cached = await cacheGet<Loc>(ck)
    if (cached) return cached
    const data = await geo({ address: name, city })
    const item = Array.isArray(data?.results) ? data.results[0] : data?.result || data?.[0]
    const lat = Number(item?.location?.lat ?? item?.lat)
    const lng = Number(item?.location?.lng ?? item?.lng)
    if (!isNaN(lat) && !isNaN(lng)) {
      const loc = { lat, lng }
      await cacheSet(ck, loc, Number(process.env.CACHE_TTL_GEO || 300))
      return loc
    }
  } catch {}
  return null
}

function fmt(loc: Loc) {
  return `${loc.lat},${loc.lng}`
}

function classify(name: string): 'airport' | 'station' | 'poi' {
  const s = String(name)
  if (/机场|T\d/.test(s)) return 'airport'
  if (/火车站|高铁站|站$/.test(s)) return 'station'
  return 'poi'
}

function haversine(a: Loc, b: Loc): number {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const aa = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
  return R * c
}

function heuristicMin(kind: { from: 'airport' | 'station' | 'poi'; to: 'airport' | 'station' | 'poi' }, distanceKm: number): number {
  if (kind.from === 'airport' && kind.to === 'airport') return Math.max(60, distanceKm > 10 ? 120 : 90)
  if (kind.from === 'station' && kind.to === 'station') return Math.max(45, distanceKm > 8 ? 75 : 60)
  if ((kind.from === 'airport' && kind.to === 'station') || (kind.from === 'station' && kind.to === 'airport')) return Math.max(90, distanceKm > 15 ? 120 : 90)
  return Math.max(30, distanceKm > 5 ? 45 : 30)
}

export async function planTransfer(city: string, fromName: string, toName: string): Promise<{ minutes: number; mode: string }> {
  const from = await geocode(city, fromName)
  const to = await geocode(city, toName)
  if (!from || !to) return { minutes: 90, mode: 'unknown' }
  const o = fmt(from)
  const d = fmt(to)
  let bestMin = 1e9
  let bestMode = 'unknown'
  try {
    const walkKey = `plan:walk:${from.lat},${from.lng}->${to.lat},${to.lng}`
    const wc = await cacheGet<any>(walkKey)
    const walk = wc || (await planWalking({ origin: `${from.lng},${from.lat}`, destination: `${to.lng},${to.lat}` }))
    const wmin = Number(walk?.duration ?? 1e9) / 60
    if (wmin < bestMin) {
      bestMin = Math.round(wmin)
      bestMode = 'walking'
    }
    if (!wc) await cacheSet(walkKey, walk, Number(process.env.CACHE_TTL_ROUTE || 180))
  } catch {}
  try {
    const trKey = `plan:transit:${o}->${d}`
    const tc = await cacheGet<any>(trKey)
    const transit = tc || (await directionTransit({ from: o, to: d }))
    const tmin = Number(transit?.duration ?? 1e9) / 60
    if (tmin < bestMin) {
      bestMin = Math.round(tmin)
      bestMode = 'transit'
    }
    if (!tc) await cacheSet(trKey, transit, Number(process.env.CACHE_TTL_ROUTE || 180))
  } catch {}
  try {
    const drKey = `plan:driving:${o}->${d}`
    const dc = await cacheGet<any>(drKey)
    const driving = dc || (await directionDriving({ from: o, to: d }))
    const dmin = Number(driving?.duration ?? 1e9) / 60
    if (dmin < bestMin) {
      bestMin = Math.round(dmin)
      bestMode = 'driving'
    }
    if (!dc) await cacheSet(drKey, driving, Number(process.env.CACHE_TTL_ROUTE || 180))
  } catch {}
  if (!isFinite(bestMin) || bestMin === 1e9) return { minutes: 90, mode: 'unknown' }
  return { minutes: Math.max(30, bestMin), mode: bestMode }
}

export async function planTransferDetailed(city: string, fromName: string, toName: string): Promise<{ minutes: number; mode: string; distanceKm: number; kind: string }> {
  const from = await geocode(city, fromName)
  const to = await geocode(city, toName)
  if (!from || !to) return { minutes: 90, mode: 'unknown', distanceKm: 0, kind: 'unknown' }
  const distKm = Number(haversine(from, to).toFixed(2))
  const k = { from: classify(fromName), to: classify(toName) }
  const minHeuristic = heuristicMin(k, distKm)
  const base = await planTransfer(city, fromName, toName)
  // 天气分级影响接驳缓冲
  let severityFactor = 1
  try {
    const w = await weather({ city, extensions: 'base' })
    const text = String(w?.weather || w?.text || '').toLowerCase()
    if (/暴雨|heavy rain|storm/.test(text)) severityFactor = 1.3
    else if (/大雪|heavy snow/.test(text)) severityFactor = 1.25
    else if (/雨|snow/.test(text)) severityFactor = 1.15
    else if (/大风|wind|fog|雾/.test(text)) severityFactor = 1.1
  } catch {}
  // 早晚高峰适度增加缓冲
  const hour = new Date().getHours()
  const rushFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.1 : 1
  const minutes = Math.max(minHeuristic, Math.round(base.minutes * severityFactor * rushFactor))
  const kind = k.from === k.to ? (k.from === 'airport' ? 'same_airport' : k.from === 'station' ? 'same_station' : 'same_poi') : `${k.from}_to_${k.to}`
  return { minutes, mode: base.mode, distanceKm: distKm, kind }
}
