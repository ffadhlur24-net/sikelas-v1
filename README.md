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
- **Axios:** "Kurir pengantar pesan" berbasis HTTP yang bertugas mengirim dan mengambil data dari server backend ke layar web Anda.
- **Vanilla CSS (Variables System):** Bahasa desain tampilan berbasis variabel terpusat (`--color-primary-500`, `--color-success`) untuk menciptakan gaya visual modern, bersih, dan konsisten di semua halaman.

### ⚙️ Mesin Server (Backend API):
- **Node.js:** Lingkungan (*runtime*) yang memungkinkan kode JavaScript dapat dijalankan di komputer server (di luar browser).
- **Express.js:** Kerangka kerja (*framework*) berbasis Node.js untuk membuat rute API (jalur komunikasi antara web frontend dan database).
- **JWT (JSON Web Tokens):** "Tiket masuk digital" yang mengamankan sesi login pengguna. Tiket ini menyimpan ID dan hak akses (*role*) pengguna yang terenkripsi.
- **Bcrypt.js:** Pengaman kata sandi yang bertugas mengacak (*hash*) password sebelum disimpan ke database agar tidak bisa dibaca oleh siapapun.

### 💾 Penyimpanan Data (Database):
- **Supabase (PostgreSQL Cloud):** Layanan basis data awan (*cloud database*) canggih berbasis PostgreSQL untuk menyimpan seluruh data master (Ruangan, Jadwal, Pengguna, Pelaporan, dan Pemesanan).

---

## 🌟 FITUR UTAMA & FITUR KEAMANAN CANGGIH

1. **Anti Double-Booking System (Pencegah Konflik Jadwal):**
   - Menggunakan rumus aljabar interval waktu (`Waktu Mulai Lama < Waktu Selesai Baru` AND `Waktu Selesai Lama > Waktu Mulai Baru`) untuk memastikan peminjaman kelas tidak akan pernah bentrok dengan jadwal reguler SIAKAD maupun peminjaman pengguna lain.
2. **Kalkulator SKS & Jam Selesai Otomatis:**
   - Pengisian waktu perkuliahan menggunakan standar akademik SKS (1 SKS = 50 Menit), di mana jam selesai dihitung dan dikunci secara otomatis.
3. **Navigasi Berjenjang Bebas Typo (*Typo-Proof Hierarchy*):**
   - **Manajemen Ruangan 3 Level:** Kampus ➔ Gedung ➔ Ruangan per Lantai.
   - **Manajemen Prodi 2 Level:** Fakultas ➔ Sub-Prodi Terikat.
4. **Proteksi Keamanan Rate Limiting Login:**
   - Sistem otomatis mengunci komputer/IP peretas jika terjadi kesalahan memasukkan password sebanyak **5 kali berturut-turut selama 15 menit**, sementara pemilik akun asli tetap aman bisa login dari perangkatnya sendiri.
5. **Kalkulasi Zona Waktu Presisi (WIB / UTC+7):**
   - Backend memproses waktu lokal WIB secara akurat sehingga mencegah bug pergeseran tanggal mundur 1 hari yang sering terjadi pada server berzona waktu UTC.

---

## 📁 STRUKTUR FOLDER PROYEK

Proyek ini dibagi secara rapi menjadi 2 folder utama:

```text
project_website/
├── client/                     # 🎨 FRONTEND WEB (React.js)
│   ├── src/
│   │   ├── api/axios.js        # Konfigurasi komunikasi API
│   │   ├── context/            # Pengelola State Login Global (AuthContext)
│   │   ├── pages/              # Halaman Web (Admin, PJ, Login, Register)
│   │   │   ├── admin/          # Halaman Fitur Manajemen Admin
│   │   │   └── pj/             # Halaman Fitur Mahasiswa PJ
│   │   ├── App.jsx             # Pengatur Rute Utama Aplikasi
│   │   └── main.jsx            # Berkas Entri Utama React
│   └── package.json            # Daftar Pustaka Frontend
│
└── server/                     # ⚙️ BACKEND API (Express.js)
    ├── config/                 # Konfigurasi Supabase Database
    ├── middleware/             # Pengaman Rute & Keamanan Rate Limiter
    ├── routes/                 # Endpoint API (Auth, Rooms, Schedules, Reports)
    ├── index.js                # Berkas Utama Menjalankan Server
    └── package.json            # Daftar Pustaka Backend
```

---

## 📖 PANDUAN CARA MENJALANKAN APLIKASI (UNTUK PEMULA)

> 💡 **Penjelasan Singkat untuk Pemula:**  
> Aplikasi website ini terdiri dari 2 bagian utama:
> 1. **Server (Backend/Express):** Bertindak sebagai "mesin" yang mengolah data dan mengubungkan ke database.
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
   `🚀 Server SiKelas berjalan di port 5000` atau `connected to Supabase`.  
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
