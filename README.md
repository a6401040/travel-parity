# travel-parity
出行比价服务 / 出行平价服务 的前后端一体化项目。

## 项目概览
- 单仓库包含 `backend`(Node.js/Express) 与 `frontend`(Vue 3/Vite)。
- 聚合铁路 12306 MCP、航班数据库 `c_trip_data_new`、高德地图 MCP/Web API，并通过 LLM 生成结构化出行方案。
- 具备限流、熔断、缓存与 Prometheus 指标，保证上游不稳定时的可用性与可观测性。

## 技术栈
- 后端：Node.js、Express、TypeScript、mysql2、redis、axios、openai(兼容 DeepSeek/SiliconFlow/百炼)、zod、prom-client
- 前端：Vue 3、Pinia、Vue Router、Element Plus、Vite、TailwindCSS、Axios

## 目录结构
```
backend/
  src/
    app.ts                 // Express 应用与中间件
    server.ts              // HTTP 入口
    config/env.ts          // 环境变量聚合
    routes/                // 路由模块聚合（llm、compiled、mcp、metrics 等）
    llm/                   // LLM 提供商链与生成逻辑
    mcp/                   // 对接 12306 与高德的工具封装
    db/                    // 航班数据查询（MySQL）
    services/              // 业务服务：剪枝、组合、路线生成、缓存、熔断、指标
    schemas/               // zod 模式校验
    middlewares/           // 会话校验等
  package.json             // dev/build/start 脚本

frontend/
  src/
    views/                 // 页面（Chat/History/Settings 等）
    layouts/               // 布局（Default/Chat/Auth）
    components/            // 领域组件（chat/travel/user/common）
    stores/                // Pinia 状态（chat/auth/settings/travel）
    services/http.ts       // Axios 实例与错误拦截
    router/index.ts        // 路由与守卫
    main.ts                // 入口与插件注册
  package.json             // dev/build/preview 脚本
```

## 后端架构
- 应用与中间件：`backend/src/app.ts:9-16` 初始化安全、日志、速率限制与 `/api` 路由；错误统一映射在 `backend/src/app.ts:18-36`。
- 路由总线：`backend/src/routes/index.ts:21-39` 聚合业务路由（如 `llm`、`compiled`、`mcp`、`metrics`、`air`）。
- LLM 提供商链：`backend/src/llm/providers.ts:35-57` 按链路依次尝试 DeepSeek/SiliconFlow/百炼，带重试与熔断；模型选择在 `backend/src/llm/providers.ts:27-33`。
- 推荐生成：系统提示词与清洗、`zod` 校验在 `backend/src/llm/deepseek.ts:5-14,16-31,32-39`，失败回退空方案并标记 `needs_more_data`。
- 铁路 MCP：统一 `toolCall`、缓存、限流与熔断在 `backend/src/mcp/rail.ts:11-37`；站点映射与列车选项在 `backend/src/mcp/rail.ts:76-97`。
- 高德 MCP/Web 回退：地点检索、路径规划、地理编码与天气在 `backend/src/mcp/amap.ts:8-39,41-77,79-117,236-352`。
- 航班数据库：城市/IATA 查询与排序、`zod` 封装在 `backend/src/db/flights.ts:4-13,43-87,89-171`。
- 缓存/限流/熔断：Redis 不可用时内存回退，见 `backend/src/services/cache.ts:3-20,22-28,30-45,47-50`；熔断器与重试在 `backend/src/services/circuit.ts:4-19,21-36`。
- 指标：Prometheus 指标注册与直方图在 `backend/src/services/metrics.ts:1-16`，暴露端点 `backend/src/routes/metrics.ts:5-8`。

### 主要接口
- `POST /api/llm/recommendations`：并行聚合铁路/航班/酒店/POI/路线后，调用 LLM 产出 `timeFirst` 与 `priceFirst` 两类方案（`backend/src/routes/llm.ts:26-99`）。
- `GET /api/compiled/recommendations`：不依赖 LLM 的编译聚合输出，含天气、酒店、POI、城市路线与交通（`backend/src/routes/compiled.ts:38-200`）。
- `POST /api/llm/chat`：通用聊天（`backend/src/routes/llm.ts:105-121`）。
- `GET /api/metrics`：Prometheus 指标（`backend/src/routes/metrics.ts:5-8`）。

## 前端架构
- 入口：`frontend/src/main.ts:10-25` 创建应用、注册 Pinia/Router/Element Plus。
- 路由与守卫：`frontend/src/router/index.ts:28-121,128-146` 认证保护与游客路由限制。
- 状态与意图解析：聊天意图解析与后端交互在 `frontend/src/stores/chat.ts:67-112,148-172,276-324,351-354`。
- HTTP 客户端：统一错误拦截在 `frontend/src/services/http.ts:8-14`，`baseURL` 取 `VITE_API_BASE` 或 `/api`。

## 环境变量
在 `backend/src/config/env.ts:4-50` 聚合，常用：
- DB：`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- LLM：`LLM_PROVIDER_CHAIN`、`LLM_MODEL`、`DEEPSEEK_API_KEY/BASE_URL/MODEL`、`SILICONFLOW_*`、`BAILIAN_*`
- MCP：`MCP_12306_BASE_URL`、`MCP_12306_API_KEY`、`GAODE_MCP_BASE_URL`、`GAODE_MCP_API_KEY`、`GAODE_WEB_BASE_URL`、`GAODE_WEB_API_KEY`
- 缓存与速率：`MCP_RATE_LIMIT_PER_MINUTE`、`AMAP_RATE_LIMIT_PER_MINUTE`、`MCP_CACHE_TTL_SECONDS`、`AMAP_CACHE_TTL_SECONDS`
- 其他：`PORT`、`JWT_SECRET`、`PDF_FONT_PATH`

## 运行与构建
- 后端
  - 开发：`cd backend && npm run dev`
  - 构建：`npm run build`
  - 运行：`npm run start`
- 前端
  - 开发：`cd frontend && npm run dev`
  - 构建：`npm run build`
  - 预览：`npm run preview`

## 数据与校验
- LLM 输出：`LLMOutputSchema` 在 `backend/src/schemas/llm.ts:56-61`。
- 航班/列车选项：`backend/src/schemas/flight.ts:3-16`、`backend/src/schemas/train.ts:3-10`。

## 稳定性与可观测性
- 限流：每分钟调用上限由环境变量控制。
- 熔断：连续失败达到阈值后短暂打开，避免雪崩（`backend/src/services/circuit.ts:10-19`）。
- 重试：指数退避重试（`backend/src/services/circuit.ts:21-36`）。
- 指标：`cache_hits`/`upstream_duration_ms` 直方图，暴露在 `/api/metrics`。

## 开发建议
- 在启动时统一校验必需环境变量，减少运行期错误。
- 为路由与服务层补充 `vitest/jest + supertest` 测试，覆盖常见降级路径与边界。
- 对 LLM 失败详情（`llm_chain_failed`）可在响应中附带 `errors.details` 以便排障。
