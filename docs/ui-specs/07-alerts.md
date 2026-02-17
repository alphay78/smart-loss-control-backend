# Alerts UI Specification

**User Role**: Owner (Amina)  
**Purpose**: View and resolve stock deviation alerts

---

## Screen: Alerts List

**Purpose**: View all alerts (open and resolved)

### UI Layout:
```
┌─────────────────────────────────────────┐
│  ← Alerts                    [Filter]   │
│                                         │
│  [All] [Open] [Resolved]                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔴 CRITICAL                     │   │
│  │ King's Oil 5L                   │   │
│  │ Missing: 3 units (-3.1%)        │   │
│  │ Est. Loss: ₦63,000              │   │
│  │ 2 hours ago            [View]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔴 CRITICAL                     │   │
│  │ Mamador 2L                      │   │
│  │ Missing: 15 units (-15%)        │   │
│  │ Est. Loss: ₦285,000             │   │
│  │ 5 hours ago            [View]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🟡 WARNING                      │   │
│  │ Golden Penny 1L                 │   │
│  │ Missing: 2 units (-2.5%)        │   │
│  │ Est. Loss: ₦42,000              │   │
│  │ 1 day ago              [View]   │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Backend API:
```javascript
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
```

### Design Notes:
- Sort by severity (Critical → Warning → OK)
- Then by time (newest first)
- Badge on tab shows open count
- Pull-to-refresh
- Swipe left to resolve

---

## Screen: Alert Details

**Purpose**: View full alert information and resolve

### UI Layout:
```
┌─────────────────────────────────────────┐
│  ← Alert Details                        │
│                                         │
│  🔴 CRITICAL ALERT                      │
│                                         │
│  Product: King's Oil 5L                 │
│  Status: OPEN                           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Stock Discrepancy               │   │
│  │                                 │   │
│  │ Expected:  97 units             │   │
│  │ Counted:   95 units             │   │
│  │ Missing:   -2 units             │   │
│  │                                 │   │
│  │ Deviation: -2.06%               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Financial Impact                │   │
│  │                                 │   │
│  │ Unit Price:    ₦21,000          │   │
│  │ Est. Loss:     ₦42,000          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Details                         │   │
│  │                                 │   │
│  │ Counted by: Chinedu             │   │
│  │ Time: Feb 16, 2026 8:30 AM     │   │
│  │ Trigger: Time-based check       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Mark as Resolved               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [View Inventory] [Contact Staff]      │
│                                         │
└─────────────────────────────────────────┘
```

### Backend API:
```javascript
PATCH /alerts/{id}/resolve
Authorization: Bearer <owner_token>

// Response
{
  "success": true,
  "message": "Alert resolved successfully"
}
```

### Design Notes:
- Color-coded header (red/yellow/green)
- Show staff who performed count
- Link to inventory screen
- Confirm before resolving
- Show success toast

---

## Push Notifications (Optional)

### Notification Format:
```
🚨 Stock Alert - Amina Ventures

King's Oil 5L: 3 units missing
Estimated Loss: ₦63,000

Tap to view details
```

### Implementation:
```javascript
// Request permission
const permission = await Notification.requestPermission();

// Show notification
if (permission === 'granted') {
  new Notification('Stock Alert', {
    body: 'King\'s Oil 5L: 3 units missing',
    icon: '/icon.png',
    badge: '/badge.png',
    data: { alertId: 'uuid' }
  });
}
```

---

## WhatsApp Notifications

### Message Format:
```
🚨 Alert: Shop [Amina Ventures]

Missing: 3 units King's 5L
Est. Loss: ₦63,000

Check your dashboard for details.
```

### Backend Handles:
- Twilio WhatsApp API integration
- Automatic sending on critical alerts
- Delivery tracking in notification_logs table

---
