# KursAI - AI Business Assistant untuk UMKM 🚀

**KursAI** adalah aplikasi asisten bisnis cerdas berbasis Kecerdasan Buatan (AI) yang dirancang khusus untuk mempermudah pemilik Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia dalam mengelola pembukuan, stok barang, faktur, pajak, dan analisis kelayakan kredit secara mudah dan otomatis.

---

## ✨ Fitur Utama

1. **Dashboard Interaktif & Laporan Keuangan**
   * Visualisasi performa bisnis (pemasukan, pengeluaran, laba/rugi) dengan grafik interaktif dari *Recharts*.
   * Filter rentang waktu dinamis dan pembagian kategori usaha vs pribadi.

2. **Chat AI Assistant (Natural Language)**
   * Catat transaksi hanya dengan mengetik kalimat biasa (contoh: *"jual nasi goreng 15rb"* atau *"beli bensin 20rb"*).
   * Asisten AI akan otomatis memproses teks, memperbarui stok barang, dan mendaftarkan transaksi baru secara instan.

3. **Scan Struk AI (OCR & AI Parser)**
   * Ambil foto struk belanja lewat kamera atau unggah file gambar struk.
   * Ekstraksi teks (*OCR*) lokal berbasis *Tesseract.js* yang diuraikan oleh AI menjadi entitas transaksi belanja terstruktur (Nama Toko, Tanggal, Rincian Item, Total) yang siap ditinjau dan disimpan.

4. **Catat Suara AI (Speech-to-Text)**
   * Cukup bicara langsung ke mikrofon untuk mencatat transaksi secara verbal dengan format bahasa alami Indonesia.

5. **Faktur & Kwitansi (Invoices)**
   * Pembuat faktur tagihan dan kwitansi POS termal secara dinamis.
   * Mendukung opsi cetak langsung (*print preview*) dan bagikan tautan faktur lewat WhatsApp.

6. **Pajak UMKM (PPh Final PPN 0.5%)**
   * Perhitungan PPh Final UMKM otomatis (PP 55/2022) lengkap dengan batasan omzet Rp500 juta tidak kena pajak untuk Wajib Pajak Orang Pribadi.

7. **Akses Modal & Skor Kredit**
   * Simulasi kelayakan kredit (Credit Scoring) dan dokumentasi pengajuan pinjaman usaha berdasarkan riwayat transaksi pembukuan.

8. **Kasbon & Piutang**
   * Catat utang-piutang pelanggan/penyalur dan kirim pesan pengingat tagihan otomatis langsung ke WhatsApp pelanggan.

9. **Manajemen Tim (Hak Akses Staf)**
   * Undang anggota tim dan atur hak akses spesifik (baca laporan, kelola stok, catat transaksi).

10. **Mode Demo & Bypass Login**
    * Tombol khusus untuk mengakses penuh seluruh fitur aplikasi secara offline/lokal tanpa perlu mendaftar/login (data tersimpan secara lokal di *localStorage*).

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion
* **Database & Auth**: Supabase (PostgreSQL, Row-Level Security)
* **OCR Engine**: Tesseract.js (Client-side)
* **Icons & Visuals**: Lucide React
* **Charts**: Recharts

---

## 🚀 Cara Menjalankan Project Secara Lokal

### Prasyarat
Pastikan Anda sudah menginstal:
* [Node.js](https://nodejs.org/) (versi 18 ke atas)
* NPM (bawaan dari Node.js)

### Langkah-langkah Penginstalan

1. **Persiapkan Direktori & Environment Variables**
   Salin berkas konfigurasi env di dalam folder `frontend`:
   * Masuk ke folder `frontend` dan duplikat file `.env.local` (atau buat baru jika belum ada).
   * Isi variabel berikut dengan kredensial Supabase Anda:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     NEXT_PUBLIC_AI_API_KEY=your_ai_api_token
     ```

2. **Instal Dependensi**
   Jalankan perintah berikut di dalam direktori `frontend`:
   ```bash
   cd frontend
   npm install
   ```

3. **Jalankan Aplikasi dalam Mode Development**
   Jalankan server lokal:
   ```bash
   npm run dev
   ```
   Aplikasi Next.js akan berjalan di: **[http://localhost:3000](http://localhost:3000)**

4. **Gunakan Mode Demo (Opsional & Direkomendasikan untuk Uji Coba Cepat)**
   * Pada halaman login/register di localhost, klik tombol pil oranye: **"Cobain Mode Demo (Bypass Login)"**.
   * Ini akan mem-bypass integrasi database Supabase secara aman dan menggunakan data simulasi lokal untuk mempermudah testing.

---

## 🗄️ Inisialisasi Database (Supabase)

Jika Anda ingin menghubungkan aplikasi dengan database Supabase Anda sendiri:
1. Buat proyek baru di [Supabase Console](https://supabase.com/).
2. Buka bagian **SQL Editor** di panel Supabase Anda.
3. Jalankan script SQL migrasi yang terdapat di folder `supabase/migrations/` secara berurutan:
   * **`00001_init.sql`**: Membuat skema tabel dasar (users, businesses, products, transactions, dll).
   * **`00002_fix_rls_policies.sql`**: Mengonfigurasi hak akses Row-Level Security (RLS) tim & owner.
   * **`00003_add_business_fields.sql`**: Menambahkan kolom metadata detail profil usaha.
