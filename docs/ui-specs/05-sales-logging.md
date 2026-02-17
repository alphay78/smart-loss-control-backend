# Sales Logging UI Specification

**User Role**: Staff (Chinedu)  
**Purpose**: Log sales offline-first with auto-sync

---

## Flow: Recording a Sale

### Step 1: Add Items to Cart (See 04-staff-dashboard.md)

### Step 2: Confirm Sale

**UI Layout**:
```
┌─────────────────────────────────────────┐
│  Confirm Sale                           │
│                                         │
│  Items: 4 units                         │
│  Total: ₦158,000                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Confirm & Record               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancel]                               │
│                                         │
└─────────────────────────────────────────┘
```

### Step 3: Save Offline (if no connection)

**Backend Logic**:
```javascript
// Generate client-side UUID
const saleId = crypto.randomUUID();

// Store in IndexedDB
const sale = {
  sale_id: saleId,
  sku_id: "uuid",
  quantity: 3,
  unit_price: 21000,
  sold_at: new Date().toISOString(),
  synced: false
};

await db.sales.add(sale);
```

### Step 4: Show Success

**UI Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│           ✅                            │
│                                         │
│     Sale Recorded!                      │
│                                         │
│     ₦158,000                            │
│                                         │
│  🟡 Will sync when online               │
│                                         │
│  [Done]                                 │
│                                         │
└─────────────────────────────────────────┘
```

### Design Notes:
- Show checkmark animation
- Display sync status
- Auto-close after 2 seconds
- Return to sales grid

---

## Background Sync

### Sync Indicator

**UI States**:
```
🟢 Online - Synced
🟡 Offline - 5 sales pending
🔄 Syncing... 3 of 5
```

### Sync Process:
```javascript
// When connection returns
window.addEventListener('online', async () => {
  const unsyncedSales = await db.sales
    .where('synced').equals(false)
    .toArray();
  
  if (unsyncedSales.length > 0) {
    const response = await fetch('/sales/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: getDeviceId(),
        sales: unsyncedSales
      })
    });
    
    if (response.ok) {
      // Mark as synced
      await markSalesAsSynced(unsyncedSales);
    }
  }
});
```

### Backend API:
```javascript
POST /sales/sync
Authorization: Bearer <staff_token>
{
  "device_id": "android-device-xyz-123",
  "sales": [
    {
      "sale_id": "uuid-123",
      "sku_id": "uuid",
      "quantity": 3,
      "unit_price": 21000,
      "sold_at": "2026-02-16T08:10:00Z"
    }
  ]
}

// Response
{
  "success": true,
  "message": "Sales synced successfully",
  "accepted": 10,
  "duplicates_ignored": 2
}
```

---

## Offline Storage (IndexedDB)

### Schema:
```javascript
const db = new Dexie('SmartLossControl');

db.version(1).stores({
  sales: 'sale_id, sku_id, synced, sold_at',
  inventory: 'sku_id, updated_at',
  skus: 'id, brand, size'
});
```

### Design Notes:
- Store up to 1000 offline sales
- Auto-sync every 30 seconds when online
- Show sync progress
- Handle conflicts (backend ignores duplicates)

---
