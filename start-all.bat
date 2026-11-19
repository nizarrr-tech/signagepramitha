@echo off
title Digital Signage System - Launcher

echo ============================================
echo   Digital Signage ^& Antrian System
echo   Klinik Pramitha
echo ============================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js tidak ditemukan. Install dari https://nodejs.org
  pause & exit /b 1
)

echo Mematikan proses lama di port 3001, 3000, 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 " ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul

echo [1/3] Memulai Backend (port 3001)...
start "Signage Backend" cmd /k "cd /d "%~dp0backend" && npx nest build && node dist/main"

timeout /t 8 /nobreak >nul

echo [2/3] Memulai Frontend CMS (port 3000)...
start "Signage Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Memulai Web Player (port 3002)...
start "Signage Player" cmd /k "cd /d "%~dp0player" && node server.js"

timeout /t 6 /nobreak >nul

echo.
echo ============================================
echo   Semua service berjalan!
echo.
echo   Backend Dashboard : http://localhost:3001
echo   Admin CMS         : http://localhost:3000/admin
echo   Operator          : http://localhost:3000/operator
echo   Player            : http://localhost:3002?client=PRAMITHA
echo ============================================
echo.
echo Tekan tombol apa saja untuk membuka browser...
pause >nul

start "" "http://localhost:3001"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/admin"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/operator"
