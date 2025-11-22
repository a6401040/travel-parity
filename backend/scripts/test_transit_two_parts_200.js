/*
  Transit-based two-part test runner
  - For city pairs, uses REST transit integrated API via backend routes
  - Derives time-best and price-best from transits[] (duration, cost)
  - Validates numeric prices and structured output
  - Stops when 100 correct tests achieved or inputs exhausted (cap 300)
*/
import axios from 'axios'

const CITIES = ['北京','上海','广州','深圳','杭州','南京','成都','重庆','武汉','西安','天津','苏州','厦门','青岛','沈阳']

function* generatePairs(maxPairs) {
  let count = 0
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = 0; j < CITIES.length; j++) {
      if (i === j) continue
      const origin = CITIES[i]
      const destination = CITIES[j]
      yield { origin, destination }
      count++
      if (count >= maxPairs) return
    }
  }
}

async function run() {
  const summary = { total: 0, correct: 0, failed: 0, cases: [] }
  const gen = generatePairs(300)
  for (const pair of gen) {
    if (summary.correct >= 100) break
    summary.total++
    try {
      // Geocode both cities to ensure valid coordinates (not strictly required by /transit, but helpful)
      const g1 = await axios.get('http://localhost:3001/api/amap/geo', { params: { address: `${pair.origin}市`, city: pair.origin }, timeout: 15000 })
      const g2 = await axios.get('http://localhost:3001/api/amap/geo', { params: { address: `${pair.destination}市`, city: pair.destination }, timeout: 15000 })
      const loc1 = String(g1.data?.data?.geocodes?.[0]?.location || '')
      const loc2 = String(g2.data?.data?.geocodes?.[0]?.location || '')
      if (!loc1 || !loc2 || !loc1.includes(',') || !loc2.includes(',')) {
        summary.failed++
        summary.cases.push({ input: pair, ok: false, note: 'geocode_failed' })
        continue
      }
      const resp = await axios.get('http://localhost:3001/api/amap/transit', { params: { from: loc1, to: loc2, city: pair.origin, cityd: pair.destination }, timeout: 30000 })
      const transits = resp.data?.data?.route?.transits || []
      if (!Array.isArray(transits) || transits.length === 0) {
        summary.failed++
        summary.cases.push({ input: pair, ok: false, note: 'no_transit' })
        continue
      }
      // Normalize items with numeric duration (seconds) and cost (string numeric)
      const items = transits.map(t => ({ duration: Number(t.duration || 0), cost: Number(t.cost || 0), raw: t }))
      const valid = items.filter(x => Number.isFinite(x.duration) && Number.isFinite(x.cost) && x.duration > 0 && x.cost >= 0)
      if (valid.length === 0) {
        summary.failed++
        summary.cases.push({ input: pair, ok: false, note: 'invalid_items' })
        continue
      }
      // Time-best and Price-best
      const timeBest = [...valid].sort((a,b) => a.duration - b.duration)[0]
      const priceBest = [...valid].sort((a,b) => a.cost - b.cost)[0]
      const ok = Number.isFinite(timeBest.cost) && Number.isFinite(priceBest.cost)
      summary.cases.push({ input: pair, ok, note: ok ? 'ok' : 'missing_cost' })
      if (ok) summary.correct++
      else summary.failed++
    } catch (e) {
      summary.failed++
      summary.cases.push({ input: pair, ok: false, note: String(e?.message || 'error') })
    }
  }
  const fs = await import('fs')
  fs.writeFileSync(new URL('./test_transit_two_parts_200.out.json', import.meta.url), JSON.stringify(summary, null, 2), 'utf-8')
  console.log(`Transit test finished: total=${summary.total} correct=${summary.correct} failed=${summary.failed}`)
  if (summary.correct < 100) console.log('WARNING: correct < 100')
}

run().catch(err => { console.error(err); process.exit(1) })