// =========================
// Middleware: Verifikasi JWT token
// =========================

import jwt from 'jsonwebtoken'

// mengecet user yang login
const verifyToken = (req, res, next) => {
    // Ambil token dari header 
    const authHeader = req.headers.authorization

    // jika token tidak ada
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Akses ditolak, token tidak ditemukan'
        })
    }

    const token = authHeader.split(' ')[1]

    try {
        // verifikasi token menggunakan secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Simpan data user ke request object agar bisa diakses di route handler berikutnya
        req.user = decoded

        next()// Lanjut ke route handler
    } catch (error) {
        return res.status(401).json({
            error: 'Token tidak valid atau kadaluarsa'
        })
    }
}

// Middleware khusus:Admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Hanya Admin yang bisa mengaksesnya'
        })
    }
    next()
}

export { verifyToken, adminOnly }