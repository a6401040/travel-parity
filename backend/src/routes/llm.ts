import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { generateRecommendationsLLM } from '../llm/deepseek.js'
import { fetchTrainOptions } from '../mcp/rail.js'
import { fetchFlightsByCityDate, fetchFlightsByIataDate } from '../db/flights.js'
import { searchHotels, searchPoi } from '../mcp/amap.js'
import { generateRoutes } from '../services/routes.js'
import { pruneTrains, pruneFlights } from '../services/prune.js'

const ReqSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  date: z.string(),
  timeFlex: z.number().optional(),
  budget: z.number().optional(),
  constraints: z
    .object({ maxTransfers: z.number().optional(), minComfort: z.number().optional(), riskTolerance: z.number().optional(), avoidNightArrival: z.boolean().optional() })
    .optional(),
  preferences: z.object({ interests: z.array(z.string()).optional(), preferTrain: z.boolean().optional(), preferFlight: z.boolean().optional() }).optional(),
  context: z.record(z.any()).optional()
})

export const router = Router()

router.post('/llm/recommendations', async (req, res) => {
  try {
    if (!env.DEEPSEEK_API_KEY) {
      return res.status(400).json({ error: 'missing_api_key', message: '请在环境变量设置 DEEPSEEK_API_KEY' })
    }
    const input = ReqSchema.parse(req.body)
    const nextDay = (() => {
      const d = new Date(`${input.date}T00:00:00`)
      d.setDate(d.getDate() + 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    })()
    const hotelRatingMin = (() => {
      const c = input.constraints?.minComfort
      if (typeof c !== 'number') return undefined
      const v = c / 20
      return Math.max(0, Math.min(5, v))
    })()
    const poiRatingMin = hotelRatingMin
    const budgetMax = typeof input.budget === 'number' ? input.budget : undefined
    const [trainsRaw, flightsRaw, hotels, poi, routes] = await Promise.all([
      fetchTrainOptions({ origin: input.origin, destination: input.destination, date: input.date, timeFlex: input.timeFlex }),
      (async () => {
        const fi = cityToPrimaryIata(input.origin)
        const ti = cityToPrimaryIata(input.destination)
        if (fi && ti) {
          return await fetchFlightsByIataDate({ date: input.date, fromIata: fi, toIata: ti, limit: 200 })
        }
        return await fetchFlightsByCityDate({ date: input.date, fromCity: input.origin, toCity: input.destination, limit: 200 })
      })(),
      env.GAODE_MCP_BASE_URL
        ? searchHotels({ city: input.destination, checkin: input.date, checkout: nextDay, budgetMin: undefined, budgetMax, ratingMin: hotelRatingMin, nearPoi: undefined, limit: 50 }).catch(() => [])
        : Promise.resolve([]),
      env.GAODE_MCP_BASE_URL
        ? searchPoi({ city: input.destination, interests: input.preferences?.interests, ratingMin: poiRatingMin, limit: 60 }).catch(() => [])
        : Promise.resolve([]),
      env.GAODE_MCP_BASE_URL
        ? generateRoutes({ city: input.destination, days: 3, interests: input.preferences?.interests, ratingMin: poiRatingMin, limit: 60 }).catch(() => [])
        : Promise.resolve([])
    ])
    const trains = pruneTrains(trainsRaw as any, { avoidNightArrival: input.constraints?.avoidNightArrival, maxTransfers: input.constraints?.maxTransfers })
    const flights = pruneFlights(flightsRaw as any, { avoidNightArrival: input.constraints?.avoidNightArrival, minComfort: input.constraints?.minComfort })
    const combos = await (async () => {
      try {
        const { buildCombos } = await import('../services/combo.js')
        return await buildCombos({ origin: input.origin, destination: input.destination, date: input.date, constraints: input.constraints })
      } catch {
        return null
      }
    })()
    const payload = {
      meta: { origin: input.origin, destination: input.destination, date: input.date, timeFlex: input.timeFlex, budget: input.budget, constraints: input.constraints, preferences: input.preferences },
      trains: trains.slice(0, 30),
      flights: flights.slice(0, 30),
      hotels: hotels.slice(0, 50),
      poi: poi.slice(0, 60),
      routes: routes.slice(0, 5),
      engineCombos: combos || undefined,
      stats: {
        trainCount: trains.length,
        flightCount: flights.length,
        hotelAvgRating: hotels.length ? Number((hotels.reduce((s: number, h: any) => s + (h.rating || 0), 0) / hotels.length).toFixed(2)) : 0,
        poiCount: poi.length
      },
      ...(input.context || {})
    }
    const guidance = {
      note: '航班数据来自近10天的 c_trip_data_new，查询使用机场三字码(IATA)。当航班为空或日期超出范围，请明确说明并给出替代建议（更换日期/优先高铁/先到最近大城市再转运）。'
    }
    const data = await generateRecommendationsLLM({ ...payload, guidance })
    res.json(data)
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'llm_error'
    res.status(500).json({ error: 'llm_error', message: msg })
  }
})

router.post('/llm/chat', async (req, res) => {
  try {
    const body = z.object({ text: z.string().min(1) }).parse(req.body)
    const data = await (async () => {
      const { callLLM } = await import('../llm/providers.js')
      const r = await callLLM([
        { role: 'system', content: '你是一个助理，请自然回答用户问题。' },
        { role: 'user', content: body.text }
      ], { model: env.LLM_MODEL || 'deepseek-chat', temperature: Number(env.LLM_TEMPERATURE || 0.3), max_tokens: Number(env.LLM_MAX_TOKENS || 1024) })
      const c = r?.choices?.[0]?.message?.content || ''
      return { content: c }
    })()
    res.json(data)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})

router.get('/llm/selftest', async (req, res) => {
  try {
    if (!env.DEEPSEEK_API_KEY) {
      return res.status(400).json({ error: 'missing_api_key', message: '请在环境变量设置 DEEPSEEK_API_KEY' })
    }
    const payload = { meta: { origin: '广州', destination: '保定', date: '2025-12-01' } }
    const data = await generateRecommendationsLLM(payload)
    res.json({ ok: true, sample: data })
  } catch (e: any) {
    res.status(500).json({ error: 'selftest_failed', message: e?.message || 'error' })
  }
})
function cityToPrimaryIata(city: string): string | null {
  const map: Record<string, string> = {
    '广州': 'CAN',
    '乌鲁木齐': 'URC',
    '北京': 'PEK',
    '上海': 'PVG',
    '深圳': 'SZX',
    '杭州': 'HGH',
    '南京': 'NKG',
    '成都': 'CTU',
    '重庆': 'CKG',
    '西安': 'XIY',
    '武汉': 'WUH'
  }
  return map[city] || null
}
