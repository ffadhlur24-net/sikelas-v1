//=============================
// Routes: Menegemen Jadwal SIAKAD
//=============================
import { Router } from 'express'
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from '../middleware/auth.js'

const router = Router()

// 1. GET /api/schedules
router.get('/', verifyToken, async (req, res) => {
    try {
        const { room_id } = req.query
        let query = supabase
            .from('schedules')
            .select('*, rooms(nama, gedung, kampus)')
            .order('hari', { ascending: true })

        if (room_id) {
            query = query.eq('room_id', room_id)
        }

        const { data, error } = await query
        if (error) throw error

        res.json({ schedules: data })
    } catch (error) {
        console.error('Get schedules error.', error)
        res.status(500).json({ error: 'Gagal mengambil data jadwal' })
    }
})

// 2. POST /api/schedules
router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { room_id, prodi, semester, dosen, kelas, mata_kuliah, hari, waktu_mulai, waktu_selesai } = req.body
        if (!room_id || !prodi || !semester || !kelas || !mata_kuliah || !hari || !waktu_mulai || !waktu_selesai || !dosen) {
            return res.status(400).json({ error: 'Semua kolom jadwal wajib diisi!' })
        }
        // Cek bentrok jadwal reguler SIAKAD
        const { data: conflicts, error: checkErr } = await supabase
            .from('schedules')
            .select('mata_kuliah')
            .eq('room_id', room_id)
            .eq('hari', hari)
            .lt('waktu_mulai', waktu_selesai)
            .gt('waktu_selesai', waktu_mulai)

        if (checkErr) throw checkErr

        if (conflicts && conflicts.length > 0) {
            return res.status(400).json({
                error: `BENTROK:  Ruangan pada hari ${hari} jam ${waktu_mulai}-${waktu_selesai} sudah diisi matkul "${conflicts[0].mata_kuliah}".`
            })
        }
        const { data, error } = await supabase
            .from('schedules')
            .insert([{ room_id, prodi, semester, kelas, mata_kuliah, hari, waktu_mulai, waktu_selesai, dosen }])
            .select('*')

        if (error) throw error
        res.status(201).json({ message: 'Jadwal SIAKAD berhasil ditambahkan,', schedules: data[0] })
    } catch (error) {
        console.error('Add schedule error:', error)
        res.status(500).json({ error: 'Gagal menambahkan jadwal.' })
    }
})

// 3. PUT /api/schedules/:id - Edit Jadwal SIAKAD
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { room_id, prodi, semester, dosen, kelas, mata_kuliah, hari, waktu_mulai, waktu_selesai } = req.body

        if (!room_id || !prodi || !semester || !kelas || !mata_kuliah || !hari || !waktu_mulai || !waktu_selesai || !dosen) {
            return res.status(400).json({ error: 'Semua kolom jadwal wajib diisi!' })
        }

        const { data, error } = await supabase
            .from('schedules')
            .update({ room_id, prodi, semester, kelas, mata_kuliah, hari, waktu_mulai, waktu_selesai, dosen })
            .eq('id', id)
            .select()

        if (error) throw error

        res.json({ message: 'Jadwal SIAKAD berhasil diperbarui!', schedule: data && data.length > 0 ? data[0] : null })
    } catch (error) {
        console.error('Update schedule error:', error)
        res.status(500).json({ error: error.message || 'Gagal memperbarui jadwal.' })
    }
})

router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id)

        if (error) throw error

        res.json({ message: 'Jadwal SIAKAD berhasil dihapus' })
    } catch (error) {
        console.error('Delete schedule error:', error)
        res.status(500).json({ error: 'Gagal menghapus jadwal' })
    }
})

export default router 