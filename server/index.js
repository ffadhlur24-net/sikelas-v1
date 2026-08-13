// =============================
// Sikelas Backend Server
// =============================

import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import supabase from './config/supabase.js'


// Import routes 
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import reservationRoutes from './routes/reservations.js'
import reportRoutes from './routes/reports.js'
import userRoutes from './routes/user.js'
import scheduleRoutes from './routes/schedules.js'
import departemenRoutes from './routes/departemen.js'
import facilityRoutes from './routes/facilityReports.js'
import notificationRoutes from './routes/notification.js'
import { initCronJobs } from './tasks/cronJobs.js';


// Inisialisasi Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
// Parse JSON body
app.use(express.json())
// menyambungkan localhost ke frontend
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}))
// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/departemen', departemenRoutes)
app.use('/api/facility-reports', facilityRoutes)
app.use('/api/notifications', notificationRoutes)

// Routes test sederhana
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: "API Sikelas wis Ready",
        timestamp: new Date().toISOString()
    })
})
// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n Server Sikelas berjalan di http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health\n`)
})

//========================================================
// BACKGROUND JOB: Sweeper Auto-Cancel & Auto-Expire
//========================================================

// setInterval(async () => {
//     try {
//         const now = new Date();
//         const currentTime = now.toTimeString().split(' ')[0]; // format "HH:MM:SS"
//         const currentDate = now.toISOString().split('T')[0]; // format "YYYY-MM-DD"

//         // Hitung waktu toleransi: Waktu sekarang dikurangi 15 menit
//         const checkTimeObj = new Date(now.getTime() - 15 * 60000)
//         const checkTime = checkTimeObj.toTimeString().split(' ')[0];

//         // Cari dan Tolak
//         const { data, error } = await supabase
//             .from('reservations')
//             .update({ status: 'rejected' })
//             .eq('status', 'approved')
//             .eq('is_checked_in', false)
//             .eq('tanggal', currentDate)
//             .lt('waktu_mulai', checkTime) // waktu mulainya lebih sudah lewat dari waktu toleran
//             .select();

//         if (data && data.length > 0) {
//             console.log(`[Sweeper] Membatalkan ${data.length} reservasi karena PJ gaje banget.`)
//         }

//         const { data: repData } = await supabase
//             .from('reports')
//             .update({ status: 'expired' })
//             .eq('status', 'pending')
//             .lt('tanggal', currentDate)
//             .select('*')

//         if (repData && repData.length > 0) {
//             console.log(`[Sweeper] mengubah ${repData.length} laporan menjadi expired karena sudah kadaluarsa`)
//         }
//     } catch (error) {
//         console.error('[Sweeper] Error:', error.message)
//     }
// }, 60000) // Berdetak setiap 1 menit
initCronJobs()