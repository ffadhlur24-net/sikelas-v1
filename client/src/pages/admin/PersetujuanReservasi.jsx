import { useState, useEffect } from 'react'
import api from '../../api/axios'

function PersetujuanReservasi() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')


  const formatTanggalIndonesia = (dateString) => {
    if (!dateString) return '-'
    const cleanDate = dateString.split('T')[0]
    const parts = cleanDate.split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const dateObj = new Date(year, monthIdx, day)
      return `${namaHari[dateObj.getDay()]}, ${day} ${namaBulan[monthIdx]} ${year}`
    }
    return dateString
  }

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

  const handleDeleteReservation = async (id) => {
    if (!window.confirm('Hapus pengajuan reservasi basi ini dari tabel?')) return
    setActionLoading(true)
    try {
      await api.delete(`/reservations/${id}`)
      setMessage('Reservasi berhasil dihapus dari tabel.')
      fetchReservations()
    } catch (error) {
      console.error('Gagal menghapus reservasi: ', error)
      alert('Gagal menghapus reservasi.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 2000)
    }
  }
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
              {pendingReservations.length > 0 ? pendingReservations.map((res) => {
                const now = new Date()
                const yyyy = now.getFullYear()
                const mm = String(now.getMonth() + 1).padStart(2, '0')
                const dd = String(now.getDate()).padStart(2, '0')
                const todayStr = `${yyyy}-${mm}-${dd}`
                const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

                // Cek apakah reservasi sudah basi/kadaluarsa
                const isExpired = res.tanggal < todayStr || (res.tanggal === todayStr && res.waktu_mulai <= currentTimeStr)
                return (
                  <tr key={res.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>
                      {res.mata_kuliah}
                      {isExpired && (
                        <span style={{ display: 'block', color: '#dc2626', fontSize: '11px', marginTop: '2px', fontWeight: 'bold' }}>
                          🚨 Kadaluarsa / Lewat Jam
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>{res.rooms?.nama || 'Ruang Dihapus'}</div>
                      <div className="text-sm text-muted">{res.rooms?.gedung}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>{res.users?.username || 'PJ Tidak Ditemukan'}</div>
                      <div className="text-sm text-muted">NIM: {res.users?.nim_nip || '-'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatTanggalIndonesia(res.tanggal)}</div>
                      <div className="text-sm text-muted">{res.waktu_mulai.substring(0, 5)} - {res.waktu_selesai.substring(0, 5)} WIB</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {!isExpired ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            style={{ marginRight: '8px' }}
                            onClick={() => handleAction(res.id, 'approved')}
                            disabled={actionLoading}
                          >
                            Setujui
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(res.id, 'rejected')}
                            disabled={actionLoading}
                          >
                            Tolak
                          </button>
                        </>
                      ) : (
                        /* TOMBOL HAPUS ROW EXPIRED 🗑️ */
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={actionLoading}
                          onClick={() => handleDeleteReservation(res.id)}
                          title="Hapus reservasi kadaluarsa dari tabel"
                        >
                          🗑️ Hapus Expired
                        </button>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nyantai dulu boss, tidak ada pengajuan reservasi yang menunggu.
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
