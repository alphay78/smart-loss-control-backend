# Frontend Integration Guide - Smart Loss Control

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [API Base URL](#api-base-url)
3. [Authentication Flow](#authentication-flow)
4. [Core User Flows](#core-user-flows)
5. [Offline-First Architecture](#offline-first-architecture)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites
- Node.js backend running on `http://localhost:5000`
- PostgreSQL database configured
- Swagger docs available at `http://localhost:5000/api-docs`

### Authentication
All API requests (except registration/login) require a JWT token:
```javascript
headers: {
  'Authorization': 'Bearer <your_jwt_token>',
  'Content-Type': 'application/json'
}
```

---

## API Base URL

**Development**: `http://localhost:5000`
**Production**: TBD

**Swagger Documentation**: `http://localhost:5000/api-docs`

---

## Authentication Flow

### 1. Owner Registration (First Time Setup)

```javascript
// Step 1: Register and request OTP
POST /auth/register-owner
{
  "full_name": "Amina Yusuf",
  "shop_name": "Amina Ventures",
  "phone": "+2348012345678"
}

// Response
{
  "success": true,
  "message": "OTP sent to +2348012345678"
}

// Step 2: Verify OTP
POST /auth/verify-otp
{
  "phone": "+2348012345678",
  "otp": "1234"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "role": "OWNER",
    "phone": "+2348012345678",
    "shop_id": "uuid"
  }
}
```

### 2. Staff Onboarding (QR Code Flow)

```javascript
// Owner generates QR code
POST /shops/qr-token
Authorization: Bearer <owner_token>

// Response
{
  "success": true,
  "qr_token": "SHOPQR-92D8KASJ2",
  "expires_in_minutes": 30
}

// Staff scans QR and links device
POST /auth/staff/link
{
  "qr_token": "SHOPQR-92D8KASJ2",
  "device_id": "android-device-xyz-123",
  "staff_name": "Chinedu",
  "pin": "4321"
}

// Response
{
  "success": true,
  "message": "Staff device linked successfully",
  "staff": {
    "id": "uuid",
    "name": "Chinedu",
    "role": "STAFF"
  }
}
```

### 3. Staff Login (4-Digit PIN)

```javascript
POST /auth/login-pin
{
  "phone": "+2348012345678",
  "pin": "4321"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "role": "STAFF",
    "phone": "+2348012345678",
    "shop_id": "uuid"
  }
}
```

---

## Core User Flows

### Flow 1: Owner Restocks Inventory

```javascript
POST /inventory/restock
Authorization: Bearer <owner_token>
{
  "sku_id": "uuid",
  "ordered_qty": 100,
  "received_qty": 98,
  "cost_price": 18500,
  "sell_price": 21000,
  "supplier_name": "Lagos Distributors Ltd"
}

// Response
{
  "success": true,
  "message": "Restock recorded successfully",
  "discrepancy": -2,
  "inventory_after": 98
}
```

### Flow 2: Staff Logs Sales (Offline-First)

```javascript
// Staff logs sales offline (stored in IndexedDB)
const offlineSales = [
  {
    "sale_id": "sale-uuid-123",  // Client-generated UUID
    "sku_id": "uuid",
    "quantity": 3,
    "unit_price": 21000,
    "sold_at": "2026-02-16T08:10:00Z"
  },
  {
    "sale_id": "sale-uuid-124",
    "sku_id": "uuid",
    "quantity": 1,
    "unit_price": 18500,
    "sold_at": "2026-02-16T08:15:00Z"
  }
];

// When online, sync all sales
POST /sales/sync
Authorization: Bearer <staff_token>
{
  "device_id": "android-device-xyz-123",
  "sales": offlineSales
}

// Response
{
  "success": true,
  "message": "Sales synced successfully",
  "accepted": 10,
  "duplicates_ignored": 2
}
```

### Flow 3: Staff Performs Carton Decant

```javascript
POST /inventory/decant
Authorization: Bearer <staff_token>
{
  "from_sku_id": "uuid-carton",  // Mamador 1L Carton
  "to_sku_id": "uuid-unit",      // Mamador 1L Bottle
  "cartons": 1,
  "units_per_carton": 12
}

// Response
{
  "success": true,
  "message": "Decant completed successfully",
  "cartons_removed": 1,
  "units_added": 12
}
```

### Flow 4: AI Triggers Spot Check

```javascript
// Check if staff should be prompted for count
GET /ai/trigger-count?device_id=android-device-xyz-123
Authorization: Bearer <staff_token>

// Response (Trigger Required)
{
  "success": true,
  "should_prompt": true,
  "sku_id": "uuid",
  "reason": "TIME_BASED_TRIGGER",
  "message": "Quick Check Required: Verify King's Oil 5L stock on shelf."
}

// Staff submits physical count
POST /audit/verify
Authorization: Bearer <staff_token>
{
  "sku_id": "uuid",
  "actual_qty": 95,
  "counted_at": "2026-02-16T08:30:00Z"
}

// Response (Deviation Detected)
{
  "success": true,
  "expected_qty": 97,
  "actual_qty": 95,
  "deviation": -2,
  "deviation_percent": -2.06,
  "alert_triggered": true,
  "estimated_loss": 42000
}
```

### Flow 5: Owner Views Alerts

```javascript
// Get all unresolved alerts
GET /alerts?status=OPEN
Authorization: Bearer <owner_token>

// Response
[
  {
    "id": "uuid",
    "shop_id": "uuid",
    "sku_id": "uuid",
    "expected_qty": 97,
    "actual_qty": 95,
    "deviation": -2,
    "estimated_loss": 42000,
    "status": "OPEN",
    "created_at": "2026-02-16T08:30:00Z"
  }
]

// Resolve an alert
PATCH /alerts/{id}/resolve
Authorization: Bearer <owner_token>

// Response
{
  "success": true,
  "message": "Alert resolved successfully"
}
```

---

## Offline-First Architecture

### IndexedDB Structure (PWA)

```javascript
// Store for offline sales
const salesStore = {
  keyPath: 'sale_id',
  indexes: [
    { name: 'synced', keyPath: 'synced' },
    { name: 'sold_at', keyPath: 'sold_at' }
  ]
};

// Store for inventory cache
const inventoryStore = {
  keyPath: 'sku_id',
  indexes: [
    { name: 'updated_at', keyPath: 'updated_at' }
  ]
};
```

### Sync Strategy

```javascript
// 1. Detect online status
window.addEventListener('online', () => {
  syncOfflineData();
});

// 2. Sync function
async function syncOfflineData() {
  const offlineSales = await getUnsyncedSales();
  
  if (offlineSales.length > 0) {
    const response = await fetch('/sales/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: getDeviceId(),
        sales: offlineSales
      })
    });
    
    if (response.ok) {
      await markSalesAsSynced(offlineSales);
    }
  }
}
```

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register-owner` | Register shop owner | No |
| POST | `/auth/verify-otp` | Verify OTP code | No |
| POST | `/auth/login-pin` | Staff PIN login | No |
| POST | `/auth/staff/link` | Link staff device via QR | No |

### Inventory
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/inventory/summary` | Get shop inventory | Yes |
| POST | `/inventory/restock` | Record restock | Yes (Owner) |
| POST | `/inventory/decant` | Convert carton to units | Yes |

### Sales
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/sales/sync` | Sync offline sales | Yes |

### Audit & AI
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/ai/trigger-count` | Check if count needed | Yes |
| POST | `/audit/verify` | Submit physical count | Yes |

### Alerts
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/alerts` | List alerts | Yes |
| PATCH | `/alerts/{id}/resolve` | Resolve alert | Yes (Owner) |

### Reports
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/reports/deviation` | Deviation report | Yes (Owner) |
| GET | `/reports/staff-performance` | Staff metrics | Yes (Owner) |
| GET | `/reports/export` | Export CSV/Excel | Yes (Owner) |

---

## Data Models

### SKU Object
```typescript
interface SKU {
  id: string;
  brand: string;        // "Mamador", "King's", "Golden Penny"
  size: string;         // "1L", "2L", "5L", "25L"
  is_carton: boolean;
  units_per_carton: number;
}
```

### Inventory Object
```typescript
interface Inventory {
  sku_id: string;
  brand: string;
  size: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  last_count_at: string;
  updated_at: string;
}
```

### Alert Object
```typescript
interface Alert {
  id: string;
  shop_id: string;
  sku_id: string;
  expected_qty: number;
  actual_qty: number;
  deviation: number;
  estimated_loss: number;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
}
```

---

## Error Handling

### Standard Error Response
```javascript
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "phone is required",
    "pin must be 4 digits"
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token/credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Best Practices

### 1. Token Management
```javascript
// Store token securely
localStorage.setItem('auth_token', token);

// Add to all requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
};
```

### 2. Offline Detection
```javascript
// Check connection before API calls
if (!navigator.onLine) {
  // Store in IndexedDB
  await saveToOfflineQueue(data);
  showOfflineIndicator();
} else {
  // Make API call
  await syncToServer(data);
}
```

### 3. Idempotent Sales Sync
```javascript
// Always use client-generated UUIDs
const saleId = crypto.randomUUID();

// Server will ignore duplicates based on sale_id
```

### 4. Real-Time Updates
```javascript
// Poll for new alerts every 30 seconds (Owner dashboard)
setInterval(async () => {
  const alerts = await fetchAlerts({ status: 'OPEN' });
  updateAlertBadge(alerts.length);
}, 30000);
```

### 5. UI Feedback
```javascript
// Show sync status
if (pendingSales > 0) {
  showSyncIndicator(`${pendingSales} sales pending sync`);
}

// Show deviation severity
if (deviation_percent >= 10) {
  showCriticalAlert(alert);
} else if (deviation_percent > 0) {
  showWarningAlert(alert);
}
```

---

## Testing Credentials

### Owner Account
- Phone: `+2348012345678`
- OTP: `1234` (development only)

### Staff Account
- Phone: `+2348087654321`
- PIN: `4321`

---

## Support

For API issues or questions:
- Check Swagger docs: `http://localhost:5000/api-docs`
- Review database schema: `docs/database-schema.md`
- Contact backend team: [Your Contact Info]

---

**Last Updated**: February 2026
**API Version**: 1.0.2
