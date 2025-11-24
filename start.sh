#!/bin/bash
set -e

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found!"
  echo "📁 Current directory: $(pwd)"
  echo "📂 Contents:"
  ls -la
  echo ""
  echo "💡 The build may have failed. Please check the build logs."
  exit 1
fi

# Check if dist has any files
if [ -z "$(ls -A dist)" ]; then
  echo "❌ Error: dist directory is empty!"
  echo "💡 The build may have completed but produced no output."
  exit 1
fi

echo "✅ dist directory found with $(ls -1 dist | wc -l) files"
echo "📂 Contents of dist:"
ls -la dist/ | head -20
echo ""
echo "🚀 Starting serve on port ${PORT:-10000}..."

# Start serve with single-page app mode
exec serve -s dist -l ${PORT:-10000}

