import OpenAI from 'openai'
import { env } from '../config/env.js'
import { circuitAllow, circuitFail, circuitOk, withRetry } from '../services/circuit.js'

function clientOf(provider: string) {
  if (provider === 'siliconflow') {
    if (!env.SILICONFLOW_API_KEY || !env.SILICONFLOW_BASE_URL) throw new Error('missing_siliconflow')
    return new OpenAI({ apiKey: env.SILICONFLOW_API_KEY, baseURL: env.SILICONFLOW_BASE_URL })
  }
  if (provider === 'deepseek') {
    if (!env.DEEPSEEK_API_KEY || !env.DEEPSEEK_BASE_URL) throw new Error('missing_deepseek')
    return new OpenAI({ apiKey: env.DEEPSEEK_API_KEY, baseURL: env.DEEPSEEK_BASE_URL })
  }
  if (provider === 'bailian') {
    if (!env.BAILIAN_API_KEY || !env.BAILIAN_BASE_URL) throw new Error('missing_bailian')
    return new OpenAI({ apiKey: env.BAILIAN_API_KEY, baseURL: env.BAILIAN_BASE_URL })
  }
  throw new Error('unknown_provider')
}

function chain(): string[] {
  const def = ['deepseek', 'siliconflow', 'bailian']
  const c = env.LLM_PROVIDER_CHAIN?.split(',').map((s) => s.trim()).filter(Boolean)
  return c && c.length ? c : def
}

function modelOf(provider: string, requested?: string) {
  if (requested) return requested
  if (provider === 'siliconflow') return env.SILICONFLOW_MODEL || 'Qwen/QwQ-32B'
  if (provider === 'deepseek') return env.DEEPSEEK_MODEL || env.LLM_MODEL || 'deepseek-chat'
  if (provider === 'bailian') return env.BAILIAN_MODEL || 'qwen-turbo'
  return 'gpt-4o-mini'
}

export async function callLLM(messages: { role: 'system' | 'user'; content: string }[], opts: { model?: string; temperature?: number; max_tokens?: number }) {
  const providers = chain()
  const errors: any[] = []
  for (const p of providers) {
    if (!circuitAllow(`llm:${p}`)) {
      errors.push({ provider: p, error: 'circuit_open' })
      continue
    }
    try {
      const client = clientOf(p)
      const res = await withRetry(() => client.chat.completions.create({ model: modelOf(p, opts.model), messages, temperature: opts.temperature ?? 0.2, max_tokens: opts.max_tokens ?? 2048 }), 2, 200)
      circuitOk(`llm:${p}`)
      return res
    } catch (e: any) {
      circuitFail(`llm:${p}`)
      errors.push({ provider: p, error: e?.message || 'error' })
      continue
    }
  }
  const err = new Error('llm_chain_failed') as any
  err.details = errors
  throw err
}
