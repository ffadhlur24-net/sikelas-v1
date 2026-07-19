import { useState, useEffect } from 'react'
import api from '../../api/axios'

function ManajemenRuangan() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [formData, setFormData] = useState({
    nama: '',
    kampus: '',
    gedung: '',
    lantai: '',
    kapasitas: ''
  })

  // 1. Ambil untuk semua ruangan
  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.rooms)
    } catch (error) {
      console.error("Gagal mengambil ruangan:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleAddRooms = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const response = await api.post('/rooms', formData)
      setMessage({ text: response.data.message, type: 'success' })

      // Kosongkan form
      setFormData({ nama: '', kampus: '', gedung: '', lantai: '', kapasitas: '' })

      // Refresh list
      fetchRooms()
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage({ text: error.response.data.error, type: 'error' })
      } else {
        setMessage({ text: 'Gagal menambahka ruangan baru.', type: 'error' })
      }
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  }

  // 3. Ubah Status Ruangan (Tersedua / Terkunci / Perbaikan)
  const handleUppdateStatus = async (id, newState) => {
    setActionLoading(true)
    try {
      await api.patch(`/rooms/${id}/status`, { status: newState })
      fetchRooms() // Refres daftar agar warnanya langsung berubah
    } catch (error) {
      alert('Gagal mengubah status ruangan')
    } finally {
      setActionLoading(false)
    }

  }
  // 4. Simpan ruangan baru
  const handleChange = (e) => {
    e.preventDefault()
    setFormData({ ...formData, [e.target.name]: e.target.value })

  }


  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Manajemen Ruangan</h1>
        <p className="page-subtitle">Daftar Inventaris Ruang<br />Kelola ketersediaan, status, dan akses booking ruangan kelas.</p>
      </div>

      {message.text && (
        <div style={{
          background: message.type === 'success' ? 'var(--color-succes-bg)' : 'var(--color-error-bg)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
          padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {/* Form Tambah Ruangan */}
      <div className="card-flat" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Tambah Ruangan Baru</h3>
        <form onSubmit={handleAddRooms} style={{ diplay: 'flex', gap: '12px', flexWrap: 'wrap', aligItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label className="form-label">Nama (Mis: Q.3.1)</label>
            <input type="text" className="input-field" name="nama" value={formData.nama} onChange={handleChange} required />
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <label className="form-label">Kampus</label>
            <input type="text" className="input-field" name="kampus" value={formData.kampus} onChange={handleChange} required />
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <label className="form-label">Gedung</label>
            <input type="text" className="input-field" name="gedung" value={formData.gedung} onChange={handleChange} required />
          </div>

          <div style={{ flex: '1', minWidth: '80px' }}>
            <label className="form-label">Lantai</label>
            <input type="number" className="input-field" name="lantai" value={formData.lantai} onChange={handleChange} required />
          </div>

          <div style={{ flex: '1', minWidth: '100px' }}>
            <label className="form-label">Kapasitas</label>
            <input type="number" className="input-field" name="kapasitas" value={formData.kapasitas} onChange={handleChange} required />
          </div>

          <div>
            <button className="btn btn-primary" disabled={actionLoading} type="submit">Tambah</button>
          </div>
        </form>
      </div>

      {/* Tabel Ruangan */}
      <div className="card-flat" style={{ overFlowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Memuat ruangan...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>Nama</th>
                <th style={{ padding: '12px' }}>Lokasi</th>
                <th style={{ padding: '12px' }}>Kapasitas</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ubah Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{room.nama}</td>
                  <td style={{ padding: '12px' }}>{room.kampus} - {room.gedung} Lt.{room.lantai}</td>

                  <td style={{ padding: '12px' }}>{room.kapasitas} kursi</td>

                  <td style={{ padding: '12px' }}>
                    {room.status === 'tersedia' && <span className="badge badge-success">Tersedia</span>}
                    {room.status === 'terkunci' && <span className="badge badge-error">Terkunci</span>}
                    {room.status === 'perbaikan' && <span className="badge badge-warning">Perbaikan</span>}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <select className="input-field"
                      style={{ padding: '4px 8px', height: 'auto', width: 'auto', display: 'inline-block' }}
                      value={room.status}
                      onChange={(e) => handleUppdateStatus(room.id, e.target.value)}
                      disabled={actionLoading}>
                      <option value="tersedia">Tersedia</option>
                      <option value="terkunci">Terkunci</option>
                      <option value="perbaikan">Perbaikan</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default ManajemenRuangan
