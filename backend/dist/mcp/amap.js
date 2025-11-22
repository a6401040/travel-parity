import axios from 'axios';
import { env } from '../config/env.js';
import { z } from 'zod';
import { cacheGet, cacheSet, rateLimit } from '../services/cache.js';
import { metrics } from '../services/metrics.js';
import { circuitAllow, circuitFail, circuitOk, withRetry } from '../services/circuit.js';
const baseURL = (env.GAODE_MCP_BASE_URL || '').replace(/\/$/, '');
async function callTool(name, args) {
    if (!baseURL)
        throw new Error('missing_gaode_mcp_base_url');
    let url = baseURL;
    if (!/\/mcp(\?|$)/.test(url))
        url = `${url}/mcp`;
    if (env.GAODE_MCP_API_KEY)
        url = `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(env.GAODE_MCP_API_KEY)}`;
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'airandroad-backend/1.0' };
    const body = { type: 'toolCall', name, arguments: args };
    const key = `amap:${name}:${JSON.stringify(args)}`;
    const cached = await cacheGet(key);
    if (cached) {
        metrics.cacheHits.inc({ tool: name });
        return cached;
    }
    const allowed = await rateLimit('amap', name, Number(env.AMAP_RATE_LIMIT_PER_MINUTE || 8));
    if (!allowed)
        throw new Error('rate_limited');
    if (!circuitAllow(`amap:${name}`))
        throw new Error('circuit_open');
    const end = metrics.upstreamTimer.startTimer({ tool: name });
    try {
        const r = await withRetry(() => axios.post(url, body, { headers, timeout: 15000 }), 2, 200);
        const data = r.data;
        end({ status: 'ok' });
        circuitOk(`amap:${name}`);
        await cacheSet(key, data, Number(env.AMAP_CACHE_TTL_SECONDS || 60));
        return data;
    }
    catch (e) {
        end({ status: 'error' });
        circuitFail(`amap:${name}`);
        throw e;
    }
}
const HotelSchema = z.object({
    hotelId: z.string().optional(),
    name: z.string(),
    rating: z.number().optional(),
    price: z.number().optional(),
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    address: z.string().optional()
});
export async function searchHotels(args) {
    let list = [];
    try {
        const data = await textSearch({ keyword: '酒店', city: args.city, limit: args.limit || 50, sort: 'rating_desc' });
        list = Array.isArray(data) ? data : [];
    }
    catch {
        try {
            list = await webTextSearch({ keyword: '酒店', city: args.city });
        }
        catch {
            list = [];
        }
    }
    const out = list.map((it) => ({
        hotelId: it.poiId || it.id,
        name: it.name,
        rating: typeof it.rating === 'number' ? it.rating : (typeof it.score === 'number' ? it.score : undefined),
        price: typeof it.price === 'number' ? it.price : undefined,
        location: it.location,
        address: it.address
    }));
    return out.map((x) => HotelSchema.parse(x));
}
const PoiSchema = z.object({
    poiId: z.string().optional(),
    name: z.string(),
    category: z.string().optional(),
    rating: z.number().optional(),
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    address: z.string().optional()
});
export async function searchPoi(args) {
    const keywords = (args.interests && args.interests.length) ? args.interests : ['景点', '博物馆', '美食', '购物', '公园'];
    const limit = args.limit || 60;
    const results = [];
    for (const kw of keywords) {
        try {
            const data = await textSearch({ keyword: kw, city: args.city, limit: Math.ceil(limit / keywords.length), sort: 'rating_desc' });
            if (Array.isArray(data))
                results.push(...data);
        }
        catch {
            try {
                const data2 = await webTextSearch({ keyword: kw, city: args.city });
                if (Array.isArray(data2))
                    results.push(...data2);
            }
            catch { }
        }
    }
    // 去重与过滤
    const seen = new Set();
    const merged = results.filter((it) => {
        const id = String(it.poiId || it.id || it.name);
        if (seen.has(id))
            return false;
        seen.add(id);
        if (typeof args.ratingMin === 'number') {
            const r = typeof it.rating === 'number' ? it.rating : (typeof it.score === 'number' ? it.score : 0);
            if (r < args.ratingMin)
                return false;
        }
        return true;
    });
    return merged.map((it) => PoiSchema.parse({ poiId: it.poiId || it.id, name: it.name, category: it.category, rating: (typeof it.rating === 'number' ? it.rating : (typeof it.score === 'number' ? it.score : undefined)), location: it.location, address: it.address }));
}
export async function getPoiDetail(args) {
    const resp = await callTool('maps_search_detail', { poi_id: args.id, extensions: 'all' });
    return resp?.data ?? resp;
}
export async function planWalking(args) {
    const resp = await callTool('maps_direction_walking', { from: args.origin, to: args.destination });
    return resp?.data ?? resp;
}
export async function planDriving(args) {
    const resp = await callTool('maps_direction_driving', { from: args.origin, to: args.destination });
    return resp?.data ?? resp;
}
export async function planTransitIntegrated(args) {
    const resp = await callTool('maps_direction_transit_integrated', { from: args.origin, to: args.destination, city: args.city, cityd: args.cityd });
    return resp?.data ?? resp;
}
export async function textSearch(args) {
    const resp = await callTool('maps_text_search', { keywords: args.keyword, city: args.city, citylimit: true });
    return resp?.data ?? resp;
}
export async function aroundSearch(args) {
    const resp = await callTool('maps_around_search', { keywords: args.keyword, location: args.location, radius: String(args.radius || 5000) });
    return resp?.data ?? resp;
}
export async function regeocode(args) {
    const resp = await callTool('maps_regeocode', args);
    return resp?.data ?? resp;
}
export async function geo(args) {
    const resp = await callTool('maps_geo', args);
    return resp?.data ?? resp;
}
export async function distance(args) {
    const resp = await callTool('maps_distance', args);
    return resp?.data ?? resp;
}
export async function directionBicycling(args) {
    const resp = await callTool('maps_direction_bicycling', args);
    return resp?.data ?? resp;
}
export async function directionDriving(args) {
    const resp = await callTool('maps_direction_driving', args);
    return resp?.data ?? resp;
}
export async function directionTransit(args) {
    const resp = await callTool('maps_direction_transit_integrated', args);
    return resp?.data ?? resp;
}
export async function weather(args) {
    try {
        const resp = await callTool('maps_weather', args);
        return resp?.data ?? resp;
    }
    catch {
        return await webWeather({ city: args.city, extensions: args.extensions || 'base' });
    }
}
// Fallback Gaode RESTful API helpers
async function webTextSearch(args) {
    const base = (env.GAODE_WEB_BASE_URL || 'https://restapi.amap.com').replace(/\/$/, '');
    const key = env.GAODE_WEB_API_KEY;
    if (!key)
        throw new Error('missing_gaode_web_api_key');
    const typeMap = {
        '酒店': '住宿服务',
        '宾馆': '住宿服务',
        '景点': '风景名胜',
        '博物馆': '博物馆',
        '公园': '公园',
        '商圈': '购物服务',
        '美食': '餐饮服务'
    };
    const t = typeMap[args.keyword] || '';
    const url = `${base}/v3/place/text?key=${encodeURIComponent(key)}&keywords=${encodeURIComponent(args.keyword)}&city=${encodeURIComponent(args.city)}&citylimit=true${t ? `&types=${encodeURIComponent(t)}` : ''}`;
    const r = await axios.get(url, { timeout: 10000 });
    const pois = (r.data && r.data.pois) || [];
    return pois.map((p) => ({ id: p.id, poiId: p.id, name: p.name, category: p.type, rating: Number(p.biz_ext?.rating || 0), address: p.address, adname: p.adname, location: locOf(p.location) }));
}
async function webWeather(args) {
    const base = (env.GAODE_WEB_BASE_URL || 'https://restapi.amap.com').replace(/\/$/, '');
    const key = env.GAODE_WEB_API_KEY;
    if (!key)
        throw new Error('missing_gaode_web_api_key');
    const url = `${base}/v3/weather/weatherInfo?key=${encodeURIComponent(key)}&city=${encodeURIComponent(args.city)}&extensions=${encodeURIComponent(args.extensions)}`;
    const r = await axios.get(url, { timeout: 10000 });
    return r.data;
}
function locOf(s) {
    if (!s)
        return undefined;
    const [lng, lat] = String(s).split(',').map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng))
        return { lat, lng };
    return undefined;
}
