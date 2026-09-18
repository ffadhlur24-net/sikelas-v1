import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../api/axios'
import './ProfilPJ.css'
import {
  PencilSquare,
  XCircleFill,
  GeoAltFill,
  PersonBadge,
  Tools,
  EnvelopeFill,
  EyeSlashFill,
  EyeFill,
  KeyFill,
  FloppyFill,
  XLg,
  PersonFill,
  DoorOpenFill,
  ClockHistory,
  CalendarWeekFill,
  MortarboardFill,
  Bank2,
  BookFill,
  TelephoneFill,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'react-bootstrap-icons'

function ProfilPJ() {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  // Ambil data user yang sudah login dari Context
  const { user, updateUser } = useContext(AuthContext)
  const [reservations, setReservations] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 3
  const [loading, setLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    if (user) {
      setEditForm(prev => ({
        ...prev,
        username: user.username || '',
        no_hp: user.no_hp || ''
      }))
    }
  }, [user])

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
        showWarning('Masukkan 6-digit Kode OTP yang dikirim ke email Anda!', 'KODE OTP DIPERLUKAN')
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
      showSuccess(res.data.message || 'Profil berhasil diperbarui!', 'PROFIL DIPERBARUI')
      if (res.data.user) {
        updateUser(res.data.user)
      }
      setShowEditModal(false)
      setEditForm(prev => ({ ...prev, old_password: '', new_password: '' }))
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal memperbarui profil.', 'GAGAL SIMPAN')
    } finally {
      setEditLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    try {
      setOtpLoading(true)
      const res = await api.post('/users/request-password-otp')
      showSuccess(res.data.message || 'Kode OTP berhasil dikirim ke email Anda!', 'OTP TERKIRIM')
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
      showError(error.response?.data?.error || 'Gagal mengirim kode OTP', 'GAGAL KIRIM OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // Mengambil data reservasi milik PJ ini
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reservations')
      setReservations(res.data.reservations || [])
    } catch (error) {
      console.error("Gagal memuat reservasi:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  // Fungsi untuk mendapatkan 2 huruf pertama dari nama(untuk Afatar)
  const getInitials = (name) => {
    if (!name) return 'PJ'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const canCheckIn = (tanggal, waktuMulai) => {
    if (!tanggal || !waktuMulai) return false
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`
    
    // Hanya bisa check-in pada hari pelaksanaan
    if (tanggal !== todayStr) return false

    const currentHour = String(now.getHours()).padStart(2, '0')
    const currentMinute = String(now.getMinutes()).padStart(2, '0')
    const currentTimeStr = `${currentHour}:${currentMinute}`

    const [startH, startM] = waktuMulai.split(':').map(Number)
    const earlyDateObj = new Date(2000, 0, 1, startH, startM - 15)
    const earlyTimeStr = earlyDateObj.toTimeString().substring(0, 5)

    const expiryDateObj = new Date(2000, 0, 1, startH, startM + 15)
    const expiryTimeStr = expiryDateObj.toTimeString().substring(0, 5)

    return currentTimeStr >= earlyTimeStr && currentTimeStr <= expiryTimeStr
  }

  const isExpiredCheck = (tanggal, waktuMulai) => {
    if (!tanggal || !waktuMulai) return false
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`
    if (tanggal < todayStr) return true
    if (tanggal === todayStr) {
      const currentHour = String(now.getHours()).padStart(2, '0')
      const currentMinute = String(now.getMinutes()).padStart(2, '0')
      const currentTimeStr = `${currentHour}:${currentMinute}`

      const [startH, startM] = waktuMulai.split(':').map(Number)
      const expiryDateObj = new Date(2000, 0, 1, startH, startM + 15)
      const expiryTimeStr = expiryDateObj.toTimeString().substring(0, 5)

      return currentTimeStr > expiryTimeStr
    }
    return false
  }

  const handleCheckIn = async (id) => {
    try {
      await api.patch(`/reservations/${id}/checkin`)
      showSuccess('Berhasil Check-In! Ruangan siap digunakan.', 'CHECK-IN BERHASIL')
      fetchReservations()
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal check-in ruangan.', 'GAGAL CHECK-IN')
      fetchReservations()
    }
  }

  // Paginasi sederhana riwayat reservasi
  const totalPages = Math.ceil(reservations.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedReservations = reservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className='profil-pj-page animate-fade-in'>
      {/* 1. Header Halaman */}
      <div className='pj-page-heading'>
        <h1 className="pj-page-title">Profil &amp; Reservasi PJ</h1>
        <p className="pj-page-subtitle">Kelola data Anda dan lakukan Check-In untuk ruangan yang disetujui.</p>
      </div>

      {/* 2. Top Grid: Kartu Profil (Kiri) & Ringkasan Fitur Sistem (Kanan) */}
      <div className='pj-top-grid'>
        {/* Kolom Kiri: Kartu Profil PJ */}
        <div className='pj-profile-col'>
          <div className='pj-profile-card'>
            {/* Header Profil Neo-Brutalist */}
            <div className="pj-profile-header">
              <div className="pj-avatar-wrapper">
                <div className="pj-avatar-box">
                  {getInitials(user?.username)}
                </div>
                <span className="pj-avatar-status-dot" title="PJ Aktif" />
              </div>

              <div className="pj-profile-title-group">
                <div className="pj-profile-name-row">
                  <h3 className="pj-profile-username" title={user?.username || 'gong'}>
                    {user?.username || 'gong'}
                  </h3>
                  <span className="pj-badge-status-aktif">
                    <span className="pj-status-dot-inner" />
                    PJ Aktif
                  </span>
                </div>
                <div className="pj-badge-role">
                  ROLE: {user?.role ? user.role.toUpperCase() : 'PJ MAHASISWA'}
                </div>
              </div>
            </div>

            {/* Information Fields */}
            <div className="pj-info-fields-list">
              {/* Email */}
              <div className="pj-info-row">
                <div className="pj-info-label-group">
                  <span className="pj-info-icon-box bg-dark">
                    <EnvelopeFill size={13} />
                  </span>
                  <span className="pj-info-label">Email</span>
                </div>
                <span className="pj-info-value-badge font-mono" title={user?.email || '-'}>
                  {user?.email || '-'}
                </span>
              </div>

              {/* NIM */}
              <div className="pj-info-row">
                <div className="pj-info-label-group">
                  <span className="pj-info-icon-box bg-dark">
                    <PersonBadge size={13} />
                  </span>
                  <span className="pj-info-label">NIM</span>
                </div>
                <span className="pj-info-value-badge font-mono">
                  {user?.nim_nip || '-'}
                </span>
              </div>

              {/* Semester & Kelas Inline Grid */}
              <div className="pj-info-dual-grid">
                <div className="pj-info-dual-box">
                  <div className="pj-info-label-group">
                    <span className="pj-info-icon-box bg-dark">
                      <CalendarWeekFill size={13} />
                    </span>
                    <span className="pj-info-label">Smt</span>
                  </div>
                  <span className="pj-info-dual-value">
                    {user?.semester || ((user?.kelas && user?.kelas.endsWith('-U')) || (user?.mata_kuliah && user?.mata_kuliah.includes('Mengulang')) ? 'SPB' : '-')}
                  </span>
                </div>

                <div className="pj-info-dual-box">
                  <div className="pj-info-label-group">
                    <span className="pj-info-icon-box bg-blue">
                      <MortarboardFill size={13} />
                    </span>
                    <span className="pj-info-label">Kelas</span>
                  </div>
                  <span className="pj-info-dual-value">
                    {user?.kelas || '-'}
                  </span>
                </div>
              </div>

              {/* Program Studi */}
              <div className="pj-info-block">
                <div className="pj-info-label-group">
                  <Bank2 size={14} className="pj-label-icon text-primary" />
                  <span className="pj-info-label">Program Studi</span>
                </div>
                <span className="pj-info-block-value">
                  {user?.prodi || '-'}
                </span>
              </div>

              {/* Mata Kuliah Diampu */}
              <div className="pj-info-block">
                <div className="pj-info-label-group">
                  <BookFill size={14} className="pj-label-icon text-blue" />
                  <span className="pj-info-label">Mata Kuliah Diampu</span>
                </div>
                <span className="pj-info-block-value">
                  {user?.mata_kuliah || '-'}
                </span>
              </div>

              {/* No. HP */}
              <div className="pj-info-row">
                <div className="pj-info-label-group">
                  <span className="pj-info-icon-box bg-green">
                    <TelephoneFill size={13} />
                  </span>
                  <span className="pj-info-label">No. HP</span>
                </div>
                <span className="pj-info-value-badge font-mono">
                  {user?.no_hp || '-'}
                </span>
              </div>
            </div>

            {/* Tombol Edit Profil */}
            <button
              type="button"
              className="pj-btn-edit-profile"
              onClick={() => setShowEditModal(true)}
            >
              <PencilSquare size={18} />
              <span>EDIT PROFIL SAYA</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Fitur Sistem */}
        <div className="pj-features-col">
          <div className="pj-features-header">
            <h2 className="pj-features-title">RINGKASAN FITUR SISTEM</h2>
            <span className="pj-features-badge-tag">Panduan Menu</span>
          </div>

          <div className="pj-features-list">
            {/* Fitur 1: Profil & Reservasi */}
            <div
              className="pj-feature-card-neo"
              onClick={() => {
                const el = document.getElementById('riwayat-reservasi-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              role="button"
              tabIndex={0}
            >
              <div className="pj-feature-main-content">
                <div className="pj-feature-icon-box bg-blue">
                  <PersonFill size={22} />
                </div>
                <div className="pj-feature-text-group">
                  <h4 className="pj-feature-name">Profil &amp; Reservasi</h4>
                  <p className="pj-feature-desc">
                    Data akun akademik PJ, status keaktifan, daftar reservasi disetujui/menunggu, dan catatan pj.
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="pj-feature-arrow" />
            </div>

            {/* Fitur 2: Daftar Kelas & Ruangan */}
            <div
              className="pj-feature-card-neo"
              onClick={() => navigate('/pj/daftar-kelas')}
              role="button"
              tabIndex={0}
            >
              <div className="pj-feature-main-content">
                <div className="pj-feature-icon-box bg-green">
                  <DoorOpenFill size={22} />
                </div>
                <div className="pj-feature-text-group">
                  <h4 className="pj-feature-name">Daftar Kelas &amp; Ruangan</h4>
                  <p className="pj-feature-desc">
                    Status fisik ruangan real-time, jadwal mingguan per kelas, serta pengajuan reservasi instan.
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="pj-feature-arrow" />
            </div>

            {/* Fitur 3: Pelaporan Kelas Kosong */}
            <div
              className="pj-feature-card-neo"
              onClick={() => navigate('/pj/pelaporan')}
              role="button"
              tabIndex={0}
            >
              <div className="pj-feature-main-content">
                <div className="pj-feature-icon-box bg-orange">
                  <ClockHistory size={22} />
                </div>
                <div className="pj-feature-text-group">
                  <h4 className="pj-feature-name">Pelaporan Kelas Kosong</h4>
                  <p className="pj-feature-desc">
                    Melaporkan dosen berhalangan, kuliah daring, atau ruangan terkunci agar hak guna dapat dialihkan.
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="pj-feature-arrow" />
            </div>

            {/* Fitur 4: Pelaporan Kerusakan */}
            <div
              className="pj-feature-card-neo"
              onClick={() => navigate('/pj/pelaporan-kerusakan')}
              role="button"
              tabIndex={0}
            >
              <div className="pj-feature-main-content">
                <div className="pj-feature-icon-box bg-blue">
                  <Tools size={20} />
                </div>
                <div className="pj-feature-text-group">
                  <h4 className="pj-feature-name">Pelaporan Kerusakan</h4>
                  <p className="pj-feature-desc">
                    Laporan kerusakan fasilitas &amp; sarpras kelas (seperti AC atau proyektor) kepada tim terkait.
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="pj-feature-arrow" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Bawah (Lebar Penuh / Full-Width): Riwayat Reservasi PJ */}
      <section id="riwayat-reservasi-section" className="pj-reservations-section">
        <div className="pj-reservations-header">
          <h2 className="pj-reservations-title">RIWAYAT RESERVASI PJ</h2>
        </div>

        {loading ? (
          <div className="pj-empty-box">Memuat riwayat...</div>
        ) : reservations.length === 0 ? (
          <div className="pj-empty-box">Anda belum memiliki riwayat reservasi ruangan.</div>
        ) : (
          <div className="pj-reservations-list">
            {displayedReservations.map(res => (
              <div key={res.id} className="pj-reservation-card">
                <div className="pj-res-card-content">
                  <div className="pj-res-details">
                    <h3 className="pj-res-subject">{res.mata_kuliah}</h3>
                    <p className="pj-res-room">Ruang {res.rooms?.nama} ({res.rooms?.gedung})</p>
                    <p className="pj-res-time">
                      Tanggal: {res.tanggal} | Waktu: {res.waktu_mulai} - {res.waktu_selesai}
                    </p>
                    {res.status === 'rejected' && (
                      <div className="pj-res-rejected-box">
                        <span className="pj-rejected-label"><XCircleFill size={15} /> <b>Ditolak Admin:</b></span> {res.alasan_penolakan || 'Tidak ada alasan yang dicantumkan.'}
                      </div>
                    )}
                  </div>

                  <div className="pj-res-status-actions">
                    {res.status === 'pending' && (
                      <span className="pj-res-badge badge-pending">Menunggu</span>
                    )}
                    {res.status === 'rejected' && (
                      <span className="pj-res-badge badge-rejected">Ditolak</span>
                    )}
                    {res.status === 'expired' && (
                      <span className="pj-res-badge badge-expired">Kadaluwarsa / Hangus</span>
                    )}
                    {res.status === 'approved' && !res.is_checked_in && (
                      isExpiredCheck(res.tanggal, res.waktu_mulai) ? (
                        <span className="pj-res-badge badge-expired">Kadaluwarsa (&gt;15 Menit)</span>
                      ) : (
                        <span className="pj-res-badge badge-approved">Disetujui</span>
                      )
                    )}
                    {res.status === 'approved' && res.is_checked_in && (
                      <span className="pj-res-badge badge-checkedin">Sudah Check-In</span>
                    )}

                    {/* Tombol Check-In */}
                    {res.status === 'approved' && !res.is_checked_in && !isExpiredCheck(res.tanggal, res.waktu_mulai) && (
                      canCheckIn(res.tanggal, res.waktu_mulai) ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(res.id)}
                          className="pj-btn-checkin"
                        >
                          <GeoAltFill size={15} /> Check-In Sekarang
                        </button>
                      ) : (
                        <span className="pj-res-badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#000' }}>
                          Check-In H-15 Menit
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Paginasi Riwayat */}
            {totalPages > 1 && (
              <div className="pj-pagination-bar">
                <button
                  type="button"
                  className="pj-page-nav-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span className="pj-page-info">
                  Halaman <b>{currentPage}</b> dari <b>{totalPages}</b>
                </span>
                <button
                  type="button"
                  className="pj-page-nav-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* MODAL FORM EDIT PROFIL */}
      {showEditModal && (
        <div className="pj-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="pj-modal-card card-flat" onClick={(e) => e.stopPropagation()}>
            <div className="pj-modal-header">
              <h3><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><PencilSquare size={18} /> Edit Profil Saya</span></h3>
              <button type="button" className="pj-modal-close-btn" onClick={() => setShowEditModal(false)} aria-label="Tutup modal">
                <XLg size={16} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="pj-modal-form">
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Pengguna (Username)</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={editForm.username}
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={editForm.no_hp}
                  onChange={e => setEditForm({ ...editForm, no_hp: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  required
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Password Baru (Opsional)</label>
                  {editForm.new_password.trim() !== '' && (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={otpLoading || otpCountdown > 0}
                      style={{
                        background: 'none', border: 'none', color: '#2563eb',
                        fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      {otpLoading ? 'Sending...' : otpCountdown > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><EnvelopeFill size={13} /> Minta Ulang ({otpCountdown}s)</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><EnvelopeFill size={13} /> Kirim OTP ke Email</span>}
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input"
                    style={{ width: '100%', paddingRight: '40px' }}
                    value={editForm.new_password}
                    onChange={e => setEditForm({ ...editForm, new_password: e.target.value })}
                    placeholder="Minimal 8 karakter (Kosongkan jika tidak diubah)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'
                    }}
                  >
                    {showNewPassword ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
                  </button>
                </div>
              </div>
              {/* TAMPILKAN INPUT KONFIRMASI, OTP, & PASSWORD LAMA JIKA PASSWORD BARU TERISI */}
              {editForm.new_password.trim() !== '' && (
                <>
                  {/* Input Konfirmasi Password Baru */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Ulangi Password Baru
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input"
                        style={{ width: '100%', paddingRight: '40px' }}
                        value={editForm.confirm_password}
                        onChange={e => setEditForm({ ...editForm, confirm_password: e.target.value })}
                        placeholder="Ketik ulang password baru Anda"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'
                        }}
                      >
                        {showConfirmPassword ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
                      </button>
                    </div>
                  </div>
                  {/* INPUT KODE OTP EMAIL 6-DIGIT */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#2563eb' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><KeyFill size={16} /> Kode OTP Email (6-Digit)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input"
                      style={{ width: '100%', letterSpacing: '4px', fontWeight: 'bold', textAlign: 'center', borderColor: '#93c5fd' }}
                      value={editForm.otp_code}
                      onChange={e => setEditForm({ ...editForm, otp_code: e.target.value })}
                      placeholder="000000"
                      required
                    />
                  </div>
                  {/* Input Password Lama */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#dc2626' }}>
                      Password Lama (Konfirmasi Keamanan)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="input"
                        style={{ width: '100%', paddingRight: '40px', borderColor: '#fca5a5' }}
                        value={editForm.old_password}
                        onChange={e => setEditForm({ ...editForm, old_password: e.target.value })}
                        placeholder="Masukkan password lama Anda saat ini"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'
                        }}
                      >
                        {showOldPassword ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div className="pj-modal-actions">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editLoading}>
                  {editLoading ? 'Menyimpan...' : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FloppyFill size={15} /> Simpan Perubahan</span>}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
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

export default ProfilPJ
