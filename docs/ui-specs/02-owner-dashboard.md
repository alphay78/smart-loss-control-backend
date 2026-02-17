# Owner Dashboard UI Specification

**User Role**: Owner (Amina)  
**Purpose**: Main control center for shop management

---

## Screen: Owner Home Dashboard

**Purpose**: Overview of shop health, alerts, and quick actions

### UI Layout:
```
┌─────────────────────────────────────────┐
│  ☰  Smart Loss Control    🔔(3)  [👤]  │
│                                         │
│  Good morning, Amina! 👋                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Shop Health                    │   │
│  │                                 │   │
│  │      ┌─────────────┐            │   │
│  │      │   🟢 SAFE   │            │   │
│  │      │     92%     │            │   │
│  │      └─────────────┘            │   │
│  │                                 │   │
│  │  No critical alerts today       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Quick Stats                            │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Stock    │ │ Today's  │ │ Alerts │ │
│  │ Value    │ │ Sales    │ │ Open   │ │
│  │ ₦2.4M    │ │ ₦185K    │ │   3    │ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                         │
│  Recent Alerts                          │
│  ┌─────────────────────────────────┐   │
│  │ 🔴 King's 5L - 3 units missing  │   │
│  │    Loss: ₦63,000  2h ago [View] │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🟡 Mamador 2L - Low stock       │   │
│  │    12 units left  5h ago [View] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Quick Actions                          │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Restock  │ │ Add Staff│ │ Reports│ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                         │
│  [🏠 Home] [📦 Stock] [🚨 Alerts] [⚙️]│
└─────────────────────────────────────────┘
```

### Backend API Calls:
```javascript
// On screen load
GET /shops/me
GET /inventory/summary
GET /alerts?status=OPEN&limit=5
GET /reports/deviation?days=1

// Response
{
  "shop": {
    "id": "uuid",
    "shop_name": "Amina Ventures",
    "owner_phone": "+2348012345678"
  },
  "stats": {
    "total_inventory_value": 2400000,
    "today_sales": 185000,
    "open_alerts_count": 3
  },
  "recent_alerts": [...]
}
```

### Components:

**1. Risk Score Gauge**
- Green (>90%): "SAFE"
- Yellow (70-90%): "CAUTION"
- Red (<70%): "CRITICAL"
- Calculated from: (1 - deviation_rate) * 100

**2. Quick Stats Cards**
- Stock Value: Sum of (quantity × selling_price) from inventory
- Today's Sales: Sum of sales from transactions today
- Alerts Open: Count of unresolved alerts

**3. Recent Alerts List**
- Show top 5 most recent unresolved alerts
- Color-coded by severity (red/yellow/green)
- Tap to view full alert details

**4. Quick Action Buttons**
- Restock → Navigate to restock form
- Add Staff → Generate QR code
- Reports → Navigate to reports screen

**5. Bottom Navigation**
- Home, Stock, Alerts, Settings
- Badge on Alerts icon shows count

### Design Notes:
- Auto-refresh every 30 seconds
- Pull-to-refresh gesture
- Smooth animations for gauge
- Haptic feedback on button taps

---

## Navigation Menu (Hamburger)

### UI Layout:
```
┌─────────────────────────────┐
│  Amina Ventures             │
│  +234 801 234 5678          │
│                             │
│  🏠 Dashboard               │
│  📦 Inventory               │
│  🚨 Alerts                  │
│  📊 Reports                 │
│  👥 Staff Management        │
│  ⚙️  Settings               │
│  📤 Logout                  │
│                             │
└─────────────────────────────┘
```

### Backend API:
```javascript
// Logout
POST /auth/logout
Authorization: Bearer <token>

// Clear local storage and redirect to login
```

---

## Bottom Navigation Bar

**Tabs**:
1. Home (Dashboard)
2. Stock (Inventory)
3. Alerts
4. Settings

**Active State**: Bold text + colored icon
**Badge**: Show count on Alerts tab

---
