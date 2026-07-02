# QR-SOS — Production Deployment Roadmap
## Google Cloud + qr-sos.online

---

## Architecture Overview

```
User → qr-sos.online (Namecheap DNS)
         ↓
    Google Cloud Load Balancer (HTTPS, SSL cert)
         ↓
    Cloud Run (Next.js Docker container)
         ↓
    Cloud SQL (PostgreSQL 16)   +   Upstash Redis (rate limiting)
         ↓
    Cloudinary (images)   +   Resend (emails)
```

**Why Cloud Run?**
- Pay only when requests are made (free tier: 2M requests/month)
- Auto-scales to zero when idle
- No server management
- Built-in HTTPS with Google-managed SSL
- Works directly with your existing Dockerfile

---

## Phase 1 — Code Changes

### 1.1 Update `nginx/nginx.conf` — change domain name

```nginx
# Line 70 — replace qr-sos.com with your actual domain
server_name qr-sos.online www.qr-sos.online;
```

### 1.2 Update `next.config.js` — remove dev-only settings

Remove `allowedDevOrigins` entirely (it's for local dev only — meaningless in production):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // ... rest stays the same
};
```

### 1.3 Create `.env.production` values (never commit this file)

```env
# Database — Cloud SQL (use Cloud SQL Auth Proxy socket in production)
DATABASE_URL="postgresql://qrsos:<PASSWORD>@/<DB_NAME>?host=/cloudsql/<PROJECT>:<REGION>:<INSTANCE>"

# NextAuth
NEXTAUTH_URL="https://qr-sos.online"
NEXTAUTH_SECRET="<generate: openssl rand -hex 32>"
AUTH_SECRET="<same as NEXTAUTH_SECRET>"
AUTH_URL="https://qr-sos.online"

# Cloudinary (real keys)
CLOUDINARY_CLOUD_NAME="your-real-cloud-name"
CLOUDINARY_API_KEY="your-real-api-key"
CLOUDINARY_API_SECRET="your-real-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-real-cloud-name"

# Upstash Redis (real keys — free tier at upstash.com)
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
REDIS_URL="rediss://default:<password>@your-db.upstash.io:6379"

# Resend (real key — free tier at resend.com)
RESEND_API_KEY="re_your_real_key"
EMAIL_FROM="noreply@qr-sos.online"

# VAPID (same keys as dev — don't regenerate or push subscriptions break)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BFcE2anvpi5Yzo1jKly8MOjkBnTnpRt4OoisgnVQmypliW7gerI3uUUv1D4rHhIhEyG-aq7zlSeEDvNPOjprWf4"
VAPID_PRIVATE_KEY="2bbKYDN0rq7R8zWc-FU3JNtNbbicMlKtHARPMZsJ0LU"
VAPID_SUBJECT="mailto:admin@qr-sos.online"

# App
NEXT_PUBLIC_APP_URL="https://qr-sos.online"
NEXT_PUBLIC_APP_NAME="QR-SOS"
```

### 1.4 Update `VAPID_SUBJECT` email

In your production env, change:
```
VAPID_SUBJECT="mailto:admin@qr-sos.online"
```

### 1.5 Commit all code changes before deploying

```bash
git add -A
git commit -m "Production config for qr-sos.online"
git push origin main
```

---

## Phase 2 — Google Cloud Setup

### 2.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **New Project** → name it `qr-sos` → **Create**
3. Note your **Project ID** (e.g. `qr-sos-123456`)
4. Enable billing (required for Cloud Run + Cloud SQL)

### 2.2 Install Google Cloud CLI

```bash
# Windows (PowerShell — run as admin)
winget install Google.CloudSDK

# Then authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2.3 Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

---

## Phase 3 — Database (Cloud SQL)

### 3.1 Create PostgreSQL instance

```bash
gcloud sql instances create qrsos-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --deletion-protection
```

> **Cost:** db-f1-micro ≈ $7–10/month. Cheapest option.

### 3.2 Create database and user

```bash
# Create database
gcloud sql databases create qrsos --instance=qrsos-db

# Create user (replace <PASSWORD> with a strong password)
gcloud sql users create qrsos \
  --instance=qrsos-db \
  --password=<PASSWORD>
```

### 3.3 Note your connection name

```bash
gcloud sql instances describe qrsos-db --format="value(connectionName)"
# Output: YOUR_PROJECT_ID:us-central1:qrsos-db
```

You'll use this in `DATABASE_URL`:
```
DATABASE_URL="postgresql://qrsos:<PASSWORD>@/qrsos?host=/cloudsql/YOUR_PROJECT_ID:us-central1:qrsos-db"
```

---

## Phase 4 — Redis (Upstash — Free Tier)

Cloud Memorystore is expensive ($50+/month). Use **Upstash** instead — free up to 10,000 requests/day.

1. Go to [upstash.com](https://upstash.com) → **Create Database**
2. Name: `qrsos-redis` | Region: `US-East-1` (or closest to your Cloud Run region) | Type: **Redis**
3. Copy the **REST URL** and **REST Token** → add to your env vars
4. Copy the **Redis URL** (starts with `rediss://`) → set as `REDIS_URL`

---

## Phase 5 — Container Registry

### 5.1 Create Artifact Registry repository

```bash
gcloud artifacts repositories create qrsos \
  --repository-format=docker \
  --location=us-central1 \
  --description="QR-SOS container images"
```

### 5.2 Build and push Docker image

```bash
# Authenticate Docker with Google Cloud
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build image (run from project root)
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/qrsos/app:latest .

# Push to registry
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/qrsos/app:latest
```

> **Alternative:** Use Cloud Build to build remotely (no local Docker needed):
> ```bash
> gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/qrsos/app:latest
> ```

---

## Phase 6 — Secret Manager (Store Environment Variables)

Never pass secrets as plain env vars in Cloud Run. Use Secret Manager:

```bash
# Create secrets for sensitive values
echo -n "your-auth-secret" | gcloud secrets create AUTH_SECRET --data-file=-
echo -n "your-db-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-cloudinary-secret" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
echo -n "your-resend-key" | gcloud secrets create RESEND_API_KEY --data-file=-
echo -n "your-upstash-token" | gcloud secrets create UPSTASH_REDIS_REST_TOKEN --data-file=-
echo -n "your-vapid-private" | gcloud secrets create VAPID_PRIVATE_KEY --data-file=-
```

Grant Cloud Run access to secrets:
```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Phase 7 — Deploy to Cloud Run

```bash
gcloud run deploy qr-sos \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/qrsos/app:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:qrsos-db \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NEXTAUTH_URL=https://qr-sos.online,AUTH_URL=https://qr-sos.online,NEXT_PUBLIC_APP_URL=https://qr-sos.online,NEXT_PUBLIC_APP_NAME=QR-SOS,EMAIL_FROM=noreply@qr-sos.online,VAPID_SUBJECT=mailto:admin@qr-sos.online,NEXT_PUBLIC_VAPID_PUBLIC_KEY=BFcE2anvpi5Yzo1jKly8MOjkBnTnpRt4OoisgnVQmypliW7gerI3uUUv1D4rHhIhEyG-aq7zlSeEDvNPOjprWf4,CLOUDINARY_CLOUD_NAME=your-cloud-name,CLOUDINARY_API_KEY=your-api-key,NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name,UPSTASH_REDIS_REST_URL=https://your-db.upstash.io,REDIS_URL=rediss://default:password@your-db.upstash.io:6379,NEXTAUTH_SECRET=$(openssl rand -hex 32)" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,VAPID_PRIVATE_KEY=VAPID_PRIVATE_KEY:latest"
```

After deploy, Cloud Run gives you a URL like:
```
https://qr-sos-xxxxxxxxxx-uc.a.run.app
```

Test it works before connecting your domain.

---

## Phase 8 — Run Database Migrations

```bash
# Install Cloud SQL Auth Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.windows.amd64.exe

# In one terminal — start proxy
./cloud-sql-proxy YOUR_PROJECT_ID:us-central1:qrsos-db --port=5433

# In another terminal — run migrations
DATABASE_URL="postgresql://qrsos:<PASSWORD>@localhost:5433/qrsos" npx prisma migrate deploy

# Optional: seed demo data
DATABASE_URL="postgresql://qrsos:<PASSWORD>@localhost:5433/qrsos" npx prisma db seed
```

---

## Phase 9 — Custom Domain + SSL

### 9.1 Map domain to Cloud Run

```bash
gcloud run domain-mappings create \
  --service=qr-sos \
  --domain=qr-sos.online \
  --region=us-central1

# Also map www subdomain
gcloud run domain-mappings create \
  --service=qr-sos \
  --domain=www.qr-sos.online \
  --region=us-central1
```

### 9.2 Get the DNS records

```bash
gcloud run domain-mappings describe \
  --domain=qr-sos.online \
  --region=us-central1
```

This outputs DNS records you need to add in Namecheap. Example output:
```
resourceRecords:
  - name: qr-sos.online
    rrdata: 216.239.32.21
    type: A
  - name: qr-sos.online
    rrdata: 216.239.34.21
    type: A
  - name: qr-sos.online
    rrdata: 216.239.36.21
    type: A
  - name: qr-sos.online
    rrdata: 216.239.38.21
    type: A
  - name: www.qr-sos.online
    rrdata: ghs.googlehosted.com.
    type: CNAME
```

### 9.3 Configure DNS in Namecheap

1. Log in to [namecheap.com](https://namecheap.com) → **Domain List** → **Manage** next to `qr-sos.online`
2. Click **Advanced DNS** tab
3. Delete any existing A records and CNAME for `www`
4. Add the records from step 9.2:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 216.239.32.21 | Automatic |
| A | @ | 216.239.34.21 | Automatic |
| A | @ | 216.239.36.21 | Automatic |
| A | @ | 216.239.38.21 | Automatic |
| CNAME | www | ghs.googlehosted.com. | Automatic |

5. Wait 15–60 minutes for DNS to propagate

> Google Cloud Run automatically provisions and renews the SSL certificate once DNS resolves. No manual cert setup needed.

### 9.4 Verify SSL is active

```bash
gcloud run domain-mappings describe \
  --domain=qr-sos.online \
  --region=us-central1 \
  --format="value(status.conditions)"
```

When `CertificateProvisioned` shows `True`, your site is live at `https://qr-sos.online`.

---

## Phase 10 — Email Domain Verification (Resend)

To send emails from `noreply@qr-sos.online` (instead of a shared Resend domain):

1. Go to [resend.com](https://resend.com) → **Domains** → **Add Domain** → type `qr-sos.online`
2. Resend gives you DNS records to add in Namecheap (SPF, DKIM, DMARC):

| Type | Host | Value |
|------|------|-------|
| TXT | @ | `v=spf1 include:amazonses.com ~all` |
| TXT | resend._domainkey | `p=MIIBIjAN...` (your DKIM key) |
| TXT | _dmarc | `v=DMARC1; p=none;` |

3. Add these in Namecheap → **Advanced DNS** → same place as step 9.3
4. Click **Verify** in Resend — takes 5–10 minutes

---

## Phase 11 — Continuous Deployment (Auto-deploy on git push)

### 11.1 Connect GitHub to Cloud Build

```bash
# Enable Cloud Build trigger
gcloud builds triggers create github \
  --repo-name=qr-sos \
  --repo-owner=farrukh-aftab-ahmed \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml
```

### 11.2 Create `cloudbuild.yaml` in project root

```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - us-central1-docker.pkg.dev/$PROJECT_ID/qrsos/app:$COMMIT_SHA
      - -t
      - us-central1-docker.pkg.dev/$PROJECT_ID/qrsos/app:latest
      - .

  # Push image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - push
      - --all-tags
      - us-central1-docker.pkg.dev/$PROJECT_ID/qrsos/app

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - qr-sos
      - --image=us-central1-docker.pkg.dev/$PROJECT_ID/qrsos/app:$COMMIT_SHA
      - --region=us-central1
      - --platform=managed

images:
  - us-central1-docker.pkg.dev/$PROJECT_ID/qrsos/app:$COMMIT_SHA
  - us-central1-docker.pkg.dev/$PROJECT_ID/qrsos/app:latest
```

After this, every `git push origin main` automatically builds and deploys.

---

## Summary Checklist

### Code Changes
- [ ] `nginx/nginx.conf` — update `server_name` to `qr-sos.online`
- [ ] `next.config.js` — remove `allowedDevOrigins`
- [ ] Create `cloudbuild.yaml` for CI/CD

### Third-party Accounts
- [ ] [Cloudinary](https://cloudinary.com) — create account, get real API keys
- [ ] [Resend](https://resend.com) — create account, get API key, verify `qr-sos.online` domain
- [ ] [Upstash](https://upstash.com) — create Redis database, get REST URL + token

### Google Cloud
- [ ] Create GCP project
- [ ] Enable APIs (Cloud Run, Cloud SQL, Artifact Registry, Secret Manager)
- [ ] Create Cloud SQL PostgreSQL instance (`qrsos-db`)
- [ ] Create database `qrsos` and user `qrsos`
- [ ] Create Artifact Registry repository
- [ ] Store secrets in Secret Manager
- [ ] Build and push Docker image
- [ ] Deploy to Cloud Run
- [ ] Run `prisma migrate deploy` via Cloud SQL Auth Proxy

### Domain & DNS
- [ ] Add A records in Namecheap pointing to Google Cloud IPs
- [ ] Add `www` CNAME record
- [ ] Wait for SSL certificate to provision (15–60 min)
- [ ] Add Resend DNS records for email sending
- [ ] Verify `https://qr-sos.online` is live

### CI/CD (Optional)
- [ ] Create `cloudbuild.yaml`
- [ ] Connect GitHub repo to Cloud Build trigger
- [ ] Test auto-deploy on push to `main`

---

## Estimated Monthly Cost

| Service | Plan | Cost |
|---------|------|------|
| Cloud Run | ~100k requests/month | Free |
| Cloud SQL (db-f1-micro) | Always on | ~$9/month |
| Artifact Registry | <1GB storage | ~$0.10/month |
| Upstash Redis | Free tier | Free |
| Resend | 100 emails/day | Free |
| Cloudinary | 25GB storage | Free |
| **Total** | | **~$10/month** |

> Scale Cloud SQL to `db-g1-small` ($25/month) if you need more performance.

---

## Local Dev (unchanged)

Local development workflow stays exactly the same:

```bash
docker compose --profile dev up -d   # postgres + redis
npm run dev                           # http://localhost:3000
```

The production env vars only live in Google Cloud Secret Manager — never in the repo.
