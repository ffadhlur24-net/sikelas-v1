import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import ProfilPJ from './pj/ProfilPJ'
import DaftarKelas from './pj/DaftarKelas'
import PelaporanKelas from './pj/PelaporanKelas'
import PelaporanKerusakan from './pj/PelaporanKerusakan'
import Notification from '../components/Notification'
import './DashboardPJ.css'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function DashboardPJ() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          {/* Logo */}
          <div className="sidebar-brand">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#059669" fillOpacity="0.1" />
              <path d="M24 8L14 14V22C14 30.4 18.28 38.16 24 40C29.72 38.16 34 30.4 34 22V14L24 8Z" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              <path d="M20 24L23 27L28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <span className="sidebar-brand-text">SiKelas</span>
              <span className="sidebar-brand-sub">Penanggung Jawab</span>
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
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="header-left">
          </div>
          <div className="header-right">
            <Notification />
            <div className="header-avatar">{user?.username.charAt(0).toUpperCase()}</div>
            <div className="header-user-info">
              <span className="header-user-name">{user?.username}</span>
              <span className="header-user-detail">{user?.nim_nip} • {user?.prodi} {user?.semester}{user?.kelas}</span>
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
