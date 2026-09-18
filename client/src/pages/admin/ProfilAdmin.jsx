import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../api/axios'
import './ProfilAdmin.css'
import {
  EnvelopeFill,
  EyeFill,
  EyeSlashFill,
  KeyFill,
  FloppyFill
} from 'react-bootstrap-icons'

function ProfilAdmin() {
  const { user, updateUser } = useContext(AuthContext)
  const { showSuccess, showError, showWarning } = useToast()
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [message, setMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // State Toggle Visibility Password 
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
  const [stats, setStats] = useState({
    activePj: 0,
    totalRooms: 0,
    damageReports: 0,
    reservations: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const res = await api.get('/users/admin-stats')
      setStats(res.data)
    } catch (err) {
      console.error('Gagal memuat statistik admin:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    fetchStats()
    return () => clearInterval(timer)
  }, [])

  // Handler Minta Kode OTP Email
  const handleRequestOtp = async () => {
    try {
      setOtpLoading(true)
      const res = await api.post('/users/request-password-otp')
      showSuccess(res.data.message || 'Kode OTP berhasil dikirim ke email Admin!', 'OTP TERKIRIM')
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
      showError(error.response?.data?.error || 'Gagal mengirim kode OTP Admin', 'GAGAL KIRIM OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // Handler Submit Edit Profil
  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (editForm.new_password.trim() !== '') {
      if (editForm.new_password.length < 8) {
        showWarning('Password baru minimal harus 8 karakter!', 'VALIDASI PASSWORD')
        return
      }
      if (editForm.new_password !== editForm.confirm_password) {
        showWarning('Konfirmasi password baru tidak cocok!', 'VALIDASI PASSWORD')
        return
      }
      if (!editForm.otp_code || editForm.otp_code.length !== 6) {
        showWarning('Masukkan 6-digit Kode OTP yang dikirim ke email Admin!', 'KODE OTP DIPERLUKAN')
        return
      }
      if (!editForm.old_password) {
        showWarning('Silakan masukkan password lama Anda untuk konfirmasi keamanan.', 'KEAMANAN AKUN')
        return
      }
    }

    try {
      setEditLoading(true)
      const res = await api.put('/users/profile', editForm)
      showSuccess(res.data.message || 'Profil Admin berhasil diperbarui!', 'PROFIL DIPERBARUI')
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
      showError(error.response?.data?.error || 'Gagal memperbarui profil.', 'GAGAL MEMPERBARUI')
    } finally {
      setEditLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (confirmInput !== 'RESET-SEMESTER') {
      showWarning('Teks konfirmasi salah! Ketik RESET-SEMESTER dengan benar.', 'KONFIRMASI SALAH')
      return
    }
    try {
      setLoading(true)
      const res = await api.post('/users/reset-semester', { confirmation: confirmInput })
      showSuccess(res.data.message || 'Reset akhir semester berhasil dilakukan!', 'RESET BERHASIL')
      setShowResetModal(false)
      setConfirmInput('')
      setMessage(res.data.message)
      fetchStats()
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal melakukan reset semester', 'GAGAL RESET')
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

  const handleCopyEmail = async () => {
    const email = user?.email || 'admin@walisongo.ac.id'
    try {
      await navigator.clipboard.writeText(email)
      showSuccess('Email berhasil disalin ke clipboard!', 'EMAIL DISALIN')
    } catch {
      showError('Gagal menyalin email.', 'GAGAL SALIN')
    }
  }

  return (
    <div className="profil-admin-page">
      {/* ===== 1. Real-time Clock Banner ===== */}
      <section className="admin-clock-card neo-card">
        <div className="clock-icon-box" aria-hidden="true">
          <span className="material-symbols-outlined">schedule</span>
        </div>
        <div className="clock-text">
          <h2 className="clock-time">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </h2>
        </div>
        <span className="online-badge">
          <span className="pulse-dot" />
          Sistem Online
        </span>
      </section>

      {/* ===== 2. Quick Stats Grid ===== */}
      <section className="admin-stats-grid" aria-label="Ringkasan statistik sistem">
        <article className="admin-stat-card stat-navy">
          <span className="stat-label">PJ Aktif</span>
          <strong className="stat-value">{statsLoading ? '...' : (stats.activePj ?? 0).toLocaleString('id-ID')}</strong>
        </article>
        <article className="admin-stat-card stat-blue">
          <span className="stat-label">Total Ruangan</span>
          <strong className="stat-value">{statsLoading ? '...' : (stats.totalRooms ?? 0).toLocaleString('id-ID')}</strong>
        </article>
        <article className="admin-stat-card stat-green">
          <span className="stat-label">Laporan Kerusakan</span>
          <strong className="stat-value">{statsLoading ? '...' : (stats.damageReports ?? 0).toLocaleString('id-ID')}</strong>
        </article>
        <article className="admin-stat-card stat-orange">
          <span className="stat-label">Pengajuan Reservasi</span>
          <strong className="stat-value">{statsLoading ? '...' : (stats.reservations ?? 0).toLocaleString('id-ID')}</strong>
        </article>
      </section>

      {/* ===== 3. Main Content Grid (2 Columns) ===== */}
      <section className="admin-profile-layout">
        {/* ----- Left Column (2/3) ----- */}
        <div className="admin-col-left">
          {/* Profile & Account Info Card */}
          <article className="admin-profile-card neo-card">
            {/* Identity Column (Avatar + Badge + Edit) */}
            <div className="profile-identity-col">
              <div className="admin-avatar">
                {getInitials(user?.username || user?.nama)}
                <div className="avatar-overlay" />
              </div>
              <span className="role-badge">Admin Pusat</span>
              <div className="profile-edit-actions">
                <button type="button" className="neo-btn neo-btn-yellow" onClick={openEditModal} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  Edit Profil
                </button>
              </div>
            </div>

            {/* Info Column */}
            <div className="profile-info-col">
              <h3 className="info-heading">Informasi Akun</h3>
              <div className="info-detail-list">
                {/* Email Institusi */}
                <div className="info-detail-row">
                  <div className="detail-row-left">
                    <div className="detail-icon-box icon-sky">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div className="detail-text">
                      <div className="detail-label-row">
                        <span className="detail-label">Email Institusi</span>
                        <span className="detail-badge-primary">UTAMA</span>
                      </div>
                      <p className="detail-value">{user?.email || 'admin@walisongo.ac.id'}</p>
                    </div>
                  </div>
                  <div className="detail-row-right">
                    <button type="button" className="btn-copy" onClick={handleCopyEmail} title="Salin Email">
                      <span className="material-symbols-outlined">content_copy</span>
                      Salin
                    </button>
                  </div>
                </div>

                {/* Hak Akses */}
                <div className="info-detail-row">
                  <div className="detail-row-left">
                    <div className="detail-icon-box icon-navy">
                      <span className="material-symbols-outlined">security</span>
                    </div>
                    <div className="detail-text">
                      <span className="detail-label">Hak Akses</span>
                      <p className="detail-value">{user?.role === 'admin' ? 'Admin' : user?.role || 'Admin'}</p>
                    </div>
                  </div>
                  <div className="detail-row-right">
                    <span className="badge-privilege">FULL PRIVILEGE</span>
                  </div>
                </div>

                {/* Status Akun */}
                <div className="info-detail-row">
                  <div className="detail-row-left">
                    <div className="detail-icon-box icon-green">
                      <span className="material-symbols-outlined">verified_user</span>
                    </div>
                    <div className="detail-text">
                      <span className="detail-label">Status Akun</span>
                      <p className="detail-value">Aktif &amp; Terverifikasi</p>
                    </div>
                  </div>
                  <div className="detail-row-right">
                    <span className="badge-online">
                      <span className="pulse-dot" />
                      ONLINE
                    </span>
                  </div>
                </div>

                {/* No. HP / WhatsApp */}
                <div className="info-detail-row">
                  <div className="detail-row-left">
                    <div className="detail-icon-box icon-teal">
                      <span className="material-symbols-outlined">call</span>
                    </div>
                    <div className="detail-text">
                      <span className="detail-label">No. HP / WhatsApp</span>
                      <p className="detail-value">{user?.no_hp || 'Belum diatur'}</p>
                    </div>
                  </div>
                  <div className="detail-row-right">
                    <span className="badge-whatsapp">
                      <span className="material-symbols-outlined">chat</span>
                      WHATSAPP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Maintenance & Semester Reset Card */}
          <article className="maintenance-card neo-card">
            <div className="maintenance-heading">
              <div className="maintenance-heading-left">
                <div className="maintenance-icon-box">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <h3>Pemeliharaan &amp; Pergantian Semester</h3>
              </div>
              <span className="badge-critical">Tindakan Kritis</span>
            </div>
            <p className="maintenance-copy">
              Perhatian: Menjalankan reset akhir semester akan mengarsipkan semua data reservasi saat ini. Pastikan backup telah dilakukan.
            </p>
            <button
              type="button"
              className="neo-btn neo-btn-danger"
              onClick={() => setShowResetModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span className="material-symbols-outlined">restart_alt</span>
              Jalankan Reset Akhir Semester
            </button>
          </article>
        </div>

        {/* ----- Right Column (1/3) ----- */}
        <article className="feature-summary-card neo-card">
          <h3 className="feature-heading">Ringkasan Fitur</h3>
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon-box ficon-sky">
                <span className="material-symbols-outlined">admin_panel_settings</span>
              </div>
              <div className="feature-item-text">
                <h5>Profil Admin</h5>
                <p>Kelola identitas &amp; akses admin, serta reset data antar-semester.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box ficon-green">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div className="feature-item-text">
                <h5>Persetujuan</h5>
                <p>Verifikasi pengajuan peminjaman ruangan dari PJ kelas.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box ficon-teal">
                <span className="material-symbols-outlined">meeting_room</span>
              </div>
              <div className="feature-item-text">
                <h5>Manajemen Ruangan</h5>
                <p>Kelola data kampus, gedung, dan ketersediaan.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box ficon-purple">
                <span className="material-symbols-outlined">supervisor_account</span>
              </div>
              <div className="feature-item-text">
                <h5>Manajemen PJ</h5>
                <p>Kelola akses, data, dan kontak PJ kelas.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box ficon-amber">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
              <div className="feature-item-text">
                <h5>Prodi &amp; Fakultas</h5>
                <p>Kelola struktur organisasi akademik.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box ficon-orange">
                <span className="material-symbols-outlined">history</span>
              </div>
              <div className="feature-item-text">
                <h5>Log Pelaporan</h5>
                <p>Pantau dan arsipkan laporan kendala perkuliahan.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box ficon-red">
                <span className="material-symbols-outlined">report_problem</span>
              </div>
              <div className="feature-item-text">
                <h5>Log Kerusakan</h5>
                <p>Mengelola daftar pelaporan kerusakan fasilitas kampus berdasarkan status pengerjaan, penguncian ruangan, serta ekspor rekap PDF/Excel.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      {message && <div className="admin-feedback neo-card" role="status">{message}</div>}

      {/* ===== Modal Reset Semester ===== */}
      {showResetModal && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal neo-card" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <h2 id="reset-title">Konfirmasi Reset Akhir Semester</h2>
            <p>Tindakan ini akan menghapus akun PJ dan mereset status semester.</p>
            <form onSubmit={handleReset}>
              <input type="text" className="admin-modal-input" placeholder="MASUKAN KATA SANDI UNTUK RESET" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} required autoFocus />
              <div className="modal-actions">
                <button type="button" className="neo-btn neo-btn-secondary" onClick={() => setShowResetModal(false)}>Batal</button>
                <button type="submit" className="neo-btn neo-btn-danger" disabled={loading}>{loading ? 'Memproses...' : 'Eksekusi Reset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Edit Profil ===== */}
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
                      {otpLoading ? 'Sending...' : otpCountdown > 0 ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><EnvelopeFill size={14} /> Minta Ulang ({otpCountdown}s)</span>) : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><EnvelopeFill size={14} /> Kirim OTP ke Email</span>)}
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
                    {showNewPassword ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
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
                        {showConfirmPassword ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* INPUT KODE OTP EMAIL 6-DIGIT */}
                  <div className="modal-field">
                    <label className="modal-label otp-label">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><KeyFill size={15} /> Kode OTP Email (6-Digit)</span>
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
                        {showOldPassword ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="submit" className="neo-btn neo-btn-primary" disabled={editLoading}>
                  {editLoading ? 'Menyimpan...' : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><FloppyFill size={16} /> Simpan Perubahan</span>)}
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
