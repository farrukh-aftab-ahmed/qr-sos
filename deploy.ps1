# ============================================================
# QR-SOS — Google Cloud Deployment Script
# Run this in PowerShell as Administrator
# Execute each STEP one at a time — read the output before continuing
# ============================================================

# ─── CONFIGURATION — fill these in before running ────────────────────────────
$PROJECT_ID      = "qr-sos-prod"          # your GCP project ID (must be globally unique)
$REGION          = "us-central1"
$REPO            = "qrsos"
$SERVICE         = "qr-sos"
$DB_INSTANCE     = "qrsos-db"
$DB_NAME         = "qrsos"
$DB_USER         = "qrsos"
$DB_PASSWORD     = "ChangeMe123!"         # change to a strong password
$GCS_BUCKET      = "qr-sos-images-prod"  # must be globally unique

# Credentials you get from third-party free-tier accounts:
$RESEND_API_KEY         = "re_your_key_here"
$UPSTASH_REST_URL       = "https://your-db.upstash.io"
$UPSTASH_REST_TOKEN     = "your-upstash-token"
$REDIS_URL              = "rediss://default:password@your-db.upstash.io:6379"
$NEXTAUTH_SECRET        = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# ─── STEP 1 — Login & project ────────────────────────────────────────────────
Write-Host "`n[STEP 1] Login to Google Cloud" -ForegroundColor Cyan
gcloud auth login
gcloud projects create $PROJECT_ID --name="QR-SOS"
gcloud config set project $PROJECT_ID
Write-Host "Open https://console.cloud.google.com/billing and link a billing account to project: $PROJECT_ID" -ForegroundColor Yellow
Read-Host "Press ENTER after billing is linked"

# ─── STEP 2 — Enable APIs ────────────────────────────────────────────────────
Write-Host "`n[STEP 2] Enabling required APIs..." -ForegroundColor Cyan
gcloud services enable `
  run.googleapis.com `
  sqladmin.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  secretmanager.googleapis.com `
  storage.googleapis.com
Write-Host "APIs enabled." -ForegroundColor Green

# ─── STEP 3 — Cloud SQL ──────────────────────────────────────────────────────
Write-Host "`n[STEP 3] Creating Cloud SQL PostgreSQL instance (takes ~5 min)..." -ForegroundColor Cyan
gcloud sql instances create $DB_INSTANCE `
  --database-version=POSTGRES_16 `
  --tier=db-f1-micro `
  --region=$REGION `
  --storage-size=10GB `
  --storage-auto-increase `
  --backup-start-time=03:00 `
  --deletion-protection

gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password=$DB_PASSWORD

$CONNECTION_NAME = (gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
Write-Host "Cloud SQL ready. Connection name: $CONNECTION_NAME" -ForegroundColor Green

$DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# ─── STEP 4 — Cloud Storage bucket ───────────────────────────────────────────
Write-Host "`n[STEP 4] Creating Cloud Storage bucket for images..." -ForegroundColor Cyan
gcloud storage buckets create gs://$GCS_BUCKET --location=$REGION
gcloud storage buckets update gs://$GCS_BUCKET --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://$GCS_BUCKET `
  --member=allUsers --role=roles/storage.objectViewer
Write-Host "Bucket ready: gs://$GCS_BUCKET" -ForegroundColor Green

# ─── STEP 5 — Artifact Registry ──────────────────────────────────────────────
Write-Host "`n[STEP 5] Creating Artifact Registry..." -ForegroundColor Cyan
gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
Write-Host "Registry ready." -ForegroundColor Green

# ─── STEP 6 — Build & push Docker image ──────────────────────────────────────
Write-Host "`n[STEP 6] Building Docker image (this takes a few minutes)..." -ForegroundColor Cyan
$IMAGE = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/app:latest"
Set-Location $PSScriptRoot
docker build -t $IMAGE .
docker push $IMAGE
Write-Host "Image pushed: $IMAGE" -ForegroundColor Green

# ─── STEP 7 — Secret Manager ─────────────────────────────────────────────────
Write-Host "`n[STEP 7] Storing secrets in Secret Manager..." -ForegroundColor Cyan

$secrets = @{
  "DATABASE_URL"             = $DATABASE_URL
  "AUTH_SECRET"              = $NEXTAUTH_SECRET
  "RESEND_API_KEY"           = $RESEND_API_KEY
  "UPSTASH_REDIS_REST_TOKEN" = $UPSTASH_REST_TOKEN
  "VAPID_PRIVATE_KEY"        = "2bbKYDN0rq7R8zWc-FU3JNtNbbicMlKtHARPMZsJ0LU"
}

foreach ($name in $secrets.Keys) {
  $value = $secrets[$name]
  Write-Output $value | gcloud secrets create $name --data-file=- 2>$null
  if (-not $?) {
    Write-Output $value | gcloud secrets versions add $name --data-file=-
  }
}
Write-Host "Secrets stored." -ForegroundColor Green

# ─── STEP 8 — Grant Cloud Run access to secrets ──────────────────────────────
Write-Host "`n[STEP 8] Granting permissions..." -ForegroundColor Cyan
$PROJECT_NUMBER = (gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
$SA = "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${SA}" `
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${SA}" `
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${SA}" `
  --role="roles/storage.objectAdmin"

Write-Host "Permissions granted." -ForegroundColor Green

# ─── STEP 9 — Deploy to Cloud Run ────────────────────────────────────────────
Write-Host "`n[STEP 9] Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE `
  --image=$IMAGE `
  --region=$REGION `
  --platform=managed `
  --allow-unauthenticated `
  --port=3000 `
  --memory=512Mi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=10 `
  --add-cloudsql-instances=$CONNECTION_NAME `
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NEXTAUTH_URL=https://qr-sos.online,AUTH_URL=https://qr-sos.online,NEXT_PUBLIC_APP_URL=https://qr-sos.online,NEXT_PUBLIC_APP_NAME=QR-SOS,EMAIL_FROM=noreply@qr-sos.online,VAPID_SUBJECT=mailto:admin@qr-sos.online,NEXT_PUBLIC_VAPID_PUBLIC_KEY=BFcE2anvpi5Yzo1jKly8MOjkBnTnpRt4OoisgnVQmypliW7gerI3uUUv1D4rHhIhEyG-aq7zlSeEDvNPOjprWf4,GCS_BUCKET_NAME=${GCS_BUCKET},UPSTASH_REDIS_REST_URL=${UPSTASH_REST_URL},REDIS_URL=${REDIS_URL},NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" `
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,VAPID_PRIVATE_KEY=VAPID_PRIVATE_KEY:latest"

$CLOUD_RUN_URL = (gcloud run services describe $SERVICE --region=$REGION --format="value(status.url)")
Write-Host "Deployed! Test URL: $CLOUD_RUN_URL" -ForegroundColor Green

# ─── STEP 10 — Run database migrations ───────────────────────────────────────
Write-Host "`n[STEP 10] Running database migrations..." -ForegroundColor Cyan
Write-Host "Download Cloud SQL Auth Proxy:" -ForegroundColor Yellow
Write-Host "  https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.windows.amd64.exe"
Write-Host "Save it as cloud-sql-proxy.exe in this folder, then run these in TWO separate terminals:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1:  .\cloud-sql-proxy.exe ${CONNECTION_NAME} --port=5433" -ForegroundColor White
Write-Host "  Terminal 2:  `$env:DATABASE_URL='postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5433/${DB_NAME}'; npx prisma migrate deploy" -ForegroundColor White
Read-Host "`nPress ENTER once migrations are done"

# ─── STEP 11 — Map custom domain ─────────────────────────────────────────────
Write-Host "`n[STEP 11] Mapping qr-sos.online domain..." -ForegroundColor Cyan
gcloud run domain-mappings create --service=$SERVICE --domain=qr-sos.online --region=$REGION
gcloud run domain-mappings create --service=$SERVICE --domain=www.qr-sos.online --region=$REGION

Write-Host "`nDNS records to add in Namecheap (Advanced DNS tab):" -ForegroundColor Yellow
gcloud run domain-mappings describe --domain=qr-sos.online --region=$REGION --format="table(status.resourceRecords[].type,status.resourceRecords[].name,status.resourceRecords[].rrdata)"

Write-Host "`n[DONE] Add those DNS records in Namecheap then wait 15-30 min for SSL to provision." -ForegroundColor Green
Write-Host "Your site will be live at: https://qr-sos.online" -ForegroundColor Green

# ─── STEP 12 — Connect GitHub for auto-deploy ────────────────────────────────
Write-Host "`n[STEP 12] Set up auto-deploy from GitHub..." -ForegroundColor Cyan
Write-Host "Go to: https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID" -ForegroundColor Yellow
Write-Host "Click 'Connect Repository' -> GitHub -> select farrukh-aftab-ahmed/qr-sos-gcp" -ForegroundColor Yellow
Write-Host "Trigger: push to main branch, use cloudbuild.yaml" -ForegroundColor Yellow
