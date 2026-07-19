import { useState, useEffect } from 'react'
import api from '../../api/axios'

function PelaporanKelas() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [formData, setFormData] = useState({
    room_id: '',
    mata_kuliah: '',
    alasan: ''
  })
  // 1. Ambil daftar ruangan (untuk dropdown)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms')
        setRooms(response.data.rooms)
      } catch (error) {
        console.error("Gagal mengambil data ruangan:", error)
      }
    }
    fetchRooms()
  }, [])
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  // 2. Kirim laporan ke Backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const response = await api.post('/reports', formData)
      setMessage({ text: response.data.message, type: 'success' })
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage({ text: error.response.data.error, type: 'error' })
      } else {
        setMessage({ text: 'Terjadi kesalahan koneksi server.', type: 'error' })
      }
    } finally {
      setLoading(false)
    }

  }
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Pelaporan Kelas Kosong</h1>
        <p className="page-subtitle">Sampaikan laporan ketidakhadiran dosen atau perubahan jadwal kelas hari ini</p>
      </div>

      <div className="card-flat" style={{ maxWidth: '600px' }}>

        {/* Notifikasi */}
        {message.text && (
          <div style={{
            background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
            color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
            padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Jenis Laporan / Kendala</label>
            <select name="alasan" value={formData.alasan} onChange={handleChange} className="input-field" required>
              <option value="">-- Pilih Jenis Laporan --</option>
              <option value="DOSEN_BERHALANGAN">Dosen Berhalangan Hadir</option>
              <option value="RUANGAN_TERKUNCI">Ruangan Terkunci / Bermasalah</option>
              <option value="KELAS_ONLINE">Kelas Dipindah ke Online (Zoom/Meet)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mata Kuliah</label>
            <input type="text" className="input-field" name="mata_kuliah" value={formData.mata_kuliah} onChange={handleChange} placeholder="Contoh: Struktur Data" required />
          </div>

          <div className="form-group">
            <label className="form-label">Ruangan Jadwal Asli</label>
            <select className="input-field" name="room_id" value={formData.room_id} onChange={handleChange} required>
              <option value="">-- Pilih Ruangan --</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.nama} ({room.gedung})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-error' }} disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default PelaporanKelas
