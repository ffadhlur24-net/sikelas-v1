//============================
// Routes: Reservasi Kelas
//============================

import { Router } from "express";
import supabase from "../config/supabase.js";
import { verifyToken, adminOnly } from "../middleware/auth.js";

const router = Router()

//GET /api/reservations - Ambil reservasi
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = supabase
            .from('reservations')
            .select('*, rooms(nama, gedung), users(username, nim_nip, prodi, kelas)')
            .order('created_at', { ascending: false })


        // Jika PJ, hanya tampilkan miliknya sendiri
        if (req.user.role === 'pj') {
            query = query.eq('user_id', req.user.id)

        }
        const { data, error } = await query
        if (error) throw error

        res.json({ reservations: data })
    } catch (error) {
        console.error('Get reservations error:', error)
        res.status(500).json({ error: 'Gagal mengambil data reservasi.' })
    }
})

// POST /api/reservations - Buat reservasi baru
router.post('/', verifyToken, async (req, res) => {
    try {
        const { room_id, mata_kuliah, tanggal, waktu_mulai, waktu_selesai } = req.body

        if (!room_id || !mata_kuliah || !tanggal || !waktu_mulai || !waktu_selesai) {
            return res.status(400).json({
                error: 'Semua Kolom wajib diisi..'
            })
        }

        // 1. Cari tahu Hari apa tanggal yang diinputkan (0 = Minggu, 1 = Senin, dst)
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const dateObj = new Date(tanggal)
        const namaHari = hariArray[dateObj.getDay()]

        // 2. CEK BENTROK DENGAN JADWAL REGULER (SIAKAD)
        // Rumus Overlap: (Waktu Mulai Lama < Waktu Selesai Baru) AND (Waktu Selesai Lama > Waktu Mulai Baru)
        const { data: scheduleConflicts, error: scheduleError } = await supabase
            .from('schedules')
            .select('mata_kuliah')
            .eq('room_id', room_id)
            .eq('hari', namaHari)
            .lt('waktu_mulai', waktu_selesai)
            .gt('waktu_selesai', waktu_mulai)

        if (scheduleError) throw scheduleError

        // Jika ada bentrok dengan jadwal reguler, langsung tolak!
        if (scheduleConflicts && scheduleConflicts.length > 0) {
            return res.status(400).json({
                error: `Gagal: Ruangan sedang digunakan untuk jadwal kuliah reguler (${scheduleConflicts[0].mata_kuliah}).`
            })
        }

        // 3. CEK BENTROK DENGAN RESERVASI ORANG LAIN (RACE CONDITION)
        // Cek apakah ada reservasi yang sudah di-approve di ruangan, tanggal, dan jam yang tumpang tindih
        const { data: reservationConflicts, error: reservationError } = await supabase
            .from('reservations')
            .select('id')
            .eq('room_id', room_id)
            .eq('tanggal', tanggal)
            .eq('status', 'approved')
            .lt('waktu_mulai', waktu_selesai)
            .gt('waktu_selesai', waktu_mulai)

        if (reservationError) throw reservationError

        // Jika ada orang yang keduluan meminjam (selisih 1 menit sekalipun), langsung tolak!
        if (reservationConflicts && reservationConflicts.length > 0) {
            return res.status(400).json({
                error: 'Gagal: Ruangan sudah direservasi oleh PJ lain pada jam tersebut.'
            })
        }

        // --- AKHIR FASE 9 ---

        const { data, error } = await supabase
            .from('reservations')
            .insert({
                user_id: req.user.id,
                room_id,
                mata_kuliah,
                tanggal,
                waktu_mulai,
                waktu_selesai,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        res.status(201).json({
            message: ' Reserbasi berhasil diajukan!\n Menunggu persetjuan admin.',
            reservation: data
        })

    } catch (error) {
        console.error(' Create reservation error:', error)
        res.status(500).json({ error: 'gagal membuat reservasi.' })
    }
})

// PATCH /api/reservations/:id/approve - Setuju reservasi (Admin Only)

router.patch('/:id/approve', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params

        const { data, error } = await supabase
            .from('reservations')
            .update({ status: 'approved' })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        res.json({ message: 'Reservasi disetujui.', reservation: data })
    } catch (error) {
        res.status(500).json({ error: 'gagal menyetujui reservasi.' })
    }
})

// PATCH /api/reservations/:id/reject - Tolak reservasi (Admin Only)

router.patch('/:id/reject', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params

        const { data, error } = await supabase
            .from('reservations')
            .update({ status: 'rejected' })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        res.json({ message: "Reservasi ditolak.", reservation: data })
    } catch (error) {
        res.status(500).json({ error: 'Gagal menolak reservasi.' })
    }
})

// PATCH /api/reservations/:id/check-in - PJ
router.patch('/:id/checkin', verifyToken, async (req, res) => {
    try {
        const { id } = req.params

        const { data: reservation, error: checkError } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('id', id)
            .eq('status', 'approved')
            .single()


        if (checkError || !reservation) {
            return res.status(404).json({ error: 'Reservasi tidak ditemukan atau belum disetujui.' });
        }

        // Update is_cheked-in menjadi true
        const { data, error } = await supabase
            .from('reservations')
            .update({ is_checked_in: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Berhasil Check-In! Ruangan siap digunakan.', reservation: data })
    } catch (error) {
        res.status(500).json({ error: 'Gagal melakukan Check-In.' })
    }
})

router.patch('/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, alasan_penolakan } = req.body;

        const updateData = { status };
        // Jika ditolak, simpan alasan penolakan dari admin
        if (status === 'rejected' && alasan_penolakan) {
            updateData.alasan_penolakan = alasan_penolakan;
        }

        const { data, error } = await supabase
            .from('reservations')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single()

        if (error) throw error

        res.json({ message: `Status reservasi berhasil diubah menjadi ${status}.`, reservation: data })
    } catch (error) {
        console.error('Update reservasi error:', error)
        res.status(500).json({ error: 'gagal mengubah status reservasi.' })
    }
})

export default router