#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

PORT="${PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-15173}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:$FRONTEND_PORT}"
BASE_PATH="${BASE_PATH:-/}"
DATABASE_URL="${DATABASE_URL:-postgres://eps:eps@localhost:5432/eps?sslmode=disable}"
JWT_SECRET="${JWT_SECRET:-dev-local-admin}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin1234}"
GOCACHE="${GOCACHE:-$ROOT_DIR/.cache/go-build}"

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    return
  fi

  echo "==> Stopping existing process on port $port: $pids"
  kill $pids 2>/dev/null || true

  for _ in {1..20}; do
    if ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return
    fi
    sleep 0.2
  done

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "==> Force stopping process on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
}

cleanup() {
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> Admin frontend: $FRONTEND_ORIGIN"
echo "==> Admin backend:  http://localhost:$PORT"
echo "==> Base path:      $BASE_PATH"
echo "==> Database URL:   $DATABASE_URL"
echo "==> Login:          $ADMIN_USERNAME / $ADMIN_PASSWORD"

stop_port "$PORT"
stop_port "$FRONTEND_PORT"

cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo "==> Installing frontend dependencies"
  npm install
fi

echo "==> Starting Vite"
VITE_BASE_PATH="$BASE_PATH" VITE_API_PROXY_TARGET="http://localhost:$PORT" npm run dev -- --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

echo "==> Starting Echo"
cd "$BACKEND_DIR"
PORT="$PORT" \
FRONTEND_ORIGIN="$FRONTEND_ORIGIN" \
DEV_FRONTEND_PROXY=true \
BASE_PATH="$BASE_PATH" \
DATABASE_URL="$DATABASE_URL" \
JWT_SECRET="$JWT_SECRET" \
ADMIN_USERNAME="$ADMIN_USERNAME" \
ADMIN_PASSWORD="$ADMIN_PASSWORD" \
GOCACHE="$GOCACHE" \
go run ./cmd
