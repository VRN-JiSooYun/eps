#!/bin/bash

# Local development startup script

cleanup() {
    echo ""
    echo "Stopping all processes..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting backend..."
(cd backend && DEV_FRONTEND_PROXY=true go run ./cmd/main.go) &
BACKEND_PID=$!

echo "Installing frontend dependencies..."
(cd frontend && npm install) || { echo "npm install failed!"; kill $BACKEND_PID; exit 1; }

echo "Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop."

wait $BACKEND_PID $FRONTEND_PID
