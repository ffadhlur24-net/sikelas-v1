import { useState, useEffect } from 'react'
import { exportToCSV } from '../../utils/exportExcel'
import { sendWANotifications } from '../../utils/waNotification'
import api from '../../api/axios'
import './LogPelaporan.css'

function LogPelaporan() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending') // Default Tab
  const [currentTime, setCurrentTime] = useState(new Date())

  // Modal State
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, subject: '', reason: '' })
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, subject: '' })

  // Real-time Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  const formatClockIndonesia = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
    return date.toLocaleDateString('id-ID', options).replace(' pukul', ' —').replace(/\./g, '.')
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reports')
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Gagal memanggil laporan:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

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

  // Action: ACC / Tolak Laporan
  const handleResolve = async (id, status = 'verified', customReason = '') => {
    let alasan_penolakan = customReason
    if (status === 'rejected' && !alasan_penolakan.trim()) {
      alert('Alasan penolakan wajib diisi!')
      return
    }

    const targetReport = reports.find(r => r.id === id)
    let isWASent = false

    // 1. Kirim Notifikasi WhatsApp Direct Link
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

    // 2. STATUS BERUBAH DI DATABASE
    setActionLoading(true)
    setMessage('')
    try {
      const res = await api.patch(`reports/${id}/resolve`, { status, alasan_penolakan })

      // 3. BUAT NOTIFIKASI IN-APP KE KOTAK MASUK PJ
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
      console.error(error)
      alert('Terjadi kesalahan saat mengirim perubahan laporan')
    } finally {
      setActionLoading(false)
      setRejectModal({ open: false, id: null, subject: '', reason: '' })
      setTimeout(() => setMessage(''), 3500)
    }
  }

  // Action: Hapus Laporan
  const handleDeleteReport = async (id) => {
    setActionLoading(true)
    try {
      await api.delete(`/reports/${id}`)
      setMessage('Laporan berhasil dihapus dari sistem!')
      fetchReports()
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus laporan.')
    } finally {
      setActionLoading(false)
      setDeleteModal({ open: false, id: null, subject: '' })
      setTimeout(() => setMessage(''), 3000)
    }
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
    const headers = ['ID Laporan', 'Jenis Kendala / Alasan', 'Mata Kuliah', 'Ruangan', 'Gedung', 'Tanggal Sesi', 'Pelapor (PJ)', 'NIM', 'Status Laporan']
    const rows = filteredReports.map(r => [
      r.id,
      r.alasan?.replace(/_/g, ' ') || '-',
      r.mata_kuliah || '-',
      r.rooms?.nama || r.room_id || '-',
      r.rooms?.gedung || '-',
      r.tanggal || r.created_at?.split('T')[0] || '-',
      r.users?.username || '-',
      r.users?.nim_nip || '-',
      isReportExpired(r) ? 'Kadaluarsa' : r.status === 'verified' ? 'Disetujui / Kosong' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu ACC'
    ])
    exportToCSV('Laporan_Kelas_Kosong', headers, rows)
  }

  // Print PDF
  const handlePrintPDF = () => {
    window.print()
  }

  const pendingCount = reports.filter(r => r.status === 'pending' && !isReportExpired(r)).length
  const verifiedCount = reports.filter(r => r.status === 'verified').length
  const rejectedCount = reports.filter(r => r.status === 'rejected').length
  const expiredCount = reports.filter(r => isReportExpired(r)).length

  return (
    <div className="log-pelaporan-page">
      {/* 1. Real-time Clock Widget */}
      <section className="neo-clock-card no-print">
        <div className="neo-clock-content">
          <div className="neo-clock-icon-box">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div className="neo-clock-meta">
            <p className="neo-clock-label">Waktu Sistem Server</p>
            <h3 className="neo-clock-time">{formatClockIndonesia(currentTime)}</h3>
          </div>
        </div>
        <div className="neo-system-online-badge">
          <span className="neo-pulse-dot"></span>
          Sistem Online
        </div>
      </section>

      {/* 2. Page Header Title */}
      <header className="neo-page-header">
        <h2 className="neo-page-title">Log Pelaporan PJ</h2>
        <p className="neo-page-subtitle">
          Pusat pemantauan aktivitas laporan kelas kosong, pindah online, dan kendala ruangan.
        </p>
      </header>

      {/* Alert Banner */}
      {message && (
        <div className="neo-alert-banner">
          <span>{message}</span>
          <button
            onClick={() => setMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Filter Bar & Action Tools */}
      <div className="neo-toolbar-card no-print">
        <div className="neo-filter-group">
          <span className="neo-filter-label">Status Laporan:</span>
          <button
            type="button"
            className={`neo-filter-btn ${filterStatus === 'pending' ? 'active-pending' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            🟡 Menunggu ACC ({pendingCount})
          </button>
          <button
            type="button"
            className={`neo-filter-btn ${filterStatus === 'verified' ? 'active-verified' : ''}`}
            onClick={() => setFilterStatus('verified')}
          >
            🟢 Disetujui / Kosong ({verifiedCount})
          </button>
          <button
            type="button"
            className={`neo-filter-btn ${filterStatus === 'rejected' ? 'active-rejected' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            🔴 Ditolak ({rejectedCount})
          </button>
          <button
            type="button"
            className={`neo-filter-btn ${filterStatus === 'expired' ? 'active-expired' : ''}`}
            onClick={() => setFilterStatus('expired')}
          >
            🚨 Kadaluarsa ({expiredCount})
          </button>
          <button
            type="button"
            className={`neo-filter-btn ${filterStatus === 'Semua' ? 'active-all' : ''}`}
            onClick={() => setFilterStatus('Semua')}
          >
            📋 Semua ({reports.length})
          </button>
        </div>

        <div className="neo-action-tools">
          <button type="button" className="neo-tool-btn" onClick={handlePrintPDF}>
            <span className="material-symbols-outlined">print</span>
            Cetak PDF
          </button>
          <button type="button" className="neo-tool-btn" onClick={handleExportExcel}>
            <span className="material-symbols-outlined">description</span>
            Ekspor Excel (.CSV)
          </button>
        </div>
      </div>

      {/* Official Letterhead Header for Print Mode Only */}
      <div className="print-only">
        <div className="kop-surat">
          <h2>PLATFORM KAMPUS SMART CLASSROOM</h2>
          <h3>LAPORAN REKAPITULASI PELAPORAN KELAS KOSONG</h3>
          <p>Dokumen Resmi Hasil Ekspor Log Sistem Manajemen Ruangan Kelas</p>
        </div>
      </div>

      {/* 4. Table Card */}
      <div className="neo-table-card">
        {loading ? (
          <div className="neo-empty-state">
            <div className="neo-empty-icon">
              <span className="material-symbols-outlined animate-spin">sync</span>
            </div>
            <h4 className="neo-empty-title">Memuat Data Laporan...</h4>
            <p className="neo-empty-desc">Sedang menyinkronkan data pelaporan dari server.</p>
          </div>
        ) : (
          <table className="neo-table">
            <thead className="neo-table-head">
              <tr>
                <th style={{ width: '25%' }}>Jenis Kendala</th>
                <th style={{ width: '35%' }}>Detail</th>
                <th style={{ width: '22%' }}>Pelapor (PJ)</th>
                <th style={{ width: '18%' }} className="neo-cell-action no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const targetDate = report.tanggal || report.created_at?.split('T')[0]
                  const expired = isReportExpired(report)
                  const reasonTitle = report.alasan?.replace(/_/g, ' ') || 'DOSEN BERHALANGAN'
                  const sentDate = report.created_at
                    ? new Date(report.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : '-'

                  return (
                    <tr key={report.id} className="neo-table-row">
                      {/* Column 1: Jenis Kendala */}
                      <td className="neo-table-cell">
                        <p className="neo-report-reason">{reasonTitle}</p>
                        <p className="neo-report-time">Dikirim: {sentDate}</p>
                      </td>

                      {/* Column 2: Detail */}
                      <td className="neo-table-cell">
                        <div className="neo-detail-container">
                          <div className="neo-detail-date">
                            <span className="material-symbols-outlined">calendar_today</span>
                            <span>{formatTanggalIndonesia(targetDate)}</span>
                          </div>

                          {/* Status Badge */}
                          {expired ? (
                            <div className="neo-status-badge neo-badge-expired">
                              <span className="material-symbols-outlined">warning</span>
                              KADALUARSA
                            </div>
                          ) : report.status === 'verified' ? (
                            <div className="neo-status-badge neo-badge-verified">
                              <span className="material-symbols-outlined">check_circle</span>
                              DISETUJUI / KOSONG
                            </div>
                          ) : report.status === 'rejected' ? (
                            <div>
                              <div className="neo-status-badge neo-badge-rejected">
                                <span className="material-symbols-outlined">cancel</span>
                                DITOLAK
                              </div>
                              {report.alasan_penolakan && (
                                <p className="neo-reject-note">"{report.alasan_penolakan}"</p>
                              )}
                            </div>
                          ) : (
                            <div className="neo-status-badge neo-badge-pending">
                              <span className="material-symbols-outlined">hourglass_empty</span>
                              MENUNGGU ACC
                            </div>
                          )}

                          <p className="neo-detail-subject">{report.mata_kuliah || 'Mata Kuliah'}</p>

                          <div className="neo-detail-location">
                            <span className="material-symbols-outlined">location_on</span>
                            <span>
                              Ruang: {report.rooms?.nama || report.room_id || '-'} ({report.rooms?.gedung || '-'})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Pelapor (PJ) */}
                      <td className="neo-table-cell">
                        <div className="neo-reporter-box">
                          <p className="neo-reporter-badge-text">Pelapor (PJ)</p>
                          <p className="neo-reporter-name">{report.users?.username || 'PJ Mahasiswa'}</p>
                          <p className="neo-reporter-nim">NIM: {report.users?.nim_nip || '-'}</p>
                        </div>
                      </td>

                      {/* Column 4: Aksi */}
                      <td className="neo-table-cell neo-cell-action no-print">
                        {report.status === 'pending' && !expired ? (
                          <div className="neo-action-buttons">
                            <button
                              type="button"
                              className="neo-btn neo-btn-approve"
                              disabled={actionLoading}
                              title="ACC & Kosongkan Jadwal Kelas"
                              onClick={() => handleResolve(report.id, 'verified')}
                            >
                              ACC
                            </button>
                            <button
                              type="button"
                              className="neo-btn neo-btn-reject"
                              disabled={actionLoading}
                              title="Tolak Pengajuan Laporan"
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  id: report.id,
                                  subject: report.mata_kuliah || 'Mata Kuliah',
                                  reason: ''
                                })
                              }
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="neo-btn neo-btn-delete"
                            disabled={actionLoading}
                            title="Hapus Laporan dari Sistem"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                id: report.id,
                                subject: report.mata_kuliah || 'Mata Kuliah'
                              })
                            }
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="neo-empty-state">
                      <div className="neo-empty-icon">
                        <span className="material-symbols-outlined">inbox</span>
                      </div>
                      <h4 className="neo-empty-title">Tidak Ada Laporan</h4>
                      <p className="neo-empty-desc">
                        Belum ada data laporan kelas kosong pada kategori status "{filterStatus}".
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Modal: Tolak Laporan */}
      {rejectModal.open && (
        <div className="neo-modal-backdrop" onClick={() => setRejectModal({ open: false, id: null, subject: '', reason: '' })}>
          <div className="neo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="neo-modal-header">
              <span className="material-symbols-outlined">cancel</span>
              <h3 className="neo-modal-title">Penolakan Laporan</h3>
            </div>
            <p className="neo-modal-desc">
              Silakan masukkan alasan penolakan laporan kelas kosong untuk mata kuliah <b>{rejectModal.subject}</b>:
            </p>
            <textarea
              className="neo-modal-textarea"
              placeholder="Contoh: Jadwal perkuliahan telah diverifikasi tetap berlangsung tatap muka..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              autoFocus
            />
            <div className="neo-modal-actions">
              <button
                type="button"
                className="neo-btn neo-btn-modal-cancel"
                onClick={() => setRejectModal({ open: false, id: null, subject: '', reason: '' })}
              >
                Batal
              </button>
              <button
                type="button"
                className="neo-btn neo-btn-modal-confirm"
                disabled={actionLoading}
                onClick={() => handleResolve(rejectModal.id, 'rejected', rejectModal.reason)}
              >
                {actionLoading ? 'Memproses...' : 'Tolak Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Konfirmasi Hapus Laporan */}
      {deleteModal.open && (
        <div className="neo-modal-backdrop" onClick={() => setDeleteModal({ open: false, id: null, subject: '' })}>
          <div className="neo-modal-card danger-border" onClick={(e) => e.stopPropagation()}>
            <div className="neo-modal-header">
              <span className="material-symbols-outlined">delete_forever</span>
              <h3 className="neo-modal-title">Konfirmasi Hapus</h3>
            </div>
            <p className="neo-modal-desc">
              Apakah Anda yakin ingin menghapus data laporan untuk <b>{deleteModal.subject}</b> dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="neo-modal-actions">
              <button
                type="button"
                className="neo-btn neo-btn-modal-cancel"
                onClick={() => setDeleteModal({ open: false, id: null, subject: '' })}
              >
                Batal
              </button>
              <button
                type="button"
                className="neo-btn neo-btn-modal-confirm neo-btn-modal-confirm-delete"
                disabled={actionLoading}
                onClick={() => handleDeleteReport(deleteModal.id)}
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogPelaporan