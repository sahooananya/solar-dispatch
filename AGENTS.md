# SolarDispatch Repository Instructions

## Project objective

SolarDispatch is a Mini ERP + CRM portal for a rooftop solar distributor and installation business.

The mandatory stack is:

* Frontend: React 18, TypeScript, Vite
* Backend: Node.js, Express, TypeScript
* Database: PostgreSQL
* ORM: Prisma
* Validation: Zod
* Authentication: JWT and bcryptjs
* Frontend local port: 3000
* Backend local port: 8001

Do not replace this stack with Next.js, NestJS, MongoDB, Firebase, Supabase APIs, or another framework.

## Required modules

Preserve and verify:

* JWT authentication
* ADMIN, SALES, WAREHOUSE, and ACCOUNTS roles
* Customer CRM
* Customer follow-up history
* Product management
* Inventory management
* Stock movement audit logs
* Low-stock alerts
* Draft, confirmed, and cancelled sales challans
* Atomic stock reduction
* Stock restoration after cancellation
* Printable challan
* Postman collection
* Prisma migrations and seed data
* Docker setup
* Vercel and Render deployment configuration

## Critical business rules

* Draft challans must not change inventory.
* Confirmed challans must reduce stock.
* Stock must never become negative.
* Insufficient stock must return HTTP 409.
* Challan confirmation must run inside a Prisma transaction.
* Confirmed challan cancellation must restore stock transactionally.
* Every inventory change must create a StockMovement record.
* Product snapshots inside historical challans must not change when a Product record is edited.
* Permissions must be enforced by Express middleware, not only by the frontend.

## Safety rules

* Never delete files before checking imports, scripts, build configuration, and documentation references.
* Never delete Prisma migrations, seed scripts, Postman collections, deployment files, tests, `.env.example` files, or Docker files without explicit justification.
* Do not commit `.env`, secrets, database passwords, JWT secrets, `node_modules`, build output, coverage output, or logs.
* Do not change API response contracts without updating the frontend, tests, Postman collection, and README together.
* Do not add future modules such as quotations, invoices, payments, or technician scheduling.
* Make minimal, focused changes.
* Show the diff or changed-file summary after every task.
* Do not claim a command passed unless it was executed successfully.

## Code quality

* Use strict TypeScript.
* Avoid unnecessary `any`.
* Use domain-specific names.
* Keep controllers thin and business logic in services.
* Keep route authorization explicit.
* Use one statement per line.
* Format JSX clearly.
* Avoid large unrelated refactors.
* Add comments only for non-obvious business rules.

## Required verification

After meaningful changes, run the scripts that actually exist in the repository:

* Prisma generation
* Type checking
* Linting
* Tests
* Frontend production build
* Backend production build

Use the existing package manager determined from the repository lockfile. Do not switch from Yarn to npm or npm to Yarn unless there is a genuine repository problem.
