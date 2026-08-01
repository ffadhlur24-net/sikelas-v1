// =================================
// Routes: Autentikasi(Login, Register)
// =================================

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// POST/api/auth/register
// untuk mendaftarkan PJ baru

router.post('/register', async (req, res) => {
    try {
        const { username, nim_nip, email, password, prodi, semester, mata_kuliah, kelas, no_hp } = req.body

        // 1. Validasi input
        if (!username || !nim_nip || !email || !password || !prodi || !mata_kuliah || !kelas || !semester || !no_hp) {
            return res.status(400).json({
                error: 'Semua kolom wajib diisi broo!'
            })
        }

        // 2. Cek username Duplikat
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single()

        if (existingUser) {
            return res.status(409).json({
                error: "Username sudah terdaftar, pilih username yang lain aja coy."
            })
        }

        // 3. Cek double PJ
        const { data: existingPJ } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'pj')
            .eq('prodi', prodi)
            .eq('mata_kuliah', mata_kuliah)
            .eq('kelas', kelas)
            .single()
        if (existingPJ) {
            return res.status(400).json({
                error: `Pendaftaran Ditulak: Mata kuliah ${mata_kuliah} (${prodi}) Kelas ${kelas} Sudah memiliki Penganggung Jawab!`
            })
        }

        // 4. hash password (enkripsi)
        const hashedPassword = await bcrypt.hash(password, 10)

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                username,
                password: hashedPassword,
                role: 'pj',
                nim_nip,
                email,
                prodi,
                mata_kuliah,
                semester,
                kelas,
                no_hp,
                status: 'pending' // Menunggu admin acc
            })
            .select()

        if (error) throw error

        // 5. Kirim respon sukse
        res.status(201).json({
            message: 'Registrasi berhasil! Menunggu verifikasi admin.',
            user: {
                id: newUser.id,
                nama: newUser.nama,
                nim: newUser.nim,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
            }
        })

    } catch (error) {
        console.error('Registrasi error:', error)
        res.status(500).json({ error: 'Terjadi kesalahan diserver.' })
    }
})
// Mengambil seluruh mata kuliah yang belum memiliki pj
// Mengambil seluruh mata kuliah yang belum memiliki pj
router.get('/registration-options', async (req, res) => {
    try {
        const { data: allSchedules, error: schedError } = await supabase
            .from('schedules')
            .select('prodi, semester, kelas, mata_kuliah')

        if (schedError) throw schedError

        const { data: takenUsers, error: userError } = await supabase
            .from('users')
            .select('prodi, semester, kelas, mata_kuliah')
            .eq('role', 'pj')

        if (userError) throw userError

        const takenKeys = new Set((takenUsers || []).map(u =>
            `${u.prodi}|${u.semester}|${u.kelas}|${u.mata_kuliah}`
        ))

        // Filter mata kuliah yang BELUM ada PJ-nya
        const availableSchedules = (allSchedules || []).filter(s => {
            const key = `${s.prodi}|${s.semester}|${s.kelas}|${s.mata_kuliah}`
            return !takenKeys.has(key)
        })

        if (availableSchedules.length === 0) {
            return res.json({
                isOpen: false,
                message: 'Pendaftaran penanggung jawab telah ditutup (Semua Mata Kuliah sudah memiliki PJ).'
            })
        }

        res.json({
            isOpen: true,
            availableSchedules
        })
    } catch (error) {
        console.error('Registration options error:', error)
        res.status(500).json({ error: 'Gagal mengambil opsi pendaftaran' })
    }
})

//POST/api/auth/login
// Untuk login PJ dan Admin
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body

        // 1. Validasi input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email.dan Password wajib diisi.'
            })
        }

        // 2. cari user berdasarkan email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error || !user) {
            return res.status(401).json({
                error: "Email atau password salah."
            })
        }

        // 3. cek apakah akun sudah diverifikasi
        if (user.status === 'pending') {
            return res.status(403).json({
                error: 'Akun belum diverifikasi oleh admin'
            })
        }

        if (user.status === 'nonaktif') {
            return res.status(403).json({
                error: 'Akun Anda telah dinontaktifkan'
            })
        }

        // 4. Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            if (req.rateLimiter) req.rateLimiter.recordFailedAttempt()
            return res.status(401).json({
                error: 'Email atau password salah.'
            })
        }

        if (req.rateLimiter) req.rateLimiter.resetAttempts()
        // 5. Buat JWT token
        const token = jwt.sign({
            id: user.id,
            nama: user.nama,
            nim: user.nim,
            email: user.email,
            role: user.role
        },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )
        // 6. Kirim response + token
        res.json({
            message: "Login berhasil",
            token,
            user: {
                id: user.id,
                username: user.username,
                nim_nip: user.nim_nip,
                email: user.email,
                role: user.role,
                prodi: user.prodi,
                semester: user.semester,
                kelas: user.kelas,
                mata_kuliah: user.mata_kuliah,
                no_hp: user.no_hp
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: "Terjadi kesalahan pada server. harap dimaklumkan" })
    }
})

// GET /api/auth/available-courses
// Mengambil daftar mata kuliah dari SIAKAD yang belum memiliki PJ
router.get('/available-courses', async (req, res) => {
    try {
        const { prodi, kelas } = req.query;

        if (!prodi || !kelas) {
            return res.status(400).json({ error: 'Prodi dan kelas wajib dipilih' })
        }

        // 1. Ambil semua mata kuliah dari master data schedule(SIAKAD)
        const { data: allSchedules, error: schedError } = await supabase
            .from('schedules')
            .select('mata_kuliah')

        if (schedError) throw schedError

        // Ekstrak nama mata kuliah (tanpa duplikat)
        const allCourses = [...new Set((allSchedules || []).map(s => s.mata_kuliah))];


        const { data: tokenPjs, error: userError } = await supabase
            .from('users')
            .select('mata_kuliah')
            .eq('role', 'pj')
            .eq('prodi', prodi)
            .eq('kelas', kelas)

        if (userError) throw userError;

        const tokenCourses = new Set((tokenPjs || []).map(u => u.mata_kuliah));

        // FILTER: Hanya mengambil mata kuliah yang belum memiliki PJ
        const availableCourses = allCourses.filter(course => !tokenCourses.has(course))

        res.json({ courses: availableCourses })
    } catch (error) {
        console.error('Fetch available course error:', error);
        res.status(500).json({ error: 'Gagal mengambil daftar mata kuliah.' })
    }
});
export default router