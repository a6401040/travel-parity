import { mysql } from './mysql.js'
import { FlightOptionSchema, FlightOption } from '../schemas/flight.js'

export async function fetchFlightsByCityDate(args: {
  date: string
  fromCity: string
  toCity: string
  earliestStartTime?: number
  latestStartTime?: number
  sortFlag?: 'startTime' | 'arriveTime' | 'duration' | 'price'
  sortReverse?: boolean
  limit?: number
}): Promise<FlightOption[]> {
  const orderExpr = (() => {
    switch (args.sortFlag) {
      case 'arriveTime':
        return 'ArrivalTime'
      case 'duration':
        return 'TIMESTAMPDIFF(MINUTE, DepartureTime, ArrivalTime)'
      case 'price':
        return 'LEAST(IFNULL(YPrice, 999999), IFNULL(CPrice, 999999), IFNULL(FPrice, 999999))'
      case 'startTime':
      default:
        return 'DepartureTime'
    }
  })()
  const direction = args.sortReverse ? 'DESC' : 'ASC'
  const limit = args.limit ?? 200
  const whereParts = [
    'DATE(FlightDate) = ?',
    'FromCity = ?',
    'ToCity = ?'
  ]
  const params: any[] = [args.date, args.fromCity, args.toCity]
  if (typeof args.earliestStartTime === 'number') {
    whereParts.push('HOUR(DepartureTime) >= ?')
    params.push(Math.max(0, Math.floor(args.earliestStartTime)))
  }
  if (typeof args.latestStartTime === 'number') {
    whereParts.push('HOUR(DepartureTime) < ?')
    params.push(Math.min(24, Math.ceil(args.latestStartTime)))
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
  `
  params.push(limit)
  const [rows] = await mysql.query(sql, params)
  const out: FlightOption[] = (rows as any[]).map((r) => {
    const cabin = [] as { code: string; price?: number; remaining?: number }[]
    if (r.yCabin) cabin.push({ code: String(r.yCabin), price: r.yPrice ?? undefined })
    if (r.cCabin) cabin.push({ code: String(r.cCabin), price: r.cPrice ?? undefined })
    if (r.fCabin) cabin.push({ code: String(r.fCabin), price: r.fPrice ?? undefined })
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
    }
    return FlightOptionSchema.parse(obj)
  })
  return out
}

export async function fetchFlightsByIataDate(args: {
  date: string
  fromIata: string
  toIata: string
  earliestStartTime?: number
  latestStartTime?: number
  sortFlag?: 'startTime' | 'arriveTime' | 'duration' | 'price'
  sortReverse?: boolean
  limit?: number
}): Promise<FlightOption[]> {
  const orderExpr = (() => {
    switch (args.sortFlag) {
      case 'arriveTime':
        return 'ArrivalTime'
      case 'duration':
        return 'TIMESTAMPDIFF(MINUTE, DepartureTime, ArrivalTime)'
      case 'price':
        return 'LEAST(IFNULL(YPrice, 999999), IFNULL(CPrice, 999999), IFNULL(FPrice, 999999))'
      case 'startTime':
      default:
        return 'DepartureTime'
    }
  })()
  const direction = args.sortReverse ? 'DESC' : 'ASC'
  const limit = args.limit ?? 200
  const whereParts = [
    'DATE(FlightDate) = ?',
    '`From` = ?',
    '`To` = ?'
  ]
  const params: any[] = [args.date, args.fromIata, args.toIata]
  if (typeof args.earliestStartTime === 'number') {
    whereParts.push('HOUR(DepartureTime) >= ?')
    params.push(Math.max(0, Math.floor(args.earliestStartTime)))
  }
  if (typeof args.latestStartTime === 'number') {
    whereParts.push('HOUR(DepartureTime) < ?')
    params.push(Math.min(24, Math.ceil(args.latestStartTime)))
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
  `
  params.push(limit)
  const [rows] = await mysql.query(sql, params)
  const out: FlightOption[] = (rows as any[]).map((r) => {
    const cabin = [] as { code: string; price?: number; remaining?: number }[]
    if (r.yCabin) cabin.push({ code: String(r.yCabin), price: r.yPrice ?? undefined })
    if (r.cCabin) cabin.push({ code: String(r.cCabin), price: r.cPrice ?? undefined })
    if (r.fCabin) cabin.push({ code: String(r.fCabin), price: r.fPrice ?? undefined })
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
    }
    return FlightOptionSchema.parse(obj)
  })
  return out
}
