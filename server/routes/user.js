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
            .select('id, username, nim_nip, email, prodi, semester, kelas, mata_kuliah, no_hp, role, status, created_at')
            .eq('role', 'pj') // 👈 Hanya ambil akun bertipe PJ (Keluarkan seluruh Akun Admin)
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
            .select('id, username, status')
            .single()

        if (error) throw error

        res.json({ message: `Status pengguna berhasil diubah menjadi ${status}.`, user: data })
    } catch (error) {
        console.error('Update user status error', error)
        res.status(500).json({ error: 'Gagal mengubah status pengguna.' })
    }
})
// Hapus Akun PJ
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error
        res.json({ message: 'Akun PJ berhasil dihapus secara permanent' })
    } catch (error) {
        console.error('Delete user error:', error)
        res.status(500).json({ error: 'Gagal menghapus akun PJ.' })
    }
})
// Edit data PJ
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { username, nim_nip, prodi, semester, kelas, mata_kuliah, no_hp, status } = req.body
        const { data, error } = await supabase
            .from('users')
            .update({ username, nim_nip, prodi, semester, kelas, mata_kuliah, no_hp, status })
            .eq('id', id)
            .select('*')
            .single()

        if (error) throw error
        res.json({ message: 'Data Pj berhasil diperbarui.', user: data })
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Gagal memperbarui data PJ.' })
    }
})
// POST /api/users/reset-semester 
router.post('/reset-semester', verifyToken, adminOnly, async (req, res) => {
    try {
        const { confirmation } = req.body

        if (confirmation !== 'RESET-SEMESTER') {
            return res.status(400).json({ error: 'Kode konfirmasi tidak valid.' })
        }
        // 1. Reset PJ
        const { error: userErr } = await supabase
            .from('users')
            .delete()
            .eq('role', 'pj');

        if (userErr) throw userErr
        // 2. Reset Reservations
        const { error: resErr } = await supabase
            .from('reservations')
            .delete()
            .neq('id', 0)

        if (resErr) throw resErr
        // 3. Reset Laporan
        const { error: repErr } = await supabase
            .from('reports')
            .delete()
            .neq('id', 0)
        if (repErr) throw repErr

        // 4. Reset Jadwal SIAKAD
        const { error: schedErr } = await supabase
            .from('schedules')
            .delete()
            .neq('id', 0);
        if (schedErr) throw schedErr
        res.json({ message: 'Reset Akhir Semester Berhasil! Akun PJ, Reservasi, Laporan, dan Jadwal SIAKAD Berhasil Dihapus.' })
    } catch (error) {
        console.error('ResetSemester Error:', error)
        res.status(500).json({ error: 'Gagal melakukan reset semester.' })
    }
});
export default router