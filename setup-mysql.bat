@echo off
title Digital Signage - Setup MySQL (XAMPP)

echo ============================================
echo   Setup Database MySQL via XAMPP
echo ============================================
echo.

REM Cek XAMPP MySQL jalan
echo [1/5] Cek XAMPP MySQL...
netstat -an | findstr ":3306" | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] MySQL XAMPP tidak jalan!
  echo.
  echo Langkah:
  echo   1. Buka XAMPP Control Panel
  echo   2. Klik START di baris MySQL
  echo   3. Tunggu status jadi hijau
  echo   4. Jalankan setup-mysql.bat lagi
  echo.
  pause
  exit /b 1
)
echo [OK] MySQL XAMPP jalan di port 3306.

echo.
echo [2/5] Membuat database 'signage_antrian'...
REM Coba buat database menggunakan mysql.exe dari XAMPP
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
if not exist "%MYSQL_PATH%" (
  set MYSQL_PATH=C:\xampp64\mysql\bin\mysql.exe
)
if not exist "%MYSQL_PATH%" (
  echo [WARNING] mysql.exe tidak ditemukan di C:\xampp
  echo           Buat database manual di phpMyAdmin (lihat instruksi di bawah)
  goto MANUAL_DB
)

"%MYSQL_PATH%" -u root -e "CREATE DATABASE IF NOT EXISTS signage_antrian CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% neq 0 (
  echo [WARNING] Gagal buat database otomatis (mungkin butuh password)
  goto MANUAL_DB
)
echo [OK] Database 'signage_antrian' berhasil dibuat.
goto DB_DONE

:MANUAL_DB
echo.
echo ============================================
echo  BUAT DATABASE MANUAL DI phpMyAdmin:
echo.
echo  1. Buka: http://localhost/phpmyadmin
echo  2. Klik "New" di sidebar kiri
echo  3. Nama database: signage_antrian
echo  4. Collation: utf8mb4_unicode_ci
echo  5. Klik "Create"
echo ============================================
echo.
echo Tekan Enter setelah database dibuat...
pause >nul

:DB_DONE
echo.
echo [3/5] Menjalankan Prisma migrate...
cd /d "d:\SIGNAGE ANTRIAN\backend"
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Prisma db push gagal!
  echo Kemungkinan penyebab:
  echo   - Database belum dibuat di phpMyAdmin
  echo   - MySQL belum jalan
  echo   - Password MySQL salah (edit file backend\.env)
  echo.
  pause
  exit /b 1
)
echo [OK] Tabel berhasil dibuat di MySQL.

echo.
echo [4/5] Seed data awal...
call npx ts-node src/seed.ts
if %errorlevel% neq 0 (
  echo [WARNING] Seed gagal - mungkin data sudah ada, lanjutkan...
)

echo.
echo [5/5] Install frontend...
cd /d "d:\SIGNAGE ANTRIAN\frontend"
call npm install --legacy-peer-deps

echo.
echo ============================================
echo   SETUP SELESAI!
echo.
echo   Database MySQL: signage_antrian
echo   phpMyAdmin    : http://localhost/phpmyadmin
echo   Jalankan      : start-all.bat
echo ============================================
pause
