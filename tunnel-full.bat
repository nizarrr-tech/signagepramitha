@echo off
title Signage - Full Remote Tunnel

echo ============================================
echo   Digital Signage - Full Remote Access
echo   Backend (3001) + Frontend (3000)
echo ============================================
echo.

REM Cek cloudflared
where cloudflared >nul 2>&1
set CF_CMD=cloudflared
if %errorlevel% neq 0 (
  if exist "cloudflared.exe" (
    set CF_CMD=cloudflared.exe
  ) else (
    echo [!] cloudflared tidak ditemukan.
    echo     Jalankan tunnel-cloudflare.bat untuk install otomatis.
    pause
    exit /b 1
  )
)

REM Cek services
curl -s http://localhost:3001/api/clients >nul 2>&1
if %errorlevel% neq 0 (
  echo [!] Backend belum jalan. Jalankan start-all.bat dulu.
  pause
  exit /b 1
)

echo Membuat 2 tunnel terpisah...
echo.

REM Buka tunnel backend di window baru
start "Tunnel Backend :3001" cmd /k "%CF_CMD% tunnel --url http://localhost:3001"

timeout /t 3 /nobreak >nul

REM Buka tunnel frontend di window baru  
start "Tunnel Frontend :3000" cmd /k "%CF_CMD% tunnel --url http://localhost:3000"

echo.
echo ============================================
echo  Dua jendela tunnel terbuka.
echo.
echo  INSTRUKSI:
echo  1. Lihat URL dari window "Tunnel Backend"
echo     contoh: https://xxxx.trycloudflare.com
echo  2. Buka http://localhost:3000/network
echo  3. Masukkan URL backend tersebut dan Simpan
echo  4. Bagikan URL frontend ke operator/viewer
echo     contoh: https://yyyy.trycloudflare.com/player?client=PRAMITHA
echo ============================================
echo.
pause
