// =========================================================
// Middleware Rate Limiter Login Per Perangkat (IP Limiter)
// =========================================================

const attemptStore = new Map();

export const loginLimiter = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    const now = Date.now()

    const record = attemptStore.get(ip) || { count: 0, lockUntil: 0 }

    if (record.lockUntil > now) {
        const remainingMinutes = Math.ceil((record.lockUntil - now) / 60000)
        return res.status(429).json({
            error: `🚨 Terlalu banyak percobaan login gagal dari perangkat Anda! Demi keamanan, silakan tunggu ${remainingMinutes} menit lagi sebelum mencoba lagi.`
        })
    }

    if (record.lockUntil && record.lockUntil <= now) {
        record.count = 0
        record.lockUntil = 0
    }

    req.rateLimiter = {
        recordFailedAttempt: () => {
            record.count += 1
            if (record.count >= 5) {
                record.lockUntil = Date.now() + 15 * 60 * 1000
            }
            attemptStore.set(ip, record)
        },
        resetAttempts: () => {
            attemptStore.delete(ip)
        }
    }
    next()
}