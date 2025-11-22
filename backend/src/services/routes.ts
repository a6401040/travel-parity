import { searchPoi, planWalking, planDriving, planTransitIntegrated, getPoiDetail } from '../mcp/amap.js'

export async function generateRoutes(args: { city: string; days?: number; interests?: string[]; ratingMin?: number; limit?: number; startDate?: string }) {
  const days = Math.max(1, Math.min(7, args.days ?? 3))
  const poi = await searchPoi({ city: args.city, interests: args.interests, ratingMin: args.ratingMin, limit: args.limit ?? 60 })
  const enriched = await Promise.all(
    poi.slice(0, Math.min(100, poi.length)).map(async (p) => {
      let detail: any = null
      if (p.poiId) {
        try {
          detail = await getPoiDetail({ id: String(p.poiId) })
        } catch {}
      }
      return { ...p, detail }
    })
  )
  const sorted = enriched.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
  const centers = clusterCenters(sorted, days)
  const grouped = assignToClusters(sorted, centers)
  const dailyPlan = [] as any[]
  for (let d = 1; d <= days; d++) {
    const bucket = grouped[d - 1] || []
    const items = scheduleByOpenHours(bucket, args.startDate)
    dailyPlan.push({ day: d, items })
  }
  let totalDistanceKm = 0
  let totalDurationMin = 0
  for (const day of dailyPlan) {
    for (let i = 1; i < day.items.length; i++) {
      const a = enriched.find((x) => x.name === day.items[i - 1].poiName)
      const b = enriched.find((x) => x.name === day.items[i].poiName)
      if (!a?.location || !b?.location) continue
      const o = `${a.location.lng},${a.location.lat}`
      const dstr = `${b.location.lng},${b.location.lat}`
      let plan: any = null
      try {
        plan = await planWalking({ origin: o, destination: dstr })
      } catch {}
      if (!plan || (plan?.distance || 0) > 2000) {
        try {
          plan = await planTransitIntegrated({ origin: o, destination: dstr, city: args.city, cityd: args.city })
        } catch {}
      }
      if (!plan) {
        try {
          plan = await planDriving({ origin: o, destination: dstr })
        } catch {}
      }
      const dist = Number(plan?.distance || 0)
      const dur = Number(plan?.duration || 0)
      totalDistanceKm += dist / 1000
      totalDurationMin += dur / 60
      day.items[i].transport = plan?.mode || day.items[i].transport
      day.items[i].notes = plan?.notes || day.items[i].notes
    }
  }
  const clusterScore = computeClusterScore(grouped)
  const transferPenalty = Math.max(0, Math.round(totalDurationMin / (days * 480)))
  const feasibilityScore = Math.max(0, 100 - transferPenalty * 10 - (clusterScore.gaps * 5))
  const route = {
    name: `${args.city}${days}日精选`,
    city: args.city,
    days,
    dailyPlan,
    budgetRange: { min: 0, max: 0 },
    notes: '融合开放时段与路径规划的精细草案',
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalDurationMin: Math.round(totalDurationMin),
    scores: { feasibilityScore, clusterScore: clusterScore.score, transferPenalty }
  }
  return [route]
}

function clusterCenters(list: any[], k: number) {
  const centers = [] as any[]
  const step = Math.max(1, Math.floor(list.length / k))
  for (let i = 0; i < k; i++) {
    const p = list[i * step] || list[0]
    centers.push(p?.location || { lat: 0, lng: 0 })
  }
  return centers
}

function assignToClusters(list: any[], centers: any[]) {
  const buckets = centers.map(() => [] as any[])
  for (const p of list) {
    const idx = nearestCenter(p.location, centers)
    buckets[idx].push(p)
  }
  return buckets
}

function nearestCenter(loc: any, centers: any[]) {
  let best = 0
  let bestd = Infinity
  for (let i = 0; i < centers.length; i++) {
    const d = distanceKm(loc, centers[i])
    if (d < bestd) {
      bestd = d
      best = i
    }
  }
  return best
}

function distanceKm(a: any, b: any) {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad((b.lat || 0) - (a.lat || 0))
  const dLon = toRad((b.lng || 0) - (a.lng || 0))
  const lat1 = toRad(a.lat || 0)
  const lat2 = toRad(b.lat || 0)
  const aa = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
  return R * c
}

function scheduleByOpenHours(list: any[], startDate?: string) {
  const items = [] as any[]
  const morning: any[] = []
  const afternoon: any[] = []
  const evening: any[] = []
  for (const p of list) {
    const oh = String(p?.detail?.open_hours || '')
    const slot = pickSlot(oh, p.category, p.rating)
    const obj = { timeSlot: slot, poiId: p.poiId || '', poiName: p.name, transport: '步行/地铁', notes: oh ? `开放:${oh}` : '' }
    if (slot === '上午') morning.push(obj)
    else if (slot === '下午') afternoon.push(obj)
    else evening.push(obj)
  }
  return [...morning, ...afternoon, ...evening].slice(0, Math.max(3, Math.min(6, list.length)))
}

function pickSlot(open: string, category?: string, rating?: number) {
  const r = Number(rating || 0)
  if (/\bclosed\b/i.test(open)) return '下午'
  if (/\b09:|10:/i.test(open)) return r >= 4.5 ? '上午' : '下午'
  if (/\b20:|21:/i.test(open)) return '晚上'
  if (String(category || '').includes('博物馆')) return '上午'
  if (String(category || '').includes('美食')) return '晚上'
  return r >= 4.3 ? '上午' : '下午'
}

function computeClusterScore(buckets: any[]) {
  let gaps = 0
  for (const b of buckets) {
    if (!b.length) gaps += 1
  }
  const score = Math.max(0, 100 - gaps * 20)
  return { score, gaps }
}
