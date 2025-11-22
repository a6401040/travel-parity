/*
  Two-part structured recommendation test runner
  - Generates up to 200 test queries (dates × city pairs)
  - Calls local /api/llm/recommendations
  - Validates two-part format: timeFirst and priceFirst present, numeric prices
  - Stops when 100 correct tests achieved or inputs exhausted
  - Writes a JSON summary to backend/scripts/test_two_parts_200.out.json
*/
import axios from 'axios'

const ORIGIN_CITIES = ['广州','深圳','上海','杭州','南京','成都','重庆','武汉','西安','北京']
const DEST_CITIES = ['北京','上海','广州','深圳','杭州','南京','成都','重庆','武汉','西安']

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function* generateCases(maxDays, maxPairs) {
  const today = new Date()
  // Use past 10 days (inclusive) to match flight table constraint
  const days = Math.min(maxDays, 10)
  let pairCount = 0
  for (let di = 0; di < days; di++) {
    const d = new Date(today)
    d.setDate(d.getDate() - di)
    const date = formatDate(d)
    for (let i = 0; i < ORIGIN_CITIES.length; i++) {
      const origin = ORIGIN_CITIES[i]
      const destination = DEST_CITIES[i]
      if (origin === destination) continue
      yield { origin, destination, date }
      pairCount++
      if (pairCount >= maxPairs) break
    }
  }
}

function isNumeric(n) {
  return typeof n === 'number' && Number.isFinite(n)
}

function validateScheme(s) {
  if (!s) return false
  const okTotals = isNumeric(s.totalPrice) && isNumeric(s.totalTimeMinutes) && isNumeric(s.transfers)
  const okSegs = Array.isArray(s.segments) && s.segments.length > 0 && s.segments.every(seg => isNumeric(seg.price))
  return okTotals && okSegs
}

async function run() {
  const summary = { total: 0, correct: 0, failed: 0, cases: [] }
  const maxCases = 200
  const targetCorrect = 100
  const gen = generateCases(10, maxCases)
  for (const tc of gen) {
    if (summary.correct >= targetCorrect) break
    summary.total++
    try {
      const resp = await axios.post('http://localhost:3001/api/llm/recommendations', {
        origin: tc.origin,
        destination: tc.destination,
        date: tc.date,
        timeFlex: 0,
        preferences: {},
        constraints: {}
      }, { timeout: 25000 })
      const data = resp.data || {}
      const tf = Array.isArray(data?.schemes?.timeFirst) ? data.schemes.timeFirst[0] : null
      const pf = Array.isArray(data?.schemes?.priceFirst) ? data.schemes.priceFirst[0] : null
      const ok = validateScheme(tf) && validateScheme(pf)
      summary.cases.push({ input: tc, ok, note: ok ? 'ok' : `invalid_two_part_or_price` })
      if (ok) summary.correct++
      else summary.failed++
    } catch (e) {
      summary.failed++
      summary.cases.push({ input: tc, ok: false, note: String(e?.message || 'error') })
    }
  }
  // Write out
  const fs = await import('fs')
  fs.writeFileSync(new URL('./test_two_parts_200.out.json', import.meta.url), JSON.stringify(summary, null, 2), 'utf-8')
  console.log(`Test finished: total=${summary.total} correct=${summary.correct} failed=${summary.failed}`)
  if (summary.correct < targetCorrect) {
    console.log(`WARNING: correct < ${targetCorrect}. Consider adjusting date range or data sources.`)
  }
}

run().catch(err => { console.error(err); process.exit(1) })