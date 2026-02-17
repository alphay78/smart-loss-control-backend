# AI Spot Checks UI Specification

**User Role**: Staff (Chinedu)  
**Purpose**: AI-triggered physical inventory counts

---

## Flow: Spot Check Trigger

### Step 1: Check if Count Needed

**Backend API**:
```javascript
// Call after every 10 sales or every 4 hours
GET /ai/trigger-count?device_id=android-xyz
Authorization: Bearer <staff_token>

// Response (No count needed)
{
  "success": true,
  "should_prompt": false
}

// Response (Count needed)
{
  "success": true,
  "should_prompt": true,
  "sku_id": "uuid",
  "reason": "TIME_BASED_TRIGGER",
  "message": "Quick Check: Verify King's Oil 5L stock"
}
```

### Step 2: Show Spot Check Overlay

**UI Layout** (Full-screen modal):
```
┌─────────────────────────────────────────┐
│                                         │
│           🔍                            │
│                                         │
│     Quick Stock Check                   │
│                                         │
│  Please count the physical stock        │
│  on the shelf:                          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │      King's Oil 5L              │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  How many units are on the shelf?       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         [  95  ]                │   │
│  │                                 │   │
│  │  [  -  ]    [  +  ]             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Submit Count                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ This screen cannot be skipped       │
│                                         │
└─────────────────────────────────────────┘
```

### Design Notes:
- **Cannot be dismissed** - Staff must enter count
- Large number input with +/- buttons
- Show product image if available
- Haptic feedback on +/- buttons
- Auto-focus on number input

---

## Step 3: Submit Count

**Backend API**:
```javascript
POST /audit/verify
Authorization: Bearer <staff_token>
{
  "sku_id": "uuid",
  "actual_qty": 95,
  "counted_at": "2026-02-16T08:30:00Z"
}

// Response (No deviation)
{
  "success": true,
  "expected_qty": 95,
  "actual_qty": 95,
  "deviation": 0,
  "deviation_percent": 0,
  "alert_triggered": false
}

// Response (Deviation detected)
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

---

## Step 4: Show Result

### Scenario A: Count Matches (No Deviation)

**UI Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│           ✅                            │
│                                         │
│     Count Verified!                     │
│                                         │
│  Expected: 95 units                     │
│  Counted: 95 units                      │
│                                         │
│  Everything looks good!                 │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

### Scenario B: Small Deviation (<10%)

**UI Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│           ⚠️                            │
│                                         │
│     Minor Discrepancy                   │
│                                         │
│  Expected: 97 units                     │
│  Counted: 95 units                      │
│  Difference: -2 units (-2.1%)           │
│                                         │
│  Owner has been notified                │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

### Scenario C: Large Deviation (≥10%)

**UI Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│           🚨                            │
│                                         │
│     CRITICAL ALERT                      │
│                                         │
│  Expected: 100 units                    │
│  Counted: 85 units                      │
│  Difference: -15 units (-15%)           │
│                                         │
│  Estimated Loss: ₦285,000               │
│                                         │
│  Owner has been alerted immediately     │
│                                         │
│  Please contact your manager            │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

### Design Notes:
- Color-coded by severity:
  - Green (0%): Success
  - Yellow (<10%): Warning
  - Red (≥10%): Critical
- Show financial impact for critical alerts
- Auto-close after 5 seconds (or tap Continue)
- Return to sales dashboard

---

## Trigger Logic (Frontend)

```javascript
let salesCounter = 0;
let lastCheckTime = Date.now();

async function checkIfCountNeeded() {
  const fourHours = 4 * 60 * 60 * 1000;
  const timeSinceLastCheck = Date.now() - lastCheckTime;
  
  // Trigger every 10 sales OR every 4 hours
  if (salesCounter >= 10 || timeSinceLastCheck >= fourHours) {
    const response = await fetch('/ai/trigger-count?device_id=' + deviceId);
    const data = await response.json();
    
    if (data.should_prompt) {
      showSpotCheckModal(data);
      salesCounter = 0;
      lastCheckTime = Date.now();
    }
  }
}

// Call after every sale
function onSaleRecorded() {
  salesCounter++;
  checkIfCountNeeded();
}
```

---

## Design Requirements

✅ **Cannot Skip**: Modal is blocking, no close button  
✅ **Large Input**: Number input minimum 48dp height  
✅ **Clear Instructions**: Simple language  
✅ **Visual Feedback**: Color-coded results  
✅ **Offline Support**: Queue count if offline, sync later  

---
