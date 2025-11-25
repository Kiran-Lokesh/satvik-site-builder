#!/bin/bash
set -e

echo "=========================================="
echo "🚀 START SCRIPT EXECUTING"
echo "=========================================="
echo "📁 Current directory: $(pwd)"
echo "👤 User: $(whoami)"
echo "🔧 PORT: ${PORT:-10000}"
echo ""

echo "📂 Listing current directory contents:"
ls -la
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist directory not found!"
  echo "📁 Current directory: $(pwd)"
  echo "📂 Contents of current directory:"
  ls -la
  echo ""
  echo "💡 The build may have failed. Please check the build logs."
  exit 1
fi

echo "✅ dist directory exists"
echo ""

# Check if dist has any files
if [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo "❌ ERROR: dist directory is empty!"
  echo "📂 Contents of dist (should show files):"
  ls -la dist/ || echo "Cannot list dist directory"
  echo ""
  echo "💡 The build may have completed but produced no output."
  exit 1
fi

echo "✅ dist directory has files"
FILE_COUNT=$(ls -1 dist | wc -l)
echo "📊 File count in dist: $FILE_COUNT"
echo ""

echo "📂 Contents of dist directory:"
ls -la dist/ | head -30
echo ""

echo "🔍 Checking for index.html:"
if [ -f "dist/index.html" ]; then
  echo "✅ index.html found"
  echo "📄 First few lines of index.html:"
  head -5 dist/index.html
else
  echo "❌ index.html NOT FOUND!"
  echo "📂 Files in dist:"
  find dist -type f | head -20
fi
echo ""

echo "🚀 Starting serve on port ${PORT:-10000}..."
echo "Command: serve -s dist -l ${PORT:-10000}"
echo "=========================================="
echo ""

# Start serve with single-page app mode
exec serve -s dist -l ${PORT:-10000}

