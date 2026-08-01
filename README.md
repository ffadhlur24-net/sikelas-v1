# SiKelas - Sistem Informasi Manajemen & Reservasi Kelas 🎓

**SiKelas** adalah platform aplikasi web cerdas yang dirancang untuk mengatasi permasalahan manajemen ruang kelas di lingkungan kampus UIN Walisongo Semarang. Aplikasi ini memfasilitasi transparansi jadwal, mempercepat peminjaman ruang, serta mencegah terjadinya tumpang tindih (*double booking*) antara jadwal kuliah reguler SIAKAD dengan kegiatan insidental.

---

## 🌟 Fitur Utama (Core Features)

- **Manajemen Ketersediaan Real-Time**: Dasbor pemantauan status ruang kelas (Tersedia, Digunakan, Perbaikan).
- **Anti Double-Booking System (Pencegah Konflik)**: Algoritma validasi otomatis pada *backend* yang menolak reservasi jika jadwal bertabrakan dengan jadwal SIAKAD reguler atau reservasi pengguna lain.
- **Reservasi Mandiri Berbasis SKS**: Antarmuka peminjaman ruangan yang cepat dan transparan untuk Penanggung Jawab (PJ) kelas dengan kalkulasi jam selesai otomatis berbasis SKS.
- **Role-Based Access Control (RBAC)**: Pemisahan hak akses yang jelas antara **Admin** (Pengelola/Staf) dan **PJ** (Mahasiswa Penanggung Jawab).
- **Navigasi Berjenjang Terstruktur**: Manajemen Ruangan 3 Level (Kampus ➔ Gedung ➔ Ruangan per Lantai) dan Manajemen Prodi 2 Level (Fakultas ➔ Sub-Prodi).
- **Proteksi Keamanan Rate Limiting**: Sistem otomatis yang mengunci percobaan login jika terjadi salah password 5 kali berturut-turut demi keamanan akun.
- **Fitur Pelaporan Kendala**: Fitur bagi PJ untuk melaporkan fasilitas kelas bermasalah lengkap dengan pilihan alasan custom.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

- **Frontend (Tampilan Web):** React.js (Vite), React Router DOM, Axios, Vanilla CSS Custom.
- **Backend (Mesin Server):** Node.js, Express.js, JWT (JSON Web Tokens), Bcryptjs.
- **Database (Penyimpanan Data):** Supabase (PostgreSQL Cloud).

---

## 📖 PANDUAN MUDAH MENJALANKAN APLIKASI (UNTUK PEMULA)

> 💡 **Penjelasan Singkat untuk Pemula:**  
> Aplikasi website ini terdiri dari 2 bagian utama:
> 1. **Server (Backend/Express):** Bertindak sebagai "mesin" yang mengolah data dan mengubungkan ke database.
> 2. **Client (Frontend/React):** Bertindak sebagai "layar tampilan" yang dilihat oleh pengguna di browser.
> 
> **Keduanya harus dijalankan secara bersamaan agar website dapat berfungsi sempurna!**

---

### 📋 Prasyarat Awal (Yang Harus Diinstal)
Sebelum mulai, pastikan komputer Anda sudah terpasang:
1. **Node.js** (Aplikasi penjalun kode JavaScript di komputer): [Download Node.js di sini](https://nodejs.org/) (Pilih versi LTS).
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
