import { callLLM } from './providers.js';
import { env } from '../config/env.js';
import { LLMOutputSchema } from '../schemas/llm.js';
export async function generateRecommendationsLLM(payload) {
    const system = '你是出行推荐编排助手。严格依据提供的上下文生成JSON，不得虚构数据。仅输出两部分方案：timeFirst（时间最优）与priceFirst（价格最优），balanced 保持为空数组。价格字段必须严格从提供的 flights/trains 数据中复制的精确数值（单位人民币），不得出现“约”“大约”等模糊字样；如价格缺失则置空并在 needs_more_data 中注明 "missing_price"。字段不足则返回 needs_more_data。只返回JSON，不要文本。航班数据来自近10天的 c_trip_data_new，查询使用机场三字码(IATA)。当航班为空或日期超出范围，请在 needs_more_data 中包含 "no_flight_data" 并在 schemes 中不填充虚假价格；同时建议更换日期或选择其他交通方式。';
    const user = JSON.stringify(payload);
    const res = await callLLM([
        { role: 'system', content: system },
        { role: 'user', content: user }
    ], { model: env.LLM_MODEL || 'deepseek-chat', temperature: Number(env.LLM_TEMPERATURE || 0.2), max_tokens: Number(env.LLM_MAX_TOKENS || 2048) });
    const raw = res.choices?.[0]?.message?.content || '{}';
    const clean = (() => {
        let s = raw.trim();
        // 去除 ```json ... ``` 包裹
        const fenceMatch = s.match(/```json[\s\S]*?```/i);
        if (fenceMatch) {
            s = fenceMatch[0].replace(/```json/i, '').replace(/```/g, '').trim();
        }
        // 如果仍解析失败，截取最外层花括号
        try {
            JSON.parse(s);
            return s;
        }
        catch { }
        const start = s.indexOf('{');
        const end = s.lastIndexOf('}');
        if (start >= 0 && end > start) {
            s = s.slice(start, end + 1);
        }
        return s;
    })();
    try {
        const parsed = JSON.parse(clean);
        const output = LLMOutputSchema.parse(parsed);
        return { ...output, schemes: { timeFirst: output.schemes.timeFirst, priceFirst: output.schemes.priceFirst, balanced: [] } };
    }
    catch {
        return { schemes: { timeFirst: [], priceFirst: [], balanced: [] }, needs_more_data: ['llm_response_invalid'] };
    }
}
