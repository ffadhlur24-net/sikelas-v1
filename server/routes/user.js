//==================================
// Routes: Managemen User (Admin)
//==================================

import { Router } from "express"
import bcrypt from 'bcryptjs'
import supabase from "../config/supabase.js";
import { verifyToken, adminOnly } from "../middleware/auth.js"
import { sendPasswordOtpEmail } from '../untils/sendEmail.js'

const router = Router()

// PUT /api/users/profile - Edit Profil Mandiri (Admin & PJ)
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { username, no_hp, old_password, new_password, otp_code } = req.body
        const userId = req.user.id

        const { data: currentUser, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (fetchErr || !currentUser) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' })
        }

        const updatePayload = {}

        if (username && username.trim() !== '') {
            updatePayload.username = username.trim()
        }

        if (no_hp !== undefined) {
            updatePayload.no_hp = no_hp.trim()
        }

        if (new_password && new_password.trim() !== '') {
            if (!otp_code || otp_code.trim() === '') {
                return res.status(400).json({ error: 'Kode OTP wajib diisi!' })
            }

            if (currentUser.otp_code !== otp_code.trim()) {
                return res.status(400).json({ error: 'Kode OTP yang Anda masukkan salah!' })
            }
            if (currentUser.otp_expires_at && new Date() > new Date(currentUser.otp_expires_at)) {
                return res.status(400).json({ error: 'Kode OTP telah kadaluwarsa! Silakan minta kode baru.' })
            }
            if (!old_password) {
                return res.status(400).json({ error: 'Password lama wajib diisi untuk mengubah password baru!' })
            }
            const isMatch = await bcrypt.compare(old_password, currentUser.password)
            if (!isMatch) {
                return res.status(400).json({ error: 'Password lama Anda tidak sesuai!' })
            }

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(new_password.trim(), salt)
            updatePayload.password = hashedPassword
            updatePayload.otp_code = null
            updatePayload.otp_expires_at = null
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ error: 'Tidak ada data yang diubah' })
        }

        const { data: updatedUser, error: updateErr } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', userId)
            .select('id, username, nim_nip, email, prodi, semester, kelas, mata_kuliah, no_hp, role, status')
            .single()

        if (updateErr) throw updateErr

        res.json({
            message: 'Profil berhasil diperbarui!',
            user: updatedUser
        })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({ error: error.message || 'Gagal memperbarui profil' })
    }
})

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

router.post('/request-password-otp', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id
        // 1. Ambil data email & username user
        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('email, username')
            .eq('id', userId)
            .single()
        if (fetchErr || !user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
        }
        // 2. Generate OTP 6-Digit & masa berlaku (15 menit)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
        // 3. Update otp_code di database Supabase
        const { error: updateErr } = await supabase
            .from('users')
            .update({
                otp_code: otpCode,
                otp_expires_at: otpExpiresAt.toISOString()
            })
            .eq('id', userId)
        if (updateErr) throw updateErr
        // 4. Kirim email OTP via Resend menggunakan template ubah password
        await sendPasswordOtpEmail(user.email, otpCode, user.username)
        res.json({ message: 'Kode OTP verifikasi telah dikirim ke email Anda!' })
    } catch (error) {
        console.error('Request OTP profile error:', error)
        res.status(500).json({ error: 'Gagal mengirim kode OTP ke email.' })
    }
})

export default router