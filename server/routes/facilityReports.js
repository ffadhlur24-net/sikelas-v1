//=============================================================
// Routes: Pelaporan Kerusakan Fasilitas Ruangan
//=============================================================

import { Router } from 'express';
import supabase from '../config/supabase.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = Router()

// GET /api/facility-reports/active?room_id=X
router.get('/active', verifyToken, async (req, res) => {
    try {
        const { room_id } = req.query
        if (!room_id) return res.status(400).json({ error: 'room_id wajib diisi' })

        const { data, error } = await supabase
            .from('facility_reports')
            .select('kategori, status, rincian')
            .eq('room_id', room_id)
            .in('status', ['pending', 'in_progress'])

        if (error) throw error

        res.json({ activeCategories: data || [] })
    } catch (error) {
        console.error('Get active categories error:', error)
        res.status(500).json({ error: 'gagal mengambil kategori aktif' })
    }
})

// POST /api/facility-reports
router.post('/', verifyToken, async (req, res) => {
    try {
        const { room_id, kategori, rincian } = req.body

        if (!room_id || !kategori || !rincian) {
            return res.status(400).json({ error: 'harus diisi semua.' })
        }

        // Cek kategori, udah pernah digunakan atau belum
        const { data: existingTicket } = await supabase
            .from('facility_reports')
            .select('id, status')
            .eq('room_id', room_id)
            .eq('kategori', kategori)
            .in('status', ['pending', 'in_progress'])
            .maybeSingle()

        if (existingTicket) {
            return res.status(400).json({
                error: `ℹ️ Kendala kategori "${kategori}" pada ruangan ini sudah dilaporkan sebelumnya dan sedang dalam penanganan teknisi.`
            })
        }

        // Simpan Laporan
        const { data, error } = await supabase
            .from('facility_reports')
            .insert({ room_id, reporter_id: req.user.id, kategori, rincian, status: 'pending' })
            .select('*')

        if (error) throw error

        res.status(201).json({
            message: 'Laporan berhasil terkirim',
            report: data[0]
        })
    } catch (error) {
        console.error('Submit report error:', error)
        res.status(500).json({ error: 'gagal mengirim laporan' })
    }
})

// GET /api/facility-reports/
router.get('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('facility_reports')
            .select('*, rooms(nama, gedung, kampus, status), users(username, email, prodi, no_hp)')
            .order('created_at', { ascending: false })

        if (error) throw error

        res.json({ reports: data || [] })
    } catch (error) {
        console.error('Admin get reports error:', error)
        res.status(500).json({ error: 'gagal mengambil daftar laporan' })
    }
})

router.patch('/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        if (!['pending', 'in_progress', 'resolved'].includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid.' })
        }

        // 🔒 PROTEKSI KEAMANAN: Cek apakah tiket yang ditargetkan sudah berstatus resolved
        const { data: currentTicket } = await supabase
            .from('facility_reports')
            .select('status')
            .eq('id', id)
            .single()

        if (currentTicket && currentTicket.status === 'resolved') {
            return res.status(400).json({ error: 'Tiket yang sudah selesai diperbaiki tidak dapat diubah kembali!' })
        }

        const { data, error } = await supabase
            .from('facility_reports')
            .update({ status })
            .eq('id', id)
            .select()

        if (error) throw error

        res.json({ message: 'Status tiket kerusakan berhasil diperbarui!', report: data[0] })
    } catch (error) {
        console.error('Update ticket status error:', error)
        res.status(500).json({ error: 'Gagal mengupdate status tiket' })
    }
})
export default router
