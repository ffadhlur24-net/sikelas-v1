import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
import './ProfilPJ.css'

function ProfilPJ() {
  // Ambil data user yang usdah login dari Context
  const { user, logout, updateUser } = useContext(AuthContext)
  const [reservations, setReservations] = useState([])
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
        return alert('⚠️ Password baru minimal harus 8 karakter!')
      }
      if (editForm.new_password !== editForm.confirm_password) {
        return alert('⚠️ Konfirmasi password baru tidak cocok!')
      }
      if (!editForm.otp_code || editForm.otp_code.length !== 6) {
        return alert('⚠️ Masukkan 6-digit Kode OTP yang dikirim ke email Anda!')
      }
      if (!editForm.old_password) {
        return alert('⚠️ Silakan masukkan password lama Anda untuk konfirmasi keamanan.')
      }
    }
    try {
      setEditLoading(true)
      const res = await api.put('/users/profile', editForm)
      alert(res.data.message || 'Profil berhasil diperbarui!')
      if (res.data.user) {
        updateUser(res.data.user)
      }
      setShowEditModal(false)
      setEditForm(prev => ({ ...prev, old_password: '', new_password: '' }))
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal memperbarui profil.')
    } finally {
      setEditLoading(false)
    }
  }
  const handleRequestOtp = async () => {
    try {
      setOtpLoading(true)
      const res = await api.post('/users/request-password-otp')
      alert(res.data.message || 'Kode OTP berhasil dikirim ke email Anda!')
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
      alert(error.response?.data?.error || 'Gagal mengirim kode OTP')
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
    if (!name) return 'pj'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const isExpiredCheck = (tanggal, waktuMulai) => {
    if (!tanggal || !waktuMulai) return false
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
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
      alert('Berhasil Check-In! Ruangan Siap digunakan.')
      fetchReservations()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal check-in')
      fetchReservations()
    }
  }

  return (
    <div className='animate-fade-in'>
      <div className='page-header'>
        <h1 className='page-title'>Profil Saya & Reservasi Saya</h1>
        <p className='page-subtitle'>Kelola data Anda dan lakukan Check-In untuk ruangan yang disetujui.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* kolom kiri: Profil */}
        <div className='profile-card card-flat' style={{ height: 'fit-content' }}>
          <div className="profile-header">
            <div className="profile-avatar">
              {getInitials(user?.username)}
            </div>
            <div className="profile-info">
              <h2>{user?.username || 'Nama PJ'}</h2>
              <p>{user?.email || 'email@student.walisongo.ac.id'}</p>
              <span className='badge badge-success'>PJ Aktif</span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span className="datail-label">NIM</span>
              <span className="detail-value">{user?.nim_nip || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Semester</span>
              <span className="detail-value">{user?.semester || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Kelas</span>
              <span className="detail-value">{user?.kelas || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Program Studi</span>
              <span className="detail-value">{user?.prodi || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Mata Kuliah</span>
              <span className="detail-value">{user?.mata_kuliah || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">No. HP</span>
              <span className="detail-value">{user?.no_hp || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Role Akses</span>
              <span className="detail-value" style={{ textTransform: 'capitalize' }}>{user?.role || 'PJ'}</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-4)' }}
            onClick={() => setShowEditModal(true)}
          >
            ✏️ Edit Profil Saya
          </button>

          <button className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--spacing-3)', color: 'var(--color-error)' }}
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {/* Kolom Kanan: Riwayat Reservasi dan check-in*/}
        <div className="card-flat">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Riwayat Reservasi Saya</h2>
          {loading ? (
            <p>Memuat riwayat...</p>
          ) : reservations.length === 0 ? (
            <p style={{ color: 'gray' }}>Anda belum memiliki riwayat reservasi ruangan.</p>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reservations.map(res => (
                <div key={res.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{res.mata_kuliah}</h3>
                    {res.status === 'pending' && <span className="badge badge-warning">Menunggu</span>}
                    {res.status === 'rejected' && (
                      <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                        ❌ <b>Ditolak Admin:</b> {res.alasan_penolakan || 'Tidak ada alasan yang dicantumkan.'}
                      </div>
                    )}
                    {res.status === 'expired' && <span className="badge badge-error">Hangus (Ghosting)</span>}
                    {res.status === 'approved' && !res.is_checked_in && (
                      isExpiredCheck(res.tanggal, res.waktu_mulai) ? (
                        <span className="badge badge-error" style={{ background: '#ef4444', color: 'white' }}>Kadaluwarsa (&gt;15 Menit)</span>
                      ) : (
                        <span className="badge badge-success">Disetujui (Belum Check-In)</span>
                      )
                    )}
                    {res.status === 'approved' && res.is_checked_in && <span className="badge badge-success" style={{ background: '#10b981', color: 'white' }}>Sudah Check-In</span>}
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>
                    Ruang {res.rooms?.nama} ({res.rooms?.gedung}) <br />
                    Tanggal: {res.tanggal} | Waktu: {res.waktu_mulai} - {res.waktu_selesai}
                  </p>

                  {/* TOMBOL CHECK IN MUNCUL HANYA JIKA APPROVED & BELUM EXPIRED */}
                  {res.status === 'approved' && !res.is_checked_in && !isExpiredCheck(res.tanggal, res.waktu_mulai) && (
                    <button
                      onClick={() => handleCheckIn(res.id)}
                      className="btn btn-primary"
                      style={{ marginTop: '12px', width: '100%', background: '#3b82f6' }}
                    >
                      📍 Check-In Sekarang
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM EDIT PROFIL */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>✏️ Edit Profil Saya</h3>
            <form onSubmit={handleEditSubmit}>
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
                      {otpLoading ? 'Sending...' : otpCountdown > 0 ? `📩 Minta Ulang (${otpCountdown}s)` : '📩 Kirim OTP ke Email'}
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
                    {showNewPassword ? '🙈' : '👁️'}
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
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  {/* INPUT KODE OTP EMAIL 6-DIGIT */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#2563eb' }}>
                      🔑 Kode OTP Email (6-Digit)
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
                        {showOldPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editLoading}>
                  {editLoading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
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
