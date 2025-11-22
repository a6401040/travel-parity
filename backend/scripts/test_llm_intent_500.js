/*
  Node script: generate 500 questions by ratio and test backend LLM endpoints
  Ratios: general 30% (150), factual 30% (150), instruction 20% (100), travel 20% (100)
*/
import axios from 'axios'
import fs from 'fs'

const BASE = 'http://localhost:3001'
const travelKws = ['旅行','路线','行程','推荐','酒店','景点','机票','火车票','航班','列车','高铁','票务','目的地','方案','联运','换乘']

const generalSeeds = [
  '你好', '早上好', '晚安', '讲个笑话', '最近有什么新闻？', '你是谁', '你能做什么', '如何保持专注', '今天心情不错', '分享一个生活小技巧',
  '如何高效阅读', '如何记笔记', '时间管理建议', '如何提升表达能力', '如何健身入门', '饮食建议', '如何学会冥想', '如何处理压力', '如何改善睡眠', '如何与人沟通',
  '如何学习英语', '如何做自我介绍', '如何写简历', '如何准备面试', '如何制定目标', '习惯养成技巧', '效率工具推荐', '如何管理待办', '如何写周报', '如何做会议纪要'
]
const factualSeeds = [
  '中国人口有多少', '光速是多少', '地球半径是多少', '泰勒展开是什么', 'HTTP 是什么', 'TCP 与 UDP 的区别', 'MySQL 索引的作用', '什么是二叉树', '冒泡排序复杂度', 'React 和 Vue 的区别',
  'Element Plus 是什么', 'TypeScript 泛型是什么', '什么是RESTful', '什么是JWT', '什么是OAuth2', 'Docker 是什么', 'Kubernetes 是什么', '什么是CDN', '什么是DNS', 'IPv6 与 IPv4 区别',
  '什么是缓存穿透', '什么是雪崩效应', '一致性哈希是什么', '什么是事务隔离级别', 'ACID 是什么', 'CAP 定理是什么', '布隆过滤器是什么', '二进制是什么', 'Linux 文件权限含义', 'Git rebase 是什么'
]
const instructionSeeds = [
  '写一封感谢信', '写一封道歉信', '写一个活动邀请函', '给我一段TypeScript泛型示例', '写一段Java接口示例', '写一个正则表达式示例', '帮我写一个会议议程', '写一个项目计划摘要', '生成一个周报模板', '生成一个需求文档大纲',
  '总结AI趋势', '写一段产品文案', '生成一个FAQ列表', '写一个用户指南开头', '写一个release note 示例', '生成一个提示词指南', '写一个求职邮件', '给出一次面试问题清单', '写一个工程代码规范摘要', '生成一个隐私政策段落'
]
const cities = ['北京','上海','广州','深圳','杭州','南京','成都','重庆','西安','武汉']
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

function genGeneral(n){ const out=[]; for(let i=0;i<n;i++){ out.push(pick(generalSeeds)) } return out }
function genFactual(n){ const out=[]; for(let i=0;i<n;i++){ out.push(pick(factualSeeds)) } return out }
function genInstruction(n){ const out=[]; for(let i=0;i<n;i++){ out.push(pick(instructionSeeds)) } return out }
function genTravel(n){ const out=[]; for(let i=0;i<n;i++){ const o=pick(cities), d=pick(cities.filter(x=>x!==o)); const t=['三日行程推荐','机票查询','火车票推荐','酒店和景点推荐','联运换乘建议']; out.push(`${o}到${d}的${pick(t)}`) } return out }

function isTravelIntent(text){ const t=String(text).toLowerCase(); return travelKws.some(k=>t.includes(k)) }

async function run(){
  const general = genGeneral(150)
  const factual = genFactual(150)
  const instruction = genInstruction(100)
  const travel = genTravel(100)
  const all = [...general, ...factual, ...instruction, ...travel]
  let ok=0, total=all.length
  let nonTravelCount=general.length+factual.length+instruction.length
  let nonTravelCorrect=0
  let travelCount=travel.length
  let travelOK=0
  let routingCorrect=0
  const batchSize = 25
  for (let i=0; i<all.length; i+=batchSize){
    const batch = all.slice(i, i+batchSize)
    await Promise.all(batch.map(async (q)=>{
      const travelIntent = isTravelIntent(q)
      try {
        if (travelIntent){
          const r = await axios.post(`${BASE}/api/llm/recommendations`, { origin: pick(cities), destination: pick(cities), date: '2025-12-01', preferences:{}, constraints:{} }, { timeout: 15000 })
          if (r.status===200){ ok++; travelOK++; routingCorrect++; }
        } else {
          const r = await axios.post(`${BASE}/api/llm/chat`, { text: q }, { timeout: 15000 })
          const content = String(r?.data?.content||'')
          const bad = travelKws.some(k=>content.includes(k))
          if (r.status===200 && content.length>0 && !bad){ ok++; nonTravelCorrect++; routingCorrect++; }
        }
      } catch(e){ /* ignore errors for summary */ }
    }))
    if ((i+batchSize) % 100 === 0){
      console.log(`progress: ${Math.min(i+batchSize, total)}/${total}`)
    }
  }
  const summary = {
    total,
    ok,
    nonTravelCount,
    nonTravelCorrect,
    travelCount,
    travelOK,
    routingCorrect,
    okRate: Number((ok/total*100).toFixed(2)),
    nonTravelCorrectRate: Number((nonTravelCorrect/nonTravelCount*100).toFixed(2)),
    travelOKRate: Number((travelOK/travelCount*100).toFixed(2)),
    routingCorrectRate: Number((routingCorrect/total*100).toFixed(2)),
  }
  try { fs.writeFileSync('backend/scripts/test_llm_intent_500.out.json', JSON.stringify(summary, null, 2)) } catch {}
  console.log('TEST_SUMMARY:', JSON.stringify(summary))
}

run()