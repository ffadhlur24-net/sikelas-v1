import { useEffect, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../api/axios'
import './HalamanLogin.css'

function HalamanLogin() {
  const [activeTab, setActiveTab] = useState('login') // 'login' or 'register'
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')


  // State untuk form input
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nama: '',
    nim: '',
    prodi: '',
    no_hp: ''
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
      if (activeTab === 'login') {
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
      } else {
        // Proses Register
        const response = await api.post('/auth/register', formData);

        setSuccessMsg(response.data.message)
        setActiveTab('login') // Pindah ke tab login setelah sukses

        // Reset form
        setFormData({ email: '', password: '', nama: '', nim: '', prodi: '', no_hp: '' })
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
              <path d="M20 24L23 27L28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="login-title">SiKelas</h1>
          <p className="login-subtitle">Sistem Reservasi & Pelaporan Kelas</p>
        </div>
        {/* Tab Toggle */}
        <div className="login-tabs">
          <button
            className={`login-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Masuk
          </button>
          <button
            className={`login-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Daftar PJ
          </button>
        </div>
        {/* Notifikasi Error/Success */}
        {errorMsg && (
          <div style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
            {successMsg}
          </div>
        )}
        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>

          {activeTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input type="text" className="input-field" name="nama" value={formData.nama} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIM</label>
                  <input type="text" className="input-field" name="nim" value={formData.nim} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prodi</label>
                  <select className="input-field" name="prodi" value={formData.prodi} onChange={handleChange}>
                    <option value="">Pilih Prodi</option>
                    <option value="Teknik Informatika">Teknik Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">No WhatsApp</label>
                <input type="text" className="input-field" name="no_hp" value={formData.no_hp} onChange={handleChange} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email Institusi</label>
            <input type="email" className="input-field" name="email" value={formData.email} onChange={handleChange} placeholder="nama@student.walisongo.ac.id" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="input-field" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          {activeTab === 'login' && (
            <a href="#" className="forgot-password">Lupa Password?</a>
          )}
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Memproses...' : (activeTab === 'login' ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default HalamanLogin
