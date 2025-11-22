import axios from 'axios'
import fs from 'fs'

const BASE = 'http://localhost:5173/api' // simulate frontend proxy
const cities = ['北京','上海','广州','深圳','杭州','南京','成都','重庆','西安','武汉','乌鲁木齐']

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function distinctPair(){ const o=pick(cities); let d=pick(cities); while(d===o){ d=pick(cities) } return { o,d } }

function genPairIntent(n){ const out=[]; for(let i=0;i<n;i++){ const {o,d}=distinctPair(); out.push(`${o}飞${d}最省钱的旅行方案`) } return out }
function genCityIntent(n){ const out=[]; for(let i=0;i<n;i++){ const c=pick(cities); out.push(`请推荐${c}的酒店与三日旅游路线`) } return out }

function parseIntent(q){
  const m = q.match(/[\u4e00-\u9fa5]{2,}\s*(到|至|飞)\s*[\u4e00-\u9fa5]{2,}/)
  if (m) {
    const mm = q.match(/([\u4e00-\u9fa5]{2,})\s*(到|至|飞)\s*([\u4e00-\u9fa5]{2,})/)
    return { type:'pair', origin:mm[1], destination:mm[3] }
  }
  const mc = q.match(/请推荐([\u4e00-\u9fa5]{2,})的酒店与三日旅游路线/)
  if (mc) return { type:'city', city: mc[1] }
  return { type:'chat' }
}

async function run(){
  const list=[...genPairIntent(250), ...genCityIntent(250)]
  let ok=0, total=list.length
  let pairOk=0, cityOk=0
  const failures=[]
  const batchSize=25
  for(let i=0;i<list.length;i+=batchSize){
    const batch=list.slice(i,i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      const intent = parseIntent(q)
      try {
        if (intent.type==='pair'){
          const date='2025-12-01'
          const r1 = await axios.post(`${BASE}/llm/recommendations`, { origin:intent.origin, destination:intent.destination, date }, { timeout: 20000 })
          const r2 = await axios.get(`${BASE}/compiled/recommendations`, { params:{ city:intent.destination, origin:intent.origin, destination:intent.destination, date, budgetMax:600, ratingMin:3, interests:'美食', limit:40 }, timeout: 20000 })
          const d=r2.data||{}
          const hotelsOk = Array.isArray(d.hotels) && d.hotels.length>0
          const poiOk = Array.isArray(d.poi) && d.poi.length>0
          const weatherOk = !!d.weather
          if (r1.status===200 && hotelsOk && poiOk && weatherOk){ ok++; pairOk++ } else { failures.push({ q, reason:'pair_validation_failed', data:{ d } }) }
        } else if (intent.type==='city'){
          const date='2025-12-01'
          const r = await axios.get(`${BASE}/compiled/recommendations`, { params:{ city:intent.city, date, budgetMax:600, ratingMin:3, interests:'美食', limit:40 }, timeout: 20000 })
          const d=r.data||{}
          const hotelsOk = Array.isArray(d.hotels) && d.hotels.length>0
          const poiOk = Array.isArray(d.poi) && d.poi.length>0
          const weatherOk = !!d.weather
          if (r.status===200 && hotelsOk && poiOk && weatherOk){ ok++; cityOk++ } else { failures.push({ q, reason:'city_validation_failed', data:{ d } }) }
        } else {
          const r = await axios.post(`${BASE}/llm/chat`, { text:q }, { timeout: 15000 })
          const content = String(r?.data?.content||'')
          if (r.status===200 && content.length>0){ ok++ } else { failures.push({ q, reason:'chat_validation_failed' }) }
        }
      } catch (e) {
        failures.push({ q, reason:'request_error', error: String(e) })
      }
    }))
    // progress log chunk
    console.log(`progress: ${Math.min(i+batchSize,total)}/${total}`)
  }
  const summary={ total, ok, pairOk, cityOk, okRate: Number((ok/total*100).toFixed(2)), failuresCount: failures.length }
  try { fs.writeFileSync('backend/scripts/test_front_qa_500.out.json', JSON.stringify({ summary, failures }, null, 2)) } catch {}
  console.log('TEST_FRONT_QA_SUMMARY:', JSON.stringify(summary))
}

run()