#!/bin/bash
# Don't use set -e initially so we can capture errors
set +e

echo "=========================================="
echo "🔨 BUILD SCRIPT STARTING"
echo "=========================================="
echo "📁 Current directory: $(pwd)"
echo "📅 Time: $(date)"
echo ""

echo "📦 Step 1: Installing dependencies..."
# Use npm install instead of npm ci to handle lock file mismatches
NODE_ENV=development npm install
NPM_INSTALL_EXIT=$?
if [ $NPM_INSTALL_EXIT -ne 0 ]; then
  echo "❌ npm install failed with exit code $NPM_INSTALL_EXIT!"
  exit 1
fi

echo ""
echo "✅ Dependencies installed"
echo ""

echo "🔨 Step 2: Building application..."
echo "Environment variables check:"
echo "  VITE_ENVIRONMENT=${VITE_ENVIRONMENT:-❌ NOT SET}"
echo "  VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL:-❌ NOT SET}"
echo "  VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY:+✅ SET}${VITE_FIREBASE_API_KEY:-❌ NOT SET}"
echo "  VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN:+✅ SET}${VITE_FIREBASE_AUTH_DOMAIN:-❌ NOT SET}"
echo "  VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID:+✅ SET}${VITE_FIREBASE_PROJECT_ID:-❌ NOT SET}"
echo ""

if [ -z "$VITE_FIREBASE_API_KEY" ]; then
  echo "⚠️  WARNING: VITE_FIREBASE_API_KEY is not set. Build may fail."
fi

echo "Running: VITE_ENVIRONMENT=test npm run build"
echo "----------------------------------------"
VITE_ENVIRONMENT=test npm run build 2>&1
BUILD_EXIT=$?
echo "----------------------------------------"
echo "Build command exited with code: $BUILD_EXIT"
echo ""

if [ $BUILD_EXIT -ne 0 ]; then
  echo ""
  echo "❌ BUILD FAILED with exit code $BUILD_EXIT!"
  echo ""
  echo "Common issues:"
  echo "  - Missing VITE_FIREBASE_* environment variables"
  echo "  - TypeScript compilation errors"
  echo "  - Missing dependencies"
  echo "  - Build errors in source code"
  echo ""
  echo "Check the error messages above for details."
  exit 1
fi

echo ""
echo "✅ Build command completed"
echo ""

echo "🔍 Step 3: Verifying build output..."
if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist directory not created!"
  echo "📂 Current directory contents:"
  ls -la
  echo ""
  echo "💡 Build may have failed silently. Check for errors above."
  exit 1
fi

echo "✅ dist directory exists"
echo ""

FILE_COUNT=$(ls -1 dist | wc -l)
echo "📊 Files in dist: $FILE_COUNT"
echo ""

echo "📂 Contents of dist:"
ls -la dist/ | head -20
echo ""

if [ ! -f "dist/index.html" ]; then
  echo "❌ ERROR: index.html not found in dist!"
  echo "📂 All files in dist:"
  find dist -type f | head -20
  exit 1
fi

echo "✅ index.html found"
echo "✅ Build verification complete!"
echo "=========================================="

