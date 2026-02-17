# Smart Loss Control - Backend API

> AI-powered inventory reconciliation platform for FMCG cooking oil retailers

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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

Smart Loss Control helps cooking oil retailers eliminate the "Silent Profit Killer" - stock theft and unrecorded sales that cost businesses 10-30% of revenue. The platform uses AI-powered anomaly detection to trigger real-time spot-checks and sends instant WhatsApp alerts when stock variance exceeds 10%.

### The Problem

- **Unrecorded Sales**: Staff forget to log WhatsApp/phone orders
- **Stock Diversion**: High-value oil sold "off-books"
- **Delayed Detection**: Losses only discovered at month-end audits

### Our Solution

- **Offline-First**: Works without internet (market connectivity issues)
- **AI Reconciliation**: Smart spot-checks based on sales velocity patterns
- **Real-Time Alerts**: WhatsApp notifications when variance detected
- **Immutable Audit Trail**: Complete accountability for every transaction

## ✨ Features

### Core Features

- ✅ **Offline Sales Logging** - IndexedDB sync with idempotent uploads
- ✅ **AI Spot-Check Triggers** - Random, anomaly-based, and time-based
- ✅ **Variance Detection** - Auto-calculate deviation and financial loss
- ✅ **WhatsApp Alerts** - Instant notifications for critical deviations (>10%)
- ✅ **QR-Based Onboarding** - Secure staff device linking
- ✅ **4-Digit PIN Auth** - Fast login for shop-floor efficiency
- ✅ **Bulk-to-Retail Logic** - Carton → 12 bottles conversion
- ✅ **Restock Auditing** - Track ordered vs received quantities
- ✅ **Role-Based Access** - Owner (full control) vs Staff (entry only)
- ✅ **Session Management** - 12-hour auto-logout for security

### Security Features

- 🔒 AES-256 encryption for local storage
- 🔒 Device whitelisting and remote revocation
- 🔒 Immutable transaction logs
- 🔒 PIN hashing (bcrypt/argon2)
- 🔒 JWT token authentication

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5.x
- **Database**: PostgreSQL 14+
- **Cache**: Redis (for real-time alerts)
- **Documentation**: Swagger/OpenAPI 3.0
- **Authentication**: JWT + bcrypt
- **Notifications**: Twilio (WhatsApp/SMS)

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
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your credentials
   # DATABASE_URL=postgresql://user:password@localhost:5432/smart_loss_control
   # JWT_SECRET=your_secret_key
   # PORT=5000
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
   npm run dev
   ```

7. **Access API documentation**
   ```
   http://localhost:5000/api-docs
   ```

## 📊 Database Schema

The database consists of 15 tables organized into 4 groups:

### Core Tables
- `shops` - Business information
- `users` - Owner & Staff accounts
- `skus` - Product catalog
- `inventory` - Current stock levels

### Transaction Tables
- `transactions` - Immutable log of all movements
- `restocks` - Supplier deliveries
- `decants` - Carton-to-bottle conversions

### Audit Tables
- `audit_logs` - Physical count verifications
- `alerts` - Auto-generated deviation alerts
- `sales_velocity_metrics` - AI pattern analysis

### Security Tables
- `otp_verifications` - Owner registration
- `sessions` - JWT token management
- `devices` - Whitelisted staff phones
- `qr_codes` - One-time staff onboarding
- `notification_logs` - WhatsApp/SMS tracking

**Full Schema Documentation**: [docs/database-schema.md](docs/database-schema.md)

### ER Diagram Preview

```
shops ──┬── users ──── devices
        ├── inventory ──── skus
        ├── transactions
        ├── audit_logs ──── alerts ──── notification_logs
        └── sales_velocity_metrics
```

## 📚 API Documentation

### Swagger UI
Interactive API documentation available at: `http://localhost:5000/api-docs`

### OpenAPI Spec
Raw specification: [docs/openapi.yaml](docs/openapi.yaml)

### Endpoint Categories

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | `/auth/*` | Registration, OTP, login, staff linking |
| **Shops** | `/shops/*` | Shop profile, QR generation, staff management |
| **Inventory** | `/inventory/*` | Stock summary, restock, decant |
| **Sales** | `/sales/*` | Offline sales sync |
| **Audit** | `/ai/*`, `/audit/*` | Spot-check triggers, variance detection |
| **Alerts** | `/alerts/*` | Alert listing and resolution |
| **Reports** | `/reports/*` | Deviation, performance, velocity reports |
| **Notifications** | `/notifications/*` | WhatsApp/SMS delivery tracking |

### Frontend Presentation
Complete guide for frontend team: [docs/FRONTEND_PRESENTATION.md](docs/FRONTEND_PRESENTATION.md)

## 📁 Project Structure

```
smart-loss-control-backend/
├── docs/
│   ├── openapi.yaml              # Swagger API specification
│   ├── database-schema.md        # ER diagram & table docs
│   └── FRONTEND_PRESENTATION.md  # Frontend team guide
├── migrations/
│   └── 001_init.sql              # Initial database schema
├── scripts/
│   ├── run-migration.js          # Migration runner
│   └── reset-db.js               # Database reset (dev only)
├── src/
│   ├── config/
│   │   ├── db.js                 # PostgreSQL connection
│   │   └── swagger.js            # Swagger configuration
│   ├── controllers/              # Route handlers (TODO)
│   ├── middleware/               # Auth, validation (TODO)
│   ├── routes/                   # API routes (TODO)
│   ├── services/                 # Business logic (TODO)
│   ├── utils/                    # Helper functions (TODO)
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── .env                          # Environment variables (gitignored)
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with nodemon |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run db:reset` | ⚠️ Reset database (destroys all data) |

### Migration Workflow

```bash
# First time setup
npm run migrate

# Reset and recreate (development only)
npm run db:reset
npm run migrate
```

## 🧪 Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Open Swagger UI: `http://localhost:5000/api-docs`
3. Test endpoints interactively

### Postman Collection

Import collection from: `docs/postman_collection.json` (coming soon)

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "feat: add user authentication"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Create Pull Request

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
- **Institution**: [Your Institution]

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/alphay78/smart-loss-control-backend/issues)
- **Documentation**: [Wiki](https://github.com/alphay78/smart-loss-control-backend/wiki)
- **Email**: [Your Email]

## 🗺 Roadmap

### Phase 1 (Current - MVP)
- ✅ Database schema design
- ✅ API documentation
- ⏳ API implementation
- ⏳ Authentication & authorization
- ⏳ AI trigger logic
- ⏳ WhatsApp integration

### Phase 2 (Future)
- 📷 Computer Vision for shelf counting
- 📊 Advanced analytics dashboard
- 🔄 Multi-store management
- 📱 Mobile app (React Native)
- 🌍 Multi-currency support

---

**Built with ❤️ for Nigerian SME retailers**
