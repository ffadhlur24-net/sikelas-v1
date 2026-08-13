# SiKelas - Sistem Informasi Manajemen & Reservasi Kelas 🎓

**SiKelas** adalah platform aplikasi web cerdas yang dirancang untuk mengatasi permasalahan manajemen ruang kelas di lingkungan kampus. Aplikasi ini memfasilitasi transparansi jadwal, mempercepat peminjaman ruang, serta mencegah terjadinya tumpang tindih (*double booking*) antara jadwal kuliah reguler SIAKAD dengan kegiatan insidental.

---

## 🛠️ TEKNOLOGI & TOOLS YANG DIGUNAKAN (TECH STACK)

<div align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white" alt="Resend" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
</div>

<br/>

> 💡 **Penjelasan Singkat untuk Pemula:**  
> Berikut adalah penjelasan mengenai teknologi yang digunakan dalam proyek ini dengan bahasa yang sederhana:

### 🎨 Tampilan Depan (Frontend Web):
- **React.js (Vite):** Pustaka (*library*) JavaScript modern untuk membangun antarmuka web yang interaktif, cepat, dan tanpa perlu melakukan reload halaman (*Single Page Application*).
- **React Router DOM:** Berfungsi mengatur navigasi halaman (seperti berpindah dari Halaman Login ke Dashboard Admin) tanpa membuat browser me-load ulang seluruh halaman.
- **Axios:** "Kurir pengantar pesan" berbasis HTTP yang bertugas mengirim dan mengambil data dari server backend ke layar web Anda (dilengkapi *Response Interceptor 401* untuk auto-logout saat sesi expired).
- **Vanilla CSS (Variables System):** Bahasa desain tampilan berbasis variabel terpusat (`--color-primary-500`, `--color-success`) untuk menciptakan gaya visual modern, bersih, dan konsisten di semua halaman.

### ⚙️ Mesin Server (Backend API):
- **Node.js:** Lingkungan (*runtime*) yang memungkinkan kode JavaScript dapat dijalankan di komputer server (di luar browser).
- **Express.js:** Kerangka kerja (*framework*) berbasis Node.js untuk membuat rute API (jalur komunikasi antara web frontend dan database).
- **Resend (Email API Service):** Layanan pengiriman email transaksi terandal untuk mengirimkan kode OTP 6-Digit saat verifikasi pendaftaran akun baru, lupa password, dan konfirmasi penggantian password profil secara instan.
- **Automation Cron Jobs Sweeper:** Pembersih otomatis latar belakang yang berjalan berkala untuk membatalkan reservasi hangus (*Phantom Booking Cleaner*) dan laporan kadaluwarsa secara mandiri.
- **JWT (JSON Web Tokens):** "Tiket masuk digital" yang mengamankan sesi login pengguna. Tiket ini menyimpan ID dan hak akses (*role*) pengguna yang terenkripsi.
- **Bcrypt.js:** Pengaman kata sandi yang bertugas mengacak (*hash*) password sebelum disimpan ke database agar tidak bisa dibaca oleh siapapun.

### 💾 Penyimpanan Data (Database):
- **Supabase (PostgreSQL Cloud):** Layanan basis data awan (*cloud database*) canggih berbasis PostgreSQL untuk menyimpan seluruh data master (Ruangan, Jadwal, Pengguna, Pelaporan, Notifikasi, dan Pemesanan).

---

## 🌟 FITUR UTAMA & FITUR TAMBAHAN APLIKASI

### 📌 1. FITUR UTAMA (CORE FEATURES):

1. **Dashboard Interaktif Admin & PJ Kelas:**
   - Visualisasi ringkasan statistik harian (Jumlah Ruangan Tersedia/Terkunci, Total Reservasi Hari Ini, Status Laporan, dan Akun Pending).
2. **Peminjaman & Reservasi Ruangan Kelas (PJ Kelas):**
   - Formulir reservasi interaktif yang memilih tanggal, jam, prodi, dan mata kuliah.
3. **Anti Double-Booking System (Pencegah Konflik Jadwal):**
   - Menggunakan rumus aljabar interval waktu (`Waktu Mulai Lama < Waktu Selesai Baru` AND `Waktu Selesai Lama > Waktu Mulai Baru`) untuk memastikan peminjaman kelas tidak akan pernah bentrok dengan jadwal reguler SIAKAD maupun peminjaman pengguna lain.
4. **Pelaporan Kelas Kosong / Kendala Perkuliahan:**
   - Fitur pelaporan oleh PJ saat dosen berhalangan hadir, kelas pindah online, atau ruangan terkunci.
5. **Pelaporan Kerusakan Fasilitas Kelas:**
   - Log pelaporan kerusakan fasilitas (AC rusak, proyektor mati, spidol habis) yang terintegrasi langsung ke panel pantau Admin.
6. **Sistem Verifikasi & Manajemen Akun PJ:**
   - Pendaftaran akun baru PJ yang membutuhkan persetujuan (*Approval/Rejection*) dari Admin sebelum bisa login.
7. **Pusat Penampung Notifikasi In-App (Web Inbox Center):**
   - Fitur lonceng 🔔 header dasbor dengan badge merah indikator real-time, status pesan dibaca, serta tombol *bulk delete* (hapus massal).
8. **Ekspor Laporan Data (PDF & Excel):**
   - Kemampuan mengunduh rekapitulasi data log pelaporan dan kerusakan ke format dokumen PDF dan file Excel/CSV.
9. **Manajemen Hierarki Ruangan 3-Level:**
   - Penataan hierarki lokasi terstruktur: Kampus ➔ Gedung ➔ Ruangan per Lantai.
10. **Manajemen Prodi Dinamis 2-Level:**
    - Penataan hierarki akademik: Fakultas ➔ Program Studi Terikat.
11. **Pemeliharaan & Reset Akhir Semester ("Tombol Nuklir"):**
    - Fitur pembersihan total akhir semester untuk mengosongkan data PJ, reservasi, laporan, dan jadwal SIAKAD lama saat semester resmi berakhir.

---

### 🚀 2. FITUR TAMBAHAN & KEAMANAN SISTEM (ADDITIONAL & ADVANCED SECURITY FEATURES):

1. **Verifikasi OTP Email Ganda (Double OTP Verification via Resend API):**
   - Kode OTP 6-digit dikirim langsung ke email pengguna untuk memverifikasi akun pendaftaran baru, reset lupa password, serta perlindungan ganda saat mengubah password di halaman Profil.
2. **Automated Phantom Booking Sweeper:**
   - Robot latar belakang otomatis membatalkan reservasi berstatus `approved` jika PJ tidak melakukan *check-in* setelah lewat 15 menit dari jam mulai, sehingga ruangan tidak terkunci secara gantung.
3. **Toggle Lihat/Sembunyi Password (👁️ / 🙈):**
   - Tombol interaktif untuk menampilkan atau menyembunyikan karakter password pada form login, register, dan modal profil.
4. **Validasi Kemanan Password Frontend:**
   - Pengecekan otomatis minimal 8 karakter dan konfirmasi kecocokan password sebelum form dikirim ke server.
5. **Proteksi Keamanan Rate Limiting Login (IP Limiter):**
   - Sistem otomatis mengunci komputer/IP peretas jika terjadi kesalahan memasukkan password sebanyak **5 kali berturut-turut selama 15 menit**, sementara pemilik akun asli tetap aman bisa login dari perangkatnya sendiri.

---

## 📁 STRUKTUR FOLDER PROYEK LENGKAP

Proyek **SiKelas** disusun secara terstruktur dengan pemisahan penuh antara Frontend (React) dan Backend (Express API):

```text
project_website/
├── client/                             # 🎨 FRONTEND WEB (React.js + Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                # Client API & Response 401 Interceptor
│   │   ├── components/                 # Komponen Reusable
│   │   │   ├── Header.jsx              # Topbar Header Dashboard
│   │   │   ├── NotificationBell.jsx    # Pop-up Lonceng Inbox Notifikasi
│   │   │   ├── ProtectedRoute.jsx      # Pengaman Akses Berdasarkan Role
│   │   │   └── Sidebar.jsx             # Menu Navigasi Samping
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Provider State Pengguna Global
│   │   ├── pages/                      # Halaman Utama Aplikasi
│   │   │   ├── admin/                  # Halaman Fitur Manajemen Admin
│   │   │   │   ├── LogKerusakanFasilitas.jsx
│   │   │   │   ├── LogPelaporan.jsx
│   │   │   │   ├── ManajemenAkunPJ.jsx
│   │   │   │   ├── ManajemenProdi.jsx
│   │   │   │   ├── ManajemenRuangan.jsx
│   │   │   │   ├── PersetujuanReservasi.jsx
│   │   │   │   ├── ProfilAdmin.css
│   │   │   │   └── ProfilAdmin.jsx     # Edit Profil Admin + Toggle & OTP
│   │   │   ├── auth/                   # Autentikasi Pengguna
│   │   │   │   └── Register.jsx        # Pendaftaran Akun PJ & Form OTP
│   │   │   ├── pj/                     # Halaman Fitur Mahasiswa PJ
│   │   │   │   ├── DaftarKelas.jsx
│   │   │   │   ├── PelaporanKelas.jsx
│   │   │   │   ├── Pelaporankerusakan.jsx
│   │   │   │   ├── ProfilPJ.css
│   │   │   │   └── ProfilPJ.jsx        # Edit Profil PJ + Toggle & OTP
│   │   │   ├── DashboardAdmin.jsx      # Layout Shell Admin
│   │   │   ├── DashboardPJ.jsx         # Layout Shell PJ
│   │   │   ├── HalamanLogin.jsx        # Form Login & Rate Limiter Alert
│   │   │   ├── LandingPage.jsx         # Halaman Depan Publik
│   │   │   └── VerifyEmail.jsx         # Verifikasi Email OTP
│   │   ├── App.css
│   │   ├── App.jsx                     # Konfigurasi Rute Aplikasi
│   │   ├── index.css                   # System Design Tokens & Variabel CSS
│   │   └── main.jsx                    # Berkas Utama React Entry Point
│   ├── index.html
│   └── package.json                    # Pustaka & Dependensi Frontend
│
└── server/                             # ⚙️ BACKEND API (Express.js)
    ├── config/
    │   └── supabase.js                 # Inisialisasi Koneksi DB Supabase
    ├── middleware/
    │   ├── auth.js                     # Middleware Verifikasi JWT Token
    │   └── rateLimiter.js              # Middleware IP Limiter Perangkat
    ├── routes/                         # Endpoint Controller RESTful API
    │   ├── auth.js                     # Register, Login, Verify OTP, Reset Password
    │   ├── departemen.js               # Manajemen Prodi Dinamis
    │   ├── facilityReports.js          # Laporan Kerusakan Fasilitas
    │   ├── notification.js             # API Notifikasi Inbox 2-Arah
    │   ├── reports.js                  # API Laporan Kelas Kosong
    │   ├── reservations.js             # API Booking & Check-In Kelas
    │   ├── rooms.js                    # API Master Ruangan & Status Lock
    │   ├── schedules.js                # API Kalender Perkuliahan
    │   └── user.js                     # API Profil, User List, & Request OTP
    ├── tasks/
    │   └── cronJobs.js                 # Automation Phantom Booking & Midnight Sweeper
    ├── untils/
    │   └── sendEmail.js                # Helper Pengiriman Email OTP via Resend API
    ├── .env                            # Kunci Rahasia Environment Variables
    ├── index.js                        # Berkas Utama Server & Init Cron Jobs
    ├── seed_add.js                     # Skrip Inisialisasi Data Awal (Seeder)
    ├── seed_clear.js                   # Skrip Reset Data Seeder
    └── package.json                    # Pustaka & Dependensi Backend
```

---

## 📖 PANDUAN CARA MENJALANKAN APLIKASI (UNTUK PEMULA)

> 💡 **Penjelasan Singkat untuk Pemula:**  
> Aplikasi website ini terdiri dari 2 bagian utama:
> 1. **Server (Backend/Express):** Bertindak sebagai "mesin" yang mengolah data, mengirim email OTP via Resend, dan menghubungkan ke database.
> 2. **Client (Frontend/React):** Bertindak sebagai "layar tampilan" yang dilihat oleh pengguna di browser.
> 
> **Keduanya harus dijalankan secara bersamaan agar website dapat berfungsi sempurna!**

---

### 📋 Prasyarat Awal (Yang Harus Diinstal)
Sebelum mulai, pastikan komputer Anda sudah terpasang:
1. **Node.js** (Aplikasi penjalan kode JavaScript di komputer): [Download Node.js di sini](https://nodejs.org/) (Pilih versi LTS).
2. **Visual Studio Code (VS Code)**: Editor kode resmi [Download VS Code di sini](https://code.visualstudio.com/).

---

### 🚀 LANGKAH-LANGKAH MENJALANKAN WEBSITE (STEP-BY-STEP)

#### Langkah 1: Buka Folder Proyek di VS Code
1. Buka aplikasi **VS Code**.
2. Klik menu **File ➔ Open Folder...**
3. Pilih folder proyek `project_website` (atau folder utama project ini).

---

#### Langkah 2: Menjalankan Server Backend (Terminal 1)
1. Di VS Code, buka Terminal dengan menekan tombol **Ctrl + `** (tombol backtick di bawah Esc) atau klik menu **Terminal ➔ New Terminal**.
2. Masuk ke folder server dengan mengetikkan perintah berikut di terminal lalu tekan **Enter**:
   ```bash
   cd server
   ```
3. Jika ini pertama kali Anda membuka project, install dependensi terlebih dahulu (cukup 1 kali saja):
   ```bash
   npm install
   ```
4. Jalankan mesin server dengan mengetik perintah:
   ```bash
   npm run dev
   ```
5. Jika berhasil, Anda akan melihat tulisan di terminal:  
   `🚀 Server SiKelas berjalan di port 5000` dan `🤖 [CronJobs] Mengaktifkan Sweeper Latar Belakang...`.  
   *(Biarkan terminal ini tetap terbuka dan berjalan!)*

---

#### Langkah 3: Menjalankan Tampilan Frontend Web (Terminal 2)
1. Buka **Terminal Baru (Terminal Kedua)** di VS Code dengan mengklik tombol **`+` (Plus)** di pojok kanan atas jendela Terminal.
2. Masuk ke folder tampilan client dengan mengetikkan perintah berikut lalu tekan **Enter**:
   ```bash
   cd client
   ```
3. Jika ini pertama kali Anda membuka project, install dependensi terlebih dahulu:
   ```bash
   npm install
   ```
4. Jalankan tampilan frontend dengan mengetik perintah:
   ```bash
   npm run dev
   ```
5. Jika berhasil, terminal akan menampilkan alamat website lokal Anda:  
   `➜ Local: http://localhost:5173/`

---

#### Langkah 4: Buka Website di Browser Anda 🌐
1. Buka aplikasi browser favorit Anda (Google Chrome, Edge, Firefox, dll).
2. Ketikkan alamat berikut pada kolom URL di atas lalu tekan **Enter**:
   ```text
   http://localhost:5173
   ```
3. Selamat! Website **SiKelas** sudah tampil dan siap digunakan! 🎉

---

### 🔑 Akses Akun Pengujian:

- **Akun Super Admin:**
  - **Email:** `admin.kentir@mhs.edu`
  - **Password:** `password`
- **Akun PJ (Penanggung Jawab Kelas):**
  - Anda bisa melakukan **Registrasi Akun Baru** pada tombol pendaftaran di halaman utama, atau menggunakan akun PJ yang disetujui Admin.

---

### ❓ Pertanyaan & Pertolongan Pertama (Troubleshooting):

- **T: Bagaimana cara menghentikan website jika selesai menguji?**  
  *Jawab:* Cukup klik jendela terminal di VS Code, lalu tekan kombinasi tombol `Ctrl + C` pada keyboard.
- **T: Mengapa terjadi error "supabaseUrl is required" saat menjalankan script?**  
  *Jawab:* Pastikan Anda menjalankan perintah dari dalam folder `server` (`cd server`) agar file `.env` dapat dibaca dengan benar.

---

## 📜 Lisensi
Proyek ini didistribusikan di bawah lisensi MIT. Silakan gunakan, dan modifikasi secara waras sewajarnya manusia.
