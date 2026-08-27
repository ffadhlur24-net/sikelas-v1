// =================================
// Routes: Autentikasi(Login, Register)
// =================================

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'
import { loginLimiter } from '../middleware/rateLimiter.js'
import { sendOtpEmail, checkEmailDeliveryStatus } from '../utils/sendEmail.js'
const router = Router()

// Tracker ID Email Pengiriman Terakhir untuk Real-time Bounce Detection
const emailTracker = new Map()

// POST/api/auth/register
// untuk mendaftarkan PJ baru

router.post('/register', async (req, res) => {
    try {
        console.log('📩 [REGISTER REQUEST BODY]:', req.body)
        const { username, email, password, prodi, semester, mata_kuliah, kelas, no_hp } = req.body

        // 1. Validasi input kelengkapan
        if (!username || !email || !password || !prodi || !mata_kuliah || !kelas || !semester || !no_hp) {
            console.log('❌ [REGISTER FAILED]: Ada kolom yang kosong!')
            return res.status(400).json({
                error: 'Semua kolom wajib diisi!'
            })
        }
        const cleanEmail = email.trim().toLowerCase()
        if (!cleanEmail.endsWith('@student.walisongo.ac.id')) {
            return res.status(400).json({ error: 'Pendaftaran gagal: Wajib menggunakan email kampus(@student.walisongo.ac.id)' })
        }

        const nim_nip = cleanEmail.split("@")[0]
        if (!nim_nip || nim_nip.length < 5) {
            return res.status(400).json({
                error: 'Format email kampus tidak valid.'
            })
        }

        // DNS MX lookup bypassed for reliability

        const phoneRegex = /^08[0-9]{8,13}$/
        if (!phoneRegex.test(no_hp.trim())) {
            return res.status(400).json({
                error: 'Nomor HP harus berawalan 08 dan terdiri dari 10 hingga 15 digit angka.'
            })
        }

        // 1d. Validasi Panjang Password (Minimal 8 karakter)
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password minimal harus 8 karakter.'
            })
        }

        // 2. Cek NIM / NIP Duplikat
        const { data: existingNim } = await supabase
            .from('users')
            .select('id, status, otp_expires_at')
            .eq('nim_nip', nim_nip.trim())
            .maybeSingle()

        if (existingNim) {
            const now = new Date()
            const isPending = ['pending', 'pending_email_verification'].includes(existingNim.status)
            const isPendingValid = isPending && existingNim.otp_expires_at && new Date(existingNim.otp_expires_at) > now
            if (existingNim.status === 'verified' || isPendingValid) {
                return res.status(409).json({ error: "NIM / NIP ini sudah terdaftar." })
            }
        }

        // 2b. Cek Email Duplikat (Auto-Overwrite jika akun pending)
        const { data: existingEmail } = await supabase
            .from('users')
            .select('id, status')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle()

        if (existingEmail) {
            const isPending = ['pending', 'pending_email_verification'].includes(existingEmail.status)
            if (isPending) {
                console.log(`🧹 [Register Overwrite] Menghapus akun pending email ${email}...`)
                await supabase.from('users').delete().eq('id', existingEmail.id)
            } else {
                return res.status(409).json({
                    error: "Email ini telah memiliki akun aktif."
                })
            }
        }

        // 3. Cek double PJ & Pembersihan Instan Akun Gantung Expired
        const { data: existingPJ } = await supabase
            .from('users')
            .select('id, username, status, otp_expires_at, email')
            .eq('role', 'pj')
            .eq('prodi', prodi)
            .eq('mata_kuliah', mata_kuliah)
            .eq('kelas', kelas)
            .maybeSingle()

        if (existingPJ) {
            const isOtpExpired = existingPJ.otp_expires_at && new Date() > new Date(existingPJ.otp_expires_at)
            const isSameUser = existingPJ.email === email.trim().toLowerCase()
            const isPending = ['pending', 'pending_email_verification'].includes(existingPJ.status)

            // Pembersihan Instan: Jika akun lama 'pending' DAN (OTP expired ATAU pendaftar yang sama mendaftar ulang), hapus akun gantung lama tersebut!
            if (isPending && (isOtpExpired || isSameUser)) {
                console.log(`🧹 [Register Instant Cleanup] Menghapus akun gantung pending (ID: ${existingPJ.id}, User: ${existingPJ.username}) untuk mengosongkan matkul ${mata_kuliah}.`)
                await supabase.from('users').delete().eq('id', existingPJ.id)
            } else {
                console.log(`❌ [REGISTER FAILED]: Double PJ untuk ${mata_kuliah} (${prodi}) Kelas ${kelas}`)
                return res.status(400).json({
                    error: `Pendaftaran Ditolak: Mata kuliah ${mata_kuliah} (${prodi}) Kelas ${kelas} sedang dalam proses verifikasi OTP oleh calon PJ lain (${existingPJ.username}, berlaku 15 menit).`
                })
            }
        }

        // 4. Hash password (enkripsi)
        const hashedPassword = await bcrypt.hash(password, 10)

        // 5. Generate Kode OTP 6-Digit & Expire Time (15 menit)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

        const cleanSemester = String(semester || '1').trim()

        const insertPayload = {
            username,
            nim_nip,
            email,
            password: hashedPassword,
            prodi,
            semester: cleanSemester,
            mata_kuliah,
            kelas,
            no_hp,
            role: 'pj',
            status: 'pending_email_verification',
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt.toISOString()
        }

        let { data: newUser, error } = await supabase
            .from('users')
            .insert(insertPayload)
            .select()
            .single()

        if (error && error.message && (error.message.includes('otp_code') || error.message.includes('otp_expires_at') || error.message.includes('column'))) {
            delete insertPayload.otp_code
            delete insertPayload.otp_expires_at
            insertPayload.status = 'pending'
            const retry = await supabase
                .from('users')
                .insert(insertPayload)
                .select()
                .single()

            newUser = retry.data
            error = retry.error
        }

        if (error) {
            console.error('Supabase Insert User Error:', error)
            if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('already exists') || error.message.includes('duplicate')))) {
                return res.status(409).json({
                    error: 'Pendaftaran Gagal: Email, NIM/NIP, atau Username ini sudah terdaftar di sistem. Silakan gunakan akun/email lain.'
                })
            }
            return res.status(400).json({ error: error.message || 'Gagal melakukan pendaftaran akun.' })
        }

        // 5. Kirim email OTP & Lakukan Immediate Bounce Verification (Cegat Langsung Email Palsu)
        const emailResult = await sendOtpEmail(cleanEmail, otpCode, username)

        if (!emailResult || !emailResult.success) {
            if (newUser && newUser.id) {
                await supabase.from("users").delete().eq("id", newUser.id)
            }
            return res.status(400).json({
                error: "Pendaftaran Gagal: Gagal mengirimkan email verifikasi. Pastikan format email Anda benar."
            })
        }

        if (emailResult.emailId) {
            emailTracker.set(cleanEmail, emailResult.emailId)

            // Tunggu 2.5 detik untuk mendeteksi penolakan (Bounce) dari server kampus
            await new Promise(r => setTimeout(r, 2500))
            const delivery = await checkEmailDeliveryStatus(emailResult.emailId, cleanEmail)

            if (delivery.isBounced) {
                if (newUser && newUser.id) {
                    await supabase.from("users").delete().eq("id", newUser.id)
                }
                emailTracker.delete(cleanEmail)
                return res.status(400).json({
                    error: "Pendaftaran Ditolak: Email kampus (" + cleanEmail + ") tidak ditemukan atau tidak aktif di server kampus. Periksa kembali NIM Anda."
                })
            }
        }

        res.status(201).json({
            message: "Registrasi berhasil! Kode verifikasi telah dikirim ke email kampus Anda.",
            email: newUser?.email || cleanEmail,
        })
    } catch (error) {
        console.error('Registrasi error:', error)
        res.status(400).json({ error: error.message || 'Terjadi kesalahan saat memproses registrasi.' })
    }
})

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp_code } = req.body

        if (!email || !otp_code) {
            return res.status(400).json({ error: 'Email dan Kode OTP wajib diisi!' })
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle()

        if (error || !user) {
            return res.status(404).json({ error: 'Akun dengan email tersebut tidak ditemukan' })
        }

        if (user.status !== 'pending_email_verification') {
            return res.status(400).json({ error: 'Email akun ini sudah terverifikasi sebelumnya.' })
        }

        if (user.otp_code !== otp_code.trim()) {
            return res.status(400).json({ error: 'Kode OTP yang Anda masukkan salah!' })
        }

        if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ error: 'Kode OTP telah kadaluarsa! Silakan minta kode baru.' })
        }

        const { error: updateErr } = await supabase
            .from('users')
            .update({
                status: 'pending',
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id)

        if (updateErr) throw updateErr
        res.json({ message: 'Email berhasil terverifikasi! Menunggu persetujuan Admin' })
    } catch (error) {
        console.error('Varify OTP error:', error)
        res.status(500).json({ error: 'Gagal memverifikasi OTP' })
    }
})

// POST /api/auth/resend-otp - Kirim Ulang Kode OTP Baru
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ error: 'Email wajib diisi!' })
        }
        // 1. Cari user dengan status pending_email_verification
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, otp_expires_at')
            .eq('email', email)
            .eq('status', 'pending_email_verification')
            .maybeSingle()
        if (error || !user) {
            return res.status(404).json({ error: 'Akun tidak ditemukan atau sudah terverifikasi.' })
        }
        // 2. Cooldown 60 detik — cegah spam kirim ulang
        if (user.otp_expires_at) {
            const lastSent = new Date(user.otp_expires_at).getTime() - (15 * 60 * 1000) // Waktu kirim = expire - 15 menit
            const now = Date.now()
            const diffSeconds = Math.floor((now - lastSent) / 1000)
            if (diffSeconds < 60) {
                return res.status(429).json({
                    error: `Tunggu ${60 - diffSeconds} detik lagi sebelum mengirim ulang.`
                })
            }
        }
        // 3. Generate OTP baru & update di database
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const newExpiry = new Date(Date.now() + 15 * 60 * 1000)
        const { error: updateErr } = await supabase
            .from('users')
            .update({
                otp_code: newOtp,
                otp_expires_at: newExpiry.toISOString()
            })
            .eq('id', user.id)
        if (updateErr) throw updateErr
        // 4. Kirim email OTP baru
        const emailResult = await sendOtpEmail(email, newOtp, user.username)
        if (emailResult && emailResult.emailId) {
            emailTracker.set(email.toLowerCase(), emailResult.emailId)
        }
        res.json({
            message: (emailResult && emailResult.success) ? 'Kode OTP baru telah dikirim ke email Anda!'
                : 'Gagal mengirim email. Silakan coba lagi nanti.'
        })
    } catch (error) {
        console.error('Resend OTP error:', error)
        res.status(500).json({ error: 'Gagal mengirim ulang OTP.' })
    }
})
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
            .maybeSingle()

        if (error || !user) {
            return res.status(401).json({
                error: "Email atau password salah."
            })
        }

        // 3. Cek apakah akun sudah diverifikasi
        if (user.status === 'pending_email_verification') {
            return res.status(403).json({
                error: 'Email Anda belum diverifikasi! Silakan verifikasi email menggunakan kode OTP 6-digit terlebih dahulu.'
            })
        }

        if (user.status === 'pending') {
            return res.status(403).json({
                error: 'Akun Anda sudah terverifikasi email, namun masih menunggu persetujuan (ACC) dari Admin.'
            })
        }

        if (user.status === 'nonaktif') {
            return res.status(403).json({
                error: 'Akun Anda telah dinonaktifkan oleh Admin.'
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
            .select('mata_kuliah, status, otp_expires_at')
            .eq('role', 'pj')
            .eq('prodi', prodi)
            .eq('kelas', kelas)

        if (userError) throw userError;

        const now = new Date()
        // Mata kuliah dianggap TERISI hanya jika PJ 'verified' ATAU 'pending' yang OTP-nya MASIH VALID (<15 menit)
        const takenCourses = new Set(
            (tokenPjs || [])
                .filter(u => u.status === 'verified' || (['pending', 'pending_email_verification'].includes(u.status) && u.otp_expires_at && new Date(u.otp_expires_at) > now))
                .map(u => u.mata_kuliah)
        )

        // FILTER: Hanya mengambil mata kuliah yang belum memiliki PJ aktif (atau yang OTP pendingnya sudah kadaluwarsa)
        const availableCourses = allCourses.filter(course => !takenCourses.has(course))

        res.json({ courses: availableCourses })
    } catch (error) {
        console.error('Fetch available course error:', error);
        res.status(500).json({ error: 'Gagal mengambil daftar mata kuliah.' })
    }
});

// GET /api/auth/check-email?email=...
// Pengecekan real-time apakah email sudah terdaftar
router.get('/check-email', async (req, res) => {
    try {
        const { email } = req.query
        if (!email) {
            return res.status(400).json({ error: 'Email wajib diisi' })
        }

        const { data: existingEmail } = await supabase
            .from('users')
            .select('id, status, otp_expires_at')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle()

        if (existingEmail) {
            if (existingEmail.status === 'verified') {
                return res.json({ exists: true, isVerified: true, message: 'Email ini telah memiliki akun aktif.' })
            }
            // Jika status === 'pending', email dianggap tersedia untuk ditimpa jika registrasi ulang
            return res.json({ exists: false, isPending: true, message: 'Email tersedia.' })
        }

        return res.json({ exists: false, message: 'Email tersedia.' })
    } catch (error) {
        console.error('Check email error:', error)
        res.status(500).json({ error: 'Gagal memeriksa email.' })
    }
})

// POST /api/auth/resume-otp - Melanjutkan verifikasi OTP yang belum kadaluwarsa
router.post('/resume-otp', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email wajib diisi.' })

        const { data: user } = await supabase
            .from('users')
            .select('id, username, email, status, otp_expires_at, mata_kuliah, prodi, kelas')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle()

        if (!user) {
            return res.status(404).json({ error: 'Pendaftaran dengan email ini tidak ditemukan. Silakan mendaftar.' })
        }

        if (user.status === 'verified') {
            return res.status(400).json({ error: 'Akun Anda sudah terverifikasi resmi. Silakan Login.' })
        }

        const now = new Date()
        const isExpired = !user.otp_expires_at || now > new Date(user.otp_expires_at)

        if (isExpired) {
            return res.status(400).json({ error: 'Waktu verifikasi OTP Anda telah kadaluwarsa (>15 menit). Silakan lakukan pendaftaran ulang.' })
        }

        res.json({
            message: 'Verifikasi OTP masih berlaku.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                mata_kuliah: user.mata_kuliah,
                prodi: user.prodi,
                kelas: user.kelas,
                otp_expires_at: user.otp_expires_at
            }
        })
    } catch (error) {
        console.error('Resume OTP error:', error)
        res.status(500).json({ error: 'Gagal melanjutkan verifikasi OTP.' })
    }
})


// GET /api/auth/check-otp-status - Cek Status Pengiriman Email (Bounce Detection)
router.get("/check-otp-status", async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ error: "Email wajib diisi" })

        const cleanEmail = email.trim().toLowerCase()
        const emailId = emailTracker.get(cleanEmail)

        const delivery = await checkEmailDeliveryStatus(emailId, cleanEmail)

        // Jika Bounced, otomatis bersihkan data pendaftaran yang gagal agar user bisa langsung daftar ulang
        if (delivery.isBounced) {
            await supabase.from("users").delete().eq("email", cleanEmail).eq("status", "pending_email_verification")
            emailTracker.delete(cleanEmail)
        }

        res.json(delivery)
    } catch (error) {
        console.error("Check OTP status error:", error)
        res.status(500).json({ error: "Gagal memeriksa status email" })
    }
})

export default router