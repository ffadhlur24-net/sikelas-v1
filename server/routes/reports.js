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
            .select('*, rooms(nama), users(nama, nim)')
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
        const { room_id, mata_kuliah, alasan } = req.body

        const { data, error } = await supabase
            .from('reports')
            .insert({
                user_id: req.user.id,
                room_id,
                mata_kuliah,
                alasan,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        res.status(201).json({
            message: 'Laporan berhasil dikirim.', report: data
        })
    } catch (error) {
        console.error('Create report error:', error)
        res.status(500).json({ error: 'Gagal membuat laporan.' })
    }
})

// PATCH /api/reports/:id/resolve - Tandai laporan selesai (Admin Only)
router.patch('/:id/resolve', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params

        const { data, error } = await supabase
            .from('reports')
            .update({ status: 'verified' })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        res.json({ message: 'Laporan ditandai selesai.', report: data })
    } catch (error) {
        console.error('Resolve report error:', error)
        res.status(500).json({ error: 'Gagal menyelesaikan laporan.' })
    }
})



export default router

