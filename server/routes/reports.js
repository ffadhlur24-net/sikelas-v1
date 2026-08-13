// =======================================
// Routers: Pelaporan Kelas
// =======================================

import { Router } from 'express'
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from '../middleware/auth.js'

const router = Router()

// GET /api/reports - Ammbil semua laporan

router.get('/', verifyToken, async (req, res) => {
    try {
        let query = supabase
            .from('reports')
            .select('*, rooms(nama), users(username, nim_nip)')
            .order('created_at', { ascending: false })


        // Pj hanya lihat laporannya sendiri
        if (req.user.role === 'pj') {
            query = query.eq('user_id', req.user.id)
        }

        const { data, error } = await query
        if (error) throw error

        res.json({ reports: data })
    } catch (error) {
        console.error('Get reports error:', error)
        res.status(500).json({ error: 'Gagal mengambil data laporan.' })
    }
})

// POST /api/reports - Buat laporan baru (PJ)

router.post('/', verifyToken, async (req, res) => {
    try {
        const { room_id, mata_kuliah, alasan, tanggal } = req.body
        const reportDate = tanggal || new Date().toISOString().split('T')[0];

        const parsedRoomId = Number(room_id)
        if (!parsedRoomId || isNaN(parsedRoomId)) {
            return res.status(400).json({ error: 'Ruangan tidak valid atau belum dipilih' })
        }

        const { data: existingReport } = await supabase
            .from('reports')
            .select('id, status')
            .eq('user_id', req.user.id)
            .eq('room_id', parsedRoomId)
            .eq('mata_kuliah', mata_kuliah)
            .eq('tanggal', reportDate)
            .in('status', ['pending', 'approved', 'verified'])
            .single()

        if (existingReport) {
            return res.status(400).json({
                error: 'Gagal: Anda sudah membuat laporan untuk hari dan ruangan ini.'
            })
        }

        let validAlasan = 'DOSEN_BERHALANGAN'
        if (['DOSEN_BERHALANGAN', 'RUANGAN_TERKUNCI', 'KELAS_ONLINE'].includes(alasan)) {
            validAlasan = alasan
        }
        const insertPayload = {
            user_id: req.user.id,
            room_id: parsedRoomId,
            mata_kuliah: mata_kuliah || 'Mata Kuliah',
            alasan: validAlasan,
            status: 'pending'


        }
        // Masukkan tanggal jika ada
        if (reportDate) {
            insertPayload.tanggal = reportDate
        }
        // 3. Simpan ke database Supabase dengan Penanganan Fallback Otomatis
        let { data, error } = await supabase
            .from('reports')
            .insert(insertPayload)
            .select()
        // Jika error terjadi karena kolom 'tanggal' belum ada di tabel Supabase
        if (error && error.message && error.message.includes('tanggal')) {
            delete insertPayload.tanggal
            const retry = await supabase.from('reports').insert(insertPayload).select()
            data = retry.data
            error = retry.error
        }
        if (error) {
            console.error('Supabase Insert Report Error:', error)
            throw error
        }

        // ⚡ BUAT NOTIFIKASI IN-APP OTOMATIS KE SELURUH ADMIN
        try {
            const { data: adminUsers } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')

            if (adminUsers && adminUsers.length > 0) {
                const notifPayloads = adminUsers.map(adm => ({
                    user_id: adm.id,
                    title: '📋 Laporan Kelas Kosong Baru',
                    message: `PJ ${req.user.username || 'Mahasiswa'} melaporkan pengosongan kelas ${mata_kuliah || ''}.`,
                    type: 'info'
                }))
                await supabase.from('notifications').insert(notifPayloads)
            }
        } catch (notifErr) {
            console.error('Gagal mengirim notifikasi in-app ke admin:', notifErr)
        }

        res.status(201).json({
            message: 'Laporan kelas kosong berhasil dikirim!',
            report: data && data.length > 0 ? data[0] : null
        })
    } catch (error) {
        res.status(500).json({ error: error.message || 'Gagal membuat laporan.' })
    }
})

// PATCH /api/reports/:id/resolve - Tandai laporan selesai (Admin Only)
router.patch('/:id/resolve', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        let targetStatus = status === 'approved' || status === 'verified' ? 'verified' : 'rejected';

        const updateData = { status: targetStatus }
        if (alasan_penolakan) {
            updateData.alasan_penolakan = alasan_penolakan;
        }

        const { data, error } = await supabase
            .from('reports')
            .update(updateData)
            .eq('id', id)
            .select()

        if (error) throw error

        res.json({
            message: targetStatus === 'verified'
                ? 'Laporan disetujui! Jadwal perkuliahan pada tanggal tersebut resmi DICORET dan ruangan berubah menjadi TERSEDIA.'
                : 'Laporan ditolak', report: data
        })
    } catch (error) {
        console.error('Resolve report error:', error)
        res.status(500).json({ error: 'Gagal menyelesaikan laporan.' })
    }
})

// DELETE /api/reports/:id - Hapus laporan basi
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = id.params
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id)
    } catch (error) {
        console.error('Delete report error:', error)
        res.status(500).json({ error: error.message || 'Gagal menghapus laporan.' })
    }
})


export default router

