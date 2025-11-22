import { mysql } from './mysql.js';
export async function getDownloadSettings(userId) {
    const [rows] = await mysql.query('SELECT default_export_format, filename_rule, include_segments_detail, download_path FROM user_settings WHERE user_id = ?', [userId]);
    const row = rows[0];
    if (!row)
        return { default_export_format: 'markdown', filename_rule: '{origin}-{destination}-{date}-{ts}', include_segments_detail: 0, download_path: 'Desktop' };
    return { default_export_format: String(row.default_export_format), filename_rule: String(row.filename_rule), include_segments_detail: Number(row.include_segments_detail) === 1, download_path: String(row.download_path || 'Desktop') };
}
export async function upsertDownloadSettings(userId, s) {
    const [rows] = await mysql.query('SELECT user_id FROM user_settings WHERE user_id = ?', [userId]);
    const exists = rows[0];
    if (exists) {
        await mysql.query('UPDATE user_settings SET default_export_format = ?, filename_rule = ?, include_segments_detail = ?, download_path = ?, updated_at = NOW() WHERE user_id = ?', [s.default_export_format, s.filename_rule, s.include_segments_detail ? 1 : 0, s.download_path || 'Desktop', userId]);
    }
    else {
        await mysql.query('INSERT INTO user_settings (user_id, default_export_format, filename_rule, include_segments_detail, download_path) VALUES (?,?,?,?,?)', [userId, s.default_export_format, s.filename_rule, s.include_segments_detail ? 1 : 0, s.download_path || 'Desktop']);
    }
    return getDownloadSettings(userId);
}
