import { useState, useEffect } from 'react'
import api from '../../api/axios'
import './ManajemenAkunPJ.css'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/Modal/ConfirmModal'
import NeoSelect from '../../components/Select/NeoSelect'
import { PencilSquare, TrashFill, ClockFill, Search } from 'react-bootstrap-icons'

function ManajemenAkunPJ() {
  const { showSuccess, showError } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [availableSchedules, setAvailableSchedules] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, username: '', loading: false })

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
      const allUsers = userRes.data.users || []
      setUsers(allUsers.filter(u => u.role === 'pj' || u.role !== 'admin'))
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Handler hapus PJ
  const handleDeleteUser = (id, username) => {
    setConfirmDelete({ open: true, id, username, loading: false })
  }

  const handleConfirmDelete = async () => {
    const { id, username } = confirmDelete
    setConfirmDelete(prev => ({ ...prev, loading: true }))
    try {
      await api.delete(`/users/${id}`)
      showSuccess(`Akun PJ "${username}" berhasil dihapus!`, 'AKUN PJ')
      setConfirmDelete({ open: false, id: null, username: '', loading: false })
      fetchUsers()
    } catch (error) {
      showError('Gagal menghapus akun PJ.', 'AKUN PJ')
      setConfirmDelete(prev => ({ ...prev, loading: false }))
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
    if (!editForm.prodi || !editForm.semester || !editForm.kelas || !editForm.mata_kuliah) {
      showError('Harap lengkapi seluruh data akademik (Prodi, Semester, Kelas, dan Mata Kuliah)!', 'DATA PJ')
      return
    }
    try {
      setActionLoading(true)
      await api.put(`/users/${editingUser.id}`, editForm)
      showSuccess(`Data PJ "${editForm.username}" berhasil diupdate!`, 'DATA PJ')
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal mengupdate data PJ', 'DATA PJ')
    } finally {
      setActionLoading(false)
    }
  }

  // Ubah status pengguna
  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(true)
    try {
      await api.patch(`/users/${id}/status`, { status: newStatus })
      showSuccess(`Status akun pengguna berhasil diubah menjadi ${newStatus}!`, 'STATUS AKUN')
      fetchUsers()
    } catch (error) {
      showError('Gagal mengubah status pengguna', 'STATUS AKUN')
    } finally {
      setActionLoading(false)
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

  const editProdiList = [...new Set(availableForEdit.map(s => s.prodi))].sort();
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

  const filteredUsers = users.filter(user => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return true
    return [user.username, user.nim_nip, user.email, user.prodi, user.mata_kuliah]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))
  })
  const activeUsers = users.filter(user => user.status === 'aktif').length
  const pendingUsers = users.filter(user => user.status === 'pending').length
  const inactiveUsers = users.filter(user => user.status === 'nonaktif').length

  return (
    <div className="pj-management-page animate-fade-in">
      <section className="pj-clock-card">
        <div className="pj-clock-icon" aria-hidden="true"><ClockFill size={20} /></div>
        <div>
          <h2>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {currentTime.toLocaleTimeString('id-ID')}</h2>
        </div>
        <span className="pj-online"><span /> SISTEM ONLINE</span>
      </section>

      <section className="pj-stats-grid" aria-label="Ringkasan akun PJ">
        <article className="pj-stat stat-navy"><span>Total Akun PJ</span><strong>{users.length}</strong></article>
        <article className="pj-stat stat-blue"><span>PJ Aktif</span><strong>{activeUsers}</strong></article>
        <article className="pj-stat stat-green"><span>Menunggu ACC</span><strong>{pendingUsers}</strong></article>
        <article className="pj-stat stat-orange"><span>Nonaktif</span><strong>{inactiveUsers}</strong></article>
      </section>

      <div className="pj-page-heading">
        <p className="pj-eyebrow">ADMINISTRATOR / ACCOUNT CONTROL</p>
        <h1>Manajemen Akun PJ</h1>
        <p>Kelola persetujuan, perbarui data, dan hapus akun penanggung jawab kelas.</p>
      </div>

      {!loading && (
        <section className="pj-search-card">
          <div>
            <p className="pj-eyebrow">ACCOUNT DIRECTORY</p>
            <h2>Penelusuran Akun PJ</h2>
          </div>
          <div className="pj-search-row">
            <input type="search" className="pj-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Masukkan NIM, username, email, atau prodi..." aria-label="Cari akun PJ" />
            <button
              type="button"
              className="pj-search-button"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => setSearchTerm(searchTerm.trim())}
            >
              <Search size={14} /> Cari
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat data pengguna...</div>
      ) : (
        <div className="pj-table-card">
          <div className="pj-table-heading">
            <h2>Daftar Penanggung Jawab Kelas</h2>
            <span>{filteredUsers.length} akun ditampilkan</span>
          </div>
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
              {filteredUsers.length > 0 ? filteredUsers.map((u) => (
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
                        <button className="btn btn-primary btn-sm pj-action-approve" disabled={actionLoading} onClick={() => handleUpdateStatus(u.id, 'aktif')}>
                          ACC
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm pj-action-edit" disabled={actionLoading} onClick={() => handleOpenEdit(u)}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><PencilSquare size={13} /> Edit</span>
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm pj-action-delete" disabled={actionLoading} onClick={() => handleDeleteUser(u.id, u.username)}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><TrashFill size={13} /> Hapus</span>
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
        <div className="pj-modal-overlay">
          <div className="pj-modal-card">
            <div className="pj-modal-header">
              <h2><PencilSquare size={18} /> Edit Data PJ ({editingUser.username})</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingUser(null)}
                style={{ padding: '4px 10px', minHeight: 'auto', fontSize: '13px' }}
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Nama PJ / Username</label>
                <input type="text" className="input-field" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
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
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Program Studi (Prodi)</label>
                <NeoSelect
                  value={editForm.prodi}
                  onChange={(val) => setEditForm({ ...editForm, prodi: val, semester: '', kelas: '', mata_kuliah: '' })}
                  options={editProdiList.map(p => ({ value: p, label: p }))}
                  placeholder="-- Pilih Prodi --"
                />
              </div>

              {/* DROPDOWN 2 & 3: SEMESTER & KELAS */}
              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label">Semester</label>
                  <NeoSelect
                    value={editForm.semester}
                    onChange={(val) => setEditForm({ ...editForm, semester: val, kelas: '', mata_kuliah: '' })}
                    options={editSemesterList.map(s => ({ value: String(s), label: `Semester ${s}` }))}
                    placeholder={editForm.prodi ? '-- Pilih Semester --' : '-- Pilih Prodi Dulu --'}
                    disabled={!editForm.prodi}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label">Kelas</label>
                  <NeoSelect
                    value={editForm.kelas}
                    onChange={(val) => setEditForm({ ...editForm, kelas: val, mata_kuliah: '' })}
                    options={editKelasList.map(k => ({ value: k, label: `Kelas ${k}` }))}
                    placeholder={editForm.semester ? '-- Pilih Kelas --' : '-- Pilih Semester Dulu --'}
                    disabled={!editForm.semester}
                  />
                </div>
              </div>

              {/* DROPDOWN 4: MATA KULIAH */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Mata Kuliah</label>
                <NeoSelect
                  value={editForm.mata_kuliah}
                  onChange={(val) => setEditForm({ ...editForm, mata_kuliah: val })}
                  options={editCourseList.map(c => ({ value: c, label: c }))}
                  placeholder={editForm.kelas ? '-- Pilih Mata Kuliah --' : '-- Pilih Kelas Dulu --'}
                  disabled={!editForm.kelas}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PJ */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Hapus Akun PJ"
        message={`Apakah Anda yakin ingin menghapus akun PJ "${confirmDelete.username}"? Akun dan akses login yang bersangkutan akan dihapus permanen.`}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        variant="danger"
        loading={confirmDelete.loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => !confirmDelete.loading && setConfirmDelete({ open: false, id: null, username: '', loading: false })}
      />
    </div>
  )
}

export default ManajemenAkunPJ
