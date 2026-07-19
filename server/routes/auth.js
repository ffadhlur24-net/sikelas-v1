// =================================
// Routes: Autentikasi(Login, Register)
// =================================

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'

const router = Router()

// POST/api/auth/register
// untuk mendaftarkan PJ baru

router.post('/register', async (req, res) => {
    try {
        const { nama, nim, email, password, prodi, no_hp } = req.body

        // 1. Validasi input
        if (!nama || !nim || !email || !password) {
            return res.status(400).json({
                error: 'Nama, NIM, Email, dan Password wajib diisi broo!'
            })
        }

        // 2. Cek apakah email atau NIM sudah terdaftar
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},nim.eq.${nim}`)
            .single()

        if (existing) {
            return res.status(409).json({
                error: "Email atau NIM sudah terdaftar."
            })
        }

        // 3. hash password (enkripsi)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // 4. Input ke database( tabel user)
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                nama,
                nim,
                email,
                password: hashedPassword,
                prodi: prodi || null,
                no_hp: no_hp || null,
                role: 'pj',
                status: 'pending' // Menunggu admin acc
            })
            .select()
            .single()

        if (error) {
            console.error("Supabase error:", error)
            return res.status(500).json({ error: 'Gagal mendaftarkan user.' })
        }

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
//POST/api/auth/login
// Untuk login PJ dan Admin
router.post('/login', async (req, res) => {
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
            return res.status(401).json({
                error: 'Email atau password salah.'
            })
        }
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
                nama: user.nama,
                nim: user.nim,
                email: user.email,
                role: user.role,
                prodi: user.prodi
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: "Terjadi kesalahan pada server. harap dimaklumkan" })
    }
})

export default router