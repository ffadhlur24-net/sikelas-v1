// =============================
// Sikelas Backend Server
// =============================

import express from 'express'
import cors from 'cors'
import 'dotenv/config'


// Import routes 
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import reservationRoutes from './routes/reservations.js'
import reportRoutes from './routes/reports.js'
import userRoutes from './routes/user.js'

// Inisialisasi Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
// Parse JSON body
app.use(express.json())
// menyambungkan localhost ke frontend
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)

// Routes test sederhana
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: "API Sikelas wis Ready",
        timestamp: new Date().toISOString()
    })
})
// Start Server
app.listen(PORT, () => {
    console.log(`\n Server Sikelas berjalan di http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health\n`)
})