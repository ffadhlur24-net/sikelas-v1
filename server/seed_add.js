// =========================================================
// Script Seeding Data Rapi & Terstruktur (seed_add.js)
// =========================================================
// Menyaingi dan menyuntikkan data master ruangan (3 Kampus, 2 Gedung per Kampus)
// serta Jadwal Perkuliahan SIAKAD yang teratur di Kampus 3 (Gedung Q & Gedung K).
// =========================================================

import 'dotenv/config'
import supabase from './config/supabase.js'

async function seedData() {
  console.log('🚀 Memulai penyuntikan data baru yang super rapi...')

  try {
    // 1. DAFTAR RUANGAN MASTER (3 KAMPUS, 2 GEDUNG PER KAMPUS)
    // Ruangan diisi lengkap pada Kampus 3 (Gedung Q dan Gedung K)
    const roomPayloads = [
      // --- KAMPUS 3 : GEDUNG Q ---
      { nama: 'Q.1.1', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 1, kapasitas: 45, status: 'tersedia' },
      { nama: 'Q.1.2', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 1, kapasitas: 45, status: 'tersedia' },
      { nama: 'Lab Komputer 1', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 1, kapasitas: 35, status: 'tersedia' },
      { nama: 'Q.2.1', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 2, kapasitas: 50, status: 'tersedia' },
      { nama: 'Q.2.2', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 2, kapasitas: 50, status: 'tersedia' },
      { nama: 'Lab Komputer 2', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 2, kapasitas: 35, status: 'tersedia' },
      { nama: 'Q.3.1', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 3, kapasitas: 50, status: 'tersedia' },
      { nama: 'Q.3.2', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 3, kapasitas: 50, status: 'tersedia' },
      { nama: 'Auditorium Q', kampus: 'Kampus 3', gedung: 'Gedung Q', lantai: 3, kapasitas: 120, status: 'tersedia' },

      // --- KAMPUS 3 : GEDUNG K ---
      { nama: 'K.1.1', kampus: 'Kampus 3', gedung: 'Gedung K', lantai: 1, kapasitas: 40, status: 'tersedia' },
      { nama: 'K.1.2', kampus: 'Kampus 3', gedung: 'Gedung K', lantai: 1, kapasitas: 40, status: 'tersedia' },
      { nama: 'K.2.1', kampus: 'Kampus 3', gedung: 'Gedung K', lantai: 2, kapasitas: 40, status: 'tersedia' },
      { nama: 'K.2.2', kampus: 'Kampus 3', gedung: 'Gedung K', lantai: 2, kapasitas: 40, status: 'tersedia' },

      // --- KAMPUS 1 : GEDUNG A & GEDUNG B (PLACEHOLDER GEDUNG) ---
      { nama: 'A.1.1 (Utama)', kampus: 'Kampus 1', gedung: 'Gedung A', lantai: 1, kapasitas: 40, status: 'tersedia' },
      { nama: 'B.1.1 (Utama)', kampus: 'Kampus 1', gedung: 'Gedung B', lantai: 1, kapasitas: 40, status: 'tersedia' },

      // --- KAMPUS 2 : GEDUNG C & GEDUNG D (PLACEHOLDER GEDUNG) ---
      { nama: 'C.1.1 (Utama)', kampus: 'Kampus 2', gedung: 'Gedung C', lantai: 1, kapasitas: 40, status: 'tersedia' },
      { nama: 'D.1.1 (Utama)', kampus: 'Kampus 2', gedung: 'Gedung D', lantai: 1, kapasitas: 40, status: 'tersedia' }
    ]

    console.log('📌 Menyuntikkan data Ruangan (Kampus 1, 2, 3)...')
    const { data: insertedRooms, error: roomError } = await supabase
      .from('rooms')
      .insert(roomPayloads)
      .select()

    if (roomError) throw roomError
    console.log(`✅ Berhasil menyuntikkan ${insertedRooms.length} ruangan.`)

    // Buat Map Nama Ruangan ➔ ID Ruangan
    const roomMap = {}
    insertedRooms.forEach(r => { roomMap[r.nama] = r.id })

    // 2. DAFTAR JADWAL PERKULIAHAN SIAKAD RAPI & BEBAS BENTROK
    const schedulePayloads = [
      // --- SENIN ---
      {
        room_id: roomMap['Q.1.1'],
        prodi: 'Teknik Informatika',
        semester: '4',
        kelas: 'A',
        mata_kuliah: 'Pemrograman Web',
        dosen: 'Dr. Ilham, M.Kom',
        hari: 'Senin',
        waktu_mulai: '07:30:00',
        waktu_selesai: '10:00:00'
      },
      {
        room_id: roomMap['Q.1.1'],
        prodi: 'Sistem Informasi',
        semester: '2',
        kelas: 'B',
        mata_kuliah: 'Basis Data Lanjut',
        dosen: 'Prof. Ahmad, M.T',
        hari: 'Senin',
        waktu_mulai: '10:15:00',
        waktu_selesai: '12:45:00'
      },
      {
        room_id: roomMap['Q.2.1'],
        prodi: 'Teknik Komputer',
        semester: '4',
        kelas: 'A',
        mata_kuliah: 'Arsitektur Komputer',
        dosen: 'Haryanto, M.T',
        hari: 'Senin',
        waktu_mulai: '07:30:00',
        waktu_selesai: '10:00:00'
      },
      {
        room_id: roomMap['K.1.1'],
        prodi: 'Perbankan Syariah',
        semester: '2',
        kelas: 'A',
        mata_kuliah: 'Ekonomi Islam',
        dosen: 'Hj. Siti, M.E',
        hari: 'Senin',
        waktu_mulai: '13:00:00',
        waktu_selesai: '15:30:00'
      },

      // --- SELASA ---
      {
        room_id: roomMap['Q.1.2'],
        prodi: 'Teknik Informatika',
        semester: '6',
        kelas: 'A',
        mata_kuliah: 'Kecerdasan Buatan',
        dosen: 'Dr. Aris, M.Cs',
        hari: 'Selasa',
        waktu_mulai: '07:30:00',
        waktu_selesai: '10:00:00'
      },
      {
        room_id: roomMap['Q.2.2'],
        prodi: 'Sistem Informasi',
        semester: '4',
        kelas: 'A',
        mata_kuliah: 'Analisis Perancangan Sistem',
        dosen: 'NUR INDAH, M.Kom',
        hari: 'Selasa',
        waktu_mulai: '10:15:00',
        waktu_selesai: '12:45:00'
      },
      {
        room_id: roomMap['K.2.1'],
        prodi: 'Pendidikan Agama Islam',
        semester: '4',
        kelas: 'C',
        mata_kuliah: 'Metode Penelitian Pendidikan',
        dosen: 'Dr. Usman, Ag.',
        hari: 'Selasa',
        waktu_mulai: '07:30:00',
        waktu_selesai: '10:00:00'
      },

      // --- RABU ---
      {
        room_id: roomMap['Lab Komputer 1'],
        prodi: 'Teknik Informatika',
        semester: '4',
        kelas: 'A',
        mata_kuliah: 'Praktikum Pemrograman Web',
        dosen: 'Dr. Ilham, M.Kom',
        hari: 'Rabu',
        waktu_mulai: '08:00:00',
        waktu_selesai: '11:00:00'
      },
      {
        room_id: roomMap['Q.3.1'],
        prodi: 'Matematika',
        semester: '2',
        kelas: 'A',
        mata_kuliah: 'Kalkulus Lanjut',
        dosen: 'Dr. Retno, M.Sc',
        hari: 'Rabu',
        waktu_mulai: '10:15:00',
        waktu_selesai: '12:45:00'
      },

      // --- KAMIS ---
      {
        room_id: roomMap['Q.1.1'],
        prodi: 'Teknik Informatika',
        semester: '4',
        kelas: 'B',
        mata_kuliah: 'Pemrograman Web',
        dosen: 'Dr. Ilham, M.Kom',
        hari: 'Kamis',
        waktu_mulai: '07:30:00',
        waktu_selesai: '10:00:00'
      },
      {
        room_id: roomMap['Q.3.2'],
        prodi: 'Fisika',
        semester: '4',
        kelas: 'A',
        mata_kuliah: 'Fisika Kuantum',
        dosen: 'Prof. Bambang, Ph.D',
        hari: 'Kamis',
        waktu_mulai: '13:00:00',
        waktu_selesai: '15:30:00'
      },

      // --- JUMAT ---
      {
        room_id: roomMap['Auditorium Q'],
        prodi: 'Teknik Informatika',
        semester: '2',
        kelas: 'A',
        mata_kuliah: 'Pancasila & Kewarganegaraan',
        dosen: 'Drs. H. Mulyadi, M.Pd',
        hari: 'Jumat',
        waktu_mulai: '08:00:00',
        waktu_selesai: '10:30:00'
      }
    ]

    console.log('📌 Menyuntikkan Jadwal SIAKAD Reguler yang Rapi...')
    const { data: insertedScheds, error: schedError } = await supabase
      .from('schedules')
      .insert(schedulePayloads)
      .select()

    if (schedError) throw schedError
    console.log(`✅ Berhasil menyuntikkan ${insertedScheds.length} jadwal perkuliahan.`)

    console.log('\n✨ PENYUNTIKAN DATA RAPI SELESAI DENGAN SUKSES! 🚀')
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding data:', error)
  }
}

seedData()