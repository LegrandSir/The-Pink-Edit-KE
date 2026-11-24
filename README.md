# The Pink Edit KE — Full-Stack Luxury E-Commerce Platform

A mobile-responsive, full-stack e-commerce boutique and merchant operations console built for a Nairobi luxury fragrance, fine jewellery, and home sanctuary brand.

- **Live Storefront:** [https://the-pink-edit-ke.vercel.app](https://the-pink-edit-ke.vercel.app)
- **Live Admin Console:** [https://the-pink-edit-ke.vercel.app/admin](https://the-pink-edit-ke.vercel.app/admin)
- **API Health Check:** [https://the-pink-edit-ke.onrender.com/api/health](https://the-pink-edit-ke.onrender.com/api/health)

---

## Instant Demo Access (No Sign-Up Required)

Use the floating **Demo Switcher** pill in the bottom-left corner of any page, or click the **One-Click Demo Login** buttons on the login screens:

| Role | Route | Email | Password |
| :--- | :--- | :--- | :--- |
| **VIP Customer** | `/login` → `/account` | `amara@thepinkedit.com` | `Demo123!` |
| **SuperAdmin Merchant** | `/admin` → `/admin/dashboard` | `admin@thepinkedit.com` | `Admin123!` |

> **Note:** The Flask API runs on Render's free tier and may take 20–40 seconds to cold-start on the first request after inactivity.

---

## Architecture & Tech Stack

```text
┌──────────────────────────────┐        HTTPS / JWT        ┌──────────────────────────────┐
│   React 19 + Vite Frontend   │ ◄───────────────────────► │    Python Flask REST API     │
│  Tailwind CSS v4 · Recharts  │                           │ SQLAlchemy · Flask-Migrate   │
│  Framer Motion · OAuth 2.0   │                           │  RBAC JWT · Daraja M-Pesa    │
│      (Hosted on Vercel)      │                           │      (Hosted on Render)      │
└──────────────────────────────┘                           └──────────────┬───────────────┘
                                                                          │ psycopg2 / SSL
                                                                          ▼
                                                           ┌──────────────────────────────┐
                                                           │    Neon Serverless Postgres  │
                                                           │  12 Normalized Relational    │
                                                           │  Tables (Orders, SKUs, etc.) │
                                                           └──────────────────────────────┘

Key Engineering HighlightsEnd-to-End Order & Inventory Lifecycle: Checkout recalculates prices server-side from database SKUs, deducts available_stock into committed_stock, persists Order, OrderItem, and Payment rows atomically, clears the synced cart, and recalculates customer lifetime spend & VIP tiers.Role-Based Access Control (RBAC): Custom @admin_required JWT claim guard isolates all /api/admin/* endpoints from customer tokens while supporting 7-day persistent sessions and Google OAuth 2.0 sign-in.Kenyan Commerce Workflows: Supports M-Pesa Express (both Safaricom Daraja STK Push integration and an instant portfolio simulation mode so reviewers outside Kenya can complete checkout end-to-end), Pay on Delivery, Nairobi/countrywide shipping rates, and free-shipping thresholds in KES.Merchant Command Center: Real-time 14-day Recharts revenue trajectory, department revenue breakdown, one-click +10 low-stock restocking, multi-variant SKU CRUD modal, order fulfillment/tracking/refund restocking, CSV exports, and persistent store & team configuration.Editorial Luxury UX: Typography-led UI (Cormorant Garamond + Plus Jakarta Sans), Framer Motion transitions, dual-angle product hover, URL-synced search/filters, free-shipping progress bar, wishlist persistence, and live toast feedback.Core API EndpointsMethodEndpointAccessDescriptionGET/api/productsPublicFilterable, searchable, sortable active catalog with variants & mediaGET/api/products/:idPublicSingle product detail with variant pricing & olfactory notesPOST/api/auth/demo-customerPublicOne-click JWT sign-in to pre-seeded VIP customer accountPOST/api/auth/googlePublicGoogle OAuth 2.0 token verification & account provisioningPOST/api/cart/syncCustomer JWTMerges & persists variant-aware cart items across sessionsPOST/api/checkout/orderCustomer JWTAtomic order creation, stock deduction, and M-Pesa/POD paymentGET/api/account/ordersCustomer JWTCustomer order history with 4-stage fulfillment statusPOST/DELETE/api/wishlist/:idCustomer JWTPersistent wishlist togglePOST/api/admin/demo-loginPublicOne-click JWT sign-in to SuperAdmin consoleGET/api/admin/dashboard/statsAdmin JWTRevenue KPIs, 14-day trend, department mix, and low-stock watchlistPOST/PUT/DELETE/api/productsAdmin JWTFull product, media, and multi-variant SKU managementPATCH/api/admin/variants/:id/stockAdmin JWTInstant SKU stock adjustmentsGET/POST/PATCH/api/admin/ordersAdmin JWTOrder management, courier tracking, fulfillment, and refund restockingGET/PUT/api/admin/settingsAdmin JWTPersistent store branding, payment rails, shipping thresholds, and VATLocal Development Setup1. Backend (Flask + Postgres/SQLite)Bashcd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
Create backend/.env:Code snippetDATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DARAJA_CONSUMER_KEY=your-daraja-key
DARAJA_CONSUMER_SECRET=your-daraja-secret
DARAJA_PASSKEY=your-daraja-passkey
Run migrations and seed the portfolio dataset:Bashflask db upgrade
python seed_demo.py
python app.py
2. Frontend (React + Vite)Bashcd frontend
npm install
Optional frontend/.env.local (defaults to the live Render API if omitted):Code snippetVITE_API_URL=[http://127.0.0.1:5000](http://127.0.0.1:5000)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
Start the dev server:Bashnpm run dev
AuthorPaul Wafula — Software Engineering Student at USIU-AfricaGitHub: @LegrandSirLinkedIn: linkedin.com/in/paul-wafula-b12200331