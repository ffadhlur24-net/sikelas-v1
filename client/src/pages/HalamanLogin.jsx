import { useEffect, useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/axios'
import './HalamanLogin.css'

function HalamanLogin() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // State form input
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const navigate = useNavigate()
  const { login, user } = useContext(AuthContext)

  // Jika user sudah login, arahkan ke dashboard masing-masing
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/profil')
      } else {
        navigate('/pj/profil')
      }
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const response = await api.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      })

      // Simpan data ke context & localStorage
      login(response.data.user, response.data.token)

      // Redirect berdasarkan role
      if (response.data.user.role === 'admin') {
        navigate('/admin/profil')
      } else {
        navigate('/pj/profil')
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMsg(error.response.data.error)
      } else {
        setErrorMsg('Terjadi kesalahan koneksi ke server. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Red Angular Badge Sticker (Top Right Corner) */}
        <div className="login-sticker-badge">
          SIKELAS • LOGIN 2026
        </div>

        {/* Top Header Section */}
        <header className="login-header">
          <p className="login-header-kicker">
            MEMBER • ACCESS • PORTAL
          </p>
          <h1 className="login-header-title">
            MASUK AKUN SIKELAS
          </h1>
          <p className="login-header-subtitle">
            Silakan masukkan kredensial akun Penanggung Jawab (PJ) atau Mahasiswa Anda untuk mengelola jadwal kelas.
          </p>
        </header>

        {/* Tab Bar Switcher */}
        <nav aria-label="Tab Akses Login" className="login-tab-switcher">
          {/* Inactive Tab: SIGN UP */}
          <Link to="/register" className="login-tab-inactive">
            <span>SIGN UP (DAFTAR)</span>
          </Link>
          {/* Active Tab: SIGN IN */}
          <span className="login-tab-active">
            <span>SIGN IN (MASUK)</span>
          </span>
        </nav>

        {/* Login Form Section */}
        <main className="login-form-body">
          {errorMsg && (
            <div className="login-alert-error" role="alert">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Input 1: Email Kampus / Username */}
            <div className="login-input-group">
              <div className="login-label-row">
                <label className="login-label" htmlFor="email">
                  <span>👤</span> USERNAME / EMAIL KAMPUS
                </label>
                <span className="login-badge-wajib">
                  WAJIB
                </span>
              </div>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                className="login-input-field login-input-email"
                placeholder="godong@student.walisongo.ac.id atau godongmailcom"
                value={formData.email}
                onChange={handleChange}
              />
              <p className="login-input-hint">
                <span className="info-icon">ℹ</span> Gunakan email resmi (@student.walisongo.ac.id) atau username terdaftar.
              </p>
            </div>

            {/* Input 2: Password */}
            <div className="login-input-group">
              <div className="login-label-row">
                <label className="login-label" htmlFor="password">
                  <span>🔒</span> PASSWORD
                </label>
                <span className="login-badge-wajib">
                  WAJIB
                </span>
              </div>
              <div className="login-input-password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="login-input-field login-input-password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="login-toggle-password-btn"
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#000000' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="login-input-hint">
                <span className="info-icon">ℹ</span> Password minimal 8 karakter akun SiKelas.
              </p>
            </div>

            {/* Auxiliary Row: Remember Me & Forgot Password */}
            <div className="login-auxiliary-row">
              <label className="login-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                <span>Ingat Saya</span>
              </label>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20SiKelas,%20saya%20lupa%20password%20akun%20saya"
                target="_blank"
                rel="noopener noreferrer"
                className="login-link-forgot"
              >
                Lupa Password?
              </a>
            </div>

            {/* Submit Button CTA */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              <span>{loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}</span>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>➔</span>
            </button>
          </form>

          {/* Auxiliary Links & Notification Box */}
          <div className="login-auxiliary-links">
            <p className="login-register-text">
              Belum punya akun PJ?{' '}
              <Link to="/register" className="login-link-register">
                Daftar PJ di sini
              </Link>
            </p>

            <div className="login-otp-box">
              <span style={{ color: '#ef4444' }}>📌</span>
              <span>Belum tuntas verifikasi OTP?</span>
              <Link to="/verify-email" className="login-link-otp">
                Lanjutkan Verifikasi Di Sini
              </Link>
            </div>

            <div style={{ paddingTop: '4px' }}>
              <Link to="/" className="login-btn-home">
                <span>⬅</span> KEMBALI KE BERANDA
              </Link>
            </div>
          </div>
        </main>

        {/* Perforated Ticket Footer */}
        <footer className="login-ticket-footer">
          <p>
            ★ ESTABLISHED 2026 ★ SIKELAS KAMPUS ★ ALL RIGHTS RESERVED ★
          </p>
        </footer>
      </div>

      {/* Bottom External Helpdesk Link */}
      <aside className="login-helpdesk-text">
        <span>• Butuh bantuan? </span>
        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin%20SiKelas,%20saya%20membutuhkan%20bantuan%20terkait%20login"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hubungi Admin Helpdesk SiKelas
        </a>
        <span> •</span>
      </aside>
    </div>
  )
}

export default HalamanLogin
