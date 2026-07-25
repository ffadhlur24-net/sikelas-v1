import { useState, useEffect } from 'react'
import api from '../../api/axios'

function ManajemenAkunPJ() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')


  // 1. Ambil data semua data user -_-
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('Gagal mengambil data user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 2. Buat ubah status bro!!
  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(true)
    setMessage('')

    try {
      await api.patch(`/users/${id}/status`, { status: newStatus })
      setMessage(`Status pengguna berhasil diubah menjadi ${newStatus}`)
      fetchUsers() // Refresh data
    } catch (error) {
      alert('Gagal mengubah status pengguna')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Manajemen Akun PJ</h1>
        <p className="page-subtitle">Kelola persetujuan akun PJ baru dan keaktifan penanggung jawab kelas.</p>
      </div>
      {message && (
        <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>
          {message}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat data pengguna...</div>
      ) : (
        <div className="card-flat" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Nama PJ / NIM</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Mata Kuliah / Kelas</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Kontak & Email</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {/* Kolom 1 */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{u.username}</div>
                    <div className="text-sm text-muted">{u.nim_nip || '-'}</div>
                  </td>
                  {/* Kolom 2: Matkul & Kelas */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500' }}>{u.mata_kuliah || '-'}</div>
                    <div className="text-sm text-muted">
                      {u.prodi} (Smstr {u.semester} - Kelas {u.kelas})
                    </div>
                  </td>
                  {/* Kolom 3: Email & HP */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px' }}>{u.email}</div>
                    <div className="text-sm text-muted">{u.no_hp || '-'}</div>
                  </td>
                  {/* Kolom 4: Status */}
                  <td style={{ padding: '16px' }}>
                    {u.status === 'aktif' && <span className="badge badge-success">Aktif</span>}
                    {u.status === 'pending' && <span className="badge badge-warning">Menunggu ACC</span>}
                    {u.status === 'nonaktif' && <span className="badge badge-error">Nonaktif</span>}
                  </td>
                  {/* Kolom 5: Aksi Admin */}
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {u.status === 'pending' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(u.id, 'aktif')}
                      >
                        Setujui (ACC)
                      </button>
                    ) : (
                      <select
                        className="input-field"
                        style={{ padding: '4px 8px', height: 'auto', width: 'auto', display: 'inline-block' }}
                        value={u.status}
                        onChange={(e) => handleUpdateStatus(u.id, e.target.value)}
                        disabled={actionLoading}
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada data pendaftaran PJ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ManajemenAkunPJ
