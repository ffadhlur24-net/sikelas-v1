import { useState, useEffect } from 'react'
import { exportToCSV } from '../../untils/exportExcel'
import { sendWANotifications } from '../../untils/waNotification'
import api from '../../api/axios'
function LogPelaporan() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending') // Default Tab
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
  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reports')
      setReports(response.data.reports || [])
    } catch (error) {
      console.error("Gagal memanggil laporan:", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchReports()
  }, [])
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

    const targetReport = reports.find(r => r.id === id)
    let isWASent = false

    // 1. Cobakan Kirim Notifikasi WhatsApp Direct Link
    if (targetReport) {
      const pjPhone = targetReport.users?.no_hp || targetReport.users?.phone || ''
      const pjName = targetReport.users?.username || 'PJ Kelas'
      const matkul = targetReport.mata_kuliah || 'Mata Kuliah'
      const ruang = targetReport.rooms?.nama || targetReport.room_id || '-'

      const msg = status === 'verified'
        ? `🟢 *[SiKelas - Konfirmasi Pelaporan Kelas Kosong]*\n\nHalo *${pjName}*,\nLaporan pengosongan sesi perkuliahan untuk *${matkul}* di Ruang *${ruang}* telah *DISETUJUI & DIVERIFIKASI* oleh Admin.\n\nSlot ruangan telah dibebaskan untuk peminjaman insidental. Terima kasih!`
        : `🔴 *[SiKelas - Penolakan Laporan Kelas Kosong]*\n\nHalo *${pjName}*,\nLaporan pengosongan kelas untuk *${matkul}* *DITOLAK* oleh Admin.\n\n📌 *Alasan Penolakan:*\n"${alasan_penolakan}"\n\nTerima kasih!`

      isWASent = sendWANotifications({ phone: pjPhone, message: msg })
    }

    // 2. STATUS TETAP BERUBAH DI DATABASE (TIDAK DIBATALKAN)
    setActionLoading(true)
    setMessage('')
    try {
      const res = await api.patch(`reports/${id}/resolve`, { status, alasan_penolakan })
      
      // ⚡ 3. BUAT NOTIFIKASI IN-APP KE KOTAK MASUK PJ (DENGAN WA FALLBACK WARNING JIKA WA GAGAL)
      if (targetReport?.user_id) {
        try {
          const waNote = !isWASent ? ' (⚠️ WhatsApp gagal terkirim karena nomor HP tidak valid/terdaftar. Silakan perbarui nomor di Profil)' : ''
          await api.post('/notifications', {
            user_id: targetReport.user_id,
            title: status === 'verified' ? '🟢 Laporan Kelas Kosong Disetujui' : '🔴 Laporan Kelas Kosong Ditolak',
            message: (status === 'verified'
              ? `Laporan pengosongan sesi perkuliahan untuk ${targetReport.mata_kuliah} di Ruang ${targetReport.rooms?.nama || targetReport.room_id} telah disetujui Admin.`
              : `Laporan pengosongan sesi kelas untuk ${targetReport.mata_kuliah} ditolak dengan alasan: "${alasan_penolakan}"`) + waNote,
            type: status === 'verified' ? 'success' : 'danger'
          })
        } catch (notifErr) {
          console.error('Gagal membuat notifikasi in-app:', notifErr)
        }
      }

      setMessage(res.data.message || 'Status laporan berhasil diperbarui!')
      fetchReports()
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim perubahan laporan")
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }
  const handleDeleteReport = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini dari sistem?')) return
    setActionLoading(true)
    try {
      await api.delete(`/reports/${id}`)
      setMessage('Laporan berhasil dihapus!')
      fetchReports()
    } catch (error) {
      alert('Gagal menghapus laporan.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 2000)
    }
  }
  // Cek Tanggal Hari Ini untuk Kadaluarsa
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nowStr = `${yyyy}-${mm}-${dd}`
  const isReportExpired = (report) => {
    const targetDate = report.tanggal || report.created_at?.split('T')[0]
    return report.status === 'pending' && targetDate < nowStr
  }
  // Filter Data Berdasarkan Tab Status
  const filteredReports = reports.filter(r => {
    const expired = isReportExpired(r)
    if (filterStatus === 'pending') return r.status === 'pending' && !expired
    if (filterStatus === 'expired') return expired
    if (filterStatus === 'verified') return r.status === 'verified'
    if (filterStatus === 'rejected') return r.status === 'rejected'
    return true // 'Semua'
  })

  // Ekspor Excel (.CSV)
  const handleExportExcel = () => {
    const headers = ['ID Laporan', 'Jenis Kendala / Alasan', 'Mata Kuliah', 'Ruangan', 'Gedung', 'Tanggal Sesi', 'Pelapor (PJ)', 'Status Laporan']
    const rows = filteredReports.map(r => [
      r.id,
      r.alasan?.replace(/_/g, ' ') || '-',
      r.mata_kuliah || '-',
      r.rooms?.nama || r.room_id || '-',
      r.rooms?.gedung || '-',
      r.tanggal || r.created_at?.split('T')[0] || '-',
      r.users?.username || '-',
      isReportExpired(r) ? 'Kadaluarsa' : r.status === 'verified' ? 'Disetujui / Kosong' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu ACC'
    ])
    exportToCSV('Laporan_Kelas_Kosong', headers, rows)
  }
  const handlePrintPDF = () => {
    window.print()
  }
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📌 Log Pelaporan Kelas Kosong</h1>
        <p className="page-subtitle">Pusat pemantauan dan persetujuan pengosongan sesi kelas akibat dosen berhalangan hadir.</p>
      </div>
      {message && (
        <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>
          {message}
        </div>
      )}
      {/* 📌 FILTER TAB BAR STATUS LAPORAN */}
      <div className="card-flat no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>📌 Status Laporan:</span>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'pending' ? '#f59e0b' : '#e2e8f0', color: filterStatus === 'pending' ? '#fff' : '#475569', fontWeight: filterStatus === 'pending' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('pending')}
        >
          🟡 Menunggu ACC ({reports.filter(r => r.status === 'pending' && !isReportExpired(r)).length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'verified' ? '#059669' : '#e2e8f0', color: filterStatus === 'verified' ? '#fff' : '#475569', fontWeight: filterStatus === 'verified' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('verified')}
        >
          🟢 Disetujui / Kosong ({reports.filter(r => r.status === 'verified').length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'rejected' ? '#dc2626' : '#e2e8f0', color: filterStatus === 'rejected' ? '#fff' : '#475569', fontWeight: filterStatus === 'rejected' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('rejected')}
        >
          🔴 Ditolak ({reports.filter(r => r.status === 'rejected').length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'expired' ? '#6b7280' : '#e2e8f0', color: filterStatus === 'expired' ? '#fff' : '#475569', fontWeight: filterStatus === 'expired' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('expired')}
        >
          🚨 Kadaluarsa ({reports.filter(r => isReportExpired(r)).length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'Semua' ? '#0f172a' : '#e2e8f0', color: filterStatus === 'Semua' ? '#fff' : '#475569', fontWeight: filterStatus === 'Semua' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('Semua')}
        >
          📋 Semua Laporan ({reports.length})
        </button>
      </div>
      {/* TABEL LOG LAPORAN */}
      <div className="card-flat" style={{ overflowX: 'auto', background: '#fff', padding: '20px', borderRadius: '12px' }}>

        {/* TOMBOL EKSPOR & CETAK (DI LUAR TABEL) */}
        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '16px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrintPDF}>🖨️ Cetak PDF Resmi</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>📊 Ekspor Excel (.CSV)</button>
        </div>
        {/* ELEMEN KOP SURAT KHUSUS CETAK */}
        <div className="print-only">
          <div className="kop-surat">
            <h2>PLATFORM KAMPUS SMART CLASSROOM</h2>
            <h3>LAPORAN REKAPITULASI PELAPORAN KELAS KOSONG</h3>
            <p>Dokumen Resmi Hasil Ekspor Log Sistem Manajemen Ruangan Kelas</p>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat data laporan...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px' }}>Jenis Kendala</th>
                <th style={{ padding: '12px 16px' }}>Detail Mata Kuliah & Ruang</th>
                <th style={{ padding: '12px 16px' }}>Tanggal Sesi</th>
                <th style={{ padding: '12px 16px' }}>Pelapor (PJ)</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }} className="no-print">Aksi Staf</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? filteredReports.map((report) => {
                const targetDate = report.tanggal || report.created_at?.split('T')[0]
                const expired = isReportExpired(report)
                return (
                  <tr key={report.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{report.alasan?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Dikirim: {new Date(report.created_at).toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600' }}>{report.mata_kuliah}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        📍 Ruang: <b>{report.rooms?.nama || report.room_id}</b> ({report.rooms?.gedung || '-'})
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        📅 {formatTanggalIndonesia(targetDate)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div><b>{report.users?.username || 'PJ Mahasiswa'}</b></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>NIM: {report.users?.nim_nip || '-'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {expired ? (
                        <span className="badge badge-error" style={{ fontSize: '12px' }}>🚨 Kadaluarsa</span>
                      ) : report.status === 'verified' ? (
                        <span className="badge badge-success" style={{ fontSize: '12px' }}>🟢 Disetujui / Kosong</span>
                      ) : report.status === 'rejected' ? (
                        <div>
                          <span className="badge badge-danger" style={{ fontSize: '12px' }}>🔴 Ditolak</span>
                          {report.alasan_penolakan && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>"{report.alasan_penolakan}"</div>}
                        </div>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '12px' }}>🟡 Menunggu ACC</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }} className="no-print">
                      {report.status === 'pending' && !expired ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            style={{ marginRight: '6px' }}
                            disabled={actionLoading}
                            onClick={() => handleResolve(report.id, 'verified')}>
                            ACC & Kosongkan
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
                          className="btn btn-sm btn-secondary"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          disabled={actionLoading}
                          onClick={() => handleDeleteReport(report.id)}>
                          🗑️ Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada data laporan kelas kosong pada kategori filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
export default LogPelaporan