import { Router } from 'express'
import { z } from 'zod'
import { textSearch, aroundSearch, regeocode, geo, distance, directionBicycling, directionDriving, directionTransit, getPoiDetail } from '../mcp/amap.js'

export const router = Router()

router.get('/amap/text-search', async (req, res) => {
  try {
    const q = z.object({ keyword: z.string(), city: z.string(), page: z.coerce.number().optional(), limit: z.coerce.number().optional(), sort: z.string().optional() }).parse(req.query)
    const data = await textSearch(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/around-search', async (req, res) => {
  try {
    const q = z.object({ location: z.string(), keyword: z.string(), radius: z.coerce.number().optional(), page: z.coerce.number().optional(), limit: z.coerce.number().optional(), category: z.string().optional() }).parse(req.query)
    const data = await aroundSearch(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/regeocode', async (req, res) => {
  try {
    const q = z.object({ location: z.string(), radius: z.coerce.number().optional(), poi: z.coerce.boolean().optional() }).parse(req.query)
    const data = await regeocode(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/geo', async (req, res) => {
  try {
    const q = z.object({ address: z.string(), city: z.string().optional(), batch: z.coerce.boolean().optional() }).parse(req.query)
    const data = await geo(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/distance', async (req, res) => {
  try {
    const q = z.object({ origins: z.string(), destinations: z.string(), type: z.string().optional() }).parse(req.query)
    const data = await distance(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/bicycling', async (req, res) => {
  try {
    const q = z.object({ from: z.string(), to: z.string(), departure_time: z.string().optional(), avoid: z.string().optional(), limit: z.coerce.number().optional() }).parse(req.query)
    const data = await directionBicycling(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/driving', async (req, res) => {
  try {
    const q = z.object({ from: z.string(), to: z.string(), avoid: z.string().optional(), departure_time: z.string().optional(), strategy: z.coerce.number().optional() }).parse(req.query)
    const data = await directionDriving(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/transit', async (req, res) => {
  try {
    const q = z.object({ from: z.string(), to: z.string(), departure_time: z.string().optional(), transit_type: z.string().optional(), limit: z.coerce.number().optional() }).parse(req.query)
    const data = await directionTransit(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})

router.get('/amap/poi-detail', async (req, res) => {
  try {
    const q = z.object({ id: z.string() }).parse(req.query)
    const data = await getPoiDetail(q)
    res.json({ code: 0, message: 'success', data })
  } catch (e: any) {
    res.status(500).json({ code: -1, message: e?.message || 'error' })
  }
})
