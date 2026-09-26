# 📦 StockSense – Inventory & Warehouse Management System

> **Odoo Hackathon Project**

StockSense is a modular, real-time Inventory and Warehouse Management System designed to digitize and streamline stock-related operations within a business.

The system replaces manual registers, spreadsheets, and disconnected stock-tracking methods with a centralized platform for managing products, warehouses, inventory, receipts, deliveries, transfers, adjustments, and stock movements.

StockSense is designed around **modularity, scalability, security, usability, performance, and reliable database design**.

---

## 🚀 Quick Start & Local Setup

### Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **npm** v9+

### 1. Database Setup

Create the MySQL database in your local MySQL instance:

```sql
CREATE DATABASE stocksense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd stocksense-app/server
cp .env.example .env
# Configure DB_USER and DB_PASSWORD in .env
npm install
npm run migrate
npm run seed
npm run start
```

Server runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd stocksense-app/client
npm install
npm run dev
```

Client runs on `http://localhost:5173`

### Default Admin Credentials

```
Email:    admin@stocksense.com
Password: Admin@123
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL |
| Query Builder | Knex.js |
| Authentication | JWT + bcryptjs |
| Validation | Joi |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |

---

## 📁 Project Structure

```
StockSense/
├── server/                    # Express.js REST API
│   ├── db/
│   │   ├── migrations/        # Knex database migrations
│   │   └── seeds/             # Seed data (roles, permissions, admin)
│   └── src/
│       ├── config/            # Environment, DB & Mail setup
│       ├── constants/         # Error codes & event constants
│       ├── middleware/        # JWT auth, authorization, error handler, rate limiter
│       ├── modules/           # Business feature modules
│       │   ├── auth/          # Authentication & password reset
│       │   ├── users/         # User management
│       │   ├── roles/         # Role management
│       │   └── profile/       # User profile management
│       └── utils/             # ApiResponse, ApiError, logger, OTP helpers
├── client/                    # React 18 SPA
│   └── src/
│       ├── api/               # Configured Axios HTTP client
│       ├── components/        # Reusable UI & password checklist components
│       ├── contexts/          # Auth context provider
│       ├── layouts/           # Auth & App layout shells
│       ├── pages/             # Page components
│       └── routes/            # Protected & public route guards
└── README.md
```

---

## 🧩 Functional Module Architecture

StockSense is organized into the following functional business modules:

```text
01. Authentication & User Management (Implemented)
02. Dashboard & Analytics
03. Product Management
04. Category & Unit Management
05. Warehouse & Location Management
06. Inventory & Stock Management
07. Receipt Management
08. Delivery Order Management
09. Internal Transfer Management
10. Inventory Adjustment Management
11. Stock Ledger & Movement History
12. Search, Filter & Query Management
13. Alerts & Reordering Management
14. Notification & Activity Management
15. Profile & System Settings
16. API & Business Logic Layer
17. Data & Persistence Management
18. Validation, Error Handling & Audit
```

---

## 📡 API Endpoints (Module 01)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login & receive JWT token |
| POST | `/api/v1/auth/logout` | Revoke session & logout |
| GET | `/api/v1/auth/me` | Fetch authenticated user context |

### Password Reset
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/password/forgot` | Request 6-digit OTP |
| POST | `/api/v1/auth/password/verify-otp` | Verify OTP token |
| POST | `/api/v1/auth/password/reset` | Set new password |

### User Management (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated + search/filters) |
| GET | `/api/v1/users/:id` | Get user details & permissions |
| POST | `/api/v1/users` | Create user |
| PUT | `/api/v1/users/:id` | Update user details |
| PATCH | `/api/v1/users/:id/status` | Update account status |
| PATCH | `/api/v1/users/:id/role` | Update user role |

### Roles & Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/roles` | List roles |
| GET | `/api/v1/roles/:id` | Get role permissions |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profile` | View profile |
| PUT | `/api/v1/profile` | Update profile information |
| PATCH | `/api/v1/profile/password` | Change password |
