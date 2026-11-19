@echo off
title Signage - Cloudflare Tunnel

echo ============================================
echo   Digital Signage - Cloudflare Tunnel
echo ============================================
echo.

REM Cek cloudflared sudah terinstall
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
  echo [!] cloudflared belum terinstall.
  echo.
  echo Cara install otomatis:
  echo   Script ini akan download cloudflared sekarang...
  echo.

  REM Download cloudflared
  curl -L -o "cloudflared.exe" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  if %errorlevel% neq 0 (
    echo [ERROR] Download gagal. Install manual dari:
    echo https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    pause
    exit /b 1
  )
  echo [OK] cloudflared berhasil didownload.
  echo.
)

REM Cek backend jalan
curl -s http://localhost:3001/api/clients >nul 2>&1
if %errorlevel% neq 0 (
  echo [!] Backend belum jalan. Jalankan start-all.bat dulu.
  pause
  exit /b 1
)

echo [OK] Backend jalan.
echo.
echo ============================================
echo  Memulai Cloudflare Quick Tunnel...
echo  (Tidak perlu akun, tidak perlu domain)
echo ============================================
echo.
echo  URL tunnel akan muncul dalam beberapa detik.
echo  Contoh: https://abc-def-ghi.trycloudflare.com
echo.
echo  Salin URL tersebut ke:
echo  http://localhost:3000/network
echo.
echo  Tekan Ctrl+C untuk menghentikan tunnel.
echo.

REM Gunakan cloudflared.exe dari folder ini atau dari PATH
if exist "cloudflared.exe" (
  cloudflared.exe tunnel --url http://localhost:3001
) else (
  cloudflared tunnel --url http://localhost:3001
)
