#!/bin/bash
set -euo pipefail

echo "🚀 QR-SOS Deploy Script"
echo "========================"

# Check required env vars
required_vars=(
  DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL
  CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET
  UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN
  RESEND_API_KEY NEXT_PUBLIC_VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Missing required env var: $var"
    exit 1
  fi
done
echo "✅ Environment variables verified"

# Run DB migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete"

# Build
echo "🔨 Building application..."
npm run build
echo "✅ Build complete"

echo ""
echo "🎉 Deploy ready. Start with: npm start"
echo "   Or with Docker: docker-compose up -d"
