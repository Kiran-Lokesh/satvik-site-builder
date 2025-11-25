#!/bin/bash
set -e

echo "=========================================="
echo "🚀 SERVE WRAPPER SCRIPT"
echo "=========================================="
echo "📁 Current directory: $(pwd)"
echo "👤 User: $(whoami)"
echo "🔧 PORT: ${PORT:-10000}"
echo ""

echo "📂 Listing current directory:"
ls -la
echo ""

if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist directory not found!"
  echo "📁 Current directory: $(pwd)"
  echo "📂 Contents:"
  ls -la
  exit 1
fi

echo "✅ dist directory exists"
echo "📊 Files in dist: $(ls -1 dist | wc -l)"
echo ""

echo "📂 Contents of dist:"
ls -la dist/ | head -20
echo ""

if [ ! -f "dist/index.html" ]; then
  echo "❌ WARNING: index.html not found in dist!"
  echo "📂 All files in dist:"
  find dist -type f
  echo ""
fi

echo "🚀 Starting serve..."
echo "Command: npx serve -s dist -l ${PORT:-10000}"
echo "=========================================="
echo ""

exec npx serve -s dist -l ${PORT:-10000}

