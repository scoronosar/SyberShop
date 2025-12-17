SyberShop — Complete Tech Task (React frontend + Node backend)

Logo (local path to use in project until hosted):
/mnt/data/A_logo_in_a_square_digital_vector_graphic_features.jpeg

1) High-level summary & constraints

Frontend: React (TypeScript) + Vite + Tailwind CSS; design inspired by Taobao (dense product grid, rich filters, bright orange accents).

Backend: Node.js + TypeScript + Express (or NestJS if preferred). REST API + JWT auth.
DB: Postgres. Cache: Redis. Queue: BullMQ (Redis).

Hosting: VPS on Namecheap, domain sybershop.store, subdomain api.sybershop.store. Use Nginx reverse proxy + Let's Encrypt for SSL.

Integration strategy: initially test/mock Taobao endpoints (stubs). Later swap MockTaobaoClient → TaobaoClient with OAuth.

Currency conversion: external exchange-rate API (any reliable provider). Apply +5% markup on conversion rate and +3% service fee per item.

Delivery fees: not charged at order checkout; calculated when cargo “arrives” (consolidation/arrival event) and then added to order as a surcharge/invoice.

2) Business rules / Pricing formulas

Let:

price_cny = product price from Taobao (per unit)

rate = currency conversion rate from CNY → local currency (from external API)

markup_currency = 1.05 (5% currency markup)

service_fee = 0.03 (3% per-item)

qty = number of units ordered

Per-item price (local currency):

converted = price_cny * rate

converted_with_markup = converted * markup_currency

final_item_price = converted_with_markup * (1 + service_fee)

line_total = final_item_price * qty

(Implement rounding to smallest currency unit at the last step.)

Delivery:

When order is placed, store estimated_delivery = null and delivery_fee = 0.

When consolidation/arrival event occurs (warehouse or customs event), system calculates shipping cost for that consolidated cargo (calc_shipping_price) and applies pro-rata share to affected orders, then sets order.delivery_fee and emits invoice/notification.

Example: if consolidated cargo contains N orders, delivery cost is split by weight/volume or by value as configured.

3) Architecture & components
Architecture diagram (logical):
[React Frontend]  <-->  [API Gateway (Nginx)]  <--> [Node Backend (Express/Nest)]  <--> [Postgres]
                                                             |-> Redis (cache & queues)
                                                             |-> S3-compatible storage (images)
                                                             |-> External APIs: Taobao (mock/prod), Exchange-rate API, SMS/EMAIL, Logistics partners

Important micro/modules:

Auth (JWT, OAuth hooks for Taobao)

Products (search, details, images)

Pricing (conversion + markups)

Cart & Orders

Checkout (orders without final delivery fee)

Logistics (ChinaProcurement, Warehouse, Tracking, Arrival events)

Accounting (invoices, adjustments)

Admin (orders, logistics dashboard, API credentials)

Integration Layer (abstract TaobaoClient & CurrencyClient)

4) Backend — Detailed Tech Tasks & Endpoints
4.1 Project setup

Initialize TypeScript Node project with ESLint, Prettier, Husky.

Add frameworks: Express (or NestJS), TypeORM/Prisma for Postgres, Redis client, BullMQ, Swagger/OpenAPI.

4.2 Environment variables (example)
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://user:pass@localhost:5432/sybershop
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
TAOBAO_APP_KEY=...
TAOBAO_APP_SECRET=...
CURRENCY_API_KEY=...
S3_ENDPOINT=...
S3_KEY=...
S3_SECRET=...
LOGO_LOCAL_PATH=/mnt/data/A_logo_in_a_square_digital_vector_graphic_features.png

4.3 Data models (Postgres)

User: id, email, password_hash, role, created_at, contact_info

Product: id, external_id, title_orig, title_en, price_cny, images[], skus JSON, rating, sales, raw_json, cached_at

ProductPriceSnapshot: product_id, rate_used, converted_price, final_price, service_fee, calculated_at

Cart: id, user_id, items [{product_id, sku, qty, final_price_snapshot_id}]

Order: id, user_id, items[], subtotal, delivery_fee, total, status, created_at, China_order_id (if any)

database, [11/30/2025 4:10 PM]
ChinaOrder: id, orders[], items[], total_yuan, warehouse, status

Cargo: id, china_order_id, trackers[], weight, volume, arrival_date, shipping_cost

Tracker: id, imei, type, status, assigned_cargo_id

AppCredentials: id, taobao_app_key, taobao_app_secret, access_token, refresh_token

4.4 API endpoints (initial mock / later prod)

Auth

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

Products

GET /api/products?query=&category=&sort=&page=&price_min=&price_max= (calls MockTaobaoClient initially)

GET /api/products/:id (returns product + computed final_item_price with current rate)

POST /api/products/import (admin — trigger fetch from Taobao)

Currency

GET /api/currency/rate?from=CNY&to=TJS
Response:

{
  "from":"CNY","to":"TJS",
  "rate":13.00,                  // external rate
  "rate_with_markup":13.65,      // rate * 1.05
  "timestamp":"..."
}


POST /api/currency/convert (server-side convert w/ fee applied)
Input: { amount_cny: 100 }
Response: { converted: 1300, converted_with_markup: 1365, final_per_item: 1405.95 } (numbers illustrative)

Cart & Orders

POST /api/cart (add item)

GET /api/cart

POST /api/order (create order — no delivery fee assigned)

GET /api/order/:id/status

POST /api/order/:id/pay (future)

Logistics / Arrival

POST /api/logistics/cargo/create (admin/warehouse)

POST /api/logistics/cargo/:id/arrive — when cargo arrival occurs, system calls calc_shipping_price(cargo) and:

sets cargo.shipping_cost

allocates pro-rata delivery_fee to associated orders

updates each order total; emits invoice & notifications

GET /api/logistics/order/:orderId/tracking

Admin

GET /api/admin/orders

POST /api/admin/assign-cargo

GET /api/admin/analytics/logistics

4.5 Implementation notes for pricing endpoints

All product responses must include fields:

price_cny

rate_used

converted_with_markup

service_fee_amount

final_item_price

Frontend should never calculate final prices from raw cny without calling /api/products/:id or /api/currency/convert. Server is the source of truth.

5) Frontend — React (TypeScript) Detailed Tech Tasks
5.1 Project setup

Vite + React + TypeScript

Tailwind CSS + classnames utility

React Router v6

State management: React Query (data fetching + cache) + Zustand or Redux Toolkit for client state (cart/auth)

i18n: react-i18next (RU/EN)

ESLint + Prettier

5.2 Pages & Components (priority order)

Landing / Home

Top nav (logo, search bar, cart icon, user menu)

Category carousel (Taobao style)

Promotion banners

Featured products grid

Search results page

Keyword input + image search (image upload)

Filters: category, price range, rating, sales, shipping (available)

Sorting: relevance, price ascending/descending, rating, sales

Product grid: card with image carousel, price in local currency, “Mock” badge when using test API, “Add to cart” button

Product detail

Gallery, price breakdown (CNY → converted → final), SKU selection, quantity selector

Tabs: Description (raw HTML sanitized), Specifications, Reviews, Shipping & logistics (shows current cargo/tracking if ordered)

Button: Add to cart / Buy now

Cart

List items with per-line price (server-calculated), subtotal, placeholder for delivery fee (shows “Calculated at arrival”)

Checkout button → creates order (status: pending_processing)

Order details

Items, subtotal, delivery_fee (zero until arrival), total

Timeline of logistics events (updated via polling/websocket)

Admin dashboard

Orders table, cargo management (create cargo, mark arrived), assign trackers, view shipping cost calc.

User account

Orders, tracking, invoices

Settings

Toggle between Test API and Production API

API keys for Taobao (admin)

5.3 UI/UX specifics (Taobao-like)

Dense product grid, small product cards with multiple images

Use orange accent color for CTAs (match your earlier logo request)

Mobile-first responsive, but desktop should prioritize grid density

Inline price breakdown modal/tray (user can expand to see conversion details)

Badges: “Free Shipping”, “Taobao Seller”, “Mock Data (DEV)”

5.4 Frontend services

database, [11/30/2025 4:10 PM]
apiClient.ts — wrapper around fetch/axios, inject JWT header, retry logic

currencyService — calls /api/currency/*

taobaoService — search/product detail calls to backend endpoints

cartService — local state + persist in backend

logisticsService — poll order/:id/tracking and show timeline

6) Logistics: delivery calculation & workflow details (implementation)

Order creation:

User creates order -> Order.status = created -> ChinaOrder may be created later for procurement batch.

China procurement / consolidation:

Admin or automated rule groups orders into ChinaOrder → then Cargo created when goods leave China warehouse.

Cargo has weight/volumes. Use weight and volumetric formula:

volumetric_weight = (L*W*H)/6000 (or configured divisor)

billable_weight = max(actual_weight, volumetric_weight)

Shipment cost calc

cargo.shipping_cost = tariff_for_method * billable_weight + base_handling_fee

Tariffs stored in DB and can be changed in admin.

Upon POST /api/logistics/cargo/:id/arrive, backend computes cargo.shipping_cost and splits to orders.

Split rules

Default: split by order_total_weight / cargo_total_weight

Alternative: split by order_value / cargo_total_value

System should support both; admin selects default.

Apply fee

For each included order:

order.delivery_fee = cargo.shipping_cost * share_ratio

order.total += order.delivery_fee

order.status updated to awaiting_delivery_payment or ready_for_local_delivery depending on business rules

Notify buyer via email/telegram.

Arrival event

Set cargo.arrival_date and cargo.status = arrived

Optionally attach photos/documents, customs clearance docs, trackers snap.

7) Dev/QA: Mock mode & Taobao integration plan

Implement MockTaobaoClient behind a TaobaoClientInterface.

MockTaobaoClient.searchByKeyword returns paged fake results and logs timestamp + “mock” flag.

Feature flag TAOBAO_MODE = MOCK|PROD in env.

Later implement TaobaoOAuthManager to obtain tokens and swap client.

8) Testing, Monitoring & Acceptance Criteria
Unit & Integration tests

Backend: coverage on pricing calculations, cargo arrival handling, currency convert correctness.

Frontend: E2E flows (Cypress): search -> product -> add to cart -> create order -> mark cargo arrived -> delivery fee is added.

Acceptance criteria (example)

When product returned by GET /api/products/:id, price fields must include: price_cny, rate_with_markup, service_fee_amount, final_item_price. Calculation must match server-side logic and be displayed similarly on frontend.

When cargo arrival is posted, all associated orders receive calculated delivery_fee and their totals update.

Currency API returns rate_with_markup = rate * 1.05 and used in conversion.

Mock mode clearly indicates Mock Data badges and toggles off in production.

Deployment to VPS accessible at https://sybershop.store (frontend) and https://api.sybershop.store (backend).

9) Deployment & Namecheap VPS steps (practical)

Provision VPS (Ubuntu 22.04) on Namecheap.

SSH into VPS, create sybershop user.

Install Node LTS, PostgreSQL, Redis, Nginx.

Create Postgres DB & user; secure Redis.

Clone backend repo, build and run as systemd service:

yarn install && yarn build && pm2 start dist/main.js (or use systemd)

Setup Nginx:

Proxy api.sybershop.store → backend port (4000)

Proxy sybershop.store → frontend dist

SSL:

Use Certbot to obtain/auto-renew certificates for sybershop.store and api.sybershop.store.

Setup CI: GitHub Actions to build and deploy using SSH or Docker image pushes.

Store secrets using env files on server or use Vault.

10) Deliverables & Milestones (suggested phases)

Phase 0 — Project init

Repo skeletons, CI, basic deployment to dev VPS, domain pointing.

Phase 1 — Mock MVP

Backend skeleton + MockTaobaoClient, currency API, product endpoints

React app: search, product grid, cart, order creation (no payment)

Admin: cargo create & arrive API

Deploy to dev domain

Phase 2 — Logistics & Pricing

Cargo shipping costing, order splitting, delivery fee application and notifications

database, [11/30/2025 4:10 PM]
Real-time order tracking timeline (polling / websocket)

Add trackers table (DB) for later integration

Phase 3 — Taobao + Payment

OAuth integration with Taobao; replace Mock client

Payment methods integration (later)

Phase 4 — Hardening & Scaling

Rate limiting, caching, background jobs, monitoring, load tests, SRE tasks

11) Implementation checklist (copy/paste for devs)

 Repo sybershop-frontend scaffolded (Vite/TS/Tailwind)

 Repo sybershop-backend scaffolded (Node/TS/Express or Nest)

 MockTaobaoClient implemented and feature-flagged

 /api/currency/* endpoints implemented (rate + markup logic)

 Product API returns final price fields

 Cart & Order endpoints implemented

 Cargo endpoints & arrival processing implemented

 Frontend pages: search, product, cart, order, admin-cargo

 Deploy to Namecheap VPS; setup Nginx + SSL

 Integrate local logo path: /mnt/data/A_logo_in_a_square_digital_vector_graphic_features.png → upload to S3 or serve statically

 Unit tests & E2E tests created

 Documentation (README + API spec)

12) Example API contract (currency convert)

Request

POST /api/currency/convert
Content-Type: application/json
Body: { "amount_cny": 100.00, "to": "TJS" }


Response

{
  "from": "CNY",
  "to": "TJS",
  "amount_cny": 100.00,
  "rate": 13.00,
  "rate_with_markup": 13.65,
  "converted": 1300.00,
  "converted_with_markup": 1365.00,
  "service_fee_percent": 0.03,
  "final_per_item": 1405.95,
  "calculation": {
    "step1_converted": 1300.00,
    "step2_markup": 1365.00,
    "step3_service_fee": 40.95
  },
  "timestamp": "2025-11-21T00:00:00Z"
}


(All numbers rounded to 2 decimals on output.)