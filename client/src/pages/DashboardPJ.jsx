import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import ProfilPJ from './pj/ProfilPJ'
import DaftarKelas from './pj/DaftarKelas'
import PelaporanKelas from './pj/PelaporanKelas'
import PelaporanKerusakan from './pj/PelaporanKerusakan'
import Notification from '../components/Notification'
import './DashboardPJ.css'
import './DashboardPJTheme.css'
import { useContext } from 'react'
import { BoxArrowRight, GearFill } from 'react-bootstrap-icons'
import { AuthContext } from '../context/AuthContext'

function DashboardPJ() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Dynamic Header Title & Eyebrow based on active route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('daftar-kelas')) {
      return {
        eyebrow: 'PENANGGUNG JAWAB KELAS / RUANGAN',
        title: 'Daftar Kelas & Peminjaman'
      };
    }
    if (path.includes('pelaporan-kerusakan')) {
      return {
        eyebrow: 'PENANGGUNG JAWAB KELAS / SARPRAS',
        title: 'Pelaporan Kerusakan Fasilitas'
      };
    }
    if (path.includes('pelaporan')) {
      return {
        eyebrow: 'PENANGGUNG JAWAB KELAS / OPERASIONAL',
        title: 'Pelaporan Kelas Kosong'
      };
    }
    return {
      eyebrow: 'PENANGGUNG JAWAB KELAS / AKUN',
      title: 'Profil & Reservasi Saya'
    };
  };

  const headerInfo = getHeaderInfo();

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout pj-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          {/* Logo */}
          <div className="sidebar-brand">
            <img src="/assets/logo_sikelas.png" alt="Logo SiKelas" className="sidebar-brand-icon" />
            <div>
              <span className="sidebar-brand-text">Sikelas</span>
              <span className="sidebar-brand-sub">Dashboard PJ</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <NavLink to="/pj/profil" className="sidebar-link" id="nav-profil">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profil Saya
            </NavLink>
            <NavLink to="/pj/daftar-kelas" className="sidebar-link" id="nav-daftar-kelas">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Daftar Kelas & Peminjaman
            </NavLink>
            <NavLink to="/pj/pelaporan" className="sidebar-link" id="nav-pelaporan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              Pelaporan Kelas Kosong
            </NavLink>
            <NavLink to="/pj/pelaporan-kerusakan" className="sidebar-link" id="nav-pelaporan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Pelaporan Kerusakan
            </NavLink>
          </nav>
        </div>
        <div className="pj-sidebar-bottom">
          <button type="button" className="pj-signout-button" onClick={handleLogout}>
            <BoxArrowRight size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="pj-navbar-title">
            <p>{headerInfo.eyebrow}</p>
            <h1>{headerInfo.title}</h1>
          </div>
          <div className="pj-navbar-actions">
            <Notification />
            <div className="pj-navbar-divider" />
            <div className="pj-navbar-user">
              <div className="pj-navbar-avatar">{user?.username?.charAt(0).toUpperCase() || 'P'}</div>
              <span className="pj-navbar-name">{user?.username || 'Nama PJ'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="profil" element={<ProfilPJ />} />
            <Route path="daftar-kelas" element={<DaftarKelas />} />
            <Route path="pelaporan" element={<PelaporanKelas />} />
            <Route path="pelaporan-kerusakan" element={<PelaporanKerusakan />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default DashboardPJ
