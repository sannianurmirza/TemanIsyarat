# SIBI Detector - Frontend

Web aplikasi deteksi Bahasa Isyarat Indonesia (SIBI) menggunakan kamera real-time dan AI.

## 🏗️ Struktur Folder

\`\`\`
fe/
├── app/
│   ├── beranda/
│   │   └── BerandaContent.tsx    # Konten halaman beranda
│   ├── deteksi/
│   │   ├── DeteksiContent.tsx    # Konten halaman deteksi dengan kamera
│   │   └── page.tsx              # Route halaman deteksi
│   ├── navbar/
│   │   └── Navbar.tsx            # Komponen navigasi
│   ├── globals.css               # Style global
│   ├── layout.tsx                # Layout utama aplikasi
│   └── page.tsx                  # Route halaman beranda (/)
├── next.config.mjs               # Konfigurasi Next.js
├── package.json                  # Dependencies
└── tsconfig.json                 # Konfigurasi TypeScript
\`\`\`

## 🚀 Cara Menjalankan

### 1. Install Dependencies

Masuk ke folder `fe` dan install dependencies:

\`\`\`bash
cd fe
npm install
\`\`\`

### 2. Jalankan Development Server

\`\`\`bash
npm run dev
\`\`\`

Aplikasi akan berjalan di `http://localhost:3000`

### 3. Build untuk Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 📱 Fitur Halaman

### Halaman Beranda (/)
- Hero section dengan informasi utama
- Penjelasan cara kerja dalam 3 langkah
- Fitur unggulan aplikasi
- Tombol navigasi ke halaman deteksi

### Halaman Deteksi (/deteksi)
- **Kamera Real-time**: Akses kamera perangkat secara langsung
- **Ambil Foto**: Capture frame dari kamera untuk deteksi
- **Riwayat Deteksi**: Melihat hasil deteksi sebelumnya dengan confidence score
- **Panel Instruksi**: Panduan penggunaan aplikasi

## 🔧 Integrasi dengan Backend

Untuk menghubungkan dengan backend FastAPI, edit file `fe/app/deteksi/DeteksiContent.tsx`:

1. Cari bagian komentar TODO:
\`\`\`typescript
// TODO: Send imageData to FastAPI backend
\`\`\`

2. Uncomment dan sesuaikan URL backend:
\`\`\`typescript
const response = await fetch('http://localhost:8000/api/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: imageData })
})
const result = await response.json()
\`\`\`

3. Sesuaikan response handling dengan format data dari backend Anda

## 🎨 Warna & Tema

- **Primary (Teal)**: `#0d9488` - Untuk tombol dan aksen utama
- **Secondary (Orange)**: `#ea580c` - Untuk tombol aksi dan highlight
- **Gray Scale**: Untuk teks dan background
- Font: Inter (system font)

## 📝 Catatan Penting

- Aplikasi memerlukan **izin akses kamera** dari browser
- Pastikan website diakses melalui **HTTPS** atau **localhost** agar kamera dapat diakses
- Mock detection saat ini menghasilkan hasil dummy - ganti dengan API call ke backend untuk deteksi real

## 🔒 Keamanan & Privacy

- Video stream tidak disimpan di server
- Hanya gambar yang di-capture yang dikirim ke backend untuk deteksi
- Data deteksi disimpan sementara di browser (client-side)

## 🛠️ Teknologi yang Digunakan

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **MediaDevices API** - Akses kamera
- **Canvas API** - Capture image dari video stream
