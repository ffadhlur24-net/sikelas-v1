import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import '../pj/ProfilPJ.css'

function ProfilAdmin() {
  const { user, logout } = useContext(AuthContext)

  //Admin inilisial nama
  const getInitials = (nama) => {
    if (!nama) return 'AD'
    return nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="profil-admin-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Profil Admin</h1>
        <p className="page-subtitle">Pusat kendali dan infromasi akun anda</p>
      </div>

      <div className="profile-grid">
        <div className="profile-card card-flat">
          <div className="profile-header">
            <div className="profile-avatar" style={{ background: 'var(--color-primary)' }}>
              {getInitials(user?.nama)}
            </div>
            <div className="profile-info">
              <h2>{user?.nama || 'Administrator'}</h2>
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
              <span className="detail-label">Status Akun</span>
              <span className="detail-value">Aktif & Terverifikasi</span>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--spacing-6)', color: 'var(--color-error)' }}
            onClick={logout}
          >
            Keluar dari Akun Admin
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilAdmin
