#!/bin/bash

echo "========================================"
echo "   WebShell Blog - Starting Server"
echo "========================================"
echo ""

cd "$(dirname "$0")/server"

echo "Starting Go WebSocket server on :8080..."
go run cmd/main.go &
SERVER_PID=$!

sleep 2

echo "Starting Image server on :8081..."
go run cmd/image-server.go &
IMAGE_PID=$!

cd "$(dirname "$0")/web"

echo "Starting static file server on :3000..."
npx serve -l 3000 &
STATIC_PID=$!

echo ""
echo "========================================"
echo "   Servers started!"
echo "========================================"
echo ""
echo " - WebSocket Server: http://localhost:8080"
echo " - Image Server:     http://localhost:8081"
echo " - Static Server:    http://localhost:3000"
echo ""
echo " Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

trap "kill $SERVER_PID $IMAGE_PID $STATIC_PID 2>/dev/null" EXIT

wait
