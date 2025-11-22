import { callLLM } from './providers.js';
import { env } from '../config/env.js';
import { LLMOutputSchema } from '../schemas/llm.js';
export async function generateRecommendationsLLM(payload) {
    const system = '你是出行推荐编排助手。严格依据提供的上下文生成JSON，不得虚构数据。字段不足则返回needs_more_data。只返回JSON，不要文本。航班数据来自近10天的c_trip_data_new，查询使用机场三字码(IATA)。当航班为空或日期超出范围，请在needs_more_data中包含"no_flight_data"并在schemes中不填充虚假价格；同时建议更换日期或选择其他交通方式。';
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
        return output;
    }
    catch {
        return { schemes: { timeFirst: [], priceFirst: [], balanced: [] }, needs_more_data: ['llm_response_invalid'] };
    }
}
