import { mysql } from './mysql.js'

export async function listHistory(userId: number, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize
  const [rows] = await mysql.query('SELECT SQL_CALC_FOUND_ROWS id, title, created_at FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, pageSize, offset])
  const [countRows] = await mysql.query('SELECT FOUND_ROWS() AS total')
  const total = Number((countRows as any[])[0]?.total || 0)
  return { items: rows as any[], total }
}

export async function getHistory(userId: number, id: number) {
  const [rows] = await mysql.query('SELECT id, title, request_json, response_json, created_at FROM history WHERE id = ? AND user_id = ?', [id, userId])
  return (rows as any[])[0] || null
}

export async function insertHistory(userId: number, title: string | null, request: any, response: any) {
  const [ret] = await mysql.query('INSERT INTO history (user_id, title, request_json, response_json) VALUES (?,?,?,?)', [userId, title, JSON.stringify(request || null), JSON.stringify(response || null)])
  const id = Number((ret as any)?.insertId)
  return getHistory(userId, id)
}

export async function deleteHistory(userId: number, id: number) {
  const [ret] = await mysql.query('DELETE FROM history WHERE id = ? AND user_id = ?', [id, userId])
  return Number((ret as any)?.affectedRows || 0) > 0
}
