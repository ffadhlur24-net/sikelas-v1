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
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
    "https://sikelas.online",
    "https://www.sikelas.online"
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (seperti mobile apps, curl, server-to-server) atau yang terdaftar
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(null, true) // fallback permisif agar pendaftar tidak terblokir
        }
    },
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

initCronJobs()