#!/bin/bash

# CS:GO Match Viewer - Start Script
# Starts both backend API and frontend servers

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting CS:GO Match Viewer..."
echo ""

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "Starting backend server..."
cd "$SCRIPT_DIR/server"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd "$SCRIPT_DIR/client"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo "=========================================="
echo "  CS:GO Match Viewer is running!"
echo "=========================================="
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  API:       http://localhost:3001/api/match"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "=========================================="
echo ""

# Handle shutdown
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
