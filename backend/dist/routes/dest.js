import { Router } from 'express';
import { z } from 'zod';
import { searchHotels, searchPoi } from '../mcp/amap.js';
import { generateRoutes } from '../services/routes.js';
export const router = Router();
const HotelsReqSchema = z.object({
    city: z.string(),
    checkin: z.string(),
    checkout: z.string(),
    budgetMin: z.coerce.number().optional(),
    budgetMax: z.coerce.number().optional(),
    ratingMin: z.coerce.number().optional(),
    nearPoi: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
    location: z.string().optional(),
    radius: z.coerce.number().optional(),
    district: z.string().optional(),
    tags: z.array(z.string()).optional(),
    sort: z.enum(['distance', 'rating', 'price']).optional()
});
router.get('/dest/hotels', async (req, res) => {
    try {
        const q = HotelsReqSchema.parse(req.query);
        const all = await searchHotels(q);
        const loc = (() => {
            if (!q.location)
                return null;
            const m = /^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/.exec(q.location);
            if (!m)
                return null;
            return { lat: Number(m[1]), lng: Number(m[2]) };
        })();
        const dist = (a) => {
            if (!loc || !a?.location)
                return null;
            const toRad = (x) => (x * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad((a.location.lat || 0) - (loc.lat || 0));
            const dLon = toRad((a.location.lng || 0) - (loc.lng || 0));
            const lat1 = toRad(loc.lat || 0);
            const lat2 = toRad(a.location.lat || 0);
            const aa = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
            return R * c;
        };
        let list = all.map((h) => ({ ...h, distanceKm: dist(h) }));
        if (typeof q.radius === 'number' && loc)
            list = list.filter((h) => (h.distanceKm ?? Infinity) <= q.radius / 1000);
        if (typeof q.district === 'string')
            list = list.filter((h) => String(h.address || '').includes(String(q.district)));
        if (q.tags && q.tags.length)
            list = list.filter((h) => q.tags.some((t) => String(h?.tags || h?.name || '').includes(t)));
        if (q.sort === 'distance')
            list = list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        if (q.sort === 'rating')
            list = list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        if (q.sort === 'price')
            list = list.sort((a, b) => Number(a.price || 1e9) - Number(b.price || 1e9));
        const total = list.length;
        const page = q.page || 1;
        const pageSize = q.pageSize || 20;
        const start = (page - 1) * pageSize;
        const items = list.slice(start, start + pageSize);
        res.json({ items, total, page, pageSize });
    }
    catch (e) {
        res.status(500).json({ error: 'amap_error', message: e?.message || 'error' });
    }
});
router.get('/dest/routes', async (req, res) => {
    try {
        const q = z
            .object({ city: z.string(), days: z.coerce.number().optional(), interests: z.array(z.string()).optional(), ratingMin: z.coerce.number().optional(), limit: z.coerce.number().optional(), startDate: z.string().optional() })
            .parse(req.query);
        const routes = await generateRoutes({ city: q.city, days: q.days, interests: q.interests, ratingMin: q.ratingMin, limit: q.limit, startDate: q.startDate });
        res.json(routes);
    }
    catch (e) {
        res.status(500).json({ error: 'amap_error', message: e?.message || 'error' });
    }
});
const PoiReqSchema = z.object({
    city: z.string(),
    interests: z.array(z.string()).optional(),
    ratingMin: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
    location: z.string().optional(),
    radius: z.coerce.number().optional(),
    district: z.string().optional(),
    tags: z.array(z.string()).optional(),
    sort: z.enum(['distance', 'rating']).optional()
});
router.get('/dest/poi', async (req, res) => {
    try {
        const q = PoiReqSchema.parse(req.query);
        const all = await searchPoi({ city: q.city, interests: q.interests, ratingMin: q.ratingMin, limit: q.limit });
        const loc = (() => {
            if (!q.location)
                return null;
            const m = /^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/.exec(q.location);
            if (!m)
                return null;
            return { lat: Number(m[1]), lng: Number(m[2]) };
        })();
        const dist = (a) => {
            if (!loc || !a?.location)
                return null;
            const toRad = (x) => (x * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad((a.location.lat || 0) - (loc.lat || 0));
            const dLon = toRad((a.location.lng || 0) - (loc.lng || 0));
            const lat1 = toRad(loc.lat || 0);
            const lat2 = toRad(a.location.lat || 0);
            const aa = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
            return R * c;
        };
        let list = all.map((p) => ({ ...p, distanceKm: dist(p) }));
        if (typeof q.radius === 'number' && loc)
            list = list.filter((p) => (p.distanceKm ?? Infinity) <= q.radius / 1000);
        if (typeof q.district === 'string')
            list = list.filter((p) => String(p.address || '').includes(String(q.district)));
        if (q.tags && q.tags.length)
            list = list.filter((p) => q.tags.some((t) => String(p?.category || p?.name || '').includes(t)));
        if (q.sort === 'distance')
            list = list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        if (q.sort === 'rating')
            list = list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        const total = list.length;
        const page = q.page || 1;
        const pageSize = q.pageSize || 20;
        const start = (page - 1) * pageSize;
        const items = list.slice(start, start + pageSize);
        res.json({ items, total, page, pageSize });
    }
    catch (e) {
        res.status(500).json({ error: 'amap_error', message: e?.message || 'error' });
    }
});
