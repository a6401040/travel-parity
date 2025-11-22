import { Router } from 'express'
import { z } from 'zod'
import {
  fetchTickets,
  fetchTrainRouteStations,
  fetchInterlineTickets,
  fetchStationInfo,
  getTrainStations,
  getTrainList,
  getTrainDetail,
  getTicketAvailability,
  getTrainPrice,
  getPassengerTypes,
  getSeatTypes
} from '../mcp/rail.js'

export const router = Router()

router.get('/mcp/tickets', async (req, res) => {
  try {
    const q = z
      .object({ date: z.string(), fromStation: z.string(), toStation: z.string(), trainFilterFlags: z.string().optional(), seatType: z.string().optional() })
      .parse(req.query)
    const data = await fetchTickets(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/train-route-stations', async (req, res) => {
  try {
    const q = z.object({ trainNo: z.string(), date: z.string() }).parse(req.query)
    const data = await fetchTrainRouteStations(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/interline-tickets', async (req, res) => {
  try {
    const q = z
      .object({ from: z.string(), to: z.string(), transfer: z.string(), date: z.string(), firstTrainFilter: z.string().optional(), secondTrainFilter: z.string().optional() })
      .parse(req.query)
    const data = await fetchInterlineTickets(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/station-info', async (req, res) => {
  try {
    const q = z.object({ keyword: z.string() }).parse(req.query)
    const data = await fetchStationInfo(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/train-stations', async (_req, res) => {
  try {
    const data = await getTrainStations()
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/train-list', async (req, res) => {
  try {
    const q = z.object({ from_station: z.string(), to_station: z.string(), date: z.string(), train_type: z.string().optional() }).parse(req.query)
    const data = await getTrainList(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/train-detail', async (req, res) => {
  try {
    const q = z.object({ train_no: z.string(), date: z.string() }).parse(req.query)
    const data = await getTrainDetail(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/ticket-availability', async (req, res) => {
  try {
    const q = z
      .object({ from_station: z.string(), to_station: z.string(), date: z.string(), train_no: z.string().optional(), seat_type: z.string().optional() })
      .parse(req.query)
    const data = await getTicketAvailability(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/train-price', async (req, res) => {
  try {
    const q = z
      .object({ from_station: z.string(), to_station: z.string(), date: z.string().optional(), train_no: z.string(), seat_type: z.string(), passenger_type: z.string().optional() })
      .parse(req.query as any)
    const data = await getTrainPrice({ from_station: q.from_station, to_station: q.to_station, train_no: q.train_no, seat_type: q.seat_type, passenger_type: q.passenger_type })
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/passenger-types', async (_req, res) => {
  try {
    const data = await getPassengerTypes()
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/mcp/seat-types', async (_req, res) => {
  try {
    const data = await getSeatTypes()
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})
