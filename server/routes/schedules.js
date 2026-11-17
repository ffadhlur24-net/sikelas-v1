//=============================
// Routes: Manajemen Jadwal SIAKAD (3NF Compliant)
//=============================
import { Router } from 'express'
import supabase from '../config/supabase.js'
import { verifyToken, adminOnly } from '../middleware/auth.js'

const router = Router()

// 1. GET /api/schedules
router.get('/', verifyToken, async (req, res) => {
    try {
        const { room_id, departemen_id, hari } = req.query
        let query = supabase
            .from('schedules')
            .select('*, rooms(nama, gedung, kampus), departemen(id, nama_prodi, fakultas, kode_prodi)')
            .order('hari', { ascending: true })

        if (room_id) {
            query = query.eq('room_id', room_id)
        }
        if (departemen_id) {
            query = query.eq('departemen_id', departemen_id)
        }
        if (hari) {
            query = query.eq('hari', hari)
        }

        const { data, error } = await query
        if (error) throw error

        const formattedSchedules = (data || []).map(s => ({
            ...s,
            prodi: s.departemen?.nama_prodi || '-'
        }))

        res.json({ schedules: formattedSchedules })
    } catch (error) {
        console.error('Get schedules error.', error)
        res.status(500).json({ error: 'Gagal mengambil data jadwal' })
    }
})

// 2. POST /api/schedules
router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { room_id, prodi, departemen_id, semester, dosen, kelas, mata_kuliah, hari, waktu_mulai, waktu_selesai } = req.body

        let resolvedDepartemenId = departemen_id ? Number(departemen_id) : null
        if (!resolvedDepartemenId && prodi) {
            const { data: dep } = await supabase.from('departemen').select('id').ilike('nama_prodi', prodi.trim()).maybeSingle()
            if (dep) resolvedDepartemenId = dep.id
        }

        if (!room_id || !resolvedDepartemenId || !semester || !kelas || !mata_kuliah || !hari || !waktu_mulai || !waktu_selesai || !dosen) {
            return res.status(400).json({ error: 'Semua kolom jadwal wajib diisi (termasuk Program Studi)!' })
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
                error: `BENTROK: Ruangan pada hari ${hari} jam ${waktu_mulai}-${waktu_selesai} sudah diisi matkul "${conflicts[0].mata_kuliah}".`
            })
        }

        const insertPayload = {
            room_id,
            departemen_id: resolvedDepartemenId,
            semester,
            kelas,
            mata_kuliah,
            hari,
            waktu_mulai,
            waktu_selesai,
            dosen
        }

        const { data, error } = await supabase
            .from('schedules')
            .insert([insertPayload])
            .select('*, rooms(nama, gedung, kampus), departemen(id, nama_prodi, fakultas, kode_prodi)')

        if (error) throw error

        const formattedSched = data && data.length > 0 ? {
            ...data[0],
            prodi: data[0].departemen?.nama_prodi || '-'
        } : null

        res.status(201).json({ message: 'Jadwal SIAKAD berhasil ditambahkan.', schedules: formattedSched })
    } catch (error) {
        console.error('Add schedule error:', error)
        res.status(500).json({ error: 'Gagal menambahkan jadwal.' })
    }
})

// 3. PUT /api/schedules/:id - Edit Jadwal SIAKAD
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params
        const { room_id, prodi, departemen_id, semester, dosen, kelas, mata_kuliah, hari, waktu_mulai, waktu_selesai } = req.body

        let resolvedDepartemenId = departemen_id ? Number(departemen_id) : null
        if (!resolvedDepartemenId && prodi) {
            const { data: dep } = await supabase.from('departemen').select('id').ilike('nama_prodi', prodi.trim()).maybeSingle()
            if (dep) resolvedDepartemenId = dep.id
        }

        if (!room_id || !semester || !kelas || !mata_kuliah || !hari || !waktu_mulai || !waktu_selesai || !dosen) {
            return res.status(400).json({ error: 'Semua kolom jadwal wajib diisi!' })
        }

        const updatePayload = {
            room_id,
            semester,
            kelas,
            mata_kuliah,
            hari,
            waktu_mulai,
            waktu_selesai,
            dosen
        }
        if (resolvedDepartemenId) {
            updatePayload.departemen_id = resolvedDepartemenId
        }

        const { data, error } = await supabase
            .from('schedules')
            .update(updatePayload)
            .eq('id', id)
            .select('*, rooms(nama, gedung, kampus), departemen(id, nama_prodi, fakultas, kode_prodi)')

        if (error) throw error

        const formattedSched = data && data.length > 0 ? {
            ...data[0],
            prodi: data[0].departemen?.nama_prodi || '-'
        } : null

        res.json({ message: 'Jadwal SIAKAD berhasil diperbarui!', schedule: formattedSched })
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