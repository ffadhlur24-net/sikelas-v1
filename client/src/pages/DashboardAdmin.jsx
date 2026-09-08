import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import ProfilAdmin from './admin/ProfilAdmin'
import PersetujuanReservasi from './admin/PersetujuanReservasi'
import ManajemenRuangan from './admin/ManajemenRuangan'
import ManajemenAkunPJ from './admin/ManajemenAkunPJ'
import LogPelaporan from './admin/LogPelaporan'
import ManajemenProdi from './admin/ManajemenProdi'
import LogKerusakanFasilitas from './admin/LogKerusakanFasilitas'
import Notification from '../components/Notification'
import { BoxArrowRight } from 'react-bootstrap-icons'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import './DashboardPJ.css' // Reuse the shared dashboard layout styles
import './DashboardAdmin.css'

function DashboardAdmin() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const getPageTitle = () => {
    if (location.pathname.includes('/admin/log-kerusakan')) return 'Log Kerusakan'
    if (location.pathname.includes('/admin/log')) return 'Log Pelaporan'
    if (location.pathname.includes('/admin/persetujuan')) return 'Persetujuan'
    if (location.pathname.includes('/admin/ruangan')) return 'Manajemen Ruangan'
    if (location.pathname.includes('/admin/akun-pj')) return 'Manajemen PJ'
    if (location.pathname.includes('/admin/prodi')) return 'Manajemen Prodi & Fakultas'
    return 'Profil Admin'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout admin-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          {/* Logo */}
          <div className="sidebar-brand">
            <img src="/assets/logo_sikelas.png" alt="Logo SiKelas" className="sidebar-brand-icon" />
            <div>
              <span className="sidebar-brand-text">SiKelas</span>
              <span className="sidebar-brand-sub">Admin Dashboard</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <NavLink to="/admin/profil" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profil Admin
            </NavLink>
            <NavLink to="/admin/persetujuan" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Persetujuan
            </NavLink>
            <NavLink to="/admin/ruangan" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Manajemen Ruangan
            </NavLink>
            <NavLink to="/admin/akun-pj" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Manajemen PJ
            </NavLink>
            <NavLink to="/admin/prodi" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11H9V10z" />
              </svg>
              Manajemen Prodi & Fakultas
            </NavLink>
            <NavLink to="/admin/log" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Log Pelaporan
            </NavLink>
            <NavLink to="/admin/log-kerusakan" className="sidebar-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 2.8 20h18.4L12 3Z" fill="currentColor" stroke="currentColor" />
                <path d="M12 9v5" stroke="#ffffff" strokeWidth="2.5" />
                <path d="M12 17.5h.01" stroke="#ffffff" strokeWidth="2.5" />
              </svg>
              Log Kerusakan
            </NavLink>
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <button type="button" className="admin-signout-button" onClick={handleLogout}>
            <BoxArrowRight size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="admin-navbar-title">
            <p className="admin-navbar-kicker">SIKELAS / ADMINISTRATOR</p>
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="admin-navbar-actions">
            <Notification />
            <div className="admin-navbar-user">
              <div className="admin-navbar-avatar">{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
              <div className="admin-navbar-user-info">
                <span>{user?.username || 'Administrator'}</span>
                <small>{user?.nim_nip || 'admin@walisongo.ac.id'}</small>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="profil" element={<ProfilAdmin />} />
            <Route path="persetujuan" element={<PersetujuanReservasi />} />
            <Route path="ruangan" element={<ManajemenRuangan />} />
            <Route path="akun-pj" element={<ManajemenAkunPJ />} />
            <Route path="prodi" element={<ManajemenProdi />} />
            <Route path="log" element={<LogPelaporan />} />
            <Route path="log-kerusakan" element={<LogKerusakanFasilitas />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <span>SiKelas © 2026. Semua Hak Dilindungi.</span>
          <div className="dashboard-footer-links">
            <a href="#">Tentang Kami</a>
            <a href="#">Kontak</a>
            <a href="#">Kebijakan Privasi</a>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default DashboardAdmin
