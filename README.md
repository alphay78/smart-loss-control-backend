# 🛢️ Smart Loss Control – Backend

**Version:** v1.0  
**Author:** Alpha Degago
**Last Updated:** 14-Feb-2026  

---

## 🚀 Overview

This repository contains the **backend for Smart Loss Control**, an AI-powered inventory reconciliation platform tailored for the Cooking Oil SME market.  

The backend handles:  

- 📦 Inventory & sales data management  
- ⚡ Offline synchronization from the PWA frontend  
- 🧠 AI-driven anomaly detection & "quick-count" alerts  
- 🔒 Secure multi-role API access (Owner, Staff, Auditor)  

Built with **Node.js (Express)**, PostgreSQL, and Redis for scalability and real-time performance.

---

## 🛠️ Tech Stack

| Layer           | Technology / Tool |
|-----------------|-----------------|
| Backend         | Node.js, Express.js |
| Database        | PostgreSQL       |
| Cache / Realtime| Redis            |
| Auth / Security | QR-based onboarding, PIN login, AES-256 encryption |
| Notifications   | Twilio / WhatsApp API |
| AI / Logic      | Spot-check triggers & variance calculations |

---

## 📁 Project Structure
smart-loss-control-backend/
│
├─ src/
│ ├─ app.js # Express app configuration
│ ├─ server.js # Server startup
│ ├─ config/
│ │ ├─ db.js # PostgreSQL connection
│ │ └─ swagger.js # API docs config
│ ├─ routes/ # API routes
│ ├─ controllers/ # Business logic
│ ├─ services/ # AI & background tasks
│ └─ middlewares/ # Auth, error handling, validation
│
├─ migrations/ # DB migrations
├─ docs/ # OpenAPI docs
├─ package.json
└─ README.md

---

## ⚡ Installation

1️⃣ Clone the repo:  
```bash
git clone https://github.com/alphay78/smart-loss-control-backend.git
cd smart-loss-control-backend

2️⃣ Install dependencies:
npm install

3️⃣ Create a .env file:
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=smart_loss_control
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379

🏃 Running the Backend

Development Mode
npm run dev

Production Mode
npm start
API Docs (Swagger) available at: /api-docs

🌐 API Overview
Module	Endpoint	Method	Description
🔑 Auth	/auth/register	POST	Owner registration (OTP verification)
📦 Inventory	/inventory/restock	POST	Log received stock
🔄 Inventory	/inventory/decant	POST	Convert cartons into bottles
📝 Sales	/sales/sync	POST	Bulk upload offline sales
🧠 AI Trigger	/ai/trigger-count	GET	Determine if a quick-count is needed
📊 Audit	/audit/verify	POST	Submit physical counts for AI reconciliation

Full OpenAPI docs available in docs/openapi.yaml
