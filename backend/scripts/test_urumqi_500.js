import axios from 'axios'
import fs from 'fs'

const BASE = 'http://localhost:3001'
const origin = '广州'
const destination = '乌鲁木齐'

function genTravel(n){ const out=[]; for(let i=0;i<n;i++){ out.push({ origin, destination, date:'2025-12-01' }) } return out }
function genCity(n){ const out=[]; for(let i=0;i<n;i++){ out.push({ city: destination, date:'2025-12-01', budgetMax:600, ratingMin:3, interests:'美食' }) } return out }

async function run(){
  const A=genTravel(250), B=genCity(250)
  let ok=0, total=A.length+B.length
  let compiledOk=0, schemeOk=0
  const batchSize=25
  for(let i=0;i<A.length;i+=batchSize){
    const batch=A.slice(i,i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      try{
        const r1 = await axios.post(`${BASE}/api/llm/recommendations`, q, { timeout: 20000 })
        if (r1.status===200) schemeOk++
        const r2 = await axios.get(`${BASE}/api/compiled/recommendations`, { params: { city: q.destination, origin:q.origin, destination:q.destination, date:q.date, budgetMax:600, ratingMin:3, interests:'美食', limit:40 }, timeout: 20000 })
        const d=r2.data||{}
        if (r2.status===200 && Array.isArray(d.hotels) && d.hotels.length>0 && Array.isArray(d.poi) && d.poi.length>0 && d.weather) compiledOk++
        ok++
      }catch(e){ }
    }))
  }
  for(let i=0;i<B.length;i+=batchSize){
    const batch=B.slice(i,i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      try{
        const r = await axios.get(`${BASE}/api/compiled/recommendations`, { params: q, timeout: 20000 })
        const d=r.data||{}
        if (r.status===200 && Array.isArray(d.hotels) && d.hotels.length>0 && Array.isArray(d.poi) && d.poi.length>0 && d.weather) { compiledOk++; ok++; }
      }catch(e){ }
    }))
  }
  const summary={ total, ok, compiledOk, schemeOk, okRate: Number((ok/total*100).toFixed(2)) }
  try{ fs.writeFileSync('backend/scripts/test_urumqi_500.out.json', JSON.stringify(summary,null,2)) }catch{}
  console.log('TEST_URUMQI_SUMMARY:', JSON.stringify(summary))
}

run()