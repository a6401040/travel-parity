import { callLLM } from './providers.js'
import { env } from '../config/env.js'
import { LLMOutputSchema } from '../schemas/llm.js'

export async function generateRecommendationsLLM(payload: Record<string, unknown>) {
  const system = '你是智能旅行票务分析师。可聚合铁路12306 MCP的实时铁路信息与数据库 c_trip_data_new 的各航司机票方案。严格依据提供的上下文生成JSON，不得虚构数据。仅输出两部分方案：timeFirst（时间最优）与priceFirst（价格最优），balanced 保持为空数组。价格字段必须严格从 flights/trains 数据中复制的精确数值（人民币），绝不能出现“约”“大约”等模糊字样；如价格缺失则置空并在 needs_more_data 中注明 "missing_price"。对日期解析需支持中文自然语言（如“今天/明天/后天/大后天/下周一/11月28日”），但若输入为自然语言且未提供明确 yyyy-MM-dd，则在 needs_more_data 中加入 "ambiguous_date" 并不臆断日期。输出内容仅限：路线规划、航线或铁路班次规划、费用说明、行程优点，禁止返回与出行无关的文本。字段不足则返回 needs_more_data。只返回JSON，不要文本。航班数据来自近10天的 c_trip_data_new（使用 IATA 机场三字码查询）；铁路数据来自 12306 MCP。若航班为空或日期超出范围，请在 needs_more_data 中包含 "no_flight_data"，并在 schemes 中不填充虚假价格，同时建议更换日期或选择其他交通方式。'
  const user = JSON.stringify(payload)
  const res = await callLLM(
    [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    { model: env.LLM_MODEL || 'deepseek-chat', temperature: Number(env.LLM_TEMPERATURE || 0.2), max_tokens: Number(env.LLM_MAX_TOKENS || 2048) }
  )
  const raw = res.choices?.[0]?.message?.content || '{}'
  const clean = (() => {
    let s = raw.trim()
    // 去除 ```json ... ``` 包裹
    const fenceMatch = s.match(/```json[\s\S]*?```/i)
    if (fenceMatch) {
      s = fenceMatch[0].replace(/```json/i, '').replace(/```/g, '').trim()
    }
    // 如果仍解析失败，截取最外层花括号
    try { JSON.parse(s); return s } catch {}
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start >= 0 && end > start) {
      s = s.slice(start, end + 1)
    }
    return s
  })()
  try {
    const parsed = JSON.parse(clean)
    const output = LLMOutputSchema.parse(parsed)
    return { ...output, schemes: { timeFirst: output.schemes.timeFirst, priceFirst: output.schemes.priceFirst, balanced: [] } }
  } catch {
    return { schemes: { timeFirst: [], priceFirst: [], balanced: [] }, needs_more_data: ['llm_response_invalid'] }
  }
}
