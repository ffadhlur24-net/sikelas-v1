import { useState, useEffect } from "react";
import api from '../../api/axios'

function ReservasiKelas() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [formData, setFormData] = useState({
    room_id: '',
    mata_kuliah: '',
    tanggal: '',
    waktu_mulai: '',
    waktu_selesai: ''
  })

  // 1. Ambil daftar ruangan untuk opsi di dropdown
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms')
        // Hanya tampilkan ruangan yang bersetatus 'tersedia'
        const availableRooms = response.data.rooms.filter(r => r.status === 'tersedia')
        setRooms(availableRooms)
      } catch (error) {
        console.error("Gagal mengambil data ruangan:", error)
      }
    }
    fetchRooms()
  }, [])
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // 2. Kirim data reservasi ke backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const response = await api.post('/reservations', formData)
      setMessage({ text: response.data.message, type: 'success' })

      // Kosongkan form setelah sukses
      setFormData({
        room_id: '',
        mata_kuliah: '',
        tanggal: '',
        waktu_mulai: '',
        waktu_selesai: ''
      })
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage({ text: error.response.data.error, type: 'error' })
      } else {
        setMessage({ text: 'Terjadi Kesalahan koneksi server.', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reservasi Kelas Pengganti</h1>
        <p className="page-subtitle">Ajukan peminjaman ruangan untuk kelas pengganti atau tambahan.</p>
      </div>

      <div className="card-flat" style={{ maxWidth: '600px' }}>
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
            <label className="form-label">Mata Kuliah</label>
            <input type="text" className="input-field" name="mata_kuliah" value={formData.mata_kuliah} onChange={handleChange} placeholder="Contoh: Studi MBG" />
          </div>

          <div className="form-group">
            <label className="form-label">Ruangan yang dipinjam</label>
            <select name="room_id" value={formData.room_id} onChange={handleChange} className="input-field">
              <option value="">-- Pilih Ruangan --</option>
              {rooms.map(room => (
                <option value={room.id} key={room.id}>
                  {room.nama} ({room.gedung} Lt.{room.lantai}) - {room.kapasitas} Kursi
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Pengganti</label>
            <input type="date" className="input-field" name='tanggal' value={formData.tanggal} onChange={handleChange} required />
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Waktu Mulai</label>
              <input type="time" className="input-field" name="waktu_mulai" value={formData.waktu_mulai} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Waktu Selesai</label>
              <input type="time" className="input-field" name="waktu_selesai" value={formData.waktu_selesai} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            {/* <button type="button" className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  room_id: '',
                  mata_kuliah: '',
                  tanggal: '',
                  waktu_mulai: '',
                  waktu_selesai: ''
                });
                setMessage({ text: '', type: '' })
              }} >Batal</button> */}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Mengajukan...' : 'Ajukan Reservasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default ReservasiKelas