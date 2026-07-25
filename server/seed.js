import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase dengan Service Key
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function runSeeder() {
    console.log('🚀 Memulai Pembersihan & Injeksi Data SIAKAD Baru...\n')

    try {
        // ----------------------------------------------------
        // 1. PEMBERSIHAN DATA SEMENTARA (WIPING STALE DATA)
        // ----------------------------------------------------
        console.log('🧹 1. Menghapus data reservasi lama...')
        await supabase.from('reservations').delete().not('id', 'is', null)

        console.log('🧹 2. Menghapus data jadwal reguler lama...')
        await supabase.from('schedules').delete().not('id', 'is', null)

        console.log('🧹 3. Menghapus akun PJ lama (Akun Admin tetap aman)...')
        await supabase.from('users').delete().eq('role', 'pj')


        // ----------------------------------------------------
        // 2. MENGAMBIL ID RUANGAN YANG SUDAH ADA
        // ----------------------------------------------------
        console.log('🔍 Mengambil ID ruangan dari database...')
        const { data: existingRooms, error: roomError } = await supabase
            .from('rooms')
            .select('id, nama')

        if (roomError || !existingRooms || existingRooms.length === 0) {
            console.error('⚠️ Tidak ada ruangan ditemukan di database! Harap isi tabel rooms terlebih dahulu.')
            return
        }

        const idA101 = existingRooms.find(r => r.nama === 'A101')?.id || existingRooms[0].id
        const idB101 = existingRooms.find(r => r.nama === 'B101')?.id || existingRooms[0].id
        const idC303 = existingRooms.find(r => r.nama === 'C303')?.id || existingRooms[0].id
        const idD404 = existingRooms.find(r => r.nama === 'D404')?.id || existingRooms[0].id

        // ----------------------------------------------------
        // 3. INJEKSI JADWAL SIAKAD LENGKAP (Prodi, Semester, Kelas)
        // ----------------------------------------------------
        console.log('📦 Menambahkan data Jadwal SIAKAD Baru (Lengkap dengan Prodi, Semester, Kelas)...')

        const schedulesData = [
            // --- TEKNIK INFORMATIKA (TI) - SEMESTER 3 - KELAS A ---
            { room_id: idA101, prodi: 'Teknik Informatika', semester: '3', kelas: 'A', mata_kuliah: 'Struktur Data', dosen: 'Dr. Ilham, M.Kom', hari: 'Senin', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' },
            { room_id: idB101, prodi: 'Teknik Informatika', semester: '3', kelas: 'A', mata_kuliah: 'Pemrograman Web', dosen: 'Pak Anton, M.T.', hari: 'Selasa', waktu_mulai: '10:00:00', waktu_selesai: '12:30:00' },
            { room_id: idC303, prodi: 'Teknik Informatika', semester: '3', kelas: 'A', mata_kuliah: 'Basis Data', dosen: 'Bu Siska, Ph.D.', hari: 'Rabu', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' },

            // --- TEKNIK INFORMATIKA (TI) - SEMESTER 3 - KELAS B ---
            { room_id: idA101, prodi: 'Teknik Informatika', semester: '3', kelas: 'B', mata_kuliah: 'Struktur Data', dosen: 'Dr. Ilham, M.Kom', hari: 'Selasa', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' },
            { room_id: idD404, prodi: 'Teknik Informatika', semester: '3', kelas: 'B', mata_kuliah: 'Pemrograman Web', dosen: 'Pak Anton, M.T.', hari: 'Kamis', waktu_mulai: '13:00:00', waktu_selesai: '15:30:00' },

            // --- SISTEM INFORMASI (SI) - SEMESTER 1 - KELAS A ---
            { room_id: idB101, prodi: 'Sistem Informasi', semester: '1', kelas: 'A', mata_kuliah: 'Pengantar Teknologi Informasi', dosen: 'Ibu Ratna, M.Sc', hari: 'Senin', waktu_mulai: '10:00:00', waktu_selesai: '12:30:00' },
            { room_id: idC303, prodi: 'Sistem Informasi', semester: '1', kelas: 'A', mata_kuliah: 'Algoritma & Pemrograman', dosen: 'Pak Galih, M.Kom', hari: 'Rabu', waktu_mulai: '13:00:00', waktu_selesai: '15:30:00' },

            // --- TEKNIK KOMPUTER (TK) - SEMESTER 5 - KELAS A ---
            { room_id: idD404, prodi: 'Teknik Komputer', semester: '5', kelas: 'A', mata_kuliah: 'Jaringan Komputer', dosen: 'Mas Reza, S.Kom', hari: 'Jumat', waktu_mulai: '08:00:00', waktu_selesai: '10:30:00' }
        ]

        const { error: scheduleError } = await supabase
            .from('schedules')
            .insert(schedulesData)

        if (scheduleError) {
            console.error('❌ Gagal memasukkan jadwal:', scheduleError)
        } else {
            console.log(`✅ Berhasil menginjeksikan ${schedulesData.length} Jadwal SIAKAD Baru!`)
        }

        console.log('\n🎉 PROSES RE-SEEDING SELESAI DENGAN RAPIH!')

    } catch (err) {
        console.error('💥 Terjadi kesalahan fatal:', err)
    }
}

runSeeder()
