//==================================
// Routes: Managemen User (Admin)
//==================================

import { Router } from "express"
import supabase from "../config/supabase.js";
import { verifyToken, adminOnly } from "../middleware/auth.js"

const router = Router()

// GET /api/users - Ambil daftar semua user (Kecuali Admin)
router.get('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, nama, nim, email, prodi, no_hp, role, status, created_at')
            .neq('id', req.user.id) // Jangan tampilkan admin yang sedang login
            .order('created_at', { ascending: false })

        if (error) throw error

        res.json({ users: data })
    } catch (error) {
        console.error("Get users error:", error)
        res.status(500).json({ error: 'Gagal mengambil data pengguna.' })
    }

})

// PATCH /api/user/:id/status -Ubah status user (aktif, nonaktif)
router.patch('/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body // Aktif, Nonaktif, dan Pending

        const { data, error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', id)
            .select('id, nama, status')
            .single()
        if (error) throw error

        res.json({ message: `Status pengguna berhasil diubah menjadi ${status}.`, user: data })
    } catch (error) {
        console.error('Update user status error', error)
        res.status(500).json({ error: 'Gagal mengubah status pengguna.' })
    }
})

export default router