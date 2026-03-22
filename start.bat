@echo off
echo ========================================
echo    WebShell Blog - Starting Server
echo ========================================
echo.

cd /d %~dp0server
echo Starting Go WebSocket server on :8080...
start "WebSocket Server" cmd /k "go run cmd/main.go"

timeout /t 2 /nobreak >nul

cd /d %~dp0server
echo Starting Image server on :8081...
start "Image Server" cmd /k "go run cmd/image-server.go"

cd /d %~dp0web
echo Starting static file server on :3000...
start "Static Server" cmd /k "npx serve -l 3000"

echo.
echo ========================================
echo    Servers started!
echo ========================================
echo.
echo  - WebSocket Server: http://localhost:8080
echo  - Image Server:     http://localhost:8081
echo  - Static Server:    http://localhost:3000
echo.
echo  Open http://localhost:3000 in your browser
echo.
pause
