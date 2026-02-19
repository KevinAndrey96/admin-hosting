#!/bin/bash
# Creates a ZIP for deployment on cPanel (admin folder).
# Usage: ./create-deploy-zip.sh
# Requires: npm run build already run ( .next/standalone and .next/static must exist).

set -e
cd "$(dirname "$0")"

echo "Checking build..."
if [ ! -f ".next/standalone/server.js" ]; then
  echo "✗ Missing .next/standalone/server.js - run first: npm run build"
  exit 1
fi
if [ ! -d ".next/standalone/.next/static" ]; then
  echo "✗ Missing .next/standalone/.next/static - run first: npm run build"
  exit 1
fi
echo "✓ Build OK"

echo ""
echo "Checking environment variables..."
ENV_FILE=""
if [ -f ".env.local" ]; then
  ENV_FILE=".env.local"
  echo "✓ .env.local found - will be included in the ZIP"
elif [ -f ".env" ]; then
  ENV_FILE=".env"
  echo "✓ .env found - will be included in the ZIP"
fi

if [ -z "$ENV_FILE" ]; then
  echo "⚠️  WARNING: No .env.local or .env found"
  echo "   The app will NOT work without DATABASE_URL and other variables."
  echo "   You can:"
  echo "   1. Create .env.local (copy from .env.local.example or cp .env .env.local)"
  echo "   2. Or set the variables manually in cPanel after deploy"
  echo ""
  read -p "Continue without env file? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploy cancelled. Create .env or .env.local and run the script again."
    exit 1
  fi
  INCLUDE_ENV=false
else
  INCLUDE_ENV=true
fi

# Remove previous deployment ZIPs
if ls admin-deploy-*.zip 1>/dev/null 2>&1; then
  echo "Removing previous builds..."
  rm -f admin-deploy-*.zip
  echo "✓ Done"
fi

ZIP_NAME="admin-deploy-$(date +%Y%m%d-%H%M%S).zip"
echo ""
echo "Creating $ZIP_NAME ..."

# Include everything needed. Do NOT include node_modules (CloudLinux uses virtual env).
if [ "$INCLUDE_ENV" = true ]; then
  zip -r "$ZIP_NAME" \
    .htaccess \
    "$ENV_FILE" \
    package.json \
    start-server.js \
    next.config.js \
    tsconfig.json \
    .next/standalone \
    app \
    lib \
    prisma \
    types \
    public \
    -x "*.DS_Store" \
    -x "node_modules/*" \
    -x ".next/cache/*"
else
  zip -r "$ZIP_NAME" \
    .htaccess \
    package.json \
    start-server.js \
    next.config.js \
    tsconfig.json \
    .next/standalone \
    app \
    lib \
    prisma \
    types \
    public \
    -x "*.DS_Store" \
    -x "node_modules/*" \
    -x ".next/cache/*"
fi

echo ""
echo "   - .htaccess"
if [ "$INCLUDE_ENV" = true ]; then
  echo "   - $ENV_FILE (environment variables)"
fi
echo "   - package.json, start-server.js, next.config.js, tsconfig.json"
echo "   - .next/standalone (includes static + public)"
echo "   - app/, lib/, prisma/, types/, public/"
echo ""
if [ "$INCLUDE_ENV" = true ]; then
  echo "✅ ZIP includes $ENV_FILE - App will work automatically"
  echo ""
fi
echo "📤 Next step: Upload $ZIP_NAME to cPanel in the admin folder and extract it."
echo "   Then: Setup Node.js App → Run NPM Install → Restart App"
echo ""
