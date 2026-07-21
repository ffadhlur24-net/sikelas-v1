//=====================================
// Routes: Menegemen Ruangan
//=====================================

import { Router } from 'express'
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from '../middleware/auth.js'

const router = Router()

//GET /api/rooms - Ambil semua ruangan (harus login)

router.get('/', verifyToken, async (req, res) => {
    try {
        // 1. Ambil semua data ruang dari database
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .order('nama')

        if (roomsError) throw roomsError

        // 2. TENTUKAN WAKTU KESARANG
        const now = new Date();
        // format waktu HH:MM:SS
        const currentTime = now.toTimeString().split(' ')[0];
        // format tanggal YYYY-MM-DD
        const currentDate = now.toISOString().split('T')[0];

        // Terjemahkan hari kedalam bahasa indonesia
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const currentHari = hariArray[now.getDay()]

        // 3. CARI JADWAL SIAKAD YANG SEDANG BERJALAN
        // Syarat: Hari sama, waktu mulai sudah terlewat, dan waktu selesai belum habis
        const { data: activeSchedules } = await supabase
            .from('schedules')
            .select('room_id')
            .eq('hari', currentHari)
            .lte('waktu_mulai', currentTime)
            .gte('waktu_selesai', currentTime)

        // 4. CARI RESERVASI INSIDENTAL YANG SEDANG BERJALAN SAAT INI
        // syarat: Tanggal sama, status approved, waktu_mulai sudah terlewat, waktu selesai belum habis
        const { data: activeReservations } = await supabase
            .from('reservations')
            .select('room_id')
            .eq('tanggal', currentDate)
            .eq('status', 'approved')
            .lte('waktu_mulai', currentTime)
            .gte('waktu_selesai', currentTime)

        // 5. PISAHKAN ID RUANGAN BERDASARKAN PENYEBAB KESIBUKAN
        const scheduledRoomIds = new Set((activeSchedules || []).map(s => s.room_id));
        const reservationRoomIds = new Set((activeReservations || []).map(r => r.room_id));

        // 6. SUNTIKAN STATUS KEDALAM DATA RUANGAN SECARA SPESIFIK
        const virtualRooms = rooms.map(room => {
            if (room.status !== "tersedia") {
                return room;
            }

            // Cek Prioritas 1: Apakah sedang dipakai kuliah reguler?
            if (scheduledRoomIds.has(room.id)) {
                return { ...room, status: 'sedang_digunakan' }
            }

            // Cek Prioritas 2: Apakah sedang dipakai karena dipesan PJ?
            if (reservationRoomIds.has(room.id)) {
                return { ...room, status: 'dipesan' }
            }

            // jika tidak ada jadwal sama sekali saat ini, kembalikan normal
            return room;
        });
        res.json({ rooms: virtualRooms });

    } catch (error) {
        console.error('Get rooms error:', error)
        res.status(500).json({ error: 'Gagal mengambil data ruangan.' })
    }
})
// GET /api/rooms:id/schedule -mengambil jadwal harian (Timeline) ruangan tertentu
router.get(':id/schedule', verifyToken, async (req, res) => {
    try {
        const { id } = req.params
        const { date } = req.query;

        if (!date) return res.status(400).json({ error: 'Tanggal diperlukan,' });

        const dateObj = new Date(date);
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const namaHari = hariArray[dateObj.getDay()];

        // Ambil jadwal SIAKAD
        const { data: schedules } = await supabase
            .from('schedules')
            .select('mata_kuliah, waktu_mulai, waktu_selesai')
            .eq('room_id', id)
            .eq('status', 'approved');

        // 3. gabungkan dan urutkan dari jam paling pagi
        const combined = [
            ...(schedules || []).map(s => ({ ...s, type: 'Reguler' })),
            ...(reservations || []).map(r => ({ ...r, type: 'Dipesan' }))
        ].sort((a, b) => a.waktu_mulai.localeCompire(b.waktu_mulai))
        //4. kirim hasil ke Front-end
        res.json({ schedule: combined })
    } catch (error) {
        console.error('Get room schedule error:', error)
        res.status(500).json({ error: 'Gagal mengambil jadwal ruangan.' })
    }
})
//POST /api/rooms - Tambah ruangan baru (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { nama, kampus, gedung, lantai, kapasitas } = req.body

        const { data, error } = await supabase
            .from('rooms')
            .insert({ nama, kampus, gedung, lantai, kapasitas, status: 'tersedia' })
            .select()
            .single()

        if (error) throw error

        res.status(201).json({ message: 'Ruangan berhasil ditambahkan.', room: data })
    } catch (error) {
        console.error('Create room error:', error)
        res.status(500).json({ error: 'Gagal menambahkan ruangan.' })
    }
})

//PATCH /api/rooms/:id/status - Update status ruangan (admin only)
router.patch('/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const { data, error } = await supabase
            .from('rooms')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        res.json({ message: `Status ruangan diubah ke"${status}".`, room: data })
    } catch (error) {
        console.error('Update room status error:', error)
        res.status(500).json({ error: 'Gagal mengubah status ruangan.' })
    }
})

export default router