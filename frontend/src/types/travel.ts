// 出行相关类型定义
export interface TravelQuery {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  travelType: 'one-way' | 'round-trip'
  budget?: number
  preferences?: {
    timePriority?: boolean
    pricePriority?: boolean
    directFlight?: boolean
  }
}

export interface TravelScheme {
  id: string
  type: 'time-priority' | 'price-priority' | 'comprehensive'
  totalPrice: number
  totalDuration: number
  transferCount: number
  score: number
  segments: TravelSegment[]
  description: string
  riskTips?: string[]
  title?: string
  destinations?: Destination[]
  rating?: number
  isSaved?: boolean
  createdAt?: string
}

export interface TravelSegment {
  id: string
  type: 'flight' | 'train'
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  duration: number
  price: number
  carrier: string
  flightNumber?: string
  trainNumber?: string
  seatClass: string
}

export interface Hotel {
  id: string
  name: string
  rating: number
  price: number
  location: string
  image?: string
  amenities: string[]
  mapLink?: string
}

export interface Route {
  id: string
  name: string
  duration: number // days
  dailyItinerary: DailyItinerary[]
  totalPrice: number
  difficulty: 'easy' | 'medium' | 'hard'
  mapLink?: string
}

export interface DailyItinerary {
  day: number
  title: string
  description: string
  attractions: string[]
  meals: string[]
  accommodation?: string
}

export interface Destination {
  id: string
  name: string
  type: string
}

export interface TravelRecommendation {
  schemes: TravelScheme[]
  hotels: Hotel[]
  routes: Route[]
  query: TravelQuery
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  type: 'text' | 'scheme' | 'hotel' | 'route'
  data?: TravelScheme | Hotel | Route | TravelRecommendation
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  summary?: {
    origin: string
    destination: string
    lowestPrice: number
    shortestDuration: number
  }
}