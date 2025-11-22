import { createPool } from 'mysql2/promise';
import { env } from '../config/env.js';
export const mysql = createPool({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'airandroad',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
