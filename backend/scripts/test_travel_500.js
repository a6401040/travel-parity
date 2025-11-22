import axios from 'axios'
import fs from 'fs'

const BASE = 'http://localhost:3001'
const cities = ['北京','上海','广州','深圳','杭州','南京','成都','重庆','西安','武汉','青岛','厦门','苏州','合肥','长沙']
const interestsPool = ['博物馆','美食','亲子','历史','自然','艺术','夜景','商圈','海滨','徒步']

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function distinctPair(){ const o=pick(cities); let d=pick(cities); while(d===o){ d=pick(cities) } return { o,d } }

function genTraveler(n){ const out=[]; for(let i=0;i<n;i++){ const {o,d}=distinctPair(); const intent=pick(['最省钱','最快','最舒适','最少换乘']); out.push({ type:'traveler', text:`${o}到${d}的${intent}方案`, origin:o, destination:d }) } return out }
function genTourist(n){ const out=[]; for(let i=0;i<n;i++){ const c=pick(cities); const it=pick(interestsPool); out.push({ type:'tourist', text:`${c}的${it}推荐和天气情况`, city:c, interests:[it] }) } return out }

async function run(){
  const traveler=genTraveler(250)
  const tourist=genTourist(250)
  const all=[...traveler, ...tourist]
  let total=all.length, ok=0
  let travelerOK=0, touristOK=0
  const batchSize=25
  for(let i=0;i<all.length;i+=batchSize){
    const batch=all.slice(i,i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      try{
        if(q.type==='traveler'){
          const r = await axios.post(`${BASE}/api/llm/recommendations`, { origin: q.origin, destination: q.destination, date: '2025-12-01', preferences:{}, constraints:{} }, { timeout: 15000 })
          if(r.status===200){ ok++; travelerOK++; }
        } else {
          const r = await axios.post(`${BASE}/api/llm/recommendations`, { origin: q.city, destination: q.city, date: '2025-12-01', preferences:{ interests: q.interests }, constraints:{} }, { timeout: 15000 })
          if(r.status===200){ ok++; touristOK++; }
        }
      }catch(e){ }
    }))
    if((i+batchSize)%100===0){ console.log(`progress: ${Math.min(i+batchSize,total)}/${total}`) }
  }
  const summary={ total, ok, travelerOK, touristOK, okRate: Number((ok/total*100).toFixed(2)) }
  try{ fs.writeFileSync('backend/scripts/test_travel_500.out.json', JSON.stringify(summary,null,2)) }catch{}
  console.log('TEST_TRAVEL_SUMMARY:', JSON.stringify(summary))
}

run()