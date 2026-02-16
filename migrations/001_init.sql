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
    currency_code VARCHAR(3) DEFAULT 'NGN' NOT NULL,
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
    pin_hash TEXT,  -- allow NULL during OTP onboarding
    is_active BOOLEAN DEFAULT TRUE NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN users.pin_hash IS 'Stores the hashed version of a strictly 4-digit numeric PIN (e.g., 1234).';

CREATE UNIQUE INDEX unique_users_phone_per_shop ON users(shop_id, phone);
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
    UNIQUE(user_id, device_id),
    UNIQUE(device_id)
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
    cost_price NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
    selling_price NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
    reorder_level INTEGER DEFAULT 5 NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, sku_id),
    CHECK (selling_price >= cost_price)
);

-- Optional: auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_inventory_timestamp() RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at := NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_inventory_timestamp();

-- ============================================
-- TRANSACTIONS (IMMUTABLE LOG WITH OFFLINE SUPPORT)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID REFERENCES skus(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('SALE', 'RESTOCK', 'DECANT', 'AUDIT')),
    quantity INTEGER NOT NULL CHECK (quantity <> 0),
    is_offline BOOLEAN DEFAULT FALSE NOT NULL,
    offline_ref TEXT,
    occurred_at TIMESTAMP NOT NULL,
    device_id TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, offline_ref)
);

CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX idx_transactions_sku_id ON transactions(sku_id);

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

-- Trigger: calculate deviation_percent & set status
CREATE OR REPLACE FUNCTION check_audit_severity() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expected_qty = 0 THEN
        NEW.deviation_percent := 100;
    ELSE
        NEW.deviation_percent := (NEW.deviation::numeric / NEW.expected_qty) * 100;
    END IF;

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
-- ALERTS & SEVERITY LOGIC
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

-- Trigger: auto-create alerts for CRITICAL
CREATE OR REPLACE FUNCTION create_alert_if_critical() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CRITICAL' THEN
        INSERT INTO alerts(shop_id, sku_id, audit_log_id, deviation, estimated_loss)
        VALUES (NEW.shop_id, NEW.sku_id, NEW.id, NEW.deviation, NEW.loss_value_naira);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_alert
AFTER INSERT ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION create_alert_if_critical();

-- ============================================
-- RESTOCKS & DECANTS
-- ============================================
CREATE TABLE restocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    ordered_qty INTEGER NOT NULL CHECK (ordered_qty >= 0),
    received_qty INTEGER NOT NULL CHECK (received_qty >= 0),
    cost_price NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
    selling_price NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (carton_sku_id <> unit_sku_id)
);
