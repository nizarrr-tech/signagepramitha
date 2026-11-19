# 📺 Digital Signage & Antrian — Klinik Pramitha

Sistem Client-Server pengganti S7S CMS & S7S Player. Terdiri dari 3 bagian independen.

---

## 🗂 Struktur Proyek

```
SIGNAGE ANTRIAN/
├── backend/          ← NestJS + Prisma + SQLite (port 3001)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma.service.ts
│   │   ├── seed.ts
│   │   ├── gateway/
│   │   │   └── signage.gateway.ts    ← WebSocket
│   │   ├── media/
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   └── media.module.ts
│   │   ├── signage/
│   │   │   ├── signage.controller.ts
│   │   │   ├── signage.service.ts
│   │   │   └── signage.module.ts
│   │   └── queue/
│   │       ├── queue.controller.ts
│   │       ├── queue.service.ts
│   │       └── queue.module.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── uploads/      ← File media tersimpan di sini
│
├── frontend/         ← Next.js + Tailwind (port 3000)
│   ├── pages/
│   │   ├── admin.tsx       ← Halaman Admin CMS
│   │   └── operator.tsx    ← Halaman Operator Antrian
│   ├── components/
│   │   ├── NavBar.tsx
│   │   ├── MediaUpload.tsx
│   │   └── ScheduleEditor.tsx
│   └── lib/
│       ├── api.ts          ← Axios API calls
│       └── socket.ts       ← Socket.io client
│
├── player/           ← HTML5 Standalone (port 3002)
│   ├── index.html    ← Layar Signage 1920×1080
│   └── server.js     ← Static file server
│
├── setup.bat         ← Jalankan pertama kali
├── start-all.bat     ← Jalankan setelah setup
└── README.md
```

---

## 🚀 Cara Menjalankan

### Langkah 1 — Setup (jalankan sekali)

```bat
setup.bat
```

Perintah ini akan:
1. Install semua npm dependencies (backend & frontend)
2. Generate Prisma client & buat database SQLite
3. Seed data awal (Client PRAMITHA, 5 slot antrian, 6 channel TV)

### Langkah 2 — Jalankan Sistem

```bat
start-all.bat
```

Ini membuka 3 terminal terpisah:
| Service | URL | Keterangan |
|---------|-----|------------|
| Backend API | http://localhost:3001 | NestJS + WebSocket |
| Admin CMS | http://localhost:3000/admin | Form manajemen konten |
| Operator | http://localhost:3000/operator | Panel panggil antrian |
| Player | http://localhost:3002?client=PRAMITHA | Layar signage (F11 fullscreen) |

---

## 📡 API Reference

### Media
| Method | URL | Keterangan |
|--------|-----|------------|
| POST | `/api/media/upload` | Upload 1 file (form-data: `file`) |
| POST | `/api/media/upload-multiple` | Upload banyak file (form-data: `files`) |
| GET | `/api/media` | List semua media |
| GET | `/api/media/videos` | List video saja |
| GET | `/api/media/images` | List gambar saja |
| DELETE | `/api/media/:id` | Hapus media |
| GET | `/resources/:filename` | Akses file (static) |

### Signage
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/signage/:clientId` | Ambil konfigurasi layar lengkap |
| POST | `/api/signage/:clientId/content` | Update konten + emit `refresh:clientId` |

Body POST content:
```json
{
  "videoUrls": ["/resources/video1.mp4"],
  "slideUrls": ["/resources/slide1.jpg"],
  "runningText": "Selamat datang...",
  "scheduleTable": [{"poli":"Umum","dokter":"dr. Budi","jam":"08:00-12:00"}],
  "backgroundUrl": "/resources/bg.jpg"
}
```

### Antrian
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/signage/:clientId/queue` | Ambil 5 slot antrian |
| POST | `/api/signage/:clientId/queue/call` | Panggil antrian + emit `queue:clientId` |
| POST | `/api/signage/:clientId/queue/reset` | Reset semua slot ke 000 |
| POST | `/api/signage/:clientId/queue/loket` | Update nama loket |

Body POST call:
```json
{ "slotNumber": 1, "action": "next" }
{ "slotNumber": 2, "action": "repeat" }
{ "slotNumber": 3, "action": "manual", "number": "B015" }
```

---

## 🔌 WebSocket Events

Koneksi: `ws://localhost:3001?clientId=PRAMITHA`

| Event | Arah | Payload |
|-------|------|---------|
| `queue:PRAMITHA` | Server → Player | `{ slotNumber, loketName, currentNumber }` |
| `refresh:PRAMITHA` | Server → Player | Full config object |

---

## 🖥 Layout Player (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│ Antrian 1 (5,9,597×190)   │                                 │
├───────────────────────────┤  VIDEO (628,155,1274×622)       │
│ Antrian 2 (5,203)         │                                 │
├───────────────────────────┤                                 │
│ Antrian 3 (5,397)         │                                 │
├───────────────────────────├─────────────────────────────────┤
│ Antrian 4 (5,590)         │ SLIDE (625,790)  │ TABEL        │
├───────────────────────────┤  640×188         │ (1272,790)   │
│ Antrian 5 (5,784)         │                  │  639×188     │
├───────────────────────────┴──────────────────┴──────────────┤
│ RUNNING TEXT (0,1011,1551×67)                │ JAM/TGL      │
└──────────────────────────────────────────────┴──────────────┘
```

---

## ⚙ Konfigurasi Multi-Client

Untuk menambah client baru selain PRAMITHA:
1. POST ke `/api/clients` dengan body `{ "id": "KLINIK2", "description": "Cabang 2" }`
2. Buka player: `http://localhost:3002?client=KLINIK2`
3. Buka admin: ubah `CLIENT_ID` di `frontend/pages/admin.tsx`

---

## 🌐 Akses Jarak Jauh (Beda WiFi / Beda Internet)

### Opsi 1 — Cloudflare Tunnel (Gratis, Disarankan)

```bat
REM Pastikan start-all.bat sudah jalan, lalu:
tunnel-cloudflare.bat
```
Copy URL `https://xxxx.trycloudflare.com` yang muncul → masukkan di **Admin CMS → Jaringan**.

### Opsi 2 — ngrok

```bat
REM Install ngrok dulu dari https://ngrok.com/download
REM Lalu tambahkan authtoken:
ngrok config add-authtoken TOKEN_ANDA

REM Jalankan:
tunnel-ngrok.bat
```

### Opsi 3 — Tunnel Backend + Frontend sekaligus

```bat
tunnel-full.bat
```

### Cara Update URL di Aplikasi

1. Buka `http://localhost:3000/network`
2. Masukkan URL tunnel (contoh: `https://xxxx.trycloudflare.com`)
3. Klik **Test** → **Simpan**
4. Bagikan ke operator: `http://[IP-lokal]:3000/operator`
5. Player remote: `https://[URL-frontend-tunnel]/player?client=PRAMITHA&api=https://[URL-backend-tunnel]`

---

## 🛠 Development

```bash
# Backend dev mode (auto-reload)
cd backend && npm run start:dev

# Frontend dev mode (hot-reload)
cd frontend && npm run dev

# Player (tidak perlu build)
cd player && node server.js

# Prisma Studio (GUI database)
cd backend && npx prisma studio
```
