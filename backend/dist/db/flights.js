import { mysql } from './mysql.js';
import { FlightOptionSchema } from '../schemas/flight.js';
export async function fetchFlightsByCityDate(args) {
    const orderExpr = (() => {
        switch (args.sortFlag) {
            case 'arriveTime':
                return 'ArrivalTime';
            case 'duration':
                return 'TIMESTAMPDIFF(MINUTE, DepartureTime, ArrivalTime)';
            case 'price':
                return 'LEAST(IFNULL(YPrice, 999999), IFNULL(CPrice, 999999), IFNULL(FPrice, 999999))';
            case 'startTime':
            default:
                return 'DepartureTime';
        }
    })();
    const direction = args.sortReverse ? 'DESC' : 'ASC';
    const limit = args.limit ?? 200;
    const whereParts = [
        'DATE(FlightDate) = ?',
        'FromCity = ?',
        'ToCity = ?'
    ];
    const params = [args.date, args.fromCity, args.toCity];
    if (typeof args.earliestStartTime === 'number') {
        whereParts.push('HOUR(DepartureTime) >= ?');
        params.push(Math.max(0, Math.floor(args.earliestStartTime)));
    }
    if (typeof args.latestStartTime === 'number') {
        whereParts.push('HOUR(DepartureTime) < ?');
        params.push(Math.min(24, Math.ceil(args.latestStartTime)));
    }
    const sql = `
    SELECT 
      FlightNumber AS flightNo,
      Carrier AS carrier,
      ` + '`From`' + ` AS departAirport,
      ` + '`To`' + ` AS arriveAirport,
      FromCity AS fromCity,
      ToCity AS toCity,
      DATE_FORMAT(DepartureTime, '%Y-%m-%dT%H:%i:%s') AS departTime,
      DATE_FORMAT(ArrivalTime, '%Y-%m-%dT%H:%i:%s') AS arriveTime,
      YCabin AS yCabin,
      YPrice AS yPrice,
      CCabin AS cCabin,
      CPrice AS cPrice,
      FCabin AS fCabin,
      FPrice AS fPrice,
      PunctualityRate AS onTimeRate
    FROM c_trip_data_new 
    WHERE ${whereParts.join(' AND ')}
    ORDER BY ${orderExpr} ${direction}
    LIMIT ?
  `;
    params.push(limit);
    const [rows] = await mysql.query(sql, params);
    const out = rows.map((r) => {
        const cabin = [];
        if (r.yCabin)
            cabin.push({ code: String(r.yCabin), price: r.yPrice ?? undefined });
        if (r.cCabin)
            cabin.push({ code: String(r.cCabin), price: r.cPrice ?? undefined });
        if (r.fCabin)
            cabin.push({ code: String(r.fCabin), price: r.fPrice ?? undefined });
        const obj = {
            flightNo: String(r.flightNo ?? ''),
            carrier: String(r.carrier ?? ''),
            departAirport: String(r.departAirport ?? ''),
            arriveAirport: String(r.arriveAirport ?? ''),
            fromCity: String(r.fromCity ?? ''),
            toCity: String(r.toCity ?? ''),
            departTime: String(r.departTime ?? ''),
            arriveTime: String(r.arriveTime ?? ''),
            cabin,
            onTimeRate: r.onTimeRate != null ? Number(r.onTimeRate) : undefined
        };
        return FlightOptionSchema.parse(obj);
    });
    return out;
}
export async function fetchFlightsByIataDate(args) {
    const orderExpr = (() => {
        switch (args.sortFlag) {
            case 'arriveTime':
                return 'ArrivalTime';
            case 'duration':
                return 'TIMESTAMPDIFF(MINUTE, DepartureTime, ArrivalTime)';
            case 'price':
                return 'LEAST(IFNULL(YPrice, 999999), IFNULL(CPrice, 999999), IFNULL(FPrice, 999999))';
            case 'startTime':
            default:
                return 'DepartureTime';
        }
    })();
    const direction = args.sortReverse ? 'DESC' : 'ASC';
    const limit = args.limit ?? 200;
    const whereParts = [
        'DATE(FlightDate) = ?',
        '`From` = ?',
        '`To` = ?'
    ];
    const params = [args.date, args.fromIata, args.toIata];
    if (typeof args.earliestStartTime === 'number') {
        whereParts.push('HOUR(DepartureTime) >= ?');
        params.push(Math.max(0, Math.floor(args.earliestStartTime)));
    }
    if (typeof args.latestStartTime === 'number') {
        whereParts.push('HOUR(DepartureTime) < ?');
        params.push(Math.min(24, Math.ceil(args.latestStartTime)));
    }
    const sql = `
    SELECT 
      FlightNumber AS flightNo,
      Carrier AS carrier,
      ` + '`From`' + ` AS departAirport,
      ` + '`To`' + ` AS arriveAirport,
      FromCity AS fromCity,
      ToCity AS toCity,
      DATE_FORMAT(DepartureTime, '%Y-%m-%dT%H:%i:%s') AS departTime,
      DATE_FORMAT(ArrivalTime, '%Y-%m-%dT%H:%i:%s') AS arriveTime,
      YCabin AS yCabin,
      YPrice AS yPrice,
      CCabin AS cCabin,
      CPrice AS cPrice,
      FCabin AS fCabin,
      FPrice AS fPrice,
      PunctualityRate AS onTimeRate
    FROM c_trip_data_new 
    WHERE ${whereParts.join(' AND ')}
    ORDER BY ${orderExpr} ${direction}
    LIMIT ?
  `;
    params.push(limit);
    const [rows] = await mysql.query(sql, params);
    const out = rows.map((r) => {
        const cabin = [];
        if (r.yCabin)
            cabin.push({ code: String(r.yCabin), price: r.yPrice ?? undefined });
        if (r.cCabin)
            cabin.push({ code: String(r.cCabin), price: r.cPrice ?? undefined });
        if (r.fCabin)
            cabin.push({ code: String(r.fCabin), price: r.fPrice ?? undefined });
        const obj = {
            flightNo: String(r.flightNo ?? ''),
            carrier: String(r.carrier ?? ''),
            departAirport: String(r.departAirport ?? ''),
            arriveAirport: String(r.arriveAirport ?? ''),
            fromCity: String(r.fromCity ?? ''),
            toCity: String(r.toCity ?? ''),
            departTime: String(r.departTime ?? ''),
            arriveTime: String(r.arriveTime ?? ''),
            cabin,
            onTimeRate: r.onTimeRate != null ? Number(r.onTimeRate) : undefined
        };
        return FlightOptionSchema.parse(obj);
    });
    return out;
}
