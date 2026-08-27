//============================
// Routes: Reservasi Kelas
//============================

import { Router } from "express";
import supabase from "../config/supabase.js";
import { verifyToken, adminOnly } from "../middleware/auth.js";
import { sendReservationNotificationEmail } from '../utils/sendEmail.js'

const router = Router()

//GET /api/reservations - Ambil reservasi
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = supabase
            .from('reservations')
            .select('*, rooms(nama, gedung), users(username, nim_nip, prodi, kelas, no_hp)')
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
        res.status(500).json({ error: error.message || 'Gagal mengambil data reservasi.' })
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
        const now = new Date()
        const yyyy = now.getFullYear()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')
        const todayStr = `${yyyy}-${mm}-${dd}`
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

        if (tanggal < todayStr || (tanggal === todayStr && waktu_mulai <= currentTimeStr)) {
            return res.status(400).json({ error: 'Gagal: Waktu pemakaian yang Anda pilih sudah berlalu!' })
        }


        // 1. Cari tahu Hari apa tanggal yang diinputkan (0 = Minggu, 1 = Senin, dst)
        const hariArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const dateObj = new Date(tanggal + 'T00:00:00')
        const namaHari = hariArray[dateObj.getDay()]

        // 2. CEK BENTROK DENGAN JADWAL REGULER (SIAKAD)
        // Ambil laporan kelas kosong yang sudah disetujui pada tanggal peminjaman ini
        const { data: approvedReports } = await supabase
            .from('reports')
            .select('mata_kuliah')
            .eq('room_id', room_id)
            .eq('tanggal', tanggal)
            .in('status', ['approved', 'verified'])

        const cancelledSubjects = new Set((approvedReports || []).map(r => r.mata_kuliah))

        const { data: scheduleConflicts, error: scheduleError } = await supabase
            .from('schedules')
            .select('mata_kuliah, waktu_mulai, waktu_selesai')
            .eq('room_id', room_id)
            .eq('hari', namaHari)
            .lt('waktu_mulai', waktu_selesai)
            .gt('waktu_selesai', waktu_mulai)

        if (scheduleError) throw scheduleError

        // Filter bentrok yang BELUM dilaporkan kosong pada tanggal tersebut
        const validConflicts = (scheduleConflicts || []).filter(sched => !cancelledSubjects.has(sched.mata_kuliah))

        // Jika ada bentrok dengan jadwal reguler yang masih aktif, langsung tolak!
        if (validConflicts.length > 0) {
            const conflict = validConflicts[0]
            return res.status(400).json({
                error: `❌ Peminjaman Ditolak! Durasi peminjaman Anda (selesai jam ${waktu_selesai}) menabrak Jadwal SIAKAD di ruangan ini: "${conflict.mata_kuliah}" (Jam ${conflict.waktu_mulai.substring(0, 5)} - ${conflict.waktu_selesai.substring(0, 5)} WIB). Silakan kurangi SKS atau pilih ruangan lain.`
            })
        }

        // 3. CEK BENTROK DENGAN RESERVASI ORANG LAIN (RACE CONDITION)
        // Cek apakah ada reservasi yang sudah di-approve di ruangan, tanggal, dan jam yang tumpang tindih
        const { data: reservationConflicts, error: reservationError } = await supabase
            .from('reservations')
            .select('id, waktu_mulai')
            .eq('room_id', room_id)
            .eq('tanggal', tanggal)
            .eq('status', 'approved')
            .lt('waktu_mulai', waktu_selesai)
            .gt('waktu_selesai', waktu_mulai)

        if (reservationError) throw reservationError

        const currentMins = now.getHours() * 60 + now.getMinutes()

        // Filter reservasi yang MASIH VALID (abaikan yang >15 menit belum check-in hari ini)
        const activeResConflicts = (reservationConflicts || []).filter(res => {
            if (tanggal === todayStr) {
                const [sH, sM] = res.waktu_mulai.split(':').map(Number)
                const startMins = sH * 60 + sM
                if (currentMins > startMins + 15) {
                    return false // Hangus/expired, abaikan dari bentrok!
                }
            }
            return true
        })

        // Jika ada orang yang keduluan meminjam (dan belum kadaluwarsa), langsung tolak!
        if (activeResConflicts.length > 0) {
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

        // ⚡ BUAT NOTIFIKASI IN-APP OTOMATIS KE SELURUH ADMIN
        try {
            const { data: adminUsers } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')

            if (adminUsers && adminUsers.length > 0) {
                const notifPayloads = adminUsers.map(adm => ({
                    user_id: adm.id,
                    title: '📥 Pengajuan Reservasi Baru',
                    message: `PJ ${req.user.username || 'Mahasiswa'} mengajukan reservasi kelas untuk ${mata_kuliah} pada ${tanggal}.`,
                    type: 'info'
                }))
                await supabase.from('notifications').insert(notifPayloads)
            }
        } catch (notifErr) {
            console.error('Gagal mengirim notifikasi in-app ke admin:', notifErr)
        }

        res.status(201).json({
            message: ' Reserbasi berhasil diajukan!\n Menunggu persetjuan admin.',
            reservation: data
        })

    } catch (error) {
        console.error(' Create reservation error:', error)
        res.status(500).json({ error: error.message || 'gagal membuat reservasi.' })
    }
})

// PATCH /api/reservations/:id/approve - Setuju reservasi (Admin Only)

router.patch('/:id/approve', verifyToken, adminOnly, async (req, res) => {
    if (status === 'approved') {
        const { data: targetRes } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', id)
            .single()

        if (targetRes) {
            if (targetRes.tanggal < todayStr || (tanggal === todayStr && targetRes.waktu_mulai <= currentTimeStr)) {
                return res.status(400).json({
                    error: 'Gagal: Reservasi ini sudah lewat waktu. Tidak dapat disetujui.'
                })
            }
        }
    }
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

        // ⏱️ PROTEKSI REAL-TIME: CEK TOLERANSI WAKTU CHECK-IN (MAKSIMAL 15 MENIT DARI WAKTU MULAI)
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const currentHour = String(now.getHours()).padStart(2, '0')
        const currentMinute = String(now.getMinutes()).padStart(2, '0')
        const currentTimeStr = `${currentHour}:${currentMinute}`

        const [startH, startM] = reservation.waktu_mulai.split(':').map(Number)
        const expiryDateObj = new Date(2000, 0, 1, startH, startM + 15)
        const expiryTimeStr = expiryDateObj.toTimeString().substring(0, 5)

        const isDateExpired = reservation.tanggal < todayStr
        const isTimeExpired = (reservation.tanggal === todayStr && currentTimeStr > expiryTimeStr)

        if (isDateExpired || isTimeExpired) {
            // Otomatis ubah status reservasi gantung menjadi 'expired'
            await supabase
                .from('reservations')
                .update({ status: 'expired' })
                .eq('id', id)

            return res.status(400).json({
                error: `❌ Check-In Gagal! Batas waktu check-in telah kadaluwarsa (>15 menit dari jam mulai ${reservation.waktu_mulai.substring(0, 5)} WIB). Reservasi otomatis dibatalkan.`
            })
        }

        // Update is_checked_in menjadi true
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

        if (data && data.users && data.users.email) {
            const timeSlot = `${data.waktu_mulai} - ${data.waktu_selesai}`
            sendReservationNotificationEmail(
                data.users.email,
                data.users.username,
                status,
                data.rooms?.nama || 'Ruangan',
                data.tanggal,
                timeSlot,
                alasan_penolakan || ''
            )
        }


        res.json({ message: `Status reservasi berhasil diubah menjadi ${status}.`, reservation: data })
    } catch (error) {
        console.error('Update reservasi error:', error)
        res.status(500).json({ error: 'gagal mengubah status reservasi.' })
    }
})

// DELETE /api/reservations/:id - Hapus reservasi basi
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id)
        res.json({ message: 'Reservasi berhasil dihapus dari tabel.' })
    } catch (error) {
        console.error('Delete reservation error:', error)
        res.status(500).json({ error: error.message || 'Gagal menghapus reservasi.' })
    }
})
export default router