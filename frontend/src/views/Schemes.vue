<template>
  <div class="schemes-page bg-schemes">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">出行方案对比</div>
    </header>
    <main class="center">
      <div class="schemes-container">
        <h2 class="section-title">为您推荐的出行方案</h2>
        <div class="cards">
          <div v-for="scheme in orderedSchemes" :key="scheme.title" class="card">
            <div class="title">{{ scheme.title }}</div>
            <div class="meta">
              <span class="pill">总价 ¥{{ scheme.totalPrice }}</span>
              <span class="pill">时长 {{ scheme.totalTimeMinutes }} 分</span>
              <span class="pill">换乘 {{ scheme.transfers }}</span>
              <span class="pill">评分 {{ scheme.score }}</span>
            </div>
            <div class="seg">
              <span v-for="segment in scheme.segments" :key="segment.optionId" class="pill">
                {{ segment.mode === 'train' ? '🚆 火车' : '✈️ 飞机' }} · {{ segment.optionId }}
              </span>
            </div>
            <div style="margin-top: 8px; display: flex; gap: 8px;">
              <a v-for="segment in scheme.segments" :key="segment.optionId + '-booking'" 
                 class="btn" 
                 target="_blank" 
                 :href="segment.booking.url">
                {{ segment.booking.provider === '12306' ? '12306购票' : '航司购票' }}
              </a>
            </div>
            <div class="scheme-reason">{{ scheme.reason }}</div>
          </div>
        </div>
        
        <div class="additional-info">
          <div class="routes-section">
            <h3 class="section-title">目的地旅游路线</h3>
            <div class="list">
              <div v-for="route in destRoutes" :key="route.name" class="route">
                <div class="title">🗺️ {{ route.name }} · {{ route.days }} 天</div>
                <div v-for="(item, index) in route.items" :key="index">{{ item }}</div>
                <div style="margin-top: 8px;">
                  <a class="btn secondary" target="_blank" :href="route.url">查看地图</a>
                </div>
              </div>
            </div>
            <h3 class="section-title">经停地旅游路线</h3>
            <div class="list">
              <div v-for="route in viaRoutes" :key="route.name" class="route">
                <div class="title">🗺️ {{ route.name }} · {{ route.days }} 天</div>
                <div v-for="(item, index) in route.items" :key="index">{{ item }}</div>
                <div style="margin-top: 8px;">
                  <a class="btn secondary" target="_blank" :href="route.url">查看地图</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="hotels-section">
            <h3 class="section-title">不同价位酒店推荐</h3>
            <div class="list">
              <div v-for="grp in hotelGroups" :key="grp.tier" class="hotel">
                <div class="title">🏨 {{ grp.tier }}</div>
                <div class="meta">
                  <span class="pill">共 {{ grp.items.length }} 条</span>
                </div>
                <div>
                  <div v-for="h in grp.items" :key="h.name" style="margin-top:6px;">
                    <div><strong>{{ h.name }}</strong></div>
                    <div class="meta">
                      <span class="pill">评分 {{ h.rating }}</span>
                      <span class="pill">价格 ¥{{ h.price }}</span>
                    </div>
                    <div>{{ h.reason }}</div>
                    <div style="margin-top: 6px;"><a class="btn secondary" target="_blank" :href="h.url">查看位置</a></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="actions">
          <router-link to="/" class="btn">返回聊天</router-link>
          <router-link to="/history" class="btn secondary">查看历史</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface TravelSegment {
  mode: 'flight' | 'train'
  optionId: string
  departTime: string
  arriveTime: string
  price: number
  booking: {
    provider: '12306' | 'airline'
    url: string
    notes: string
  }
}

interface TravelScheme {
  title: string
  segments: TravelSegment[]
  totalPrice: number
  totalTimeMinutes: number
  transfers: number
  score: number
  reason: string
}

interface Hotel {
  name: string
  rating: number
  price: number
  reason: string
  url: string
}

interface Route {
  name: string
  days: number
  items: string[]
  url: string
  kind: 'destination' | 'stopover'
}

const route = useRoute()
const schemes = ref<TravelScheme[]>([])
const hotels = ref<Hotel[]>([])
const routes = ref<Route[]>([])
const destRoutes = computed(() => routes.value.filter(r => r.kind === 'destination'))
const viaRoutes = computed(() => routes.value.filter(r => r.kind === 'stopover'))
const hotelGroups = computed(() => {
  const premium = hotels.value.filter(h => h.price >= 500)
  const comfort = hotels.value.filter(h => h.price < 500 && h.price >= 300)
  const budget = hotels.value.filter(h => h.price < 300)
  return [
    { tier: '高端（¥500+）', items: premium },
    { tier: '舒适（¥300-¥499）', items: comfort },
    { tier: '经济（¥<300）', items: budget }
  ]
})
const orderedSchemes = computed(() => {
  const t = schemes.value.slice()
  const order = ['时间优先', '价格优先', '综合优先']
  t.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title))
  return t
})

// 模拟数据生成函数
const mockSchemes = (origin: string, destination: string, priceFirst: boolean = false): TravelScheme[] => {
  const date = new Date().toISOString().slice(0, 10)
  const segA: TravelSegment[] = [
    {
      mode: 'flight',
      optionId: `F-${origin}-石家庄`.toUpperCase(),
      departTime: `${date}T08:00:00+08:00`,
      arriveTime: `${date}T10:30:00+08:00`,
      price: 480,
      booking: {
        provider: 'airline',
        url: `https://www.example-airline.com/book?flight=${encodeURIComponent(`F-${origin}-石家庄`)}`,
        notes: '跳转至航司官网'
      }
    },
    {
      mode: 'train',
      optionId: `T-石家庄-${destination}`.toUpperCase(),
      departTime: `${date}T12:00:00+08:00`,
      arriveTime: `${date}T14:00:00+08:00`,
      price: 240,
      booking: {
        provider: '12306',
        url: 'https://www.12306.cn/',
        notes: '跳转至铁路官网'
      }
    }
  ]

  const segB: TravelSegment[] = [
    {
      mode: 'flight',
      optionId: `F-${origin}-北京`.toUpperCase(),
      departTime: `${date}T09:00:00+08:00`,
      arriveTime: `${date}T11:30:00+08:00`,
      price: 520,
      booking: {
        provider: 'airline',
        url: `https://www.example-airline.com/book?flight=${encodeURIComponent(`F-${origin}-北京`)}`,
        notes: '跳转至航司官网'
      }
    },
    {
      mode: 'train',
      optionId: `T-北京-${destination}`.toUpperCase(),
      departTime: `${date}T13:00:00+08:00`,
      arriveTime: `${date}T14:30:00+08:00`,
      price: 180,
      booking: {
        provider: '12306',
        url: 'https://www.12306.cn/',
        notes: '跳转至铁路官网'
      }
    }
  ]

  const segC: TravelSegment[] = [
    {
      mode: 'train',
      optionId: `T-${origin}-${destination}`.toUpperCase(),
      departTime: `${date}T07:00:00+08:00`,
      arriveTime: `${date}T16:00:00+08:00`,
      price: 680,
      booking: {
        provider: '12306',
        url: 'https://www.12306.cn/',
        notes: '跳转至铁路官网'
      }
    }
  ]

  const m1: TravelScheme = {
    title: '时间优先',
    segments: segA,
    totalPrice: 720,
    totalTimeMinutes: 360,
    transfers: 1,
    score: 78.3,
    reason: '总耗时较短，接驳适中'
  }

  const m2: TravelScheme = {
    title: '价格优先',
    segments: segB,
    totalPrice: 700,
    totalTimeMinutes: 390,
    transfers: 1,
    score: 74.1,
    reason: '机票特价，总价更低'
  }

  const m3: TravelScheme = {
    title: '综合优先',
    segments: segC,
    totalPrice: 680,
    totalTimeMinutes: 540,
    transfers: 0,
    score: 79.0,
    reason: '无接驳，体验稳定'
  }

  return [m1, m2, m3]
}

const mockHotels = (destination: string): Hotel[] => [
  {
    name: `${destination}中心酒店`,
    rating: 4.6,
    price: 520,
    reason: '位置优越，评分高',
    url: 'https://www.amap.com'
  },
  {
    name: `${destination}舒适酒店`,
    rating: 4.3,
    price: 420,
    reason: '交通便利，预算适中',
    url: 'https://www.amap.com'
  },
  {
    name: `${destination}经济酒店`,
    rating: 3.9,
    price: 260,
    reason: '预算友好',
    url: 'https://www.amap.com'
  }
]

const mockRoutes = (destination: string, stopover: string): Route[] => [
  {
    name: `${destination}三日精华`,
    days: 3,
    items: [
      'D1 上午-博物馆 下午-历史街区',
      'D2 上午-地标建筑 下午-城市公园',
      'D3 上午-艺术馆 下午-美食区'
    ],
    url: 'https://www.amap.com',
    kind: 'destination'
  },
  {
    name: `${destination}美食与夜游`,
    days: 2,
    items: [
      'D1 城市地标与夜市',
      'D2 老街区与美食探索'
    ],
    url: 'https://www.amap.com',
    kind: 'destination'
  },
  {
    name: `${stopover}文化速览`,
    days: 1,
    items: [
      '上午-博物馆 下午-地标建筑'
    ],
    url: 'https://www.amap.com',
    kind: 'stopover'
  },
  {
    name: `${stopover}城市漫步`,
    days: 1,
    items: [
      '上午-历史街区 下午-城市公园'
    ],
    url: 'https://www.amap.com',
    kind: 'stopover'
  }
]

onMounted(() => {
  // 从路由参数获取出发地和目的地
  const origin = (route.query.origin as string) || '广州'
  const destination = (route.query.destination as string) || '保定'
  const stopover = (route.query.via as string) || '北京'
  const priceFirst = route.query.priceFirst === 'true'
  
  // 生成模拟数据
  schemes.value = mockSchemes(origin, destination, priceFirst)
  hotels.value = mockHotels(destination)
  routes.value = mockRoutes(destination, stopover)
})
</script>

<style scoped lang="scss">
.schemes-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.schemes-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/bg/u=4239833843,3906688363&fm=3074&app=3074&f=PNG.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(12px);
  transform: scale(1.05);
  z-index: 0;
  pointer-events: none;
}

.schemes-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.schemes-page > * {
  position: relative;
  z-index: 1;
}

.schemes-container {
  max-width: 1200px;
  width: 100%;
  padding: 16px;
}

.section-title {
  font-weight: 600;
  margin: 16px 0 12px;
  color: #ffffff;
  text-shadow: 0 2px 6px rgba(0,0,0,0.35);
}

.hero {
  padding: 16px;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.35);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.card {
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.card .title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 16px;
}

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.pill {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid #ddd;
  border-radius: 999px;
  font-size: 12px;
  color: #444;
  background: #f9fafb;
}

.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.scheme-reason {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
  font-style: italic;
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}

.hotel, .route {
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
}

.hotel .title, .route .title {
  font-weight: 600;
  margin-bottom: 6px;
}

.additional-info {
  margin-bottom: 24px;
}

.hotels-section, .routes-section {
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #2f80ed;
  color: #fff;
  background: #2f80ed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn.secondary {
  border-color: #888;
  color: #222;
  background: #eee;
}

.btn:hover {
  opacity: 0.9;
}

@media (max-width: 900px) {
  .cards, .list {
    grid-template-columns: 1fr;
  }
}
</style>