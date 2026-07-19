import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function runSeeder() {
    console.log('🚀 Memulai proses injeksi data...\n')

    // ----------------------------------------------------
    // 1. INJEKSI RUANGAN
    // ----------------------------------------------------
    console.log('1️⃣ Menambahkan data Ruangan...')
    const roomsData = [
        { nama: 'A101', kampus: 'Kampus 1', gedung: 'Gedung A', lantai: '1', kapasitas: 40, status: 'tersedia' },
        { nama: 'A102', kampus: 'Kampus 1', gedung: 'Gedung A', lantai: '1', kapasitas: 40, status: 'tersedia' },
        { nama: 'A201', kampus: 'Kampus 1', gedung: 'Gedung A', lantai: '2', kapasitas: 50, status: 'tersedia' },
        { nama: 'B101', kampus: 'Kampus 1', gedung: 'Gedung B', lantai: '1', kapasitas: 60, status: 'tersedia' },
        { nama: 'B302', kampus: 'Kampus 2', gedung: 'Gedung B', lantai: '3', kapasitas: 30, status: 'tersedia' },
        { nama: 'C303', kampus: 'Kampus 3', gedung: 'Gedung C', lantai: '3', kapasitas: 30, status: 'tersedia' },
        { nama: 'D404', kampus: 'Kampus 4', gedung: 'Gedung D', lantai: '4', kapasitas: 40, status: 'tersedia' },
        { nama: 'E505', kampus: 'Kampus 5', gedung: 'Gedung E', lantai: '5', kapasitas: 50, status: 'tersedia' },
        { nama: 'F606', kampus: 'Kampus 6', gedung: 'Gedung F', lantai: '6', kapasitas: 60, status: 'tersedia' },
        { nama: 'G707', kampus: 'Kampus 7', gedung: 'Gedung G', lantai: '7', kapasitas: 70, status: 'tersedia' },
        { nama: 'H808', kampus: 'Kampus 8', gedung: 'Gedung H', lantai: '8', kapasitas: 80, status: 'tersedia' },
        { nama: 'I909', kampus: 'Kampus 9', gedung: 'Gedung I', lantai: '9', kapasitas: 90, status: 'tersedia' },
        { nama: 'J1010', kampus: 'Kampus 10', gedung: 'Gedung J', lantai: '10', kapasitas: 30, status: 'tersedia' },
        { nama: 'K1111', kampus: 'Kampus 11', gedung: 'Gedung K', lantai: '11', kapasitas: 30, status: 'tersedia' },
        { nama: 'C312', kampus: 'Kampus 2', gedung: 'Gedung C', lantai: '3', kapasitas: 30, status: 'tersedia' },
        { nama: 'Lab Komputer 1', kampus: 'Kampus 1', gedung: 'Gedung Lab', lantai: '1', kapasitas: 35, status: 'tersedia' }
    ]

    const { data: insertedRooms, error: roomError } = await supabase
        .from('rooms')
        .insert(roomsData)
        .select()

    if (roomError) {
        console.error('Gagal memasukkan ruangan:', roomError)
        return
    }
    console.log(`✅ ${insertedRooms.length} Ruangan berhasil ditambahkan!`)


    // ----------------------------------------------------
    // 2. INJEKSI AKUN PJ
    // ----------------------------------------------------
    console.log('\n2️⃣ Menambahkan data Akun PJ...')
    const salt = await bcrypt.genSalt(10)
    const defaultPassword = await bcrypt.hash('password123', salt)

    const usersData = [
        { nama: 'Budi Santoso', nim: '1903001', email: 'budi@mhs.edu', password: defaultPassword, prodi: 'Teknik Informatika', role: 'pj', status: 'aktif' },
        { nama: 'Siti Aminah', nim: '1903002', email: 'siti@mhs.edu', password: defaultPassword, prodi: 'Sistem Informasi', role: 'pj', status: 'aktif' },
        { nama: 'Dimas Salto', nim: '1903004', email: 'pj1@mhs.edu', password: defaultPassword, prodi: 'Ultra Neo', role: 'pj', status: 'aktif' },
        { nama: 'mamah gufron', nim: '1903005', email: 'pj2@mhs.edu', password: defaultPassword, prodi: 'Bahasa Suryani', role: 'pj', status: 'aktif' },
        { nama: 'Andi Wijaya', nim: '1903003', email: 'andi@mhs.edu', password: defaultPassword, prodi: 'Teknik Komputer', role: 'pj', status: 'aktif' }
    ]

    // Upsert akan membatalkan insert jika email sudah terdaftar sebelumnya
    const { error: userError } = await supabase
        .from('users')
        .upsert(usersData, { onConflict: 'email' })

    if (userError) console.error('Gagal memasukkan users:', userError)
    else console.log('✅ 3 Akun PJ berhasil ditambahkan! (Email: budi@mhs.edu, Pass: password123)')


    // ----------------------------------------------------
    // 3. INJEKSI JADWAL SIAKAD (Schedules)
    // ----------------------------------------------------
    console.log('\n3️⃣ Menambahkan data Jadwal Kuliah Reguler (SIAKAD)...')

    const idA101 = insertedRooms.find(r => r.nama === 'A101')?.id
    const idB101 = insertedRooms.find(r => r.nama === 'B101')?.id
    const idB302 = insertedRooms.find(r => r.nama === 'B302')?.id
    const idC303 = insertedRooms.find(r => r.nama === 'C303')?.id
    const idD404 = insertedRooms.find(r => r.nama === 'D404')?.id
    const idI909 = insertedRooms.find(r => r.nama === 'I909')?.id

    if (idA101 && idB101 && idB302 && idC303 && idD404 && idI909) {
        const schedulesData = [
            { room_id: idA101, mata_kuliah: 'Struktur Data', dosen: 'Dr. Ilham, M.Kom', hari: 'Senin', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' },
            { room_id: idA101, mata_kuliah: 'Pengantar Psikologi', dosen: 'Prof. Dina, S.Psi', hari: 'Senin', waktu_mulai: '13:00:00', waktu_selesai: '15:30:00' },
            { room_id: idA101, mata_kuliah: 'Hukum Dagang', dosen: 'Bapak Surya, S.H.', hari: 'Rabu', waktu_mulai: '09:00:00', waktu_selesai: '11:30:00' },
            { room_id: idA101, mata_kuliah: 'Sejarah Peradaban', dosen: 'Bapak Rudi, M.Hum', hari: 'Jumat', waktu_mulai: '08:00:00', waktu_selesai: '10:00:00' },

            // Ruang B101
            { room_id: idB101, mata_kuliah: 'Kalkulus Lanjut', dosen: 'Ibu Ratna, M.Sc', hari: 'Selasa', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' },
            { room_id: idB101, mata_kuliah: 'Sosiologi Perkotaan', dosen: 'Dr. Bima, M.Sos', hari: 'Rabu', waktu_mulai: '10:00:00', waktu_selesai: '12:00:00' },
            { room_id: idB101, mata_kuliah: 'Manajemen Keuangan', dosen: 'Ibu Tika, S.E., M.M.', hari: 'Kamis', waktu_mulai: '14:00:00', waktu_selesai: '16:30:00' },
            { room_id: idB101, mata_kuliah: 'Antropologi Budaya', dosen: 'Bu Yuni, S.Sos', hari: 'Jumat', waktu_mulai: '13:30:00', waktu_selesai: '15:30:00' },
            // Ruang B302
            { room_id: idB302, mata_kuliah: 'Public Speaking', dosen: 'Bapak Andre, M.I.Kom', hari: 'Jumat', waktu_mulai: '08:00:00', waktu_selesai: '10:00:00' },
            { room_id: idB302, mata_kuliah: 'Filsafat Ilmu', dosen: 'Dr. Hendra, M.Fil', hari: 'Senin', waktu_mulai: '15:00:00', waktu_selesai: '17:00:00' },
            { room_id: idB302, mata_kuliah: 'Komunikasi Visual', dosen: 'Bu Citra, S.I.Kom', hari: 'Selasa', waktu_mulai: '09:00:00', waktu_selesai: '11:30:00' },
            { room_id: idB302, mata_kuliah: 'Pengantar Ilmu Politik', dosen: 'Pak Rahman, S.IP', hari: 'Kamis', waktu_mulai: '13:00:00', waktu_selesai: '15:30:00' },
            // Ruang C303
            { room_id: idC303, mata_kuliah: 'Basis Data', dosen: 'Pak Anton, M.T.', hari: 'Selasa', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' },
            { room_id: idC303, mata_kuliah: 'Makroekonomi', dosen: 'Prof. Widya, M.E.', hari: 'Kamis', waktu_mulai: '11:00:00', waktu_selesai: '13:30:00' },
            { room_id: idC303, mata_kuliah: 'Etika Profesi', dosen: 'Dr. Slamet, M.Hum', hari: 'Sabtu', waktu_mulai: '09:00:00', waktu_selesai: '11:00:00' },
            { room_id: idC303, mata_kuliah: 'Akuntansi Dasar', dosen: 'Bu Nita, M.Ak', hari: 'Senin', waktu_mulai: '10:00:00', waktu_selesai: '12:30:00' },
            // Ruang D404
            { room_id: idD404, mata_kuliah: 'Desain Grafis', dosen: 'Mbak Sarah, S.Sn', hari: 'Rabu', waktu_mulai: '13:00:00', waktu_selesai: '16:00:00' },
            { room_id: idD404, mata_kuliah: 'Sastra Inggris', dosen: 'Mr. John Doe, M.A.', hari: 'Kamis', waktu_mulai: '08:00:00', waktu_selesai: '10:00:00' },
            { room_id: idD404, mata_kuliah: 'Sastra Jepang', dosen: 'Sensei Akira, M.Hum', hari: 'Selasa', waktu_mulai: '14:00:00', waktu_selesai: '16:30:00' },
            { room_id: idD404, mata_kuliah: 'Fotografi Jurnalistik', dosen: 'Pak Denny, S.Sn', hari: 'Jumat', waktu_mulai: '09:00:00', waktu_selesai: '11:30:00' },
            // Ruangan I909
            { room_id: idI909, mata_kuliah: 'Praktikum Jaringan Komputer', dosen: 'Mas Reza, S.Kom', hari: 'Selasa', waktu_mulai: '13:00:00', waktu_selesai: '16:00:00' },
            { room_id: idI909, mata_kuliah: 'Data Mining', dosen: 'Bu Siska, Ph.D.', hari: 'Jumat', waktu_mulai: '14:00:00', waktu_selesai: '16:30:00' },
            { room_id: idI909, mata_kuliah: 'Data Mining', dosen: 'Bu Siska, Ph.D.', hari: 'Jumat', waktu_mulai: '14:00:00', waktu_selesai: '16:30:00' },
            { room_id: idI909, mata_kuliah: 'Pemrograman Python', dosen: 'Pak Galih, M.Kom', hari: 'Senin', waktu_mulai: '08:00:00', waktu_selesai: '11:00:00' },
            { room_id: idI909, mata_kuliah: 'Desain UI/UX', dosen: 'Bu Farah, M.Ds', hari: 'Rabu', waktu_mulai: '09:00:00', waktu_selesai: '12:00:00' }
        ]

        const { error: scheduleError } = await supabase
            .from('schedules')
            .insert(schedulesData)

        if (scheduleError) console.error('Gagal memasukkan jadwal:', scheduleError)
        else console.log(`✅ ${schedulesData.length} Jadwal Reguler berhasil ditambahkan!`)
    }

    console.log('\n🎉 PROSES SEEDING SELESAI!')
}

runSeeder()
