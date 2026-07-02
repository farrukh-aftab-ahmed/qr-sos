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

## License

MIT — Built for life-saving. Use it.
