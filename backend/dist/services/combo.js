import { pruneTrains, pruneFlights } from './prune.js';
import { fetchFlightsByCityDate } from '../db/flights.js';
import { fetchTrainOptions } from '../mcp/rail.js';
import { weather } from '../mcp/amap.js';
import { planTransferDetailed } from './transfer.js';
import { env } from '../config/env.js';
function minutesBetween(a, b) {
    const ta = new Date(a).getTime();
    const tb = new Date(b).getTime();
    if (isNaN(ta) || isNaN(tb))
        return 1e9;
    return Math.max(0, Math.round((tb - ta) / 60000));
}
function priceTrain(t) {
    const seats = Array.isArray(t.seatTypes) ? t.seatTypes : [];
    const prices = seats.map((s) => Number(s.price || 1e9));
    const p = Math.min(...(prices.length ? prices : [1e9]));
    return p === 1e9 ? 0 : p;
}
function priceFlight(f) {
    const cabins = Array.isArray(f.cabin) ? f.cabin : [];
    const prices = cabins.map((c) => Number(c.price || 1e9));
    const p = Math.min(...(prices.length ? prices : [1e9]));
    return p === 1e9 ? 0 : p;
}
function comfortTrain(t) {
    const seats = Array.isArray(t.seatTypes) ? t.seatTypes : [];
    if (!seats.length)
        return 65;
    const map = (type) => (type.includes('商务') ? 85 : type.includes('一等') ? 75 : type.includes('二等') ? 65 : 70);
    const vals = seats.map((s) => map(String(s.type || '')));
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
function comfortFlight(f) {
    const cabins = Array.isArray(f.cabin) ? f.cabin : [];
    if (!cabins.length)
        return 65;
    const map = (code) => (code.toUpperCase().startsWith('F') ? 90 : code.toUpperCase().startsWith('C') ? 85 : 60);
    const vals = cabins.map((c) => map(String(c.code || '')));
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
function feasibleConnect(arrive, depart, minMinutes) {
    return minutesBetween(arrive, depart) >= minMinutes;
}
export async function buildCombos(input) {
    const maxTransfers = input.constraints?.maxTransfers ?? 2;
    const minComfort = input.constraints?.minComfort;
    const avoidNightArrival = input.constraints?.avoidNightArrival;
    const [trainsRaw, flightsRaw] = await Promise.all([
        fetchTrainOptions({ origin: input.origin, destination: input.destination, date: input.date }),
        fetchFlightsByCityDate({ date: input.date, fromCity: input.origin, toCity: input.destination, limit: 200 })
    ]);
    const trains = pruneTrains(trainsRaw, { avoidNightArrival, maxTransfers });
    const flights = pruneFlights(flightsRaw, { avoidNightArrival, minComfort });
    let weatherRisk = 0;
    try {
        const w = await weather({ city: input.destination, date: input.date, extensions: 'base' });
        const text = String(w?.weather || w?.text || '').toLowerCase();
        if (/暴雨|heavy rain|storm/.test(text))
            weatherRisk = 6;
        else if (/大雪|heavy snow/.test(text))
            weatherRisk = 5;
        else if (/雨|snow/.test(text))
            weatherRisk = 3;
        else if (/大风|wind|fog|雾/.test(text))
            weatherRisk = 2;
    }
    catch { }
    const schemes = [];
    // 纯火车
    for (const t of trains.slice(0, 30)) {
        const seg = { mode: 'train', optionId: t.trainNo, departTime: t.departTime, arriveTime: t.arriveTime, price: priceTrain(t) };
        const dur = minutesBetween(seg.departTime, seg.arriveTime);
        schemes.push({ segments: [seg], totalTimeMinutes: dur, totalPrice: seg.price, transfers: 0, riskScore: 0, comfortScore: comfortTrain(t), score: 0, reason: '直达列车' });
    }
    // 纯航班
    for (const f of flights.slice(0, 30)) {
        const seg = { mode: 'flight', optionId: f.flightNo, departTime: f.departTime, arriveTime: f.arriveTime, price: priceFlight(f) };
        const dur = minutesBetween(seg.departTime, seg.arriveTime);
        schemes.push({ segments: [seg], totalTimeMinutes: dur, totalPrice: seg.price, transfers: 0, riskScore: 0, comfortScore: comfortFlight(f), score: 0, reason: '直达航班' });
    }
    // 空铁联运（航班→火车）
    const MIN_CONNECT_SAME_CITY = 30;
    for (const f of flights.slice(0, 10)) {
        for (const t of trains.slice(0, 10)) {
            const transfer = await planTransferDetailed(input.destination, String(f.arriveAirport || input.destination), String(t.departStation || input.destination));
            if (!feasibleConnect(f.arriveTime, t.departTime, Math.max(MIN_CONNECT_SAME_CITY, transfer.minutes)))
                continue;
            const seg1 = { mode: 'flight', optionId: f.flightNo, departTime: f.departTime, arriveTime: f.arriveTime, price: priceFlight(f) };
            const seg2 = { mode: 'train', optionId: t.trainNo, departTime: t.departTime, arriveTime: t.arriveTime, price: priceTrain(t) };
            const totalDur = minutesBetween(seg1.departTime, seg1.arriveTime) + minutesBetween(seg2.departTime, seg2.arriveTime) + transfer.minutes;
            const totalPrice = seg1.price + seg2.price;
            const transfers = 1;
            const crossPenalty = transfer.kind.includes('airport_to_station') ? 5 : transfer.kind.includes('same_station') ? 0 : transfer.kind.includes('same_airport') ? 0 : 3;
            const distancePenalty = transfer.distanceKm > 25 ? 5 : transfer.distanceKm > 10 ? 2 : 0;
            const ontimePenalty = typeof f.onTimeRate === 'number' ? Math.max(0, (1 - Number(f.onTimeRate)) * 10) : 0;
            const rushPenalty = (() => {
                const h = new Date(seg2.departTime).getHours();
                return (h >= 7 && h <= 9) || (h >= 17 && h <= 19) ? 2 : 0;
            })();
            const risk = (avoidNightArrival ? 5 : 0) + (minComfort && comfortFlight(f) < minComfort ? 5 : 0) + crossPenalty + distancePenalty + ontimePenalty + rushPenalty + weatherRisk;
            const comfort = Math.round((comfortFlight(f) + comfortTrain(t)) / 2);
            schemes.push({ segments: [seg1, seg2], totalTimeMinutes: totalDur, totalPrice, transfers, riskScore: risk, comfortScore: comfort, score: 0, reason: `航班+火车，${transfer.kind}，${transfer.mode}接驳约${transfer.minutes}分钟，距离${transfer.distanceKm}km` });
        }
    }
    // 评分
    for (const s of schemes) {
        const timeScore = 1000 / Math.max(60, s.totalTimeMinutes);
        const priceScore = 1000 / Math.max(1, s.totalPrice);
        const comfortScore = s.comfortScore;
        const wTime = Number(env.SCORE_W_TIME || 0.4);
        const wPrice = Number(env.SCORE_W_PRICE || 0.4);
        const wComfort = Number(env.SCORE_W_COMFORT || 0.2);
        const wTransfer = Number(env.PENALTY_W_TRANSFER || 10);
        const transferPenalty = s.transfers * wTransfer;
        const riskPenalty = s.riskScore;
        s.score = wTime * timeScore + wPrice * priceScore + wComfort * comfortScore - transferPenalty - riskPenalty;
        s.scoring = { timeScore, priceScore, comfortScore, transferPenalty, riskPenalty, weights: { wTime, wPrice, wComfort, wTransfer } };
    }
    const sortBy = (key) => {
        const cpy = [...schemes];
        if (key === 'time')
            return cpy.sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes).slice(0, 3);
        if (key === 'price')
            return cpy.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 3);
        return cpy.sort((a, b) => b.score - a.score).slice(0, 3);
    };
    return {
        timeFirst: sortBy('time'),
        priceFirst: sortBy('price'),
        balanced: sortBy('balanced')
    };
}
