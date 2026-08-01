//===========================================
// Routes: Menegemen Master Prodi & Fakultas
//===========================================

import { Router } from "express";
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from "../middleware/auth.js";

const router = Router()

// GET /api/departemen - Ambil semua Prodi & Fakultas 
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('departemen')
            .select('*')
            .order('fakultas', { ascending: true })

        if (error) throw error
        res.json({ departemen: data })
    } catch (error) {
        console.error('error fetching departemen:', error)
        res.status(500).json({ error: "Gagal mengambil data Prodi & Fakultas" })
    }
})

// POST /api/departemen
router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { nama_prodi, fakultas, kode_prodi } = req.body
        if (!(nama_prodi && fakultas)) {
            return res.status(400).json({ error: "Prodi & Fakultas wajib diisi" })
        }
        const { data, error } = await supabase
            .from('departemen')
            .insert([{ nama_prodi, fakultas, kode_prodi }])
            .select('*')
            .single()

        if (error) throw error
        res.status(201).json({ message: 'Program Studi berhasil ditambah.', departemen: data })
    } catch (error) {
        console.error('Create department error:', error)
        res.status(500).json({ error: 'Gagal menambahkan Program Studi.' })
    }
})

// PUT /api/departemen/:id - Edit Prodi
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { nama_prodi, fakultas, kode_prodi } = req.body
        const { data, error } = await supabase
            .from('departemen')
            .update({ nama_prodi, fakultas, kode_prodi })
            .eq('id', id)
            .select('*')
            .single()

        if (error) throw error
        res.json({ message: 'Data Program Studi berhasi diperbarui.' })
    } catch (error) {
        console.error('Update department error:', error)
        res.status(500).json({ error: 'Gagal memperbarui data Program Studi.' })
    }
})

// DELETE /api/departemen/:id - Hapus Prodi
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('departemen')
            .delete()
            .eq('id', id)

        if (error) throw error
        res.json({ message: 'Prodi berhasil dihapus.' })
    } catch (error) {
        console.error('Delete department error:', error)
        res.status(500).json({ error: 'Gagal menghapus Prodi.' })
    }
})

export default router