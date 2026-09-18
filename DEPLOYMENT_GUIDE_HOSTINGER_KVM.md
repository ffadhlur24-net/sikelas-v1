# Panduan Deployment SiKelas di Hostinger KVM (VPS)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan hosting dan deployment sistem **SiKelas** (Frontend React Vite + Backend Node.js Express + Supabase) di VPS Hostinger KVM berbasis OS **Ubuntu 22.04 / 24.04 LTS**.

---

## 1. Persiapan Awal di Server VPS

Masuk ke VPS melalui SSH (menggunakan Terminal, PowerShell, atau PuTTY):
```bash
ssh root@IP_SERVER_HOSTINGER
```

### Update & Install Dependensi Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw build-essential
```

### Install Node.js v20 (LTS) & PM2
```bash
# Tambahkan repository NodeSource v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi (harus v20.x dan npm v10.x)
node -v
npm -v

# Install PM2 (Process Manager agar server selalu berjalan di background)
sudo npm install -g pm2
```

---

## 2. Mengunggah Kode & Struktur Direktori

Buat direktori kerja aplikasi di `/var/www/sikelas`:
```bash
sudo mkdir -p /var/www/sikelas
sudo chown -R $USER:$USER /var/www/sikelas
cd /var/www/sikelas

# Clone repositori Anda (atau upload via SCP/SFTP)
git clone <URL_REPOSITORY_ANDA> .
```

Struktur folder yang diharapkan:
```
/var/www/sikelas/
├── client/
└── server/
```

---

## 3. Konfigurasi & Menjalankan Backend (Server)

### 3.1. Install Dependensi Server
```bash
cd /var/www/sikelas/server
npm install --production
```

### 3.2. Setup Environment Variable Backend (`.env`)
Salin dari `.env.example` dan sesuaikan nilainya:
```bash
cp .env.example .env
nano .env
```
Isi konfigurasi `.env` sesuai kredensial Supabase & Resend produksi:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
JWT_SECRET=buat-string-rahasia-panjang-dan-acak-minimal-32-karakter
RESEND_API_KEY=re_your_resend_api_key
FRONTEND_URL=https://sikelas.online
```
*(Tekan `Ctrl + O` lalu `Enter` untuk simpan, `Ctrl + X` untuk keluar dari nano).*

### 3.3. Jalankan Backend dengan PM2
```bash
# Mulai proses backend
pm2 start index.js --name "sikelas-api"

# Pastikan proses otomatis restart jika server VPS reboot/restart
pm2 startup
# (Jalankan perintah sudo env PATH... yang ditampilkan di terminal jika ada)
pm2 save

# Periksa status
pm2 status
```

Untuk melihat log backend:
```bash
pm2 logs sikelas-api
```

---

## 4. Konfigurasi & Build Frontend (Client)

### 4.1. Setup Environment Variable Frontend (`.env`)
```bash
cd /var/www/sikelas/client
cp .env.example .env
nano .env
```
Setel URL API publik domain Anda:
```env
VITE_API_BASE_URL=https://sikelas.online/api
```

### 4.2. Install & Build Bundle Vite
```bash
npm install
npm run build
```
Hasil build produksi yang siap disajikan Nginx akan berada di folder `/var/www/sikelas/client/dist`.

---

## 5. Konfigurasi Nginx (Reverse Proxy & Web Server)

Buat file konfigurasi Nginx untuk domain aplikasi:
```bash
sudo nano /etc/nginx/sites-available/sikelas
```

Tempel konfigurasi berikut (ganti `sikelas.online` dengan domain Anda):
```nginx
server {
    listen 80;
    server_name sikelas.online www.sikelas.online;

    # 1. Routing Frontend (Static Assets dari Vite Dist)
    root /var/www/sikelas/client/dist;
    index index.html;

    # Fallback untuk React Router (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Static Assets untuk Kecepatan Loading
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 2. Reverse Proxy untuk Backend API Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi situs dan uji sintaks Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sikelas /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Pasang SSL Gratis (HTTPS) dengan Let's Encrypt

Pastikan DNS domain Anda (A Record) sudah mengarah ke IP VPS Hostinger.
```bash
# Install Certbot Nginx
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan dan terapkan sertifikat SSL otomatis
sudo certbot --nginx -d sikelas.online -d www.sikelas.online
```
Certbot akan memperbarui file Nginx Anda secara otomatis ke port 443 (HTTPS) dengan renewal otomatis.

---

## 7. Pengamanan Firewall (UFW)

Aktifkan firewall VPS agar hanya port yang diperlukan yang terbuka:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 8. Panduan Update di Masa Mendatang (Deployment Rutin)

Ketika ada update kode di masa mendatang, cukup jalankan:
```bash
cd /var/www/sikelas
git pull origin main

# Update Backend
cd server
npm install --production
pm2 restart sikelas-api

# Update Frontend
cd ../client
npm install
npm run build

echo "Update Selesai!"
```
