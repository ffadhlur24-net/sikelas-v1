# SiKelas - Sistem Informasi Manajemen & Reservasi Kelas 🎓

SiKelas adalah sebuah platform aplikasi web cerdas yang dirancang untuk mengatasi permasalahan manajemen ruang kelas di lingkungan kampus. Aplikasi ini memfasilitasi transparansi jadwal, mempercepat birokrasi peminjaman ruang, serta mencegah terjadinya tumpang tindih (*double booking*) antara jadwal kuliah reguler dengan kegiatan insidental.

## 🌟 Fitur Utama (Core Features)

- **Manajemen Ketersediaan Real-Time**: Dasbor pemantauan status ruang kelas (Tersedia, Digunakan, Perbaikan).
- **Anti Double-Booking System (Pencegah Konflik)**: Algoritma validasi otomatis pada *backend* yang menolak reservasi jika jadwal bertabrakan dengan jadwal SIAKAD reguler atau reservasi pengguna lain.
- **Reservasi Mandiri (Ad-Hoc)**: Antarmuka pengajuan peminjaman ruangan yang cepat dan transparan untuk Penanggung Jawab (PJ) kelas.
- **Role-Based Access Control (RBAC)**: Pemisahan hak akses yang jelas antara **Admin** (Pengelola/Staf) dan **PJ** (Mahasiswa Penanggung Jawab).
- **Sistem Pelaporan Aset (Ticketing)**: Fitur bagi PJ untuk melaporkan kerusakan fasilitas kelas, lengkap dengan dasbor resolusi untuk Admin.
- **Keamanan JWT & Enkripsi Data**: Otentikasi sesi yang aman menggunakan *JSON Web Token* (JWT) dan enkripsi kata sandi menggunakan *bcrypt*.

## 🛠️ Tech Stack

**Frontend:**
- React.js (Vite)
- React Router DOM
- Axios (HTTP Client)
- Vanilla CSS (Custom UI/UX)

**Backend:**
- Node.js
- Express.js
- JWT (JSON Web Tokens)
- Bcryptjs

**Database:**
- Supabase (PostgreSQL)

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi (Local Development)

### 1. Prasyarat
Pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (versi 16 atau lebih baru)
- Git
- Akun [Supabase](https://supabase.com/)

### 2. Kloning Repositori
```bash
git clone https://github.com/USERNAME_ANDA/sikelas.git
cd sikelas
```

### 3. Konfigurasi Database (Supabase)
Buat proyek baru di Supabase, kemudian jalankan *Query SQL* untuk membuat struktur tabel berikut:
- `users` (Data akun PJ & Admin)
- `rooms` (Data ruang kelas)
- `schedules` (Data jadwal kuliah reguler/SIAKAD)
- `reservations` (Data peminjaman insidental)
- `reports` (Data log pelaporan kelas)

### 4. Menjalankan Backend API
Buka terminal dan arahkan ke folder `server`:
```bash
cd server
npm install
```
Buat file `.env` di dalam folder `server` dengan variabel berikut:
```env
PORT=5000
SUPABASE_URL=URL_SUPABASE_ANDA
SUPABASE_SERVICE_KEY=SERVICE_KEY_SUPABASE_ANDA
JWT_SECRET=rahasia_jwt_anda
JWT_EXPIRES_IN=7d
```
(Opsional) Anda dapat menyuntikkan data *dummy* awal dengan menjalankan:
```bash
node seed.js
```
Jalankan server:
```bash
npm run dev
```

### 5. Menjalankan Frontend Web
Buka terminal baru dan arahkan ke folder `client`:
```bash
cd client
npm install
npm run dev
```
Aplikasi frontend akan berjalan di `http://localhost:5173`.

---

## 📌 Status Proyek (Project Status)

Proyek **SiKelas** saat ini berada pada tahap **Versi Pertama (v1.0)**. 
Fondasi utama, logika peminjaman, serta integrasi *backend* sudah berjalan secara fungsional. Karena ini adalah versi awal, masih sangat banyak ruang bagi proyek ini untuk terus dikembangkan menjadi ekosistem yang jauh lebih masif (seperti integrasi IoT, Notifikasi WhatsApp, dll) di masa mendatang.

Bagi rekan-rekan yang telah dipilih atau diundang untuk berkolaborasi mengembangkan proyek ini, silakan berkoordinasi secara langsung dengan pemilik repositori (*maintainer*) untuk pembagian tugas pengembangan selanjutnya.

## 📜 Lisensi
Proyek ini didistribusikan di bawah lisensi MIT. Silakan gunakan, modifikasi, dan kembangkan proyek ini secara bebas.
