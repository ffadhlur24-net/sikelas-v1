// =========================================================
// Script Pembersih Data Supabase (seed_clear.js)
// =========================================================
// Menghapus data transaksi (reports, reservations, schedules, rooms)
// TANPA MENGHAPUS data master 'users' dan 'departments'.
// =========================================================

import 'dotenv/config' // 👈 WAJIB UNTUK MEMUAT VARIABEL LINGKUNGAN (.env)
import supabase from './config/supabase.js'

async function clearDatabase() {
  console.log('🧹 Memulai pembersihan data Supabase (Kecuali Users & Departments)...')

  try {
    // 1. Hapus Tabel Reports (Laporan Kelas Kosong)
    const { error: repError } = await supabase.from('reports').delete().neq('id', 0)
    if (repError) console.error('⚠️ Gagal membersihkan reports:', repError.message)
    else console.log('✅ Tabel reports berhasil dibersihkan.')

    // 2. Hapus Tabel Reservations (Reservasi Peminjaman Ruangan)
    const { error: resError } = await supabase.from('reservations').delete().neq('id', 0)
    if (resError) console.error('⚠️ Gagal membersihkan reservations:', resError.message)
    else console.log('✅ Tabel reservations berhasil dibersihkan.')

    // 3. Hapus Tabel Schedules (Jadwal Perkuliahan SIAKAD)
    const { error: schError } = await supabase.from('schedules').delete().neq('id', 0)
    if (schError) console.error('⚠️ Gagal membersihkan schedules:', schError.message)
    else console.log('✅ Tabel schedules berhasil dibersihkan.')

    // 4. Hapus Tabel Rooms (Daftar Inventaris Ruangan)
    const { error: roomError } = await supabase.from('rooms').delete().neq('id', 0)
    if (roomError) console.error('⚠️ Gagal membersihkan rooms:', roomError.message)
    else console.log('✅ Tabel rooms berhasil dibersihkan.')

    console.log('\n✨ PEMBERSIHAN SELESAI! Database siap disuntikkan data baru yang rapi.')
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat membersihkan database:', error)
  }
}

clearDatabase()
