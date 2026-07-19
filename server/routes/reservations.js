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
            .select('*, rooms(nama, gedung), users(nama, nim)')
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

export default router