# SolarDispatch: Project Submission Summary

**Submission by:**
- **Name:** ANANYA SAHOO
- **Roll Number:** 22051575

---

## 1. Project Overview

**SolarDispatch** is a role-based Mini ERP + CRM Operations Portal designed for a rooftop solar distribution business.

The application helps internal teams manage:

- Customer records and CRM follow-ups
- Solar products and inventory
- Stock IN/OUT movements
- Sales challans
- Role-based access for Admin, Sales, Warehouse, and Accounts users
- Operational dashboard metrics

The project was built as a full-stack TypeScript application and deployed using free cloud services.

---

## 2. Project Links

- **GitHub Repository:** [https://github.com/sahooananya/solar-dispatch](https://github.com/sahooananya/solar-dispatch)
- **Live Frontend Application (Vercel):** [https://solar-dispatch-three.vercel.app](https://solar-dispatch-three.vercel.app)
- **Live Backend API (Render):** [https://solar-dispatch.onrender.com](https://solar-dispatch.onrender.com)
- **Backend Health Check:** [https://solar-dispatch.onrender.com/health](https://solar-dispatch.onrender.com)
- **Video Demonstration:** to be added !!!

---

## 3. Test Login Credentials

The system includes four seeded users for testing role-based access control.

### Admin — Full Access

- **Email:** `admin@demo.solardispatch.test`
- **Password:** `SolarAdmin@123`

### Sales — Customers and Sales Challans

- **Email:** `sales@demo.solardispatch.test`
- **Password:** `SolarSales@123`

### Warehouse — Products and Stock Operations

- **Email:** `warehouse@demo.solardispatch.test`
- **Password:** `SolarWarehouse@123`

### Accounts — Operational Records and Dashboard Access

- **Email:** `accounts@demo.solardispatch.test`
- **Password:** `SolarAccounts@123`

---

## 4. Core Features Implemented

### Authentication and Role-Based Access Control

- JWT-based login
- Password hashing with bcrypt
- Protected frontend routes
- Backend authorization middleware
- Separate permissions for Admin, Sales, Warehouse, and Accounts roles

### Customer CRM

- Add and edit customers
- Search customer records
- View detailed customer information
- Store business name, customer type, status, address, and optional GST number
- Add follow-up notes and follow-up dates
- Track Lead, Active, and Inactive customers

### Product and Inventory Management

- Add and edit solar products
- Track SKU, category, unit price, warehouse location, current stock, and minimum stock
- Create stock IN and OUT adjustments
- Maintain a stock movement audit log
- Track the user and timestamp associated with each movement
- Prevent inventory from becoming negative

### Sales Challan Workflow

- Automatically generate challan numbers
- Select a customer and multiple products
- Save challans as Draft or Confirmed
- Confirm challans using database transactions
- Reduce stock only after confirmation
- Reject confirmation when stock is insufficient
- Store product snapshot data in challan items
- Cancel confirmed challans and restore stock
- Create matching stock movement records
- Provide a printable challan view

### Dashboard

- Customer totals
- Product and inventory summaries
- Low-stock indicators
- Challan statistics
- Recent operational activity

---

## 5. Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Lucide React icons
- Responsive custom CSS design system

### Backend

- Node.js
- TypeScript
- Express.js
- Zod validation
- JSON Web Tokens
- bcrypt
- Centralized error handling
- REST APIs

### Database

- PostgreSQL
- Prisma ORM
- Neon managed PostgreSQL

### Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon
- **Source Control:** GitHub
- **Optional local database setup:** Docker Compose with PostgreSQL

---

## 6. Repository Structure

```text
solar-dispatch/
├── client/                  # React + Vite frontend
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── yarn.lock
├── server/                  # Express + Prisma backend
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   ├── render.yaml
│   └── yarn.lock
├── postman/
│   └── SolarDispatch.postman_collection.json
├── memory/
│   └── PRD.md
├── docker-compose.yml
├── README.md
└── PROJECT_SUMMARY.md
```

---

## 7. Architecture Overview

SolarDispatch uses a monorepository with independently deployable frontend and backend applications.

### Frontend Architecture

The React frontend is responsible for:

- Login and session handling
- Role-aware navigation
- Forms and validation feedback
- Dashboard and operational pages
- Calling backend REST endpoints through a centralized Axios client

The JWT is stored in the browser and attached to authenticated API requests.

### Backend Architecture

The Express backend is divided into modules for:

- Authentication
- Customers
- Products
- Stock movements
- Sales challans
- Dashboard reporting

Shared middleware handles:

- JWT authentication
- Role authorization
- Zod request validation
- Centralized error responses
- Logging and rate limiting

### Database Architecture

Prisma manages the PostgreSQL schema and relationships between:

- Users
- Customers
- Customer follow-ups
- Products
- Stock movements
- Challans
- Challan items

The database is hosted on Neon and is accessed by the Render backend through an environment variable.

---

## 8. Important Design Decisions and Why They Were Made

### React, Vite, and TypeScript

React was selected for the administrative interface and reusable components. Vite provides a fast development and production build workflow. TypeScript improves maintainability and catches invalid data usage before runtime.

### Express with Modular Services

Express was selected because it is lightweight and suitable for a time-limited case study. Routes, schemas, services, middleware, and utility functions are separated to avoid placing business logic directly inside route handlers.

### PostgreSQL with Prisma

The system contains relational and transactional data, including customers, products, challans, challan items, users, and stock movements. PostgreSQL provides strong relational consistency, while Prisma provides typed database access, migrations, and readable schema definitions.

### Neon as the Cloud Database

Neon was chosen because it provides managed PostgreSQL without requiring a paid server. The same database technology is used locally and in production, which reduces environment differences.

### JWT Authentication and RBAC

JWT authentication keeps the API stateless. Role-based middleware ensures that permissions are enforced by the backend rather than relying only on hidden frontend buttons.

### Zod Validation

Zod validates incoming API data before it reaches service and database logic. This produces predictable input handling and useful field-level error messages.

### Atomic Challan Transactions

Challan confirmation changes multiple records: challan status, product stock, and stock movement history. These actions are executed in a Prisma transaction so they either all succeed or all fail together.

### Product Snapshot Data

Each challan item stores a snapshot of product information instead of depending only on a product ID. This preserves the original challan details even when the product name, SKU, or price changes later.

### Separate Vercel and Render Deployment

The frontend is a static Vite application, making Vercel a suitable hosting platform. The backend requires a long-running Node.js process, so it is deployed as a Render Web Service. Environment variables connect the two services without exposing database credentials in the repository.

### Deterministic Demo Seed

A Prisma seed script creates four role-based demo users and sample solar-business data. This makes the application immediately testable by reviewers. The seed is intended for controlled setup and is not run automatically on every production startup.

---

## 9. Key Business Logic

### Draft Challan

Creating a Draft challan does not change inventory.

### Confirmed Challan

When a challan is confirmed:

1. The backend validates each product and requested quantity.
2. It checks that sufficient stock is available.
3. Product stock is reduced.
4. An OUT stock movement is created.
5. The challan status is changed to Confirmed.
6. All changes are committed in one transaction.

If any product has insufficient stock, the complete confirmation operation fails and no partial stock deduction occurs.

### Cancelled Challan

When a confirmed challan is cancelled:

1. Previously deducted quantities are restored.
2. Reversal IN stock movements are created.
3. The challan status changes to Cancelled.
4. The operation is completed transactionally.

---

## 10. API Documentation and Postman

The Postman collection is available at:

```text
postman/SolarDispatch.postman_collection.json
```

### Usage

1. Import the collection into Postman.
2. Set the collection `baseUrl` to the live Render API base URL with `/api`.
3. Run the Login request using one of the demo accounts.
4. Copy or automatically store the returned JWT token.
5. Test the protected customer, product, stock, dashboard, and challan endpoints.

### Main Endpoints

```text
GET  /health
POST /api/auth/login
GET  /api/auth/me
GET  /api/dashboard
GET  /api/customers
POST /api/customers
GET  /api/products
POST /api/products
GET  /api/stock-movements
POST /api/challans
GET  /api/challans
```

---

## 11. Local Development Setup

### Prerequisites

- Node.js 22
- Yarn 1.22
- PostgreSQL database or a Neon connection string

### Backend Setup

```bash
cd server
yarn install --frozen-lockfile
```

Create `server/.env` from `server/.env.example`:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=12h
PORT=8001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
AUTH_RATE_LIMIT_MAX_REQUESTS=100
```

Run:

```bash
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
yarn dev
```

The backend runs at:

```text
http://localhost:8001
```

Health endpoint:

```text
http://localhost:8001/health
```

### Frontend Setup

```bash
cd client
yarn install --frozen-lockfile
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8001
```

Run:

```bash
yarn dev
```

The frontend runs at:

```text
http://localhost:3000
```

---

## 12. Production Deployment

### Backend on Render

- Root directory: `server`
- Runtime: Node.js
- Build command:

```bash
yarn install --frozen-lockfile --production=false && yarn prisma:generate && yarn build && yarn prisma:migrate
```

- Start command:

```bash
yarn start
```

- Health check path:

```text
/health
```

Required environment variables:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
NODE_ENV
CLIENT_URL
LOG_LEVEL
AUTH_RATE_LIMIT_MAX_REQUESTS
NODE_VERSION
```

### Frontend on Vercel

- Root directory: `client`
- Framework preset: Vite
- Install command:

```bash
yarn install --frozen-lockfile
```

- Build command:

```bash
yarn build
```

- Output directory:

```text
dist
```

Required environment variable:

```text
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Render CORS variable:

```text
CLIENT_URL=https://solar-dispatch-three.vercel.app
```

---

## 13. Verification Completed

The following flows were verified during development and deployment:

- Prisma connected to Neon
- Database migration deployed successfully
- Demo seed completed successfully
- Backend health endpoint returned a successful response
- Login API returned a valid JWT
- Local frontend communicated with the backend
- Render backend deployed successfully
- Vercel frontend deployed successfully
- Production login worked after configuring the correct frontend origin

---

## 14. Known Limitations

- Render's free service may enter an idle state, so the first request after inactivity can take longer.
- The application does not provide public user registration.
- User administration is limited to seeded demonstration accounts.
- Purchase orders, supplier management, payment processing, automated GST invoicing, returns, and multi-warehouse transfers are outside the current scope.
- JWT sessions do not currently use refresh tokens.
- The system is designed as a focused case-study application rather than a complete enterprise ERP suite.
- The demo seed should not be run on a database containing real operational data because it is intended to recreate demonstration records.

---

## 15. Assumptions

- One product has one current warehouse/location value.
- Stock is represented as whole-unit quantities.
- Only authorized employees access the portal.
- Confirmed challans represent stock dispatch.
- Cancelling a confirmed challan restores its stock.
- The supplied sample data is fictional and intended only for evaluation.
- Deployment uses free-tier infrastructure to avoid assignment costs.

---

## 16. Video Demonstration Outline

The demonstration video should cover:

1. Brief project introduction and business problem
2. Technology stack and repository structure
3. Login with the Admin account
4. Dashboard overview
5. Customer creation, search, detail view, and follow-up
6. Product and inventory management
7. Stock IN/OUT movement history
8. Draft challan creation
9. Confirmation and automatic stock deduction
10. Insufficient-stock validation
11. Challan cancellation and stock restoration
12. Role-based access using Sales, Warehouse, or Accounts
13. Backend health endpoint
14. GitHub repository and Postman collection
15. Deployment architecture and important technical decisions
16. Known limitations and possible future improvements

---

## 17. Conclusion

SolarDispatch demonstrates a complete full-stack business workflow using React, Express, TypeScript, PostgreSQL, Prisma, JWT authentication, validation, transactional stock handling, cloud deployment, and structured documentation.

The implementation focuses on correctness of operational workflows, maintainable project structure, role-based security, and a clear reviewer experience.
