import { useState, useEffect } from 'react'
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
  const handleAction = async (id, status) => {
    let alasan_penolakan = '';

    if (status === 'rejected') {
      alasan_penolakan = prompt('Masukan alasan penolakan reservasi ini:');
      if (alasan_penolakan === null) return;
      if (!alasan_penolakan.trim()) {
        alert('Alasan penolakan wajib diisi!');
        return
      }
    }

    try {
      setActionLoading(true)
      await api.patch(`/reservations/${id}/status`, { status, alasan_penolakan });
      fetchReservations();
    } catch (error) {
      console.error(error);
      alert('Gagal mengubah status reservasi.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage('', 3000))
    }
  }
  // 3. Filter untuk melihat reservasi yang masih pending
  const pendingReservations = reservations.filter(r => r.status === 'pending')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Persetujuan Reservasi</h1>
        <p className="subtitle">Daftar pengajuan peminjaman kelas yang menunggu persetujuan Anda.</p>
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
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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

                  {/* Mata Kuliah */}
                  <td style={{ padding: '16px', fontWeight: '600' }}>{res.mata_kuliah}</td>
                  {/* Ruangan */}
                  <td style={{ padding: '16px' }}>
                    <div>{res.rooms?.nama || 'Ruang Dihapus'}</div>
                    <div className="text-sm text-muted">{res.rooms?.gedung}</div>
                  </td>
                  {/* Pemohon (PJ) */}
                  <td style={{ padding: '16px' }}>
                    <div>{res.users?.username || 'PJ Tidak Ditemukan'}</div>
                    <div className="text-sm text-muted">NIM: {res.users?.nim_nip || '-'}</div>
                  </td>
                  {/* Waktu */}
                  <td style={{ padding: '16px' }}>
                    <div>{res.tanggal}</div>
                    <div className="text-sm text-muted">{res.waktu_mulai.substring(0, 5)} - {res.waktu_selesai.substring(0, 5)}</div>
                  </td>
                  {/* Aksi */}
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleAction(res.id, 'approved')}>
                        Setuju
                      </button>
                      <button className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-error)' }}
                        disabled={actionLoading}
                        onClick={() => handleAction(res.id, 'rejected')}>
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
