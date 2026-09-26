# StockSense — Inventory & Warehouse Management System

A modular inventory and warehouse management system built with a business-oriented architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL |
| Query Builder | Knex.js |
| Authentication | JWT + bcrypt |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |

## Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **npm** v9+

## Setup

### 1. Database

```sql
CREATE DATABASE stocksense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run migrate
npm run seed
npm run dev
```

Server starts at `http://localhost:5000`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Client starts at `http://localhost:5173`

### Default Admin Credentials

```
Email:    admin@stocksense.com
Password: Admin@123
```

## Project Structure

```
StockSense/
├── server/                    # Express.js API
│   ├── db/
│   │   ├── migrations/        # Database schema migrations
│   │   └── seeds/             # Seed data
│   └── src/
│       ├── config/            # App configuration
│       ├── constants/         # Error codes, events
│       ├── middleware/        # Auth, authorization, error handling
│       ├── modules/           # Feature modules
│       │   ├── auth/          # Authentication & password reset
│       │   ├── users/         # User management
│       │   ├── roles/         # Role management
│       │   └── profile/       # User profile
│       └── utils/             # Helpers (ApiResponse, ApiError, logger)
├── client/                    # React SPA
│   └── src/
│       ├── api/               # Axios configuration
│       ├── components/        # Reusable UI components
│       ├── contexts/          # Auth context
│       ├── layouts/           # Auth & App layouts
│       ├── pages/             # Page components
│       └── routes/            # Route guards
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |

### Password Reset
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/password/forgot` | Request OTP |
| POST | `/api/v1/auth/password/verify-otp` | Verify OTP |
| POST | `/api/v1/auth/password/reset` | Reset password |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/:id` | Get user details |
| POST | `/api/v1/users` | Create user |
| PUT | `/api/v1/users/:id` | Update user |
| PATCH | `/api/v1/users/:id/status` | Change user status |
| PATCH | `/api/v1/users/:id/role` | Change user role |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/roles` | List roles |
| GET | `/api/v1/roles/:id` | Get role with permissions |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profile` | Get profile |
| PUT | `/api/v1/profile` | Update profile |
| PATCH | `/api/v1/profile/password` | Change password |

## Module Architecture

This project follows a modular business-oriented architecture. Module 01 (Authentication & User Management) provides the identity and authorization foundation that all future modules will consume.

## License

ISC
