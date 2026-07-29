# SolarDispatch — PRD (Living Document)

Started: 2026-02-XX

## Original problem statement (summary)
Full-stack rooftop-solar Mini ERP + CRM built on the exact stack required by the assignment:
React + TypeScript + Vite + TanStack Query + React Hook Form + Zod (frontend) and Node + Express + TypeScript + Prisma + PostgreSQL + JWT + Zod (backend). Modules: auth (4 roles), customers, follow-ups, products, stock movements, sales challans with atomic confirm / cancel + printable challan.

Full spec is preserved as-is inside the original task record.

## User personas
- **Admin** — full access across CRM, inventory, dispatch.
- **Solar Consultant (Sales)** — customers, follow-ups, challans (create/confirm/cancel), read-only inventory.
- **Warehouse Coordinator** — products, stock, view confirmed challans.
- **Accounts** — read-only across customers/products/challans.

## Core requirements (static)
1. JWT auth with 4 backend-enforced roles.
2. Customers with CRM + solar-specific fields; append-only follow-up history.
3. Products with SKU uniqueness, low-stock alerts, IN/OUT movements via transactional stock adjustment.
4. Challans with automatic number, snapshot line items, atomic confirmation (`updateMany` conditional), reversal on cancel of CONFIRMED.
5. Dashboard with live DB-backed metrics.
6. Print-ready delivery challan.

## What's been implemented (2026-02)
- Complete monorepo: `/app/client` (Vite) + `/app/server` (Express + Prisma), plus `/app/postman`, `docker-compose.yml`, `README.md`.
- Prisma schema, migration, seed (4 users, 8 customers, 12 products, 3 challans).
- Auth (login + /me), rate limiting on login (disabled in test env), bcrypt, JWT with env secret.
- Full RBAC middleware on every write endpoint.
- Customer CRUD + follow-ups + filters + search + pagination.
- Product CRUD + category / low-stock filter + manual stock movement endpoint (atomic).
- Global `/api/stock-movements` history endpoint.
- Challan CRUD + confirm (serializable transaction, conditional decrement) + cancel with reversal + duplicate-line aggregation + generated challan number with collision retry.
- Dashboard summary endpoint with real aggregates.
- Vite React client: login, dashboard, customers, customer detail (follow-up timeline), products (with stock adjust dialog), stock movements, challans list, challan create, challan detail (confirm/cancel modals), printable challan.
- Design tokens (navy + solar yellow + slate), Fraunces headings + Instrument Sans body.
- Postman collection with token-capture script and insufficient-stock example.
- **Iteration 2 (2026-02):** Vitest + Supertest suite (`/app/server/tests`, 5 spec files, 37 tests, isolated `solardispatch_test` DB, TRUNCATE per test); mobile sidebar drawer with hamburger + scrim + Escape-to-close + route-change auto-close; `useFocusTrap` hook applied to every dialog (Customer, Product, Stock Adjustment, Challan confirm/cancel).

## Deferred to next phase
- Optional GitHub Actions workflow for lint/test/build.
- Screen-recording demonstration script.

## Next tasks (P0/P1/P2)
- **P1** — Ship Vitest + Supertest tests as an explicit checklist per assignment section 16.
- **P2** — Mobile drawer + focus-trap accessibility polish.
- **P2** — Quotation, invoicing, payment tracking modules (assignment "future enhancements").
