import { useState, useEffect } from 'react'
import api from '../../api/axios'

function LogPelaporan() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 1. Fungsi memanggil data laporan dari backend
  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reports')
      setReports(response.data.reports)
    } catch (error) {
      console.error("Gagal memanggil laporan:", error)
    } finally {
      setLoading(false)

    }
  }
  useEffect(() => {
    fetchReports()
  }, [])

  // 2. Fungsi untuk menandai laporan sebagai "selesai" 
  const handleResolve = async (id) => {
    setLoading(true)
    setMessage('')
    try {
      await api.patch(`reports/${id}/resolve`)
      setMessage('Laporan berhasil ditandai sebagai selesai!')
      fetchReports() // Update tabel
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim laporan")
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // filter laporan yang belum diselesaikan
  const pendingReports = reports.filter(r => r.status === 'pending')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Log Pelaporan PJ</h1>
        <p className="page-subtitle">Pusat pemantauan aktivitas laporan kelas kosong, pindah online, dan kendala ruangan.</p>
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
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Jenis Kendala</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Detail</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Pelapor (PJ)</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingReports.length > 0 ? pendingReports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500' }}>{report.alasan.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted">{new Date(report.created_at).toLocaleString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>{report.mata_kuliah}</div>
                    <div className="text-sm text-muted">Ruang: {report.rooms?.nama || 'Dihapus'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>{report.users?.nama || 'Anonim'}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                      disabled={actionLoading}
                      onClick={() => handleResolve(report.id)}
                    >
                      Tandai Selesai
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Semua aman terkendali! Tidak ada laporan baru.
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

export default LogPelaporan
