import { mysql } from './mysql.js';
export async function ensureSchema() {
    await mysql.query(`CREATE TABLE IF NOT EXISTS user_settings (
      id BIGINT NOT NULL AUTO_INCREMENT,
      user_id BIGINT NOT NULL UNIQUE,
      default_export_format VARCHAR(16) NOT NULL DEFAULT 'markdown',
      filename_rule VARCHAR(128) NOT NULL DEFAULT '{origin}-{destination}-{date}-{ts}',
      include_segments_detail TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    // users table (if missing)
    await mysql.query(`CREATE TABLE IF NOT EXISTS users (
      id BIGINT NOT NULL AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(128) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      role VARCHAR(32) NOT NULL DEFAULT 'user',
      subscription_plan VARCHAR(16) DEFAULT NULL,
      subscription_expire_at DATETIME DEFAULT NULL,
      last_login_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uk_username (username),
      UNIQUE KEY uk_email (email),
      UNIQUE KEY uk_phone (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await mysql.query(`CREATE TABLE IF NOT EXISTS history (
      id BIGINT NOT NULL AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      title VARCHAR(128) DEFAULT NULL,
      request_json JSON,
      response_json JSON,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await mysql.query(`CREATE TABLE IF NOT EXISTS schemes (
      id BIGINT NOT NULL AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      name VARCHAR(128) NOT NULL,
      scheme_json JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    // Add foreign keys (ignore errors if already exists)
    try {
        await mysql.query(`ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
    }
    catch { }
    try {
        await mysql.query(`ALTER TABLE history ADD CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
    }
    catch { }
    try {
        await mysql.query(`ALTER TABLE schemes ADD CONSTRAINT fk_schemes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
    }
    catch { }
    // c_trip_data_new flight table (minimal schema used by queries)
    await mysql.query(`CREATE TABLE IF NOT EXISTS c_trip_data_new (
      id BIGINT NOT NULL AUTO_INCREMENT,
      FlightDate DATE NOT NULL,
      FlightNumber VARCHAR(16) NOT NULL,
      Carrier VARCHAR(16) DEFAULT NULL,
      \`From\` VARCHAR(64) DEFAULT NULL,
      \`To\` VARCHAR(64) DEFAULT NULL,
      FromCity VARCHAR(64) NOT NULL,
      ToCity VARCHAR(64) NOT NULL,
      DepartureTime DATETIME NOT NULL,
      ArrivalTime DATETIME NOT NULL,
      YCabin VARCHAR(8) DEFAULT NULL,
      YPrice DECIMAL(10,2) DEFAULT NULL,
      CCabin VARCHAR(8) DEFAULT NULL,
      CPrice DECIMAL(10,2) DEFAULT NULL,
      FCabin VARCHAR(8) DEFAULT NULL,
      FPrice DECIMAL(10,2) DEFAULT NULL,
      PunctualityRate DECIMAL(5,2) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_city_date (FlightDate, FromCity, ToCity),
      KEY idx_departure (DepartureTime),
      KEY idx_flight (FlightNumber)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
export async function ensureSeedUsers() {
    const [rows] = await mysql.query('SELECT COUNT(*) AS cnt FROM users WHERE username = "admin"');
    const cnt = Number(rows[0]?.cnt || 0);
    if (cnt > 0)
        return;
    await mysql.query(`INSERT INTO users (username, password_hash, email, phone, status, role, subscription_plan, subscription_expire_at, created_at, updated_at)
     VALUES 
     ('admin', '$2b$10$CjYfJv8lU6y1p2CkYkq2oe2H8A0bq9eI8vF1r8U2F1uFvQyNnEoGi', 'admin@example.com', '13800000000', 1, 'admin', NULL, NULL, NOW(), NOW()),
     ('user_free', '$2b$10$3uK7mF5qZx1nU2YvDkq3leF7t9Qw8eR1uV0sHx9yKzQpLmNoPaQbC', 'free@example.com', '13800000001', 1, 'user', '免费', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW()),
     ('user_15', '$2b$10$QmN8aJ4sTy2pL3WvBkq9ldD1sF2gH3jK5lMnOpQrStUvWxYzAbCdEf', 'std@example.com', '13800000002', 1, 'user', '15元', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW()),
     ('user_25', '$2b$10$LmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkL', 'pro@example.com', '13800000003', 1, 'user', '25元', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())`);
}
