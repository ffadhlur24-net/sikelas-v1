import { useEffect, useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/axios'
import './HalamanLogin.css'

function HalamanLogin() {
  const [activeTab, setActiveTab] = useState('login') // 'login' or 'register'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')


  // State untuk form input
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  // Hook untuk navigasi & Context
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);

  // Jika user dah pernah login(ada datanya), tendang langsung ke dashbord 
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

  // Handle form submit (Login & Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Proses Login
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Simpan data ke context & localStorage
      login(response.data.user, response.data.token)

      // Redirect berdasarkan role
      if (response.data.user.role === 'admin') {
        navigate('/admin/profil')
      } else {
        navigate('/pj/profil')
      }

    } catch (error) {
      if (error.response && error.response.data.error) {
        setErrorMsg(error.response.data.error)
      } else {
        setErrorMsg('Terjadi kesalahan koneksi server. sabar bro!!')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="login-page animate-fade-in">
      <div className="login-card">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#059669" fillOpacity="0.1" />
              <path d="M24 8L14 14V22C14 30.4 18.28 38.16 24 40C29.72 38.16 34 30.4 34 22V14L24 8Z" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              <path d="M20 24L23 27L28 20" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="login-title">SiKelas</h1>
          <p className="login-subtitle">Masuk ke Akun Anda</p>
        </div>
        {/* Notifikasi Error */}
        {errorMsg && (
          <div style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}
        {/* Form Login */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Kampus / Username</label>
            <input type="email" className="input-field" name="email" value={formData.email} onChange={handleChange} placeholder="nama@student.walisongo.ac.id" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input-field"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan password Anda"
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b',
                  padding: '4px'
                }}
                title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        {/* Link ke Halaman Register Pintar */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Belum punya akun PJ? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Daftar PJ di sini</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>
            ⬅️ Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HalamanLogin
