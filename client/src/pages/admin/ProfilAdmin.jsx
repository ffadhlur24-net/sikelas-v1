import { useContext, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
import '../pj/ProfilPJ.css'

function ProfilAdmin() {
  const { user, logout, updateUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [message, setMessage] = useState('')

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

  return (
    <div className="profil-admin-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Profil Admin</h1>
        <p className="page-subtitle">Pusat kendali dan informasi akun Anda</p>
      </div>

      <div className="profile-grid">
        <div className="profile-card card-flat">
          <div className="profile-header">
            <div className="profile-avatar" style={{ background: 'var(--color-primary)' }}>
              {getInitials(user?.username || user?.nama)}
            </div>
            <div className="profile-info">
              <h2>{user?.username || 'Administrator'}</h2>
              <p>{user?.email || 'admin@walisongo.ac.id'}</p>
              <span className="badge badge-success">Admin Pusat</span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Role Akses</span>
              <span className="detail-value" style={{ textTransform: 'capitalize' }}>{user?.role || 'Admin'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">No. HP / WA</span>
              <span className="detail-value">{user?.no_hp || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status Akun</span>
              <span className="detail-value">Aktif & Terverifikasi</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-4)' }}
            onClick={() => {
              setEditForm({
                username: user?.username || '',
                no_hp: user?.no_hp || '',
                old_password: '',
                new_password: '',
                confirm_password: '',
                otp_code: ''
              })
              setShowEditModal(true)
            }}
          >
            ✏️ Edit Profil Admin
          </button>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--spacing-3)', color: 'var(--color-error)' }}
            onClick={logout}
          >
            Keluar dari Akun Admin
          </button>
        </div>
      </div>

      {/* PUSAT PEMELIHARAAN SISTEM */}
      <div className="card-flat" style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>⚙️ Pemeliharaan & Pergantian Semester</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
          Fitur ini digunakan saat pergantian semester perkuliahan (Misal: dari Semester Ganjil ke Semester Genap).
        </p>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: '#991b1b', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Tombol Nuklir: Reset Akhir Semester</h3>
          <p style={{ color: '#7f1d1d', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' }}>
            Tindakan ini akan mengosongkan <b>Akun PJ Mahasiswa</b>, <b>Reservasi/Laporan Lama</b>, dan <b>Jadwal SIAKAD Lama</b>. Gunakan hanya saat semester perkuliahan resmi berakhir!
          </p>
          <button className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c' }} onClick={() => setShowResetModal(true)}>
            💣 Jalankan Reset Akhir Semester
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI NUKLIR */}
      {showResetModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '480px', background: '#fff', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>⚠️ Konfirmasi Total Reset Akhir Semester</h2>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
              Tindakan ini akan menghapus semua akun PJ dan mereset status semester.
            </p>
            <form onSubmit={handleReset}>
              <input
                type="text"
                className="input-field"
                style={{ marginBottom: '16px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px', width: '100%', padding: '10px' }}
                placeholder="MASUKAN PASSWORD RESET"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#dc2626' }} disabled={loading}>
                  💥 Eksekusi Reset Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM EDIT PROFIL ADMIN */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>✏️ Edit Profil Admin</h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Pengguna (Username Admin)</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Nomor HP / WhatsApp Admin</label>
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

              {/* INPUT PASSWORD BARU */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Password Baru Admin (Opsional)</label>
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

              {/* INPUT KONFIRMASI, OTP & PASSWORD LAMA JIKA PASSWORD BARU TERISI */}
              {editForm.new_password.trim() !== '' && (
                <>
                  {/* Input Konfirmasi Password Baru */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Ulangi Password Baru Admin
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input"
                        style={{ width: '100%', paddingRight: '40px' }}
                        value={editForm.confirm_password}
                        onChange={e => setEditForm({ ...editForm, confirm_password: e.target.value })}
                        placeholder="Ketik ulang password baru Admin"
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
                      Password Lama Admin (Konfirmasi Keamanan)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="input"
                        style={{ width: '100%', paddingRight: '40px', borderColor: '#fca5a5' }}
                        value={editForm.old_password}
                        onChange={e => setEditForm({ ...editForm, old_password: e.target.value })}
                        placeholder="Masukkan password lama Admin saat ini"
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

export default ProfilAdmin
