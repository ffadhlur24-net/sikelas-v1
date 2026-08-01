import { useContext, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
import '../pj/ProfilPJ.css'

function ProfilAdmin() {
  const { user, logout } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [message, setMessage] = useState('')


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
      {/* PUSAT PENELIHARAAN SISTEM */}
      <div className="card-flat">
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
              {/* Apakah Anda yakin ingin membersihkan seluruh data PJ, reservasi, dan jadwal SIAKAD semester ini? <br /> */}
              Gak usah dicoba dulu, capek nyuntik data terus ke supabase
            </p>
            <form onSubmit={handleReset}>
              <input
                type="text"
                className="input-field"
                style={{ marginBottom: '16px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px' }}
                placeholder="GAK-USAH-DICOBA"
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
    </div>
  )
}

export default ProfilAdmin
