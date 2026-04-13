SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS sungji_phone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sungji_phone;

-- ─── 기존 테이블 ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS phones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL COMMENT '예: 갤럭시 S24 256GB',
  brand VARCHAR(50) NOT NULL COMMENT '예: 삼성, 애플',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS price_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone_id BIGINT NOT NULL,
  price INT NOT NULL COMMENT '단위: 원',
  source VARCHAR(50) NOT NULL COMMENT '예: 뽐뿌, 세티즌',
  source_url VARCHAR(500),
  crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_price_records_phone_id  ON price_records(phone_id);
CREATE INDEX IF NOT EXISTS idx_price_records_crawled_at ON price_records(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_records_price      ON price_records(price ASC);

-- ─── 유저 테이블 ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
  device_token VARCHAR(200),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 관심 목록 테이블 ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_watchlist (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_token VARCHAR(200) COMMENT 'FCM 토큰 (레거시)',
  user_id      BIGINT COMMENT '로그인 유저 FK',
  phone_id     BIGINT NOT NULL,
  target_price INT COMMENT '목표 가격 (이 이하면 알림)',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id)  REFERENCES phones(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_watchlist_device_token ON user_watchlist(device_token);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id      ON user_watchlist(user_id);

-- ─── 게시판 테이블 ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 댓글 테이블 ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comments (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  content    VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- ─── 샘플 폰 데이터 ─────────────────────────────────────────────────

INSERT INTO phones (model_name, brand) VALUES
  ('갤럭시 S24 256GB',       '삼성'),
  ('갤럭시 S24 Ultra 256GB', '삼성'),
  ('아이폰 15 128GB',        '애플'),
  ('아이폰 15 Pro 256GB',    '애플'),
  ('갤럭시 A54 256GB',       '삼성')
ON DUPLICATE KEY UPDATE model_name = model_name;
