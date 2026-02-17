# Smart Loss Control - Database Schema

## Overview
This document provides a visual representation of the database schema for the Smart Loss Control system.

## Entity Relationship Diagram

```mermaid
erDiagram
    shops ||--o{ users : "has"
    shops ||--o{ inventory : "manages"
    shops ||--o{ transactions : "records"
    shops ||--o{ audit_logs : "tracks"
    shops ||--o{ alerts : "generates"
    shops ||--o{ restocks : "receives"
    shops ||--o{ decants : "performs"
    shops ||--o{ qr_codes : "creates"
    shops ||--o{ sales_velocity_metrics : "analyzes"
    
    users ||--o{ devices : "links"
    users ||--o{ transactions : "performs"
    users ||--o{ audit_logs : "conducts"
    users ||--o{ restocks : "logs"
    users ||--o{ decants : "executes"
    users ||--o{ sessions : "maintains"
    
    skus ||--o{ inventory : "tracked_in"
    skus ||--o{ transactions : "involves"
    skus ||--o{ audit_logs : "verified_for"
    skus ||--o{ alerts : "triggers"
    skus ||--o{ restocks : "replenishes"
    skus ||--o{ sales_velocity_metrics : "measures"
    
    audit_logs ||--o{ alerts : "creates"
    alerts ||--o{ notification_logs : "sends"
    
    shops {
        uuid id PK
        varchar shop_name
        varchar owner_phone UK
        text aes_key_hash
        varchar currency_code
        varchar timezone
        timestamp created_at
    }
    
    users {
        uuid id PK
        uuid shop_id FK
        varchar full_name
        varchar phone
        varchar role
        text pin_hash
        boolean is_active
        timestamp last_login_at
        timestamp created_at
    }
    
    devices {
        uuid id PK
        uuid user_id FK
        text device_id UK
        boolean is_whitelisted
        timestamp linked_at
    }
    
    skus {
        uuid id PK
        varchar brand
        varchar size
        boolean is_carton
        integer units_per_carton
        timestamp created_at
    }
    
    inventory {
        uuid id PK
        uuid shop_id FK
        uuid sku_id FK
        integer quantity
        numeric cost_price
        numeric selling_price
        integer reorder_level
        timestamp last_count_at
        timestamp updated_at
    }
    
    transactions {
        uuid id PK
        uuid shop_id FK
        uuid user_id FK
        uuid sku_id FK
        varchar type
        integer quantity
        boolean is_offline
        text offline_ref
        timestamp occurred_at
        text device_id
        jsonb meta
        timestamp created_at
    }
    
    audit_logs {
        uuid id PK
        uuid shop_id FK
        uuid user_id FK
        uuid sku_id FK
        integer expected_qty
        integer actual_qty
        integer deviation
        numeric deviation_percent
        numeric loss_value_naira
        varchar trigger_type
        varchar status
        timestamp created_at
    }
    
    alerts {
        uuid id PK
        uuid shop_id FK
        uuid sku_id FK
        uuid audit_log_id FK
        integer deviation
        numeric estimated_loss
        boolean is_resolved
        timestamp created_at
    }
    
    restocks {
        uuid id PK
        uuid shop_id FK
        uuid user_id FK
        uuid sku_id FK
        integer ordered_qty
        integer received_qty
        numeric cost_price
        numeric selling_price
        integer discrepancy
        timestamp created_at
    }
    
    decants {
        uuid id PK
        uuid shop_id FK
        uuid user_id FK
        uuid carton_sku_id FK
        uuid unit_sku_id FK
        integer cartons_used
        integer units_created
        timestamp created_at
    }
    
    otp_verifications {
        uuid id PK
        varchar phone
        varchar otp_code
        boolean is_verified
        timestamp expires_at
        timestamp created_at
    }
    
    sessions {
        uuid id PK
        uuid user_id FK
        text device_id
        text token_hash
        timestamp expires_at
        timestamp created_at
    }
    
    qr_codes {
        uuid id PK
        uuid shop_id FK
        text code UK
        boolean is_used
        timestamp expires_at
        timestamp created_at
    }
    
    notification_logs {
        uuid id PK
        uuid alert_id FK
        varchar recipient_phone
        varchar channel
        text message_body
        varchar status
        text external_id
        timestamp sent_at
        timestamp delivered_at
        timestamp created_at
    }
    
    sales_velocity_metrics {
        uuid id PK
        uuid shop_id FK
        uuid sku_id FK
        varchar time_window
        timestamp period_start
        timestamp period_end
        integer units_sold
        numeric avg_velocity
        timestamp created_at
    }
```

## Table Descriptions

### Core Tables

#### shops
Stores shop/business information. Each shop has one owner and can have multiple staff members.

#### users
Stores both OWNER and STAFF user accounts. Linked to shops via `shop_id`.

#### devices
Tracks whitelisted devices for staff access control via QR code onboarding.

#### skus
Master product catalog for cooking oil brands (Mamador, King's, etc.) and sizes (1L, 2L, 5L, 25L).

#### inventory
Current stock levels for each SKU in each shop. Updated by sales, restocks, and decants.

### Transaction Tables

#### transactions
Immutable audit trail of all stock movements (SALE, RESTOCK, DECANT, AUDIT). Supports offline sync.

#### restocks
Records supplier deliveries with "Ordered vs Received" tracking to catch supplier errors.

#### decants
Tracks carton-to-unit conversions (e.g., 1 carton → 12 bottles).

### AI & Security Tables

#### audit_logs
Records AI-triggered spot checks comparing expected vs actual stock counts.

#### alerts
Auto-generated when deviation exceeds 10%. Triggers WhatsApp/SMS notifications.

#### sales_velocity_metrics
Tracks hourly/daily/weekly sales patterns for AI anomaly detection.

### Authentication & Security

#### otp_verifications
Temporary OTP codes for owner registration (4-digit codes).

#### sessions
JWT session management with 12-hour auto-logout.

#### qr_codes
One-time-use QR codes for secure staff device linking.

#### notification_logs
Tracks WhatsApp/SMS alert delivery status via Twilio.

## Key Relationships

1. **Shop → Users**: One-to-many (1 owner + multiple staff)
2. **Shop → Inventory**: One-to-many (each shop tracks its own stock)
3. **SKU → Inventory**: One-to-many (same product across multiple shops)
4. **Audit Log → Alert**: One-to-one (critical deviations auto-create alerts)
5. **Alert → Notifications**: One-to-many (alerts sent via multiple channels)

## Database Triggers

### Auto-Severity Calculation
```sql
-- Automatically calculates deviation_percent and sets status (OK/WARNING/CRITICAL)
CREATE TRIGGER trg_audit_severity
BEFORE INSERT ON audit_logs
FOR EACH ROW EXECUTE FUNCTION check_audit_severity();
```

### Auto-Alert Creation
```sql
-- Automatically creates alerts when deviation >= 10%
CREATE TRIGGER trg_create_alert
AFTER INSERT ON audit_logs
FOR EACH ROW EXECUTE FUNCTION create_alert_if_critical();
```

### Auto-Timestamp Update
```sql
-- Updates inventory.updated_at on every change
CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_inventory_timestamp();
```

## Indexes for Performance

### High-Frequency Query Indexes
- `idx_transactions_shop_id` - Fast shop transaction lookups
- `idx_transactions_occurred_at` - Time-based queries
- `idx_audit_logs_shop_sku` - Deviation tracking per SKU
- `idx_alerts_unresolved` - Quick access to open alerts
- `idx_sessions_expires_at` - Session cleanup queries

### Offline Sync Indexes
- `idx_transactions_type_occurred` - Sync by transaction type and time
- `unique(shop_id, offline_ref)` - Prevent duplicate offline sales

## Data Flow Examples

### Sale Flow
1. Staff logs sale → `transactions` (type: SALE, is_offline: true)
2. Offline data syncs → Updates `inventory.quantity`
3. AI checks velocity → May trigger spot check
4. Staff performs count → Creates `audit_logs` entry
5. If deviation > 10% → Auto-creates `alerts` entry
6. Alert triggers → Creates `notification_logs` entry

### Restock Flow
1. Owner logs delivery → `restocks` (ordered_qty vs received_qty)
2. System calculates discrepancy → Stored in `discrepancy` column
3. Updates `inventory` with received_qty only
4. Creates `transactions` entry (type: RESTOCK)

### Decant Flow
1. Staff breaks carton → `decants` (carton_sku_id → unit_sku_id)
2. Reduces carton inventory → Updates `inventory` for carton SKU
3. Increases unit inventory → Updates `inventory` for unit SKU
4. Creates `transactions` entries for both operations

## Security Features

- **PIN Hashing**: All PINs stored as bcrypt hashes in `users.pin_hash`
- **AES Encryption**: Shop-level encryption keys in `shops.aes_key_hash`
- **Device Whitelisting**: Only approved devices in `devices` table can access
- **Session Expiry**: 12-hour auto-logout via `sessions.expires_at`
- **Immutable Audit Trail**: Transactions cannot be deleted by staff
