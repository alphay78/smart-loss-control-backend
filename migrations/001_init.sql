-- ============================================
-- Smart Loss Control - FINAL PRODUCTION SCHEMA
-- Migration: 001_init_final.sql
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
    currency_code VARCHAR(3) DEFAULT 'NGN' NOT NULL, -- MVP: Strictly Naira
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos' NOT NULL,
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
    -- PRD: Must be validated as 4-digit numeric in App Layer before hashing
    pin_hash TEXT NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADDING DATABASE DOCUMENTATION FOR THE PIN RULE
COMMENT ON COLUMN users.pin_hash IS 'Stores the hashed version of a strictly 4-digit numeric PIN (e.g., 1234).';

CREATE INDEX idx_users_shop_id ON users(shop_id);

-- ============================================
-- DEVICES (QR ONBOARDING & WHITELISTING)
-- ============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, 
    is_whitelisted BOOLEAN DEFAULT TRUE NOT NULL,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
);

-- ============================================
-- SKUS (PRODUCT MASTER LIST)
-- ============================================
CREATE TABLE skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(100) NOT NULL, 
    size VARCHAR(50) NOT NULL,  
    is_carton BOOLEAN DEFAULT FALSE NOT NULL,
    units_per_carton INTEGER DEFAULT 12 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand, size, is_carton)
);

-- ============================================
-- INVENTORY (CURRENT STOCK STATE)
-- ============================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cost_price NUMERIC(12,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    reorder_level INTEGER DEFAULT 5 NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, sku_id)
);

-- ============================================
-- TRANSACTIONS (IMMUTABLE LOG WITH OFFLINE SUPPORT)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID REFERENCES skus(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('SALE', 'RESTOCK', 'DECANT', 'AUDIT')),
    quantity INTEGER NOT NULL,
    is_offline BOOLEAN DEFAULT FALSE NOT NULL, 
    occurred_at TIMESTAMP NOT NULL,   -- PRD: Device-side timestamp
    device_id TEXT NOT NULL,           -- Accountability: Which phone?
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);

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
    loss_value_naira NUMERIC(12,2) NOT NULL DEFAULT 0, 
    trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('RANDOM', 'ANOMALY', 'MANUAL')),
    status VARCHAR(20) DEFAULT 'OK' NOT NULL CHECK (status IN ('OK', 'WARNING', 'CRITICAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ALERTS & SEVERITY LOGIC (TRIGGER)
-- ============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES skus(id) ON DELETE SET NULL,
    audit_log_id UUID REFERENCES audit_logs(id) ON DELETE SET NULL,
    deviation INTEGER NOT NULL,
    estimated_loss NUMERIC(12,2) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGER: Automatically set status to CRITICAL if deviation >= 10%
CREATE OR REPLACE FUNCTION check_audit_severity() RETURNS TRIGGER AS $$
BEGIN
    NEW.deviation_percent := (NEW.deviation::numeric / NULLIF(NEW.expected_qty, 0)) * 100;
    
    IF ABS(NEW.deviation_percent) >= 10.00 THEN
        NEW.status := 'CRITICAL';
    ELSIF ABS(NEW.deviation_percent) > 0 THEN
        NEW.status := 'WARNING';
    ELSE
        NEW.status := 'OK';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_severity
BEFORE INSERT ON audit_logs
FOR EACH ROW EXECUTE FUNCTION check_audit_severity();

-- ============================================
-- RESTOCKS & DECANTS 
-- ============================================
CREATE TABLE restocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    ordered_qty INTEGER NOT NULL,
    received_qty INTEGER NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    discrepancy INTEGER GENERATED ALWAYS AS (received_qty - ordered_qty) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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