@echo off
title Digital Signage - Setup

echo ============================================
echo   Digital Signage ^& Antrian System
echo   Setup Installer
echo ============================================
echo.

REM Cek Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js tidak ditemukan!
  echo Silakan install dari: https://nodejs.org
  pause & exit /b 1
)
echo [OK] Node.js: 
node --version

echo.
echo Pilih jenis database:
echo   [1] MySQL via XAMPP  (phpMyAdmin) - DISARANKAN
echo   [2] SQLite           (file lokal, tidak perlu XAMPP)
echo.
set /p DB_CHOICE="Pilihan (1/2): "

if "%DB_CHOICE%"=="1" (
  echo.
  echo Menggunakan MySQL (XAMPP + phpMyAdmin)...
  call setup-mysql.bat
  goto END
)

REM SQLite setup
echo.
echo Menggunakan SQLite...

REM Ganti schema ke SQLite
echo Mengatur schema SQLite...
(
echo generator client {
echo   provider = "prisma-client-js"
echo }
echo.
echo datasource db {
echo   provider = "sqlite"
echo   url      = "file:./signage.db"
echo }
) > "d:\SIGNAGE ANTRIAN\backend\prisma\schema_sqlite.tmp"

REM Update .env untuk SQLite
echo DATABASE_URL="file:./prisma/signage.db" > "d:\SIGNAGE ANTRIAN\backend\.env"
echo PORT=3001 >> "d:\SIGNAGE ANTRIAN\backend\.env"

echo.
echo [1/3] Install backend...
cd /d "d:\SIGNAGE ANTRIAN\backend"
call npm install
call npx prisma generate
call npx prisma db push
call npx ts-node src/seed.ts

echo.
echo [2/3] Install frontend...
cd /d "d:\SIGNAGE ANTRIAN\frontend"
call npm install --legacy-peer-deps

echo.
echo [3/3] Selesai!

:END
echo.
echo ============================================
echo   Jalankan: start-all.bat
echo ============================================
pause
