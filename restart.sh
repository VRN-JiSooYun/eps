#!/bin/bash

# Local development startup script

kill_port() {
    PORT=$1
    PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "Stopping process on port $PORT..."
        kill $PIDS 2>/dev/null || true
    fi
}

cleanup() {
    echo ""
    echo "Stopping all processes..."
    killall -9 eps-backend 2>/dev/null || true
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

kill_port 8080
kill_port 5173

echo "Starting backend..."
(cd backend && go build -o ./bin/eps-backend ./cmd/main.go) || { echo "backend build failed!"; exit 1; }
(cd backend && DEV_FRONTEND_PROXY=true ./bin/eps-backend) &
BACKEND_PID=$!

echo "Installing frontend dependencies..."
(cd frontend && npm install) || { echo "npm install failed!"; kill $BACKEND_PID; exit 1; }

echo "Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop."

wait $BACKEND_PID $FRONTEND_PID
