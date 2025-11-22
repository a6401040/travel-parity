import { mysql } from './mysql.js'
import bcrypt from 'bcryptjs'

export async function getUserById(id: number) {
  const [rows] = await mysql.query('SELECT id, username, email, phone, role, status, subscription_plan, subscription_expire_at, created_at, updated_at FROM users WHERE id = ? AND (deleted_at IS NULL)', [id])
  return (rows as any[])[0] || null
}

export async function getUserByUsername(username: string) {
  const [rows] = await mysql.query('SELECT id, username, password_hash, email, phone, role, status FROM users WHERE username = ? AND (deleted_at IS NULL)', [username])
  return (rows as any[])[0] || null
}

export async function createUser(params: { username: string; password: string; email?: string; phone?: string }) {
  const [exists] = await mysql.query('SELECT id FROM users WHERE username = ? LIMIT 1', [params.username])
  if ((exists as any[])[0]) throw new Error('username_taken')
  if (params.email) {
    const [e] = await mysql.query('SELECT id FROM users WHERE email = ? LIMIT 1', [params.email])
    if ((e as any[])[0]) throw new Error('email_taken')
  }
  if (params.phone) {
    const [p] = await mysql.query('SELECT id FROM users WHERE phone = ? LIMIT 1', [params.phone])
    if ((p as any[])[0]) throw new Error('phone_taken')
  }
  const hash = await bcrypt.hash(params.password, 10)
  const [ret] = await mysql.query('INSERT INTO users (username, password_hash, email, phone, status, role, created_at, updated_at) VALUES (?,?,?,?,1, "user", NOW(), NOW())', [params.username, hash, params.email || null, params.phone || null])
  const id = (ret as any)?.insertId
  return getUserById(Number(id))
}

export async function updateUserProfile(id: number, fields: { email?: string; phone?: string }) {
  const sets: string[] = []
  const params: any[] = []
  if (fields.email != null) {
    sets.push('email = ?')
    params.push(fields.email)
  }
  if (fields.phone != null) {
    sets.push('phone = ?')
    params.push(fields.phone)
  }
  if (!sets.length) return getUserById(id)
  params.push(id)
  await mysql.query(`UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, params)
  return getUserById(id)
}

export async function updateUserPassword(id: number, currentPassword: string, newPassword: string) {
  const [rows] = await mysql.query('SELECT password_hash FROM users WHERE id = ? AND (deleted_at IS NULL)', [id])
  const row = (rows as any[])[0]
  if (!row) throw new Error('user_not_found')
  const ok = await bcrypt.compare(currentPassword, String(row.password_hash))
  if (!ok) throw new Error('password_mismatch')
  const hash = await bcrypt.hash(newPassword, 10)
  await mysql.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hash, id])
  return true
}

export async function softDeleteUser(id: number) {
  await mysql.query('UPDATE users SET status = 0, deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [id])
  return true
}
