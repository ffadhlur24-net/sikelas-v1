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
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .order('nama', { ascending: true })

        if (error) throw error

        res.json({ rooms: data })

    } catch (error) {
        console.error('get rooms error', error)
        res.status(500).json({ error: 'Gagal mengambil data ruangan.' })
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