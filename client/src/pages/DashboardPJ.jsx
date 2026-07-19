import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import ProfilPJ from './pj/ProfilPJ'
import DaftarKelas from './pj/DaftarKelas'
import ReservasiKelas from './pj/ReservasiKelas'
import PelaporanKelas from './pj/PelaporanKelas'
import './DashboardPJ.css'

function DashboardPJ() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // TODO: Clear token & redirect
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          {/* Logo */}
          <div className="sidebar-brand">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#059669" fillOpacity="0.1"/>
              <path d="M24 8L14 14V22C14 30.4 18.28 38.16 24 40C29.72 38.16 34 30.4 34 22V14L24 8Z" fill="#059669" stroke="#047857" strokeWidth="1.5"/>
              <path d="M20 24L23 27L28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sidebar-brand-text">SiKelas</span>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <NavLink to="/pj/profil" className="sidebar-link" id="nav-profil">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Profil
            </NavLink>
            <NavLink to="/pj/daftar-kelas" className="sidebar-link" id="nav-daftar-kelas">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Daftar Kelas
            </NavLink>
            <NavLink to="/pj/reservasi" className="sidebar-link" id="nav-reservasi">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reservasi
            </NavLink>
            <NavLink to="/pj/pelaporan" className="sidebar-link" id="nav-pelaporan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Pelaporan
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-link sidebar-settings" id="nav-pengaturan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Pengaturan
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="header-left">
            {/* Page title will be set by child pages */}
          </div>
          <div className="header-right">
            <div className="header-user-info">
              <span className="header-user-name">Muhammad Faris</span>
              <span className="header-user-detail">190304115 • TI-A</span>
            </div>
            <div className="header-avatar">MF</div>
            <button className="header-logout" onClick={handleLogout} id="btn-logout" title="Keluar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="profil" element={<ProfilPJ />} />
            <Route path="daftar-kelas" element={<DaftarKelas />} />
            <Route path="reservasi" element={<ReservasiKelas />} />
            <Route path="pelaporan" element={<PelaporanKelas />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default DashboardPJ
