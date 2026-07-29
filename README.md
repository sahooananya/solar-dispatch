# SolarDispatch

**Rooftop Solar Sales, Inventory and Dispatch Management** — a mini ERP + CRM operations portal for a rooftop solar equipment distributor and installation company. Built as a technical hiring assignment.

Sales, warehouse, accounts and administrative employees can manage solar leads, customer follow-ups, site surveys, equipment inventory (panels, inverters, batteries, BOS) and delivery challans with atomic stock control.

---

## Tech stack

| Layer      | Choice                                                              |
|------------|---------------------------------------------------------------------|
| Frontend   | React 18 · TypeScript · Vite 6 · React Router 6 · TanStack Query 5 · React Hook Form + Zod · Axios · Lucide · vanilla CSS with design tokens |
| Backend    | Node 20 · TypeScript · Express 4 · Prisma 5 · Zod · JWT · bcryptjs · Pino · Helmet · CORS · express-rate-limit |
| Database   | PostgreSQL 15 (local via Docker, production on Neon)                 |
| Tooling    | client + server packages, Yarn 1.22.22, tsx (dev), Vitest + Supertest, Docker Compose, Render (API), Vercel (client) |

**Why?** React + Express + PostgreSQL + Prisma is the exact stack mandated by the assignment. Prisma gives fully-typed queries and easy interactive transactions (crucial for atomic challan confirmation). Zod validates every request and shares schema logic between backend and frontend forms.

---

## Repository layout

```
/app
├── client/          Vite + React + TS frontend
│   ├── src/{api,components,hooks,layouts,pages,styles,types}
│   ├── vercel.json
│   └── package.json
├── server/          Express + Prisma + TS backend
│   ├── src/{config,middlewares,modules/{auth,customer,product,challan,dashboard},routes,utils}
│   ├── prisma/{schema.prisma,seed.ts,migrations}
│   ├── render.yaml
│   └── package.json
├── postman/         Importable Postman collection
├── docker-compose.yml
└── memory/test_credentials.md
```

---

## Architecture

```
Browser  ─►  Vite (client, port 3000)  ─►  /api  ─►  Express (server, 8001)
                                                          │
                                                          ├── Zod validation
                                                          ├── JWT auth + role authorize
                                                          ├── Services (business logic)
                                                          └── Prisma ─►  PostgreSQL
```

- All routes prefixed with `/api`, JSON responses use `{ success, data, pagination?, error? }`.
- Every write that mutates inventory (stock adjustment, challan confirmation, confirmed-challan cancellation) runs inside a Prisma interactive transaction with a conditional `updateMany({ where: { currentStock: { gte: qty } } })` so inventory can never become negative.
- JWT middleware attaches `{ sub, role }` to `req.user`; `authorize(...roles)` enforces backend-level RBAC (frontend button-hiding is decorative).

---

## Local setup

Prerequisites: Node 20+, Yarn 1.22.22 (available through Corepack), Docker.
Both package lockfiles were generated with Yarn 1.22.22; use `--frozen-lockfile`
in CI and deployment environments.

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Server
cd server
yarn install
cp .env.example .env       # tweak DATABASE_URL / JWT_SECRET
yarn prisma:generate
yarn prisma:migrate        # applies committed migrations
yarn prisma:seed           # seeds 4 users, 8 customers, 12 products, 3 challans
yarn dev                   # http://localhost:8001

# 3. Client (new terminal)
cd ../client
yarn install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8001
yarn dev                   # http://localhost:3000
```

The client appends `/api` to `VITE_API_BASE_URL`, so the example configuration calls
`http://localhost:8001/api`. If the variable is unset, Vite proxies the relative `/api`
path to the local backend. The seed command resets application data and refuses to run
when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true` is explicitly set.

### Environment variables

**server/.env**

| Var | Description |
|-----|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string (>= 16 chars) |
| `JWT_EXPIRES_IN` | e.g. `12h` |
| `PORT` | API port (default `8001`) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Allowed CORS origin (comma-separated or `*`) |
| `LOG_LEVEL` | Pino level |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Login attempts allowed per 15-minute window (default `100`) |

**client/.env**

| Var | Description |
|-----|-------------|
| `VITE_API_BASE_URL` | e.g. `http://localhost:8001`. Client suffixes `/api` automatically. Leave blank in same-origin/proxy deployments. |

---

## Demo credentials

| Role      | Email                                    | Password           |
|-----------|------------------------------------------|--------------------|
| ADMIN     | admin@demo.solardispatch.test            | SolarAdmin@123     |
| SALES     | sales@demo.solardispatch.test            | SolarSales@123     |
| WAREHOUSE | warehouse@demo.solardispatch.test        | SolarWarehouse@123 |
| ACCOUNTS  | accounts@demo.solardispatch.test         | SolarAccounts@123  |

These are demonstration accounts only.

---

## Role permission matrix (backend-enforced)

| Capability                                | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|-------------------------------------------|:-----:|:-----:|:---------:|:--------:|
| View dashboard / customers / products / challans | ✅ | ✅ | ✅ | ✅ |
| Create / edit customers                   |  ✅  |  ✅  |     ❌    |    ❌    |
| Add customer follow-ups                   |  ✅  |  ✅  |     ❌    |    ❌    |
| Create / edit products                    |  ✅  |  ❌  |     ✅    |    ❌    |
| Adjust stock (IN / OUT movements)         |  ✅  |  ❌  |     ✅    |    ❌    |
| Create / edit challans                    |  ✅  |  ✅  |     ❌    |    ❌    |
| Confirm / cancel challans                 |  ✅  |  ✅  |     ❌    |    ❌    |
| Print / view challan documents            |  ✅  |  ✅  |     ✅    |    ✅    |

Unauthenticated → `401`, wrong-role → `403`.

---

## REST API map

```
POST   /api/auth/login             GET    /api/auth/me
GET    /api/dashboard/summary
GET    /api/customers              POST   /api/customers
GET    /api/customers/:id          PATCH  /api/customers/:id
GET    /api/customers/:id/follow-ups
POST   /api/customers/:id/follow-ups
GET    /api/products               POST   /api/products
GET    /api/products/:id           PATCH  /api/products/:id
GET    /api/products/:id/movements POST   /api/products/:id/movements
GET    /api/stock-movements
GET    /api/challans               POST   /api/challans
GET    /api/challans/:id           PATCH  /api/challans/:id
POST   /api/challans/:id/confirm   POST   /api/challans/:id/cancel
GET    /health
```

Response envelope: `{ success: true, data, pagination? }` on success; `{ success: false, error: { code, message, fieldErrors } }` on failure. See `postman/SolarDispatch.postman_collection.json` for full examples.

---

## Deployment

- **Frontend (Vercel)** — root: `client/`, build: `yarn build`, output: `dist`. `client/vercel.json` handles SPA rewrites. Set `VITE_API_BASE_URL` to the Render API URL.
- **Backend (Render)** — see `server/render.yaml`. Build: `yarn install && yarn prisma:generate && yarn build && yarn prisma:migrate`. Start: `yarn start`. Health path: `/health`. Configure `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`.
- **Database (Neon)** — create a project, copy the pooled connection URL into `DATABASE_URL`, run `yarn prisma:migrate` during Render deploy.

Migrations are declarative — Prisma applies pending migrations on every production deploy via `prisma migrate deploy`.

---

## Postman

Import `postman/SolarDispatch.postman_collection.json`. It ships with variables (`baseUrl`, `token`, `customerId`, `productId`, `challanId`) and a login test-script that auto-captures the JWT.

---

## Known limitations / future enhancements

- Automated Vitest + Supertest suite is scaffolded but not exhaustive.
- Quotation and invoicing modules, technician assignments, per-serial-number tracking, and S3 product images are intentionally out of scope for this milestone.
