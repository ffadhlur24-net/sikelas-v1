//=====================================
// Routes: Menegemen Ruangan
//=====================================

import { Router } from 'express'
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from '../middleware/auth.js'

const router = Router()

//GET /api/rooms - Ambil semua ruangan + Ketersediaan Spesifik Slot Waktu
router.get('/', async (req, res) => {
    try {
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .order('nama')

        if (roomsError) throw roomsError

        // Ambil query parameter filter slot waktu (jika dikirim oleh PJ)
        const { tanggal, waktu_mulai, sks } = req.query

        const now = new Date()
        const yyyy = now.getFullYear()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')
        const todayStr = `${yyyy}-${mm}-${dd}`
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

        // Tanggal target pencarian (default: hari ini)
        const targetDate = tanggal || todayStr

        // Hitung jam mulai & jam selesai target
        let targetStart = waktu_mulai || currentTimeStr
        if (targetStart.length === 5) targetStart = `${targetStart}:00`

        const sksCount = parseInt(sks, 10) || 2
        const totalMinutes = sksCount * 50
        const [startH, startM] = targetStart.split(':').map(Number)
        const endDateObj = new Date(2000, 0, 1, startH, startM + totalMinutes)
        const targetEnd = endDateObj.toTimeString().substring(0, 5) + ':00'

        // Dapatkan nama hari untuk tanggal target (Senin, Selasa, dll)
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const targetDateObj = new Date(targetDate + 'T00:00:00')
        const targetHari = hariArray[targetDateObj.getDay()]

        // 1. CARI JADWAL SIAKAD REGULER PADA SLOT TANGGAL & JAM TARGET
        const { data: activeSchedules } = await supabase
            .from('schedules')
            .select('room_id, mata_kuliah, waktu_mulai, waktu_selesai')
            .eq('hari', targetHari)
            .lt('waktu_mulai', targetEnd)
            .gt('waktu_selesai', targetStart)

        // Cari laporan kelas kosong yang sudah di-approve pada tanggal tersebut
        const { data: approvedReports } = await supabase
            .from('reports')
            .select('room_id')
            .eq('tanggal', targetDate)
            .in('status', ['approved', 'verified'])

        const cancelledRoomIds = new Set((approvedReports || []).map(rep => rep.room_id))

        // Peta ruangan bentrok jadwal SIAKAD
        const scheduleConflictMap = new Map()
        if (activeSchedules) {
            activeSchedules.forEach(sched => {
                if (!cancelledRoomIds.has(sched.room_id)) {
                    scheduleConflictMap.set(sched.room_id, sched)
                }
            })
        }

        // 2. CARI RESERVASI INSIDENTAL APPROVED PADA SLOT TANGGAL & JAM TARGET
        const { data: activeReservations } = await supabase
            .from('reservations')
            .select('id, room_id, mata_kuliah, waktu_mulai, waktu_selesai, status')
            .eq('tanggal', targetDate)
            .eq('status', 'approved')
            .lt('waktu_mulai', targetEnd)
            .gt('waktu_selesai', targetStart)

        const expiredReservationIds = []
        const validReservations = []

        if (activeReservations) {
            activeReservations.forEach(res => {
                // Cek apakah reservasi hari ini sudah lewat 15 menit dari waktu_mulai tanpa check-in
                if (targetDate === todayStr) {
                    const [sH, sM] = res.waktu_mulai.split(':').map(Number)
                    const [curH, curM] = currentTimeStr.split(':').map(Number)
                    const startTotalMins = sH * 60 + sM
                    const currentTotalMins = curH * 60 + curM

                    // Toleransi 15 menit: Jika jam sekarang > waktu_mulai + 15 menit
                    if (currentTotalMins > startTotalMins + 15) {
                        expiredReservationIds.push(res.id)
                        return // Abaikan dari reservasi aktif (ruangan bebas!)
                    }
                }
                validReservations.push(res)
            })
        }

        // Auto-update status di database Supabase ke 'expired' jika ada reservasi hangus
        if (expiredReservationIds.length > 0) {
            supabase
                .from('reservations')
                .update({ status: 'expired' })
                .in('id', expiredReservationIds)
                .then(() => console.log(`⚡ Auto-expired ${expiredReservationIds.length} phantom reservation(s).`))
                .catch(err => console.error('Gagal auto-expire reservation:', err))
        }

        const reservationConflictMap = new Map()
        validReservations.forEach(res => {
            reservationConflictMap.set(res.room_id, res)
        })

        // 3. SUNTIKKAN STATUS KETERSEDIAAN SLOT WAKTU KEDALAM KARTU RUANGAN
        const virtualRooms = rooms.map(room => {
            if (room.status !== "tersedia") {
                return {
                    ...room,
                    slot_available: false,
                    conflict_reason: 'Ruangan sedang dalam perbaikan / tidak aktif oleh Admin.'
                }
            }

            // Bentrok SIAKAD
            if (scheduleConflictMap.has(room.id)) {
                const conf = scheduleConflictMap.get(room.id)
                return {
                    ...room,
                    slot_available: false,
                    conflict_reason: `Terpakai Jadwal SIAKAD: "${conf.mata_kuliah}" (${conf.waktu_mulai.substring(0, 5)} - ${conf.waktu_selesai.substring(0, 5)} WIB)`
                }
            }

            // Bentrok Peminjaman PJ Lain
            if (reservationConflictMap.has(room.id)) {
                const conf = reservationConflictMap.get(room.id)
                return {
                    ...room,
                    slot_available: false,
                    conflict_reason: `Dipesan PJ Lain: "${conf.mata_kuliah}" (${conf.waktu_mulai.substring(0, 5)} - ${conf.waktu_selesai.substring(0, 5)} WIB)`
                }
            }

            // Slot Bebas & Kosong untuk Dipinjam!
            return {
                ...room,
                slot_available: true,
                conflict_reason: null
            }
        })

        res.json({
            rooms: virtualRooms,
            target_filter: {
                tanggal: targetDate,
                waktu_mulai: targetStart.substring(0, 5),
                waktu_selesai: targetEnd.substring(0, 5),
                sks: sksCount
            }
        })

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

        // 1b. Ambil laporan kelas kosong terverifikasi untuk tanggal tersebut
        const { data: approvedReports } = await supabase
            .from('reports')
            .select('mata_kuliah')
            .eq('room_id', id)
            .eq('tanggal', date)
            .in('status', ['approved', 'verified']);

        const cancelledSubjects = new Set((approvedReports || []).map(r => r.mata_kuliah));

        // 1c. Ambil laporan kelas kosong pending (menunggu verifikasi admin)
        const { data: pendingReports } = await supabase
            .from('reports')
            .select('mata_kuliah')
            .eq('room_id', id)
            .eq('tanggal', date)
            .eq('status', 'pending');

        const pendingSubjects = new Set((pendingReports || []).map(r => r.mata_kuliah));

        const validSchedules = (schedules || []).filter(s => !cancelledSubjects.has(s.mata_kuliah));

        // 2. Ambil peminjaman insidental yang di-ACC untuk tanggal tersebut
        const { data: reservations } = await supabase
            .from('reservations')
            .select('mata_kuliah, waktu_mulai, waktu_selesai')
            .eq('room_id', id)
            .eq('tanggal', date)
            .eq('status', 'approved');

        // 3. Gabungkan dan urutkan dari jam paling pagi
        const combined = [
            ...validSchedules.map(s => ({
                ...s,
                type: 'Reguler',
                isPendingReport: pendingSubjects.has(s.mata_kuliah)
            })),
            ...(reservations || []).map(r => ({ ...r, type: 'Dipesan', isPendingReport: false }))
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