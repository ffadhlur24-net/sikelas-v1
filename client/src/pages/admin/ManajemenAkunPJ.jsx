import { useState, useEffect } from 'react'
import api from '../../api/axios'

function ManajemenAkunPJ() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [availableSchedules, setAvailableSchedules] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    username: '',
    nim_nip: '',
    prodi: '',
    semester: '',
    kelas: '',
    mata_kuliah: '',
    no_hp: '',
    status: ''
  })


  // 1. Ambil data semua data user & jadwal
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const [userRes, optionRes] = await Promise.all([
        api.get('/users'),
        api.get('/auth/registration-options')
      ])
      setUsers(userRes.data.users || [])
      setAvailableSchedules(optionRes.data.availableSchedules || [])
    } catch (error) {
      console.error('Gagal mengambil data user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Handler hapus PJ
  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Apakah kamu yakin mau menghapus akun PJ ${username} ?`)) {
      return
    }
    try {
      setActionLoading(true)
      await api.delete(`/users/${id}`)
      setMessage(`Akun PJ "${username}" berhasil dihapus`)
      fetchUsers()
    } catch (error) {
      alert('Gagal menghapus akun PJ.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }
  // Handler edit user
  const handleOpenEdit = (u) => {
    setEditingUser(u)
    setEditForm({
      username: u.username || '',
      nim_nip: u.nim_nip || '',
      prodi: u.prodi || '',
      semester: u.semester || '',
      kelas: u.kelas || '',
      mata_kuliah: u.mata_kuliah || '',
      no_hp: u.no_hp || '',
      status: u.status || ''
    })
  }
  // Handler simpan edit
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      await api.put(`/users/${editingUser.id}`, editForm)
      setMessage(`Data PJ "${editForm.username}" berhasil diupdate!`)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      alert('Gagal mengupdate data PJ')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }
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

  const availableForEdit = availableSchedules.filter(s => {
    const isTakenByOther = users.some(u =>
      u.id !== editingUser?.id &&
      u.role === 'pj' &&
      u.prodi === s.prodi &&
      String(u.semester) === String(s.semester) &&
      u.kelas === s.kelas &&
      u.mata_kuliah === s.mata_kuliah
    );
    return !isTakenByOther;
  });
  const editProdiList = [...new Set(availableForEdit.map(s => s.prodi))];
  const editSemesterList = [...new Set(availableForEdit
    .filter(s => s.prodi === editForm.prodi)
    .map(s => String(s.semester))
  )].sort();
  const editKelasList = [...new Set(availableForEdit
    .filter(s => s.prodi === editForm.prodi && String(s.semester) === String(editForm.semester))
    .map(s => s.kelas)
  )].sort();
  const editCourseList = [...new Set(availableForEdit
    .filter(s => s.prodi === editForm.prodi && String(s.semester) === String(editForm.semester) && s.kelas === editForm.kelas)
    .map(s => s.mata_kuliah)
  )];


  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Manajemen Akun PJ</h1>
        <p className="page-subtitle">Kelola persetujuan, perbarui data, dan hapus akun penanggung jawab kelas.</p>
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
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Mata Kuliah & Kelas</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Kontak & Email</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{u.username}</div>
                    <div className="text-sm text-muted">{u.nim_nip || '-'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500' }}>{u.mata_kuliah || '-'}</div>
                    <div className="text-sm text-muted">
                      {u.prodi} (Smstr {u.semester} - Kelas {u.kelas})
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px' }}>{u.email}</div>
                    <div className="text-sm text-muted">{u.no_hp || '-'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {u.status === 'aktif' && <span className="badge badge-success">Aktif</span>}
                    {u.status === 'pending' && <span className="badge badge-warning">Menunggu ACC</span>}
                    {u.status === 'nonaktif' && <span className="badge badge-error">Nonaktif</span>}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {u.status === 'pending' ? (
                        <button className="btn btn-primary btn-sm" disabled={actionLoading} onClick={() => handleUpdateStatus(u.id, 'aktif')}>
                          ACC
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled={actionLoading} onClick={() => handleOpenEdit(u)}>
                          ✏️ Edit
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} disabled={actionLoading} onClick={() => handleDeleteUser(u.id, u.username)}>
                        🗑️ Hapus
                      </button>
                    </div>
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
      {/* MODAL EDIT DATA PJ PINTAR */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '520px', background: '#fff', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>✏️ Edit Data PJ ({editingUser.username})</h2>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Nama PJ / Username</label>
                <input type="text" className="input-field" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">NIM / NIP</label>
                  <input type="text" className="input-field" value={editForm.nim_nip} onChange={(e) => setEditForm({ ...editForm, nim_nip: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">No. HP</label>
                  <input type="text" className="input-field" value={editForm.no_hp} onChange={(e) => setEditForm({ ...editForm, no_hp: e.target.value })} required />
                </div>
              </div>
              {/* DROPDOWN 1: PRODI (HANYA MEMUNCULKAN PRODI YANG MASIH ADA JADWAL KOSONG) */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Program Studi (Prodi)</label>
                <select className="input-field" value={editForm.prodi} onChange={(e) => setEditForm({ ...editForm, prodi: e.target.value, semester: '', kelas: '', mata_kuliah: '' })} required>
                  <option value="">-- Pilih Prodi --</option>
                  {editProdiList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* DROPDOWN 2 & 3: SEMESTER & KELAS */}
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Semester</label>
                  <select className="input-field" value={editForm.semester} onChange={(e) => setEditForm({ ...editForm, semester: e.target.value, kelas: '', mata_kuliah: '' })} disabled={!editForm.prodi} required>
                    <option value="">-- Pilih --</option>
                    {editSemesterList.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kelas</label>
                  <select className="input-field" value={editForm.kelas} onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value, mata_kuliah: '' })} disabled={!editForm.semester} required>
                    <option value="">-- Pilih Kelas --</option>
                    {editKelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                  </select>
                </div>
              </div>
              {/* DROPDOWN 4: MATA KULIAH */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Mata Kuliah</label>
                <select className="input-field" value={editForm.mata_kuliah} onChange={(e) => setEditForm({ ...editForm, mata_kuliah: e.target.value })} disabled={!editForm.kelas} required>
                  <option value="">-- Pilih Mata Kuliah --</option>
                  {editCourseList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManajemenAkunPJ
