-- ==========================================================
-- 修仙模拟器 (Project: Cultivation & Heartfire) SQLite 建表语句
-- 严格遵从 PRD 6.1 节物理表设计规范
-- ==========================================================

-- 1. 玩家主体表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    dao_name TEXT NOT NULL,
    realm TEXT NOT NULL,
    realm_index INTEGER DEFAULT 0,
    power INTEGER DEFAULT 10,
    luck INTEGER DEFAULT 75,
    heart_fire INTEGER DEFAULT 3,
    spirit_stones INTEGER DEFAULT 0,
    save_data TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 坊市交易行表
CREATE TABLE IF NOT EXISTS market_items (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_data TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    buyer_id TEXT,
    buyer_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 索引优化
-- users 表：金榜排行查询加速 (战力榜与气运榜)
CREATE INDEX IF NOT EXISTS idx_users_power ON users (power DESC);
CREATE INDEX IF NOT EXISTS idx_users_luck ON users (luck DESC);

-- market_items 表：在售状态与卖家过滤加速
CREATE INDEX IF NOT EXISTS idx_market_items_status ON market_items (status);
CREATE INDEX IF NOT EXISTS idx_market_items_seller_id ON market_items (seller_id);
