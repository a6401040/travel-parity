// 格式化工具函数
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN')}`
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}