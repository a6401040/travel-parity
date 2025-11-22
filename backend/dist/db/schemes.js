import { mysql } from './mysql.js';
export async function saveScheme(userId, name, scheme) {
    const [ret] = await mysql.query('INSERT INTO schemes (user_id, name, scheme_json) VALUES (?,?,?)', [userId, name, JSON.stringify(scheme)]);
    const id = Number(ret?.insertId);
    return { id, user_id: userId, name };
}
export async function getScheme(userId, id) {
    const [rows] = await mysql.query('SELECT id, user_id, name, scheme_json, created_at FROM schemes WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
}
export async function deleteScheme(userId, id) {
    const [ret] = await mysql.query('DELETE FROM schemes WHERE id = ? AND user_id = ?', [id, userId]);
    return Number(ret?.affectedRows || 0) > 0;
}
export async function listSchemes(userId, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const [rows] = await mysql.query('SELECT SQL_CALC_FOUND_ROWS id, name, created_at FROM schemes WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, pageSize, offset]);
    const [countRows] = await mysql.query('SELECT FOUND_ROWS() AS total');
    const total = Number(countRows[0]?.total || 0);
    return { items: rows, total };
}
