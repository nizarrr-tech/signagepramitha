@echo off
title Signage - Ngrok Tunnel

echo ============================================
echo   Digital Signage - Ngrok Tunnel Setup
echo ============================================
echo.

REM Cek ngrok sudah terinstall
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
  echo [!] ngrok belum terinstall.
  echo.
  echo Cara install:
  echo   1. Buka https://ngrok.com/download
  echo   2. Download ngrok untuk Windows
  echo   3. Ekstrak ngrok.exe ke folder ini atau ke C:\Windows
  echo   4. Daftar akun gratis di https://ngrok.com
  echo   5. Copy authtoken dari dashboard ngrok
  echo   6. Jalankan: ngrok config add-authtoken TOKEN_ANDA
  echo.
  pause
  exit /b 1
)

echo [OK] ngrok ditemukan.
echo.

REM Cek backend sudah jalan
curl -s http://localhost:3001/api/clients >nul 2>&1
if %errorlevel% neq 0 (
  echo [!] Backend belum jalan di port 3001.
  echo     Jalankan start-all.bat terlebih dahulu.
  echo.
  pause
  exit /b 1
)

echo [OK] Backend jalan di port 3001.
echo.
echo Memulai tunnel ngrok untuk backend (port 3001)...
echo Setelah tunnel aktif, copy URL https:// yang muncul
echo lalu masukkan ke halaman: http://localhost:3000/network
echo.
echo Tekan Ctrl+C untuk menghentikan tunnel.
echo.

ngrok http 3001 --log=stdout
