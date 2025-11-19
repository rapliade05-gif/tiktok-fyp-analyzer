# TikTok FYP Analyzer (MVP)

Aplikasi sederhana untuk menganalisis caption/metadata TikTok agar peluang FYP lebih besar. Legal — hanya menganalisis teks/metadata yang dimasukkan oleh pengguna.

## Cara menjalankan (lokal)

1. Pastikan Node.js terinstall (v16+ direkomendasikan)
2. Clone / ekstrak project
3. Jalankan:

```bash
npm install
node server.js
```

4. Buka `http://localhost:3000` di browser

## Endpoints
- `POST /api/analyze` — body JSON `{ caption: string, sound?: string }`
- `POST /api/upload-csv` — multipart form-data, field `csv` (CSV file)

## Catatan
- Semua analisis bersifat heuristik (rule-based) dan bukan prediksi pasti.
- Jika mau, saya bisa tambahkan autentikasi, penyimpanan history, atau model ML sederhana untuk personalisasi.

## Default timezone
- UI & rekomendasi default menggunakan timezone Asia/Jakarta.
