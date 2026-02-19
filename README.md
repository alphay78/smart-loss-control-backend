# Smart Loss Control - Backend API

> AI-powered inventory reconciliation platform for FMCG cooking oil retailers across Africa

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Contributing](#contributing)

## 🎯 Overview

Smart Loss Control helps cooking oil retailers across Africa eliminate the "Silent Profit Killer" - stock theft and unrecorded sales that cost businesses 10-30% of revenue. The platform uses AI-powered anomaly detection to trigger real-time spot-checks and sends instant WhatsApp alerts when stock variance exceeds 10%.

### The Problem

- **Unrecorded Sales**: Staff forget to log WhatsApp/phone orders
- **Stock Diversion**: High-value oil sold "off-books"
- **Delayed Detection**: Losses only discovered at month-end audits
- **Multi-Country Operations**: Need for pan-African support

### Our Solution

- **Offline-First**: Works without internet (market connectivity issues)
- **AI Reconciliation**: Smart spot-checks based on sales velocity patterns
- **Real-Time Alerts**: WhatsApp notifications when variance detected
- **Immutable Audit Trail**: Complete accountability for every transaction
- **Pan-African Support**: 15+ countries, USD currency, multi-tenant architecture

## ✨ Features

### Core Features (✅ Implemented)

- ✅ **Complete Authentication System** - Owner OTP + Staff PIN authentication
- ✅ **WhatsApp/SMS OTP** - 4-digit crypto-secure OTP with fallback
- ✅ **QR-Based Staff Onboarding** - 30-minute expiry, single-use tokens
- ✅ **Multi-Country Support** - 15+ African countries (Nigeria, Kenya, Ghana, South Africa, Ethiopia, etc.)
- ✅ **USD Currency** - Pan-African operations
- ✅ **Row-Level Security** - Multi-tenant database isolation
- ✅ **JWT Authentication** - 12-hour sessions with role-based access
- ✅ **Rate Limiting** - 5 attempts per 15 minutes for OTP
- ✅ **Bcrypt PIN Hashing** - Secure staff authentication
- ✅ **Development Mode** - Fixed OTP for easy testing

### Planned Features (⏳ In Progress)

- ⏳ **Offline Sales Logging** - IndexedDB sync with idempotent uploads
- ⏳ **AI Spot-Check Triggers** - Random, anomaly-based, and time-based
- ⏳ **Variance Detection** - Auto-calculate deviation and financial loss
- ⏳ **WhatsApp Alerts** - Instant notifications for critical deviations (>10%)
- ⏳ **Bulk-to-Retail Logic** - Carton → 12 bottles conversion
- ⏳ **Restock Auditing** - Track ordered vs received quantities

### Security Features (✅ Implemented)

- 🔒 **Crypto-secure OTP** - 4-digit with `crypto.randomInt()`
- 🔒 **Rate Limiting** - Prevents brute force attacks
- 🔒 **JWT Tokens** - 12-hour expiry with role-based claims
- 🔒 **PIN Hashing** - Bcrypt with 10 rounds
- 🔒 **Row-Level Security** - PostgreSQL RLS for multi-tenant isolation
- 🔒 **Device Whitelisting** - Track and manage staff devices
- 🔒 **QR Code Expiry** - 30-minute single-use tokens
- 🔒 **One-Time OTP** - Cannot reuse verified OTPs

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5.x
- **Database**: PostgreSQL 14+ with Row-Level Security
- **Authentication**: JWT + bcrypt
- **Notifications**: Twilio (WhatsApp/SMS)
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Custom test scripts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alphay78/smart-loss-control-backend.git
   cd smart-loss-control-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Create .env file with these variables:
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_loss_control
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   
   # Optional: Twilio for WhatsApp/SMS (not required for development)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=+14155238886
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Create database**
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE smart_loss_control;
   \q
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Start development server**
   ```bash
   npm start
   ```

7. **Access API documentation**
   ```
   http://localhost:5000/api-docs
   ```

8. **Test authentication**
   ```bash
   # Run complete authentication test
   node tests/test-auth.js
   ```

## 📊 Database Schema

The database consists of 15 tables organized into 4 groups:

### Core Tables
- `shops` - Business information with country_code and city
- `users` - Owner & Staff accounts (name-based staff login)
- `skus` - Product catalog
- `inventory` - Current stock levels
- `countries` - Supported African countries
- `exchange_rates` - Multi-currency support

### Transaction Tables
- `transactions` - Immutable log of all movements
- `restocks` - Supplier deliveries
- `decants` - Carton-to-bottle conversions

### Audit Tables
- `audit_logs` - Physical count verifications (USD-based)
- `alerts` - Auto-generated deviation alerts
- `sales_velocity_metrics` - AI pattern analysis

### Security Tables
- `otp_verifications` - Owner registration (4-digit OTP)
- `devices` - Whitelisted staff phones
- `qr_codes` - One-time staff onboarding (30-min expiry)
- `notification_logs` - WhatsApp/SMS tracking

**Full Schema Documentation**: [docs/database-schema.md](docs/database-schema.md)

### Migrations

- **001_init.sql** - Initial schema
- **002_add_row_level_security.sql** - Multi-tenant RLS
- **003_staff_name_login.sql** - Staff name authentication
- **004_africa_expansion.sql** - Pan-African support (15+ countries, USD)

## 📚 API Documentation

### Swagger UI
Interactive API documentation: **http://localhost:5000/api-docs**

### OpenAPI Spec
Raw specification: [docs/openapi.yaml](docs/openapi.yaml)

### Authentication Endpoints (✅ Complete)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/register-owner` | POST | Register owner, send 4-digit OTP | No |
| `/auth/verify-otp` | POST | Verify OTP, get JWT token | No |
| `/auth/generate-qr` | POST | Generate QR for staff onboarding | Owner |
| `/auth/qr-status/:token` | GET | Check QR status with countdown | No |
| `/auth/staff/link` | POST | Link staff device via QR | No |
| `/auth/login-pin` | POST | Staff login with name + PIN | No |
| `/auth/sms-status` | GET | Check SMS service status | No |

### Other Endpoint Categories (⏳ Planned)

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Shops** | `/shops/*` | Shop profile, staff management |
| **Inventory** | `/inventory/*` | Stock summary, restock, decant |
| **Sales** | `/sales/*` | Offline sales sync |
| **Audit** | `/ai/*`, `/audit/*` | Spot-check triggers, variance detection |
| **Alerts** | `/alerts/*` | Alert listing and resolution |
| **Reports** | `/reports/*` | Deviation, performance, velocity reports |
| **Notifications** | `/notifications/*` | WhatsApp/SMS delivery tracking |

### Documentation for Teams

- **Frontend Integration**: [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md)
- **API Testing Guide**: [docs/API_TESTING_GUIDE.md](docs/API_TESTING_GUIDE.md)
- **WhatsApp Setup**: [docs/WHATSAPP_SETUP.md](docs/WHATSAPP_SETUP.md)
- **Authentication Explained**: [docs/AUTHENTICATION_EXPLAINED.md](docs/AUTHENTICATION_EXPLAINED.md)
- **UI Specifications**: [docs/ui-specs/](docs/ui-specs/)
- **Security Documentation**: [docs/security/](docs/security/)

## 📁 Project Structure

```
smart-loss-control-backend/
├── docs/
│   ├── openapi.yaml              # Swagger API specification
│   ├── database-schema.md        # ER diagram & table docs
│   ├── AUTHENTICATION_EXPLAINED.md
│   ├── FRONTEND_INTEGRATION.md
│   ├── API_TESTING_GUIDE.md
│   ├── WHATSAPP_SETUP.md
│   ├── AFRICA_EXPANSION.md
│   ├── api/
│   │   └── postman_collection.json
│   ├── guides/
│   │   ├── TESTING_QUICKSTART.md
│   │   ├── WHATSAPP_QUICKSTART.md
│   │   └── SWAGGER_QR_GUIDE.md
│   ├── security/
│   │   ├── README.md
│   │   ├── 01-alignment-analysis.md
│   │   ├── 02-implementation-status.md
│   │   └── 03-row-level-security.md
│   └── ui-specs/
│       ├── README.md
│       ├── 01-authentication.md
│       └── ... (9 UI specification files)
├── migrations/
│   ├── 001_init.sql              # Initial database schema
│   ├── 002_add_row_level_security.sql
│   ├── 003_staff_name_login.sql
│   └── 004_africa_expansion.sql
├── scripts/
│   ├── run-migration.js          # Migration runner
│   └── reset-db.js               # Database reset (dev only)
├── src/
│   ├── config/
│   │   ├── db.js                 # PostgreSQL connection
│   │   └── swagger.js            # Swagger configuration
│   ├── controllers/
│   │   └── authController.js     # ✅ Authentication logic
│   ├── middleware/
│   │   └── auth.js               # ✅ JWT verification
│   ├── routes/
│   │   └── authRoutes.js         # ✅ Auth endpoints
│   ├── services/
│   │   └── smsService.js         # ✅ WhatsApp/SMS delivery
│   ├── utils/
│   │   └── jwt.js                # ✅ Token & OTP generation
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── tests/
│   ├── test-auth.js              # ✅ Complete auth test
│   └── test-qr-generation.js     # ✅ QR generation test
├── .env                          # Environment variables (gitignored)
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run migrate` | Run database migrations |
| `npm run db:reset` | ⚠️ Reset database (destroys all data) |

### Testing Commands

```bash
# Test complete authentication flow
node tests/test-auth.js

# Test QR generation
node tests/test-qr-generation.js

# Check server health
curl http://localhost:5000/health
```

### Migration Workflow

```bash
# First time setup
npm run migrate

# Reset and recreate (development only)
npm run db:reset
npm run migrate
```

## 🧪 Testing

### Automated Testing

```bash
# Run authentication tests (10 scenarios)
node tests/test-auth.js

# Run QR generation tests
node tests/test-qr-generation.js
```

### Manual Testing

1. Start the server: `npm start`
2. Open Swagger UI: `http://localhost:5000/api-docs`
3. Test endpoints interactively

### Postman Collection

Import collection from: `docs/api/postman_collection.json`

### Development Mode

- **OTP**: Always `1234` (no real SMS needed)
- **WhatsApp**: Console logging (no Twilio required)
- **Testing**: Easy and fast

## 🌍 Multi-Country Support

### Supported Countries (15+)

- 🇳🇬 Nigeria
- 🇰🇪 Kenya
- 🇬🇭 Ghana
- 🇿🇦 South Africa
- 🇪🇹 Ethiopia
- 🇺🇬 Uganda
- 🇹🇿 Tanzania
- 🇨🇲 Cameroon
- 🇨🇮 Ivory Coast
- 🇸🇳 Senegal
- 🇷🇼 Rwanda
- 🇿🇲 Zambia
- 🇿🇼 Zimbabwe
- 🇧🇼 Botswana
- 🇲🇼 Malawi

### Phone Number Validation

```javascript
// Supported formats
"+234801234567"  // Nigeria
"+254712345678"  // Kenya
"+233201234567"  // Ghana
"+27821234567"   // South Africa
"+251911234567"  // Ethiopia
// ... and more
```

### Currency

- **Primary**: USD (US Dollar)
- **Future**: Multi-currency with exchange rates table

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run tests: `node tests/test-auth.js`
4. Commit with clear messages: `git commit -m "feat: add user authentication"`
5. Push to GitHub: `git push origin feature/your-feature`
6. Create Pull Request

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Lead**: Alphi
- **Project**: Capstone Project 2026
- **Target Market**: African SME retailers

## 📞 Support

- **Documentation**: Start with [docs/00-INDEX.md](docs/00-INDEX.md)
- **API Docs**: http://localhost:5000/api-docs
- **GitHub Issues**: [Report bugs](https://github.com/alphay78/smart-loss-control-backend/issues)

## 🗺 Roadmap

### Phase 1 (✅ Complete - MVP Authentication)
- ✅ Database schema design (4 migrations)
- ✅ API documentation (Swagger)
- ✅ Complete authentication system
- ✅ WhatsApp/SMS OTP integration
- ✅ Multi-country support (15+ countries)
- ✅ Row-Level Security
- ✅ Comprehensive documentation

### Phase 2 (⏳ In Progress - Core Features)
- ⏳ Inventory management endpoints
- ⏳ Sales logging with offline sync
- ⏳ AI trigger logic
- ⏳ Variance detection
- ⏳ Alert system
- ⏳ Reporting endpoints

### Phase 3 (📅 Planned - Advanced Features)
- 📷 Computer Vision for shelf counting
- 📊 Advanced analytics dashboard
- 🔄 Multi-store management
- 📱 Mobile app (React Native)
- 🌍 Additional African countries

---

**Built with ❤️ for African SME retailers**

**Status**: Authentication Complete ✅ | Production Ready | Demo Ready
