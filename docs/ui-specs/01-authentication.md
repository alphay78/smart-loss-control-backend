# Authentication UI Specification for UX/UI Team

**Backend Developer**: Alphi  
**Purpose**: Ensure Figma designs align with backend API structure  
**Last Updated**: February 2026

---

## 🎯 Overview

We have **TWO different authentication flows**:
1. **Owner Flow** - First-time registration with OTP verification
2. **Staff Flow** - QR code linking + 4-digit PIN login

---

## 👤 OWNER AUTHENTICATION FLOW

### Screen 1: Welcome/Landing Screen

**Purpose**: Entry point - user chooses their role

**UI Elements:**
```
┌─────────────────────────────────┐
│                                 │
│     [Smart Loss Control Logo]   │
│                                 │
│   Protect Your Cooking Oil      │
│        Business                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Register My Shop         │  │ ← Owner button
│  │  (Primary Button)         │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Staff Login              │  │ ← Staff button
│  │  (Secondary Button)       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend Mapping:**
- No API call yet
- Just navigation logic

---

### Screen 2: Owner Registration Form

**Purpose**: Collect owner details and send OTP

**Required Fields:**

| Field Name | Input Type | Validation | Backend Field | Required |
|------------|-----------|------------|---------------|----------|
| Full Name | Text input | Min 2 chars | `full_name` | Yes |
| Shop Name | Text input | Min 2 chars | `shop_name` | Yes |
| Phone Number | Tel input | Nigerian format (+234...) | `phone` | Yes |

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Register Your Shop             │
│                                 │
│  Full Name                      │
│  ┌───────────────────────────┐  │
│  │ Amina Yusuf               │  │
│  └───────────────────────────┘  │
│                                 │
│  Shop Name                      │
│  ┌───────────────────────────┐  │
│  │ Amina Ventures            │  │
│  └───────────────────────────┘  │
│                                 │
│  Phone Number                   │
│  ┌───────────────────────────┐  │
│  │ +234 801 234 5678         │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Send OTP                 │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend API Call:**
```javascript
POST /auth/register-owner
{
  "full_name": "Amina Yusuf",
  "shop_name": "Amina Ventures",
  "phone": "+2348012345678"
}

// Success Response
{
  "success": true,
  "message": "OTP sent to +2348012345678"
}

// Error Response
{
  "success": false,
  "message": "Validation error",
  "errors": ["phone already registered"]
}
```

**Design Notes:**
- Phone input should auto-format with country code (+234)
- Show loading spinner on "Send OTP" button
- Disable button after click to prevent double submission

---

### Screen 3: OTP Verification

**Purpose**: Verify the 4-digit OTP sent to owner's phone

**Required Fields:**

| Field Name | Input Type | Validation | Backend Field | Required |
|------------|-----------|------------|---------------|----------|
| OTP Code | Number input (4 digits) | Exactly 4 digits | `otp` | Yes |

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Verify Your Phone              │
│                                 │
│  We sent a 4-digit code to      │
│  +234 801 234 5678              │
│                                 │
│  Enter OTP Code                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │       │ ← 4 separate boxes
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  Didn't receive code?           │
│  [Resend OTP]                   │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Verify & Continue        │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend API Call:**
```javascript
POST /auth/verify-otp
{
  "phone": "+2348012345678",
  "otp": "1234"
}

// Success Response
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

// Error Response
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**Design Notes:**
- Auto-focus on first OTP box
- Auto-advance to next box when digit entered
- Show countdown timer (OTP expires in 5 minutes)
- "Resend OTP" should be disabled for 60 seconds after first send
- On success, store the `token` in localStorage and navigate to Owner Dashboard

---

### Screen 4: Brand Selection (Optional - Post Registration)

**Purpose**: Let owner select which oil brands they sell

**UI Layout:**
```
┌─────────────────────────────────┐
│                                 │
│  Select Your Products           │
│                                 │
│  Which brands do you sell?      │
│                                 │
│  ☑ Mamador                      │
│  ☑ King's Oil                   │
│  ☐ Golden Penny                 │
│  ☐ Devon King's                 │
│  ☐ Turkey                       │
│  ☐ Power Oil                    │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Continue to Dashboard    │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend Mapping:**
- This is optional for MVP
- Can be skipped and configured later in settings
- No immediate API call needed

---

## 👷 STAFF AUTHENTICATION FLOW

### Screen 5: Staff Login Entry

**Purpose**: Staff chooses how to authenticate

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back to Welcome              │
│                                 │
│  Staff Login                    │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Scan QR Code             │  │ ← First time setup
│  │  (Primary Button)         │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Login with PIN           │  │ ← Returning staff
│  │  (Secondary Button)       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend Mapping:**
- No API call yet
- Just navigation logic

---

### Screen 6A: QR Code Scanner (First Time Staff Setup)

**Purpose**: Staff scans QR code from owner's device to link

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Scan Shop QR Code              │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   [Camera Viewfinder]     │  │
│  │                           │  │
│  │   ┌─────────────────┐     │  │
│  │   │  QR Target Box  │     │  │
│  │   └─────────────────┘     │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Ask your manager to show       │
│  the QR code from their app     │
│                                 │
└─────────────────────────────────┘
```

**Backend Mapping:**
- QR code contains: `SHOPQR-92D8KASJ2` (the `qr_token`)
- After scanning, navigate to Screen 6B

---

### Screen 6B: Staff Details & PIN Setup

**Purpose**: After scanning QR, staff enters their name and creates PIN

**Required Fields:**

| Field Name | Input Type | Validation | Backend Field | Required |
|------------|-----------|------------|---------------|----------|
| Your Name | Text input | Min 2 chars | `staff_name` | Yes |
| Create PIN | Number input | Exactly 4 digits | `pin` | Yes |
| Confirm PIN | Number input | Must match PIN | - | Yes |

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Complete Your Setup            │
│                                 │
│  Your Name                      │
│  ┌───────────────────────────┐  │
│  │ Chinedu                   │  │
│  └───────────────────────────┘  │
│                                 │
│  Create 4-Digit PIN             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ ● │ │ ● │ │ ● │ │ ● │       │ ← Hidden digits
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  Confirm PIN                    │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ ● │ │ ● │ │ ● │ │ ● │       │
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Complete Setup           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend API Call:**
```javascript
POST /auth/staff/link
{
  "qr_token": "SHOPQR-92D8KASJ2",
  "device_id": "android-device-xyz-123",  // Auto-generated by app
  "staff_name": "Chinedu",
  "pin": "4321"
}

// Success Response
{
  "success": true,
  "message": "Staff device linked successfully",
  "staff": {
    "id": "uuid",
    "name": "Chinedu",
    "device_id": "android-device-xyz-123",
    "role": "STAFF"
  }
}

// Error Response
{
  "success": false,
  "message": "Invalid or expired QR code"
}
```

**Design Notes:**
- `device_id` should be auto-generated (use browser fingerprint or UUID)
- PIN should be masked (show dots, not numbers)
- Show error if PINs don't match
- On success, navigate to Staff Dashboard

---

### Screen 7: Staff PIN Login (Returning Staff)

**Purpose**: Daily login for staff who already linked their device

**Required Fields:**

| Field Name | Input Type | Validation | Backend Field | Required |
|------------|-----------|------------|---------------|----------|
| Staff Name | Text input | Min 2 chars | `staff_name` | Yes |
| PIN | Number input | Exactly 4 digits | `pin` | Yes |

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Staff Login                    │
│                                 │
│  Your Name                      │
│  ┌───────────────────────────┐  │
│  │ Chinedu                   │  │
│  └───────────────────────────┘  │
│                                 │
│  Enter Your PIN                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ ● │ │ ● │ │ ● │ │ ● │       │
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  [Forgot PIN?]                  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Login                    │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend API Call:**
```javascript
POST /auth/login-pin
{
  "staff_name": "Chinedu",
  "pin": "4321"
}

// Success Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "role": "STAFF",
    "full_name": "Chinedu",
    "shop_id": "uuid"
  }
}

// Error Response
{
  "success": false,
  "message": "Invalid name or PIN"
}
```

**Design Notes:**
- Auto-focus on name input
- PIN should be masked
- Show "Invalid credentials" error if wrong
- On success, store `token` and navigate to Staff Dashboard

---

## 🔐 OWNER SIDE: QR Code Generation Screen

**Purpose**: Owner generates QR code for staff to scan

**UI Layout:**
```
┌─────────────────────────────────┐
│  ← Back to Dashboard            │
│                                 │
│  Add New Staff                  │
│                                 │
│  Show this QR code to your      │
│  staff member to link their     │
│  device                         │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   [QR CODE IMAGE]         │  │
│  │                           │  │
│  │   SHOPQR-92D8KASJ2        │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Expires in: 28:45              │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Generate New Code        │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Backend API Call:**
```javascript
POST /shops/qr-token
Authorization: Bearer <owner_token>

// Response
{
  "success": true,
  "qr_token": "SHOPQR-92D8KASJ2",
  "expires_in_minutes": 30
}
```

**Design Notes:**
- Generate QR code image from `qr_token` string
- Show countdown timer (30 minutes)
- Allow regenerating if expired
- This screen is OWNER-ONLY (requires owner JWT token)

---

## 📋 Summary for UX/UI Team

### Screens to Design:

**Owner Flow (4 screens):**
1. Welcome/Landing (role selection)
2. Owner Registration Form (name, shop, phone)
3. OTP Verification (4-digit code)
4. Brand Selection (optional)

**Staff Flow (4 screens):**
5. Staff Login Entry (QR or PIN choice)
6A. QR Scanner (camera view)
6B. Staff Setup (name + create PIN)
7. Staff PIN Login (phone + PIN)

**Owner Management (1 screen):**
8. QR Code Generation (for adding staff)

### Critical Design Requirements:

✅ **Large Buttons**: Minimum 48x48dp (greasy fingers)  
✅ **High Contrast**: 7:1 ratio (poor lighting in markets)  
✅ **Bold Text**: 18px minimum for numbers/prices  
✅ **Auto-focus**: First input field on each screen  
✅ **Loading States**: Show spinners during API calls  
✅ **Error Messages**: Red text below fields  
✅ **Success Feedback**: Green checkmarks or toast messages  

### Field Validation Rules:

| Field | Min Length | Max Length | Format | Required |
|-------|-----------|-----------|--------|----------|
| Full Name | 2 | 150 | Text | Yes |
| Shop Name | 2 | 150 | Text | Yes |
| Phone | 11 | 20 | +234XXXXXXXXXX | Yes |
| OTP | 4 | 4 | Numbers only | Yes |
| PIN | 4 | 4 | Numbers only | Yes |
| Staff Name | 2 | 150 | Text | Yes |

---

## 🎨 Recommended Color Scheme (From PRD)

- **Primary**: Green (#28A745) - Success, confirmation
- **Danger**: Red (#DC3545) - Alerts, critical deviations
- **Warning**: Orange (#FFC107) - Warnings, pending sync
- **Background**: White (#FFFFFF) or Light Gray (#F8F9FA)
- **Text**: Dark Gray (#212529)
- **Buttons**: High contrast with 2px border

---

**Questions for UX/UI Team?**  
Contact: Alphi (Backend Developer)  
Reference: This document + `docs/FRONTEND_GUIDE.md`
