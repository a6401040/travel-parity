import OpenAI from 'openai'
import { env } from '../config/env.js'

export function getLLM() {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('missing_api_key')
  }
  return new OpenAI({ apiKey: env.DEEPSEEK_API_KEY, baseURL: env.DEEPSEEK_BASE_URL })
}
