import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import './ProfilPJ.css'

function ProfilPJ() {
  // Ambil data user yang usdah login dari Context
  const { user, logout } = useContext(AuthContext)

  // Fungsi untuk mendapatkan 2 huruf pertama dari nama(untuk Afatar)
  const getInitials = (name) => {
    if (!name) return 'pj'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className='animate-fade-in'>
      <div className='page-header'>
        <h1 className='page-title'>Profil Saya</h1>
        <p className='page-subtitle'>Kelola informasi data Anda sebagai Penanggung Jawab kelas.</p>
      </div>

      <div className='profile-grid'>
        <div className='profile-card card-flat'>
          <div className="profile-header">
            <div className="profile-avatar">
              {getInitials(user?.nama)}
            </div>
            <div className="profile-info">
              <h2>{user?.nama || 'Nama PJ'}</h2>
              <p>{user?.email || 'email@student.walisongo.ac.id'}</p>
              <span className='badge badge-success'>PJ Aktif</span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span className="datail-label">NIM</span>
              <span className="detail-value">{user?.nim || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Program Studi</span>
              <span className="detail-value">{user?.prodi || '-'}</span>
            </div>

            <div className="detail-item">
              <span className="datail-label">Role Akses</span>
              <span className="detail-value" style={{ textTransform: 'capitalize' }}>{user?.role || 'PJ'}</span>
            </div>
          </div>

          <button className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--spacing-6)', color: 'var(--color-error)' }}
            onClick={logout}
          >Logout

          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilPJ
