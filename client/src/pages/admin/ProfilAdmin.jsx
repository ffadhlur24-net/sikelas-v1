import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
import './ProfilAdmin.css'

function ProfilAdmin() {
  const { user, logout, updateUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [message, setMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // State Toggle Visibility Password (👁️ / 🙈)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // State Modal Edit Profil Admin
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    no_hp: user?.no_hp || '',
    old_password: '',
    new_password: '',
    confirm_password: '',
    otp_code: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Handler Minta Kode OTP Email
  const handleRequestOtp = async () => {
    try {
      setOtpLoading(true)
      const res = await api.post('/users/request-password-otp')
      alert(res.data.message || 'Kode OTP berhasil dikirim ke email Admin!')
      setOtpCountdown(60)
      const timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal mengirim kode OTP Admin')
    } finally {
      setOtpLoading(false)
    }
  }

  // Handler Submit Edit Profil
  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (editForm.new_password.trim() !== '') {
      if (editForm.new_password.length < 8) {
        return alert('⚠️ Password baru minimal harus 8 karakter!')
      }
      if (editForm.new_password !== editForm.confirm_password) {
        return alert('⚠️ Konfirmasi password baru tidak cocok!')
      }
      if (!editForm.otp_code || editForm.otp_code.length !== 6) {
        return alert('⚠️ Masukkan 6-digit Kode OTP yang dikirim ke email Admin!')
      }
      if (!editForm.old_password) {
        return alert('⚠️ Silakan masukkan password lama Anda untuk konfirmasi keamanan.')
      }
    }

    try {
      setEditLoading(true)
      const res = await api.put('/users/profile', editForm)
      alert(res.data.message || 'Profil Admin berhasil diperbarui!')
      if (res.data.user) {
        updateUser(res.data.user)
      }
      setShowEditModal(false)
      setEditForm(prev => ({
        ...prev,
        old_password: '',
        new_password: '',
        confirm_password: '',
        otp_code: ''
      }))
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal memperbarui profil.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (confirmInput !== 'RESET-SEMESTER') {
      alert('Teks konfirmasi salah!')
      return
    }
    try {
      setLoading(true)
      const res = await api.post('/users/reset-semester', { confirmation: confirmInput })
      alert(res.data.message)
      setShowResetModal(false)
      setConfirmInput('')
      setMessage(res.data.message)
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal melakukan reset semester')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (nama) => {
    if (!nama) return 'AD'
    return nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const openEditModal = () => {
    setEditForm({
      username: user?.username || '',
      no_hp: user?.no_hp || '',
      old_password: '',
      new_password: '',
      confirm_password: '',
      otp_code: ''
    })
    setShowEditModal(true)
  }

  return (
    <div className="profil-admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATOR / ACCOUNT CONTROL</p>
          <h1>SiKelas Admin Profile</h1>
          <p>Kelola identitas, keamanan, dan kontrol operasional sistem.</p>
        </div>
        <span className="admin-status-badge">ADMIN AKTIF</span>
      </div>

      <section className="admin-clock-card neo-card">
        <div className="clock-icon" aria-hidden="true">◷</div>
        <div>
          <p className="eyebrow">WAKTU SISTEM SERVER</p>
          <h2>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {currentTime.toLocaleTimeString('id-ID')}</h2>
        </div>
        <span className="online-badge"><span /> SISTEM ONLINE</span>
      </section>

      <section className="admin-profile-layout">
        <article className="admin-main-card neo-card">
          <div className="admin-account-card">
          <div className="admin-account-identity">
            <div className="admin-avatar">{getInitials(user?.username || user?.nama)}</div>
            <span className="role-badge">ADMIN PUSAT</span>
          </div>
          <div className="admin-account-details">
            <h2>Informasi Akun</h2>
            <div className="account-detail-grid">
              <div className="account-detail"><span>Email Institusi</span><strong>{user?.email || 'admin@walisongo.ac.id'}</strong></div>
              <div className="account-detail"><span>Hak Akses</span><strong>{user?.role === 'admin' ? 'Super Admin (Level 1)' : user?.role || 'Admin'}</strong></div>
              <div className="account-detail"><span>No. HP / WhatsApp</span><strong>{user?.no_hp || 'Belum diatur'}</strong></div>
              <div className="account-detail"><span>Status Akun</span><strong className="success-text">● Aktif & Terverifikasi</strong></div>
            </div>
            <div className="account-actions">
              <button type="button" className="neo-btn neo-btn-primary" onClick={openEditModal}>✎ Edit Profil Admin</button>
              <button type="button" className="neo-btn neo-btn-secondary" onClick={logout}>↪ Keluar dari Akun</button>
            </div>
          </div>
          </div>

          <article className="feature-card">
          <h2>Ringkasan Fitur</h2>
          <ul>
            <li><b>Profil Admin:</b> Kelola identitas, akses, dan data antar-semester.</li>
            <li><b>Persetujuan:</b> Verifikasi pengajuan peminjaman ruangan.</li>
            <li><b>Manajemen Ruangan:</b> Kelola data gedung dan ketersediaan.</li>
            <li><b>Manajemen PJ:</b> Kelola akses dan kontak PJ kelas.</li>
            <li><b>Log Pelaporan:</b> Pantau kendala perkuliahan.</li>
          </ul>
          </article>
        </article>

        <article className="maintenance-card neo-card">
        <div className="maintenance-heading">
          <div>
            <p className="eyebrow">SYSTEM MAINTENANCE</p>
            <h2>Pemeliharaan & Pergantian Semester</h2>
          </div>
          <span className="warning-icon" aria-hidden="true">!</span>
        </div>
        <p className="maintenance-copy">Reset akhir semester akan mengarsipkan data reservasi, laporan, jadwal, dan akun PJ lama. Pastikan backup telah dilakukan sebelum melanjutkan.</p>
        <button type="button" className="neo-btn neo-btn-danger" onClick={() => setShowResetModal(true)}>↻ Jalankan Reset Akhir Semester</button>
        </article>
      </section>

      <section className="admin-stats-grid" aria-label="Ringkasan statistik sistem">
        <article className="admin-stat-card stat-navy"><span>Total Ruangan</span><strong>142</strong></article>
        <article className="admin-stat-card stat-blue"><span>Reservasi Aktif</span><strong>38</strong></article>
        <article className="admin-stat-card stat-green"><span>User Aktif</span><strong>1.2K</strong></article>
        <article className="admin-stat-card stat-orange"><span>Laporan Pending</span><strong>5</strong></article>
      </section>

      {message && <div className="admin-feedback" role="status">{message}</div>}

      {showResetModal && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal neo-card" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <h2 id="reset-title">Konfirmasi Reset Akhir Semester</h2>
            <p>Tindakan ini akan menghapus akun PJ dan mereset status semester. Ketik <strong>RESET-SEMESTER</strong> untuk konfirmasi.</p>
            <form onSubmit={handleReset}>
              <input type="text" className="admin-modal-input" placeholder="RESET-SEMESTER" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} required autoFocus />
              <div className="modal-actions">
                <button type="button" className="neo-btn neo-btn-secondary" onClick={() => setShowResetModal(false)}>Batal</button>
                <button type="submit" className="neo-btn neo-btn-danger" disabled={loading}>{loading ? 'Memproses...' : 'Eksekusi Reset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal neo-card edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
            <h2 id="edit-title">Edit Profil Admin</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="modal-label">Nama Pengguna (Username Admin)</label>
                <input
                  type="text"
                  className="admin-modal-input"
                  value={editForm.username}
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Nomor HP / WhatsApp Admin</label>
                <input
                  type="text"
                  className="admin-modal-input"
                  value={editForm.no_hp}
                  onChange={e => setEditForm({ ...editForm, no_hp: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  required
                />
              </div>

              <hr className="modal-divider" />

              {/* INPUT PASSWORD BARU */}
              <div className="modal-field">
                <div className="modal-label-row">
                  <label className="modal-label">Password Baru Admin (Opsional)</label>
                  {editForm.new_password.trim() !== '' && (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={otpLoading || otpCountdown > 0}
                      className="otp-button"
                    >
                      {otpLoading ? 'Sending...' : otpCountdown > 0 ? `📩 Minta Ulang (${otpCountdown}s)` : '📩 Kirim OTP ke Email'}
                    </button>
                  )}
                </div>
                <div className="password-field">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="admin-modal-input"
                    value={editForm.new_password}
                    onChange={e => setEditForm({ ...editForm, new_password: e.target.value })}
                    placeholder="Minimal 8 karakter (Kosongkan jika tidak diubah)"
                  />
                  <button type="button" className="password-icon" onClick={() => setShowNewPassword(!showNewPassword)} aria-label="Tampilkan password baru">
                    {showNewPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* INPUT KONFIRMASI, OTP & PASSWORD LAMA JIKA PASSWORD BARU TERISI */}
              {editForm.new_password.trim() !== '' && (
                <>
                  {/* Input Konfirmasi Password Baru */}
                  <div className="modal-field">
                    <label className="modal-label">
                      Ulangi Password Baru Admin
                    </label>
                    <div className="password-field">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="admin-modal-input"
                        value={editForm.confirm_password}
                        onChange={e => setEditForm({ ...editForm, confirm_password: e.target.value })}
                        placeholder="Ketik ulang password baru Admin"
                        required
                      />
                      <button type="button" className="password-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Tampilkan konfirmasi password">
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* INPUT KODE OTP EMAIL 6-DIGIT */}
                  <div className="modal-field">
                    <label className="modal-label otp-label">
                      🔑 Kode OTP Email (6-Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="admin-modal-input otp-input"
                      value={editForm.otp_code}
                      onChange={e => setEditForm({ ...editForm, otp_code: e.target.value })}
                      placeholder="000000"
                      required
                    />
                  </div>

                  {/* Input Password Lama */}
                  <div className="modal-field">
                    <label className="modal-label danger-label">
                      Password Lama Admin (Konfirmasi Keamanan)
                    </label>
                    <div className="password-field">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="admin-modal-input danger-input"
                        value={editForm.old_password}
                        onChange={e => setEditForm({ ...editForm, old_password: e.target.value })}
                        placeholder="Masukkan password lama Admin saat ini"
                        required
                      />
                      <button type="button" className="password-icon" onClick={() => setShowOldPassword(!showOldPassword)} aria-label="Tampilkan password lama">
                        {showOldPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="submit" className="neo-btn neo-btn-primary" disabled={editLoading}>
                  {editLoading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
                <button type="button" className="neo-btn neo-btn-secondary" onClick={() => setShowEditModal(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilAdmin
