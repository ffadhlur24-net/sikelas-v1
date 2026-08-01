import { useState, useEffect } from 'react'
import api from '../../api/axios'

function LogPelaporan() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  const formatTanggalIndonesia = (dateString) => {
    if (!dateString) return '-'

    // Ambil YYYY-MM-DD saja
    const cleanDate = dateString.split('T')[0]
    const parts = cleanDate.split('-')

    if (parts.length === 3) {
      const year = parts[0]
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)

      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

      const dateObj = new Date(year, monthIdx, day)
      const hari = namaHari[dateObj.getDay()]
      const bulan = namaBulan[monthIdx]

      return `${hari}, ${day} ${bulan} ${year}`
    }

    return dateString
  }
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
  const handleResolve = async (id, status = "verified") => {
    let alasan_penolakan = ''
    if (status === "rejected") {
      alasan_penolakan = prompt('Masukan alasan penolakan laporan ini:')
      if (alasan_penolakan === null) return
      if (!alasan_penolakan.trim()) {
        alert('Alasan penolakan wajib diisi!')
        return
      }
    }
    setLoading(true)
    setMessage('')
    try {
      await api.patch(`reports/${id}/resolve`, { status, alasan_penolakan })
      setMessage(res.data.message || 'Laporan berhasil ditandai sebagai selesai!')
      fetchReports() // Update tabel
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim laporan")
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 2000)
    }
  }

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Hapus laporan kadaluarsa ini dari tabel?')) return
    setActionLoading(true)
    try {
      const res = await api.delete(`/reports/${id}`)
      setMessage('Laporan kadaluarsa berhasil dihapus!')
      fetchReports()
    } catch (error) {
      alert('Gagal menghapus laporan.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 2000)
    }
  }
  const pendingReports = reports.filter(r => r.status === 'pending')
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nowStr = `${yyyy}-${mm}-${dd}`


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
              {pendingReports.length > 0 ? pendingReports.map((report) => {
                const targetDate = report.tanggal || report.created_at?.split('T')[0]
                const isUpcoming = targetDate >= nowStr
                return (
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{report.alasan?.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-muted">Dikirim: {new Date(report.created_at).toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600' }}>{report.mata_kuliah}</div>
                      <div className="text-sm text-muted">📍 Ruang: <b>{report.rooms?.nama || report.room_id}</b> ({report.rooms?.gedung || '-'})</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: isUpcoming ? '#059669' : '#dc2626' }}>
                        📅 {formatTanggalIndonesia(targetDate)}
                      </div>
                      <span className="badge" style={{
                        background: isUpcoming ? '#d1fae5' : '#fee2e2',
                        color: isUpcoming ? '#065f46' : '#991b1b',
                        marginTop: '4px', display: 'inline-block'
                      }}>
                        {isUpcoming ? '🟢 Pertemuan Mendatang' : '🚨 Kadaluarsa'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div><b>{report.users?.username || 'PJ Mahasiswa'}</b></div>
                      <div className="text-sm text-muted">NIM: {report.users?.nim_nip || '-'}</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {isUpcoming ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            style={{ marginRight: '6px' }}
                            disabled={actionLoading}
                            onClick={() => handleResolve(report.id, 'verified')}>
                            ACC & Kosongkan Ruang
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading}
                            onClick={() => handleResolve(report.id, 'rejected')}>
                            Tolak
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={actionLoading}
                          onClick={() => handleDeleteReport(report.id)}>
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                )
              }) : (
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
