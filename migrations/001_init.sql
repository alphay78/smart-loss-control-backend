-- ============================================
-- Smart Loss Control - Initial Schema Migration
-- Migration: 001_init.sql
-- Based on PRD v1.0
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SHOPS
-- ============================================
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name VARCHAR(150) NOT NULL,
    owner_phone VARCHAR(20) UNIQUE NOT NULL,
    aes_key_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS (OWNER / STAFF)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'STAFF')),
    pin_hash TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_shop_id ON users(shop_id);

-- ============================================
-- DEVICES (QR ONBOARDING)
-- ============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    is_whitelisted BOOLEAN DEFAULT TRUE,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user_id ON devices(user_id);

-- ============================================
-- SKUS (PRODUCT MASTER LIST)
-- ============================================
CREATE TABLE skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    is_carton BOOLEAN DEFAULT FALSE,
    units_per_carton INTEGER DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand, size)
);

-- ============================================
-- INVENTORY (CURRENT STOCK STATE)
-- ============================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cost_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, sku_id)
);

CREATE INDEX idx_inventory_shop_id ON inventory(shop_id);
CREATE INDEX idx_inventory_sku_id ON inventory(sku_id);

-- ============================================
-- TRANSACTIONS (IMMUTABLE LOG)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID REFERENCES skus(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('SALE', 'RESTOCK', 'DECANT', 'AUDIT')),
    quantity INTEGER NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- RESTOCKS (ORDERED VS RECEIVED)
-- ============================================
CREATE TABLE restocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    ordered_qty INTEGER NOT NULL CHECK (ordered_qty >= 0),
    received_qty INTEGER NOT NULL CHECK (received_qty >= 0),
    cost_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    discrepancy INTEGER GENERATED ALWAYS AS (received_qty - ordered_qty) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restocks_shop_id ON restocks(shop_id);
CREATE INDEX idx_restocks_sku_id ON restocks(sku_id);

-- ============================================
-- DECANTS (CARTON -> UNITS)
-- ============================================
CREATE TABLE decants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    carton_sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    unit_sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    cartons_used INTEGER NOT NULL CHECK (cartons_used > 0),
    units_created INTEGER NOT NULL CHECK (units_created > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decants_shop_id ON decants(shop_id);

-- ============================================
-- AUDIT LOGS (EXPECTED VS ACTUAL COUNT)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    expected_qty INTEGER NOT NULL,
    actual_qty INTEGER NOT NULL,
    deviation INTEGER NOT NULL,
    deviation_percent NUMERIC(6,2),
    status VARCHAR(20) DEFAULT 'OK' CHECK (status IN ('OK', 'WARNING', 'CRITICAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_shop_id ON audit_logs(shop_id);
CREATE INDEX idx_audit_sku_id ON audit_logs(sku_id);

-- ============================================
-- ALERTS (OWNER NOTIFICATION)
-- ============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES skus(id) ON DELETE SET NULL,
    audit_log_id UUID REFERENCES audit_logs(id) ON DELETE SET NULL,
    deviation INTEGER NOT NULL,
    estimated_loss NUMERIC(12,2),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_shop_id ON alerts(shop_id);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);
