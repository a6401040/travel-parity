import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register })

export const metrics = {
  cacheHits: new client.Counter({ name: 'cache_hits', help: 'Cache hit count', labelNames: ['tool'] }),
  upstreamTimer: new client.Histogram({ name: 'upstream_duration_ms', help: 'Upstream call duration', labelNames: ['tool', 'status'], buckets: [50, 100, 200, 500, 1000, 2000, 5000] })
}

register.registerMetric(metrics.cacheHits)
register.registerMetric(metrics.upstreamTimer)

export async function metricsText() {
  return await register.metrics()
}
