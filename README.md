# QR-SOS — Emergency Vehicle Identification Platform

> One scan. Emergency contact. Your safety sticker.

A production-grade web platform that lets users generate a personalized QR sticker for their vehicle. When scanned in a parking situation or emergency, it surfaces the owner's contact and emergency contacts. Real-time push and email notifications are sent to the owner on every scan.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Styling | Tailwind CSS + Framer Motion |
| Database | PostgreSQL 16 via Prisma ORM |
| Cache / Rate-limit | Redis (local Docker) / Upstash (production) |
| Auth | NextAuth.js v5 — JWT strategy, Credentials provider |
| Image Storage | Cloudinary |
| QR Generation | `qrcode` → custom SVG sticker |
| Push Notifications | Web Push API (VAPID) + Service Worker |
| Email | Resend |
| Container | Docker Compose + Nginx |

---

## Features

- 4-step animated registration (personal info → security → emergency contacts → photo)
- Framer Motion landing page with parallax hero, animated stats, floating particles
- Mobile-first, PWA-ready with service worker
- Downloadable print-ready SVG sticker (400×500px)
- Real-time in-app toast + browser push notifications on QR scan
- Scan history dashboard with full scanner profile card (name, email, phone, emergency profile link)
- Guest privacy mode — contact name hidden, only phone + relationship shown to unregistered scanners
- Auth-gate on scan page (scanner must register/login to view contacts)
- Rate limiting on all API routes
- Production Docker Compose with Nginx reverse proxy

---

## Quick Start — Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop (for Postgres + Redis)

### 1. Clone & install
```bash
git clone https://github.com/farrukh-aftab-ahmed/qr-sos.git
cd qr-sos
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- **NEXTAUTH_SECRET / AUTH_SECRET** — generate with `openssl rand -hex 32`
- **Cloudinary** — create free account at https://cloudinary.com
- **Resend** — create free account at https://resend.com
- **VAPID keys** — generate with `npx web-push generate-vapid-keys`
- **NEXT_PUBLIC_APP_URL** — your local IP if testing from phone (e.g. `http://192.168.1.x:3000`)

### 3. Start Postgres + Redis
```bash
docker compose --profile dev up -d
```

### 4. Run database migrations + seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This creates the schema and seeds a demo user:
- **Email:** `demo@qr-sos.com`
- **Password:** `demo1234`

### 5. Start the dev server
```bash
npm run dev
```

App is live at **http://localhost:3000**

> **Testing from phone?** Set `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, and `AUTH_URL` in `.env.local` to your machine's local IP (e.g. `http://192.168.1.5:3000`), add that IP to `allowedDevOrigins` in `next.config.js`, then restart the dev server.

---

## Production Deployment — Docker Compose

### 1. Copy and configure env
```bash
cp .env.example .env
```

Set all values in `.env`, especially:
- `POSTGRES_PASSWORD` — strong password for the database
- `NEXTAUTH_URL` / `AUTH_URL` / `NEXT_PUBLIC_APP_URL` — your public domain
- Real Cloudinary, Resend, and Upstash credentials

### 2. Add TLS certificates
Place your SSL cert and key in `nginx/certs/`:
```
nginx/certs/cert.pem
nginx/certs/key.pem
```

### 3. Build and start
```bash
docker compose --profile prod up -d --build
```

### 4. Run migrations
```bash
docker exec qr-sos-app npx prisma migrate deploy
```

### 5. (Optional) Seed demo data
```bash
docker exec qr-sos-app npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copy the output to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<Public Key>
VAPID_PRIVATE_KEY=<Private Key>
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── (auth)/login|register/          # Auth pages
│   ├── (dashboard)/
│   │   ├── dashboard/                  # Main dashboard
│   │   ├── profile/                    # Profile editor
│   │   └── notifications/             # Alerts / notification feed
│   ├── scan/[qrCodeId]/               # Public QR scan page
│   └── api/
│       ├── auth/register/             # User registration
│       ├── auth/[...nextauth]/        # NextAuth handlers
│       ├── users/me/                  # Profile CRUD
│       ├── qr/sticker|image/         # QR code + SVG sticker
│       ├── scan/[qrCodeId]/          # Scan handler + notifications
│       ├── scanner/[userId]/         # Scanner profile lookup
│       ├── notifications/            # Notification feed + mark read
│       └── push/subscribe/           # Web Push subscription
├── components/
│   ├── landing/                       # Hero, HowItWorks, Features, CTA
│   ├── auth/                          # LoginForm, RegisterForm (multi-step)
│   ├── dashboard/                     # DashboardClient, Nav, Notifications
│   ├── scan/                          # ScanPageClient
│   ├── shared/                        # ScannerModal (portal, z-9999)
│   └── providers/                     # PushProvider (SW + polling + toasts)
└── lib/
    ├── auth.ts / auth.config.ts       # NextAuth (Node + Edge split)
    ├── prisma.ts                      # Prisma singleton
    ├── redis.ts                       # Redis + rate limiters
    ├── cloudinary.ts                  # Image upload
    ├── qr-generator.ts               # QR code + SVG sticker
    ├── notifications.ts              # Push + email sending
    └── utils.ts                      # Shared helpers
prisma/
├── schema.prisma                     # DB schema
└── seed.ts                          # Demo data
nginx/
├── nginx.conf                        # Production Nginx config
└── proxy_params.conf
```

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | Postgres password (Docker only) |
| `NEXTAUTH_URL` / `AUTH_URL` | Full URL of your app |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Secret for JWT signing |
| `CLOUDINARY_*` | Cloudinary credentials for profile images |
| `UPSTASH_REDIS_REST_URL` | Redis URL (localhost for dev, Upstash for prod) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token (`local-dev-token` for dev) |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `EMAIL_FROM` | From address for notification emails |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push |
| `VAPID_SUBJECT` | VAPID subject (mailto: URI) |
| `NEXT_PUBLIC_APP_URL` | Public URL for links in emails/notifications |

---

## 🔌 Local Development Webhook Setup (Paddle & Ngrok)

To securely receive and test Paddle payment events on your local development machine (`localhost:3000`), we use an isolated Ngrok edge tunnel.

### 1. Project-Isolated Tunnel Script (`tunnel.bat`)
To keep authentication keys out of the global operating system profile, we use a local environment script. Create a file named `tunnel.bat` in the project root directory (this file is already ignored in `.gitignore` so it will never be pushed to GitHub):

```bat
@echo off
:: Set the token strictly inside this temporary terminal session's memory
set NGROK_AUTHTOKEN=your_actual_token_here

:: Fire up the tunnel targeting the local Next.js port and permanent domain
npx ngrok http 3000 --url=contort-bankbook-endorphin.ngrok-free.dev
```

### 2. Running the Tunnel
Whenever you are developing or testing payment features, open a standard command prompt in the project root and run:
```cmd
tunnel
```
*Keep this window open while developing.* It safely maps your permanent development domain `https://contort-bankbook-endorphin.ngrok-free.dev` straight to your local Next.js server.

### 3. Sandbox Webhook Integration Mapping
Our Paddle Sandbox dashboard is configured to send automated notifications to your tunnel endpoint:
* **Target URL:** `https://contort-bankbook-endorphin.ngrok-free.dev/api/webhooks/paddle`
* **Subscribed Event Triggers:**
  - `transaction.completed` (Fired upon successful payment invoice capture)
  - `subscription.created` (Fired upon initial service provisioning)
  - `subscription.updated` (Fired upon subscription changes or cancellations)

### 4. Required Environment Variables
Ensure both `.env` and `.env.local` files contain all 5 verified operational keys:
```env
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_PRICE_ID="pri_your_price_id_here"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_your_client_token_here"
PADDLE_API_KEY="pdl_sdbx_apikey_your_key_here"
PADDLE_WEBHOOK_SECRET="ntfset_your_webhook_secret_here"
```

### 5. How to Retrieve Paddle Sandbox Credentials
1. **Paddle Environment (`NEXT_PUBLIC_PADDLE_ENVIRONMENT`):** Set this to `"sandbox"` for local testing.
2. **Client Token (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`):** 
   - Sign in to the [Paddle Sandbox Dashboard](https://sandbox-login.paddle.com/).
   - Navigate to **Developer Tools > Authentication**.
   - Generate a new client-side token (prefixed with `ptk_`).
3. **Price ID (`NEXT_PUBLIC_PADDLE_PRICE_ID`):**
   - Navigate to **Catalog > Products & Prices** in your Paddle Sandbox dashboard.
   - Create a one-time product (e.g. "QR-SOS Sticker Activation") and set its price to **$1.58 USD** (which covers the $1.00 sticker price plus the $0.58 processing fee surcharge).
   - Copy the generated price ID (prefixed with `pri_`).
4. **Secret API Key (`PADDLE_API_KEY`):**
   - Go to **Developer Tools > Authentication** in the dashboard.
   - Under **API Keys**, generate a new secret key (prefixed with `pdl_sdbx_`).
5. **Webhook Secret Key (`PADDLE_WEBHOOK_SECRET`):**
   - Go to **Developer Tools > Webhooks**.
   - Create a webhook destination pointing to your ngrok tunnel: `https://contort-bankbook-endorphin.ngrok-free.dev/api/webhooks/paddle`
   - Select the `transaction.completed` event.
   - Save to generate the webhook secret (prefixed with `pdl_ntfset_`).

---

## License

MIT — Built for life-saving. Use it.
