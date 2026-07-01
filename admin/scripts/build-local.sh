#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIST_DIR="$BACKEND_DIR/internal/web/dist"
BIN_DIR="$BACKEND_DIR/bin"
GOCACHE_DIR="${GOCACHE:-$ROOT_DIR/.cache/go-build}"
BASE_PATH="${BASE_PATH:-/}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"

echo "==> Installing frontend dependencies"
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  npm install
fi

echo "==> Testing frontend"
npm test

echo "==> Building frontend"
VITE_BASE_PATH="$BASE_PATH" VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build

echo "==> Copying frontend dist into backend embed directory"
rm -rf "$WEB_DIST_DIR"
mkdir -p "$WEB_DIST_DIR"
cp -R "$FRONTEND_DIR/dist/." "$WEB_DIST_DIR/"

echo "==> Testing backend"
cd "$BACKEND_DIR"
GOCACHE="$GOCACHE_DIR" go test ./...

echo "==> Building backend binary"
mkdir -p "$BIN_DIR"
GOCACHE="$GOCACHE_DIR" go build -buildvcs=false -o "$BIN_DIR/eps-admin" ./cmd

echo "==> Restoring source placeholder for backend embed directory"
rm -rf "$WEB_DIST_DIR"
mkdir -p "$WEB_DIST_DIR"
printf '<div id="root">EPS Admin frontend has not been built yet.</div>\n' > "$WEB_DIST_DIR/index.html"
rm -f "$FRONTEND_DIR"/*.tsbuildinfo "$FRONTEND_DIR"/vite.config.js "$FRONTEND_DIR"/vite.config.d.ts

echo "==> Build complete: $BIN_DIR/eps-admin"
