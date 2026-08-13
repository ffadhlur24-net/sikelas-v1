import { Router } from "express";
import supabase from "../config/supabase.js";
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// GET 
router.get('/', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        const unreadCount = data.filter(n => !n.is_read).length
        res.json({ notifications: data || [], unreadCount })
    } catch (error) {
        console.error('Gagal mengambil notifikasi:', error)
        res.status(500).json({ error: 'Gagal mengambil data notifikasi' })

    }
})

// POST
router.post('/', verifyToken, async (req, res) => {
    try {
        const { user_id, title, message, type } = req.body
        const { data, error } = await supabase
            .from('notifications')
            .insert([{ user_id, title, message, type: type || 'info' }])
            .select('*')

        if (error) throw error
        res.status(201).json({ notifications: data[0] })
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat notifikasi' })
    }
})

router.post('/delete-all', verifyToken, async (req, res) => {
    try {
        const { ids } = req.body // Array ID notifikasi
        let query = supabase
            .from('notifications')
            .delete()
            .eq('user_id', req.user.id)

        if (ids && ids.length > 0) {
            query = query.in('id', ids)
        }
        const { error } = await query
        if (error) throw error
        res.json({ message: 'Notifikasi berhasil dihapus' })
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus notifikasi' })
    }
})

// PATCH
router.patch('/read-all', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.user.id)

        if (error) throw error
        res.json({ message: ' Semuanotifikasi ditandai dibaca' })
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat notifikasi' })
    }
})


export default router