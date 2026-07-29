# SolarDispatch

**Rooftop Solar Sales, Inventory and Dispatch Management**

[![React](https://img.shields.io/badge/React-18-20232a?logo=react&logoColor=61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4-111111?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

SolarDispatch is a full-stack Mini ERP and CRM portal for a rooftop solar equipment distributor and installation business. It brings customer follow-ups, solar equipment inventory, stock movements and delivery challans into one internal system.

This project was created for a full-stack developer case study. The main focus is not the size of the application, but the quality of the business flow, API design, database structure, role-based security and deployment setup.

---

## Why SolarDispatch instead of a general CRM?

The assignment asked for an ERP and CRM system for a wholesale or distribution company. I could have built a general-purpose portal, but I wanted the project to have a clear business context instead of feeling like a collection of unrelated CRUD screens.

Rooftop solar distribution fits the required modules naturally:

- Sales teams manage solar leads, customer details and follow-ups.
- Warehouse teams manage panels, inverters, batteries and other equipment.
- Accounts teams can review customer and dispatch records.
- Delivery challans connect sales activity with real stock movement.
- Site-survey and system-capacity fields give the CRM a practical solar-industry context.

The application still keeps the assignment's required terms and modules visible: customers, products, inventory, stock movements and sales challans. The solar domain adds purpose without changing the core requirements.

---

## Live Links



| Resource | URL                                            |
|---|------------------------------------------------|
| Live frontend | `https://solar-dispatch-three.vercel.app`      |
| Backend API | `https://solar-dispatch.onrender.com`          |
| Health check | `https://solar-dispatch.onrender.com/health`    |
| Postman collection | `postman/SolarDispatch.postman_collection.json` |

---

## Screenshots

### Desktop

<p align="center">
  <img src="docs/screenshots/login-page.jpeg" alt="SolarDispatch login page" width="49%" />
  <img src="docs/screenshots/dashboard.jpeg" alt="SolarDispatch operations dashboard" width="49%" />
</p>

### Mobile

<p align="center">
  <img src="docs/screenshots/mobile-sidebar.jpeg" alt="SolarDispatch mobile navigation" width="260" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/mobile-customers.jpeg" alt="SolarDispatch mobile customer list" width="260" />
</p>

---

## Core Features

### Authentication and roles

- JWT-based login
- Password hashing with bcryptjs
- Backend-enforced role permissions
- Four internal roles: Admin, Sales, Warehouse and Accounts

### Customer CRM

- Add and edit customers
- Search and filter customer records
- Customer type and status tracking
- Solar-specific project information
- Follow-up dates, notes and history
- Customer detail view with related records

### Solar equipment and inventory

- Add and edit solar equipment
- Track SKU, category, price, stock and warehouse location
- Minimum-stock alert quantity
- Manual IN and OUT stock adjustments
- Product-level and global stock-movement history
- Low-stock dashboard alerts

### Delivery challans

- Select a customer and add multiple products
- Automatically generate a challan number
- Save as Draft or Confirmed
- Prevent zero or negative quantities
- Prevent stock from going below zero
- Preserve product name, SKU, category and price snapshots
- Cancel confirmed challans and restore stock
- Print or save an A4 challan as PDF through the browser

### Dashboard

- Solar leads and active customers
- Follow-ups due today
- Upcoming site surveys
- Estimated pipeline capacity
- Equipment SKU count
- Low-stock item count
- Confirmed dispatches
- Recent challans and stock movements

---

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router DOM, Axios, TanStack Query, React Hook Form, Zod, Lucide React, vanilla CSS |
| Backend | Node.js, Express.js, TypeScript, Prisma ORM, Zod, JWT, bcryptjs, Pino, Helmet, CORS, express-rate-limit |
| Database | PostgreSQL 15 |
| Local development | Yarn, Docker Compose |
| Testing | Vitest and Supertest |
| Deployment | Vercel, Render and Neon PostgreSQL |

---

## Architecture

```mermaid
flowchart LR
    U[Internal employee] -->|Uses browser| C[React + TypeScript client]
    C -->|REST requests| A[Express + TypeScript API]

    A --> AUTH[JWT authentication]
    A --> RBAC[Role authorization]
    A --> VAL[Zod validation]
    A --> SVC[Business services]

    SVC --> TX[Prisma transactions]
    TX --> ORM[Prisma ORM]
    ORM --> DB[(PostgreSQL)]

    DB --> USERS[Users]
    DB --> CUSTOMERS[Customers and follow-ups]
    DB --> PRODUCTS[Products and stock]
    DB --> MOVEMENTS[Stock movements]
    DB --> CHALLANS[Challans and item snapshots]
```

### Request flow

1. The React client sends a request to the Express REST API.
2. Authentication middleware verifies the JWT.
3. Role middleware checks whether the user can perform the requested action.
4. Zod validates route parameters, query values and request bodies.
5. Service functions apply the business rules.
6. Prisma reads or updates PostgreSQL.
7. Inventory-changing operations run inside database transactions.

---

## Important Business Logic

### Draft challan

Saving a challan as Draft creates the challan and its item snapshots, but does not reduce stock.

### Confirmed challan

When a challan is confirmed, the server:

1. Rechecks the challan status.
2. Validates all requested quantities.
3. Uses guarded stock updates so inventory cannot become negative.
4. Creates an OUT stock-movement record for each item.
5. Changes the challan status to Confirmed.
6. Commits all changes together.

If one product has insufficient stock, the complete operation is rolled back and the API returns `409 Conflict`.

### Cancelled challan

Cancelling a confirmed challan restores the deducted quantities and creates IN reversal movements. The status check, stock restoration, movement creation and challan update are handled in one transaction so stock cannot be restored twice.

### Product snapshots

Each challan item stores product snapshot fields. Historical challans therefore remain accurate even if the current product name, SKU, category or unit price changes later.

---

## Role Permission Matrix

| Capability | Admin | Sales | Warehouse | Accounts |
|---|:---:|:---:|:---:|:---:|
| View dashboard | Yes | Yes | Yes | Yes |
| View customers | Yes | Yes | Yes | Yes |
| Add or edit customers | Yes | Yes | No | No |
| Add customer follow-ups | Yes | Yes | No | No |
| View products and stock | Yes | Yes | Yes | Yes |
| Add or edit products | Yes | No | Yes | No |
| Record manual stock movements | Yes | No | Yes | No |
| View stock-movement history | Yes | Yes | Yes | Yes |
| Create or edit draft challans | Yes | Yes | No | No |
| Confirm or cancel challans | Yes | Yes | No | No |
| View and print challans | Yes | Yes | Yes | Yes |

The Express API enforces these rules. Frontend button visibility is only an additional usability layer.

---

## Project Structure

```text
solar-dispatch/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── types/
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   ├── routes/
│   │   └── utils/
│   ├── .env.example
│   ├── render.yaml
│   └── package.json
├── docs/
│   └── screenshots/
├── postman/
│   └── SolarDispatch.postman_collection.json
├── docker-compose.yml
└── README.md
```

---

## Database Models

- `User`
- `Customer`
- `CustomerFollowUp`
- `Product`
- `StockMovement`
- `SalesChallan`
- `SalesChallanItem`

Prisma migrations are stored in `server/prisma/migrations/` and should be committed to the repository.

---

## Local Setup

### Prerequisites

- Node.js 20 or newer
- Yarn
- Docker Desktop

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/solar-dispatch.git
cd solar-dispatch
```

### 2. Start PostgreSQL

```bash
docker compose up -d
docker compose ps
```

### 3. Configure and start the backend

```bash
cd server
yarn install --frozen-lockfile
cp .env.example .env
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
yarn dev
```

The backend runs at:

```text
http://localhost:8001
```

Health check:

```text
http://localhost:8001/health
```

### 4. Configure and start the frontend

Open a second terminal:

```bash
cd client
yarn install --frozen-lockfile
cp .env.example .env
yarn dev
```

The frontend runs at:

```text
http://localhost:3000
```

---

## Environment Variables

### `server/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/solardispatch
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=12h
PORT=8001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
AUTH_RATE_LIMIT_MAX_REQUESTS=100
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:8001
```

The client appends `/api` to the configured backend URL. Do not include `/api` twice.

Never commit real `.env` files or production secrets.

---

## Demo Accounts

The seed script creates the following demo-only users:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.solardispatch.test` | `SolarAdmin@123` |
| Sales | `sales@demo.solardispatch.test` | `SolarSales@123` |
| Warehouse | `warehouse@demo.solardispatch.test` | `SolarWarehouse@123` |
| Accounts | `accounts@demo.solardispatch.test` | `SolarAccounts@123` |

Do not run the demo seed against a real production database containing user data.

---

## Available Commands

### Backend

```bash
cd server

yarn dev
yarn typecheck
yarn lint
yarn test
yarn build
yarn start

yarn prisma:generate
yarn prisma:migrate
yarn prisma:migrate:dev
yarn prisma:seed
yarn prisma:studio
```

### Frontend

```bash
cd client

yarn dev
yarn typecheck
yarn lint
yarn build
yarn preview
```

---

## API Overview

All business endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Authenticated |

### Customers

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/customers` | Search, filter and paginate customers |
| `POST` | `/api/customers` | Create customer |
| `GET` | `/api/customers/:id` | View customer details |
| `PATCH` | `/api/customers/:id` | Update customer |
| `GET` | `/api/customers/:id/follow-ups` | View follow-up history |
| `POST` | `/api/customers/:id/follow-ups` | Add follow-up note |

### Products and inventory

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/products` | Search, filter and paginate products |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/:id` | View product details |
| `PATCH` | `/api/products/:id` | Update product |
| `GET` | `/api/products/:id/movements` | View product movement history |
| `POST` | `/api/products/:id/movements` | Record manual stock adjustment |
| `GET` | `/api/stock-movements` | View global movement history |

### Challans

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/challans` | Search, filter and paginate challans |
| `POST` | `/api/challans` | Create challan |
| `GET` | `/api/challans/:id` | View challan details |
| `PATCH` | `/api/challans/:id` | Edit draft challan |
| `POST` | `/api/challans/:id/confirm` | Confirm and reduce stock |
| `POST` | `/api/challans/:id/cancel` | Cancel and restore stock where required |

### Dashboard and health

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Role-aware dashboard data |
| `GET` | `/health` | Backend health check |

---

## Postman Collection

Import:

```text
postman/SolarDispatch.postman_collection.json
```

The collection contains variables for:

- `baseUrl`
- `authToken`
- `customerId`
- `productId`
- `challanId`

Login requests can store the returned JWT in the collection-level `authToken` variable.

---

## Testing and Verification

Run backend tests:

```bash
cd server
yarn test
```

Run all static checks and builds:

```bash
cd server
yarn prisma:generate
yarn typecheck
yarn lint
yarn build

cd ../client
yarn typecheck
yarn lint
yarn build
```

Important workflow cases include:

- draft challan does not change stock
- confirmed challan reduces stock
- insufficient stock returns `409 Conflict`
- failed confirmation rolls back all changes
- cancellation restores stock once
- Accounts cannot confirm or cancel challans
- Sales cannot manually adjust inventory

---

## Docker

The current Docker Compose setup provides PostgreSQL for local development.

Start the database:

```bash
docker compose up -d
```

Stop it:

```bash
docker compose down
```

Reset the local database volume:

```bash
docker compose down -v
```

`docker compose down -v` permanently removes the local Docker database volume.

---

## Deployment

### Database: Neon PostgreSQL

1. Create a Neon project.
2. Copy its PostgreSQL connection string.
3. Set it as `DATABASE_URL` in Render.
4. Apply committed migrations using Prisma's production migration command.
5. Seed only when you intentionally want the demo accounts and demo data.

### Backend: Render

Use the `server/` directory as the service root.

Required environment variables:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
NODE_ENV=production
CLIENT_URL
LOG_LEVEL
AUTH_RATE_LIMIT_MAX_REQUESTS
```

Recommended health path:

```text
/health
```

The production build should generate Prisma Client, compile TypeScript and apply committed migrations. The application must use Render's `PORT` environment variable.

### Frontend: Vercel

Use the `client/` directory as the project root.

Set:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

After Vercel provides the final frontend URL, set the same URL as `CLIENT_URL` on Render and redeploy the backend so CORS accepts it.

---

## Assumptions

- SolarDispatch is an internal employee portal; customers do not log in.
- The current stock value represents available warehouse quantity.
- A Draft challan does not reserve inventory.
- Challan confirmation is the main outbound stock event in the current scope.
- Browser print and Save as PDF are sufficient for the assignment.
- Purchase orders, quotations, invoices and payments are outside the required core scope.

---

## Known Limitations

- No password reset or email-verification flow
- No email or SMS notifications
- No product serial-number tracking
- No purchase-order or supplier module
- No quotation, invoice or payment module
- No product-image upload
- Reporting is limited to the current operational dashboard
- Offset pagination may need to be replaced for very large datasets

These items are intentionally listed as limitations rather than presented as completed features.

---

## Possible Future Improvements

- Quotation and invoice workflow
- Purchase orders and supplier records
- Installation scheduling
- Technician assignments
- Warranty and service tickets
- Payment tracking
- Product serial-number management
- AWS S3 product-image storage
- More detailed sales and inventory reports

---

## Author

**Ananya Sahoo**  
Full-stack developer case study submission

