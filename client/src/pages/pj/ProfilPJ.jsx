import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
import './ProfilPJ.css'

function ProfilPJ() {
  // Ambil data user yang usdah login dari Context
  const { user, logout } = useContext(AuthContext)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)

  // Mengambil data reservasi milik PJ ini
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reservations')
      setReservations(res.data.reservations || [])
    } catch (error) {
      console.error("Gagal memuat reservasi:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])



  // Fungsi untuk mendapatkan 2 huruf pertama dari nama(untuk Afatar)
  const getInitials = (name) => {
    if (!name) return 'pj'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const handleCheckIn = async (id) => {
    try {
      await api.patch(`/reservations/${id}/checkin`)
      alert('Berhasil Check-In! Ruangan Siap digunakan.')
      fetchReservations()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal check-in')
    }
  }

  return (
    <div className='animate-fade-in'>
      <div className='page-header'>
        <h1 className='page-title'>Profil Saya & Reservasi Saya</h1>
        <p className='page-subtitle'>Kelola data Anda dan lakukan Check-In untuk ruangan yang disetujui.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* kolom kiri: Profil */}
        <div className='profile-card card-flat' style={{ height: 'fit-content' }}>
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

        {/* Kolom Kanan: Riwayat Reservasi dan check-in*/}
        <div className="card-flat">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Riwayat Reservasi Saya</h2>
          {loading ? (
            <p>Memuat riwayat...</p>
          ) : reservations.length === 0 ? (
            <p style={{ color: 'gray' }}>Anda belum memiliki riwayat reservasi ruangan.</p>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reservations.map(res => (
                <div key={res.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{res.mata_kuliah}</h3>
                    {res.status === 'pending' && <span className="badge badge-warning">Menunggu</span>}
                    {res.status === 'rejected' && <span className="badge badge-error">Ditolak</span>}
                    {res.status === 'expired' && <span className="badge badge-error">Hangus (Ghosting)</span>}
                    {res.status === 'approved' && !res.is_checked_in && <span className="badge badge-success">Disetujui (Belum Check-In)</span>}
                    {res.status === 'approved' && res.is_checked_in && <span className="badge badge-success" style={{ background: '#10b981', color: 'white' }}>Sudah Check-In</span>}
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>
                    Ruang {res.rooms?.nama} ({res.rooms?.gedung}) <br />
                    Tanggal: {res.tanggal} | Waktu: {res.waktu_mulai} - {res.waktu_selesai}
                  </p>

                  {/* TOMBOL CHECK IN MUNCUL JIKA STATUS APPROVED & BELUM CHECK IN */}
                  {res.status === 'approved' && !res.is_checked_in && (
                    <button
                      onClick={() => handleCheckIn(res.id)}
                      className="btn btn-primary"
                      style={{ marginTop: '12px', width: '100%', background: '#3b82f6' }}
                    >
                      📍 Check-In Sekarang
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilPJ
