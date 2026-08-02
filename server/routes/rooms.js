//=====================================
// Routes: Menegemen Ruangan
//=====================================

import { Router } from 'express'
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from '../middleware/auth.js'

const router = Router()

//GET /api/rooms - Ambil semua ruangan (harus login)
router.get('/', async (req, res) => {
    try {
        // 1. Ambil semua data ruang dari database
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .order('nama')

        if (roomsError) throw roomsError

        // 2. TENTUKAN WAKTU KESARANG
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0];         // format waktu HH:MM:SS
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const currentDate = `${yyyy}-${mm}-${dd}`;
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']        // Terjemahkan hari kedalam bahasa indonesia
        const currentHari = hariArray[now.getDay()]

        // 3. CARI JADWAL SIAKAD YANG SEDANG BERJALAN
        const { data: activeSchedules } = await supabase
            .from('schedules')
            .select('room_id')
            .eq('hari', currentHari)
            .lte('waktu_mulai', currentTime)
            .gte('waktu_selesai', currentTime)

        const { data: approvedReports } = await supabase
            .from('reports')
            .select('room_id', 'mata_kuliah')
            .eq('tanggal', currentDate)
            .in('status', ['approved', 'verified'])

        const cancelledroomIds = new Set((approvedReports || []).map(rep => rep.room_id))
        const validScheduledRoomIds = new Set((activeSchedules || []).filter(sched => !cancelledroomIds.has(sched.room_id)).map(sched => sched.room_id))

        // 4. CARI RESERVASI INSIDENTAL YANG SEDANG BERJALAN SAAT INI
        const { data: activeReservations } = await supabase
            .from('reservations')
            .select('room_id')
            .eq('tanggal', currentDate)
            .eq('status', 'approved')
            .lte('waktu_mulai', currentTime)
            .gte('waktu_selesai', currentTime)

        const reservationRoomIds = new Set((activeReservations || []).map(r => r.room_id));
        // 5. SUNTIKAN STATUS KEDALAM DATA RUANGAN SECARA SPESIFIK
        const virtualRooms = rooms.map(room => {
            if (room.status !== "tersedia") {
                return room;
            }

            // Cek Prioritas 1: Apakah sedang dipakai kuliah reguler?
            if (validScheduledRoomIds.has(room.id)) {
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
// GET /api/rooms/:id/schedule - Mengambil jadwal harian (Timeline) ruangan tertentu
router.get('/:id/schedule', verifyToken, async (req, res) => {
    try {
        const { id } = req.params
        const { date } = req.query;

        if (!date) return res.status(400).json({ error: 'Tanggal diperlukan.' });

        const dateObj = new Date(date);
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const namaHari = hariArray[dateObj.getDay()];

        // 1. Ambil jadwal SIAKAD reguler untuk hari tersebut
        const { data: schedules } = await supabase
            .from('schedules')
            .select('mata_kuliah, waktu_mulai, waktu_selesai')
            .eq('room_id', id)
            .eq('hari', namaHari);

        // 2. Ambil peminjaman insidental yang di-ACC untuk tanggal tersebut
        const { data: reservations } = await supabase
            .from('reservations')
            .select('mata_kuliah, waktu_mulai, waktu_selesai')
            .eq('room_id', id)
            .eq('tanggal', date)
            .eq('status', 'approved');

        // 3. Gabungkan dan urutkan dari jam paling pagi
        const combined = [
            ...(schedules || []).map(s => ({ ...s, type: 'Reguler' })),
            ...(reservations || []).map(r => ({ ...r, type: 'Dipesan' }))
        ].sort((a, b) => a.waktu_mulai.localeCompare(b.waktu_mulai))

        // 4. Kirim hasil ke Front-end
        res.json({ schedule: combined })
    } catch (error) {
        console.error('Get room schedule error:', error)
        res.status(500).json({ error: 'Gagal mengambil jadwal ruangan.' })
    }
})
//POST /api/rooms - Tambah ruangan baru + Jadwal ruangan (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { nama, kampus, gedung, lantai, kapasitas, initial_schedule } = req.body

        if (!nama || !kampus || !gedung || !lantai || !kapasitas) {
            return res.status(400).json({ error: 'Nama, kampus, gedung, lantai, dan kapasitas wajib diisi.' })
        }

        const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .insert({ nama, kampus, gedung, lantai, kapasitas, status: 'tersedia' })
            .select()
            .single()

        if (roomError) throw roomError

        if (initial_schedule &&
            initial_schedule.prodi &&
            initial_schedule.semester &&
            initial_schedule.kelas &&
            initial_schedule.mata_kuliah &&
            initial_schedule.dosen &&
            initial_schedule.hari &&
            initial_schedule.waktu_mulai &&
            initial_schedule.waktu_selesai
        ) {
            const { prodi, semester, kelas, mata_kuliah, dosen, hari, waktu_mulai, waktu_selesai } = initial_schedule
            await supabase.from('schedules').insert([{
                room_id: roomData.id,
                prodi,
                semester,
                kelas,
                mata_kuliah,
                dosen,
                hari,
                waktu_mulai,
                waktu_selesai,
            }])
        }

        res.status(201).json({ message: 'Ruangan berhasil ditambahkan.', room: roomData })
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