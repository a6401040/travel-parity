import axios from 'axios'
import fs from 'fs'

const BASE = 'http://localhost:3001'
const cities = ['北京','上海','广州','深圳','杭州','南京','成都','重庆','西安','武汉','青岛','厦门','苏州','合肥','长沙']
const interestsPool = ['博物馆','美食','亲子','历史','自然','艺术','夜景','商圈','海滨','徒步']

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function distinctPair(){ const o=pick(cities); let d=pick(cities); while(d===o){ d=pick(cities) } return { o,d } }

function genTraveler(n){ const out=[]; for(let i=0;i<n;i++){ const {o,d}=distinctPair(); const budget = [300,600,1200,2000][Math.floor(Math.random()*4)]; out.push({ origin:o, destination:d, budgetMax: budget }) } return out }
function genTourist(n){ const out=[]; for(let i=0;i<n;i++){ const c=pick(cities); const it=pick(interestsPool); const budget=[300,600,1200][Math.floor(Math.random()*3)]; out.push({ city:c, interests:[it], budgetMax: budget }) } return out }

async function run(){
  const traveler=genTraveler(250)
  const tourist=genTourist(250)
  let ok=0, hotelOk=0, poiOk=0, routeOk=0, weatherOk=0
  const total=traveler.length+tourist.length
  const batchSize=25
  for(let i=0;i<traveler.length;i+=batchSize){
    const batch=traveler.slice(i,i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      try{
        const r = await axios.get(`${BASE}/api/compiled/recommendations`, { params: { city: q.destination, origin: q.origin, destination: q.destination, date: '2025-12-01', budgetMax: q.budgetMax, ratingMin: 3, interests: interestsPool.slice(0,2), limit: 40 }, timeout: 20000 })
        const d=r.data||{}
        if(d.hotels && d.hotels.length>0) hotelOk++
        if(d.poi && d.poi.length>0) poiOk++
        if(d.routes && d.routes.length>=1) routeOk++
        if(d.weather) weatherOk++
        ok++
      }catch(e){ }
    }))
    console.log(`traveler progress: ${Math.min(i+batchSize, traveler.length)}/${traveler.length}`)
  }
  for(let i=0;i<tourist.length;i+=batchSize){
    const batch=tourist.slice(i,i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      try{
        const r = await axios.get(`${BASE}/api/compiled/recommendations`, { params: { city: q.city, date: '2025-12-01', budgetMax: q.budgetMax, ratingMin: 3, interests: q.interests, limit: 40 }, timeout: 20000 })
        const d=r.data||{}
        if(d.hotels && d.hotels.length>0) hotelOk++
        if(d.poi && d.poi.length>0) poiOk++
        if(d.routes && d.routes.length>=1) routeOk++
        if(d.weather) weatherOk++
        ok++
      }catch(e){ }
    }))
    console.log(`tourist progress: ${Math.min(i+batchSize, tourist.length)}/${tourist.length}`)
  }
  const summary={ total, ok, hotelOk, poiOk, routeOk, weatherOk, okRate: Number((ok/total*100).toFixed(2)) }
  try{ fs.writeFileSync('backend/scripts/test_compiled_500.out.json', JSON.stringify(summary,null,2)) }catch{}
  console.log('TEST_COMPILED_SUMMARY:', JSON.stringify(summary))
}

run()