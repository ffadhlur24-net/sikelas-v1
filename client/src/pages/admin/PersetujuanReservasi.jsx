import { useState, useEffect, Suspense } from 'react'
import api from '../../api/axios'

function PersetujuanReservasi() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')


  // 1. Fungsi mengmabil data reservasi dari backend
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reservations')
      setReservations(response.data.reservations)
    } catch (error) {
      console.error("Gagal mengambil reservasi:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])
  // 2. Fungsi untuk mengubah status reservasi
  const handleAction = async (id, action) => {
    setActionLoading(true)
    setMessage('')

    try {
      // aksi bernilai 'approve' atau 'reject'
      await api.patch(`/reservations/${id}/${action}`)

      setMessage(`Reservasi berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}!`)

      // Ambil ulang data terbaru setelah diubah statusnya
      fetchReservations()
    } catch (error) {
      console.error('Gagal mengambil reservasi:', error)
    } finally {
      setActionLoading(false)
      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setMessage(''), 3000)
    }
  }
  // 3. Filter untuk melihat reservasi yang masih pending
  const pendingReservations = reservations.filter(r => r.status === 'pending')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Persetujuan Reservasi</h1>
        <p className="subtitle">Daftar pengajuan peminjaman kelas yang menunggu Persetujuan Anda.</p>
      </div>

      {message && (
        <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat data...</div>
      ) : (
        <div className="card-flat" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Mata Kuliah</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Ruangan</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Pemohon (PJ)</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Waktu</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {pendingReservations.length > 0 ? pendingReservations.map((res) => (
                <tr key={res.id} style={{ borderBottom: '1px solid var(--border-color)' }}>

                  {/* res.room.nama berisi nama dari tabel relasi rooms */}
                  <td style={{ padding: '16px' }}>{res.rooms?.nama || 'Ruang Dihapus'}</td>

                  <td style={{ padding: '16px' }}>
                    <div>{res.users?.nama}</div>
                    <div className="text-sm text-muted">{res.users?.nim}</div>
                  </td>

                  <td style={{ padding: '16px' }}>
                    <div>{res.tanggal}</div>
                    <div className="text-sm text-muted">{res.waktu_mulai} - {res.waktu_selesai}</div>
                  </td>

                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleAction(res.id, 'approve')}>
                        Setuju
                      </button>

                      <button className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-error)' }}
                        disabled={actionLoading}
                        onClick={() => handleAction(res.id, 'reject')}>
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Hore! Tidak ada pengajuan reservasi yang menunggu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PersetujuanReservasi
