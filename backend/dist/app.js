import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { router as apiRouter } from './routes/index.js';
import cookieParser from 'cookie-parser';
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 60_000, limit: 300 }));
app.use('/api', apiRouter);
app.use((err, _req, res, _next) => {
    const msg = String(err?.message || '');
    const name = String(err?.code || err?.name || msg);
    const map = {
        invalid_params: { status: 400, error: 'invalid_params', message: '参数不合法，请检查输入' },
        unauthorized: { status: 401, error: 'unauthorized', message: '未授权或登录已过期' },
        not_found: { status: 404, error: 'not_found', message: '资源不存在或已删除' },
        rate_limited: { status: 429, error: 'rate_limited', message: '请求过于频繁，请稍后再试' },
        circuit_open: { status: 503, error: 'service_unavailable', message: '上游服务暂不可用，请稍后再试' },
        upstream_timeout: { status: 504, error: 'upstream_timeout', message: '上游服务超时，请稍后重试' },
        upstream_error: { status: 502, error: 'upstream_error', message: '上游服务异常，请稍后重试' }
    };
    const key = Object.prototype.hasOwnProperty.call(map, name) ? name : (msg.includes('rate_limited') ? 'rate_limited' : (msg.includes('circuit_open') ? 'circuit_open' : ''));
    if (key && map[key]) {
        const r = map[key];
        return res.status(r.status).json({ error: r.error, message: r.message });
    }
    res.status(500).json({ error: 'internal_error', message: '服务端异常，请稍后再试' });
});
export default app;
