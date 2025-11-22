import axios from 'axios'
import { env } from '../config/env.js'
import { TrainOptionSchema, TrainOption } from '../schemas/train.js'
import { cacheGet, cacheSet, rateLimit } from '../services/cache.js'
import { circuitAllow, circuitFail, circuitOk, withRetry } from '../services/circuit.js'
import { metrics } from '../services/metrics.js'

const baseURL = env.MCP_12306_BASE_URL?.replace(/\/$/, '') || ''
const client = axios.create({ baseURL })

async function callTool<T = any>(name: string, args: Record<string, any>): Promise<T> {
  const url = `${baseURL}/mcp`
  const body = { type: 'toolCall', name, arguments: args }
  const headers = { 'Content-Type': 'application/json', ...(env.MCP_12306_API_KEY ? { Authorization: `Bearer ${env.MCP_12306_API_KEY}` } : {}) }
  const key = `mcp12306:${name}:${JSON.stringify(args)}`
  const cached = await cacheGet<T>(key)
  if (cached) {
    metrics.cacheHits.inc({ tool: name })
    return cached
  }
  const allowed = await rateLimit('mcp12306', name, Number(env.MCP_RATE_LIMIT_PER_MINUTE || 8))
  if (!allowed) throw new Error('rate_limited')
  if (!circuitAllow(`mcp12306:${name}`)) throw new Error('circuit_open')
  const end = metrics.upstreamTimer.startTimer({ tool: name })
  try {
    const r = await withRetry(() => client.post(url, body, { headers }), 2, 200)
    const data = (r as any).data?.data ?? (r as any).data
    end({ status: 'ok' })
    circuitOk(`mcp12306:${name}`)
    await cacheSet(key, data as any, Number(env.MCP_CACHE_TTL_SECONDS || 60))
    return data as T
  } catch (e) {
    end({ status: 'error' })
    circuitFail(`mcp12306:${name}`)
    throw e
  }
  
}

function toTrainOption(x: any): TrainOption {
  const t = {
    trainNo: String(x.trainNo ?? x.train_no ?? ''),
    departStation: String(x.fromStation ?? x.from_station ?? ''),
    arriveStation: String(x.toStation ?? x.to_station ?? ''),
    departTime: String(x.departureTime ?? x.start_time ?? ''),
    arriveTime: String(x.arrivalTime ?? x.arrive_time ?? ''),
    seatTypes: Array.isArray(x.seats)
      ? x.seats.map((s: any) => ({ type: String(s.seatType ?? s.type ?? ''), price: s.price ?? undefined, remaining: s.remaining ?? s.left ?? undefined }))
      : []
  }
  return TrainOptionSchema.parse(t)
}

export async function fetchTickets(args: { date: string; fromStation: string; toStation: string; trainFilterFlags?: string; seatType?: string }): Promise<TrainOption[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-tickets', args)
  const list = Array.isArray(data?.data) ? data.data : []
  return list.map(toTrainOption)
}

export async function fetchTrainRouteStations(args: { trainNo: string; date: string }): Promise<any> {
  const data = await callTool<{ code: number; message: string; data: any }>('get-train-route-stations', args)
  return data?.data ?? data
}

export async function fetchInterlineTickets(args: { from: string; to: string; transfer: string; date: string; firstTrainFilter?: string; secondTrainFilter?: string }): Promise<any[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-interline-tickets', args)
  return data?.data ?? []
}

export async function fetchStationInfo(args: { keyword: string }): Promise<{ stationCode: string; stationName: string }[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-station-info', args)
  const list = Array.isArray(data?.data) ? data.data : []
  return list.map((s: any) => ({ stationCode: String(s.stationCode ?? s.code ?? ''), stationName: String(s.stationName ?? s.name ?? '') }))
}

export async function fetchTrainOptions(params: { origin: string; destination: string; date: string; timeFlex?: number }): Promise<TrainOption[]> {
  if (!baseURL) return []
  // 如果传入的是中文站名或非电报码，自动用 get-station-info 做一次映射，取第一个匹配
  const isCode = (v: string) => /^[A-Z]{3}$/.test(v)
  let fromStation = params.origin
  let toStation = params.destination
  if (!isCode(fromStation)) {
    let stations: any[] = []
    try { stations = await fetchStationInfo({ keyword: fromStation }) } catch { stations = [] }
    fromStation = stations[0]?.stationCode || fromStation
  }
  if (!isCode(toStation)) {
    let stations: any[] = []
    try { stations = await fetchStationInfo({ keyword: toStation }) } catch { stations = [] }
    toStation = stations[0]?.stationCode || toStation
  }
  try {
    return await fetchTickets({ date: params.date, fromStation, toStation })
  } catch {
    return []
  }
}

export async function getTrainStations(): Promise<any[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-train-stations', {})
  return data?.data ?? []
}

export async function getTrainList(args: { from_station: string; to_station: string; date: string; train_type?: string }): Promise<any[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-train-list', args)
  return data?.data ?? []
}

export async function getTrainDetail(args: { train_no: string; date: string }): Promise<any> {
  const data = await callTool<{ code: number; message: string; data: any }>('get-train-detail', args)
  return data?.data ?? data
}

export async function getTicketAvailability(args: { from_station: string; to_station: string; date: string; train_no?: string; seat_type?: string }): Promise<any[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-ticket-availability', args)
  return data?.data ?? []
}

export async function getTrainPrice(args: { from_station: string; to_station: string; train_no: string; seat_type: string; passenger_type?: string }): Promise<any> {
  const data = await callTool<{ code: number; message: string; data: any }>('get-train-price', args)
  return data?.data ?? data
}

export async function getPassengerTypes(): Promise<any[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-passenger-types', {})
  return data?.data ?? []
}

export async function getSeatTypes(): Promise<any[]> {
  const data = await callTool<{ code: number; message: string; data: any[] }>('get-seat-types', {})
  return data?.data ?? []
}
