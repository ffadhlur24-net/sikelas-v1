import { useState, useEffect } from 'react'
import { exportToCSV } from '../../utils/exportExcel'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import './PersetujuanReservasi.css'
import {
  HourglassSplit,
  CheckCircleFill,
  XCircleFill,
  ExclamationTriangleFill,
  CardList,
  PrinterFill,
  FileEarmarkSpreadsheetFill,
  X,
  ClockFill,
  ChevronLeft,
  ChevronRight
} from 'react-bootstrap-icons'
function PersetujuanReservasi() {
  const { showSuccess, showError, showWarning } = useToast()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState({
    open: false,
    id: null,
    mataKuliah: '',
    pemohon: '',
    reason: ''
  })
  const [filterStatus, setFilterStatus] = useState('pending') // Default tab
  const [currentTime, setCurrentTime] = useState(new Date())

  // Konfigurasi Paginasi (15 Baris per Halaman)
  const ITEMS_PER_PAGE = 15
  const [currentPage, setCurrentPage] = useState(1)

  // Reset ke halaman 1 saat filter status reservasi berganti
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus])

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
  // Fungsi Cek Apakah Reservasi Sudah Lewat Jam/Tanggal
  const isReservationExpired = (res) => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return res.status === 'pending' && (res.tanggal < todayStr || (res.tanggal === todayStr && res.waktu_mulai <= currentTimeStr))
  }
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reservations')
      setReservations(response.data.reservations || [])
    } catch (error) {
      console.error("Gagal mengambil reservasi:", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchReservations()
  }, [])
  const handleApprove = async (id) => {
    try {
      setActionLoading(true)
      await api.patch(`/reservations/${id}/status`, { status: 'approved' })
      showSuccess('Reservasi berhasil disetujui! Notifikasi in-app dan email telah dikirim ke PJ.', 'RESERVASI DISETUJUI')
      fetchReservations()
    } catch (error) {
      console.error(error)
      showError(error.response?.data?.error || 'Gagal mengubah status reservasi.', 'GAGAL UBAH STATUS')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenRejectModal = (res) => {
    setRejectModal({
      open: true,
      id: res.id,
      mataKuliah: res.mata_kuliah || '-',
      pemohon: `${res.users?.username || 'PJ'} (NIM: ${res.users?.nim_nip || '-'})`,
      reason: ''
    })
  }

  const handleConfirmReject = async (e) => {
    e.preventDefault()
    if (!rejectModal.reason.trim()) {
      showWarning('Alasan penolakan wajib diisi sebelum menolak pengajuan!', 'VALIDASI PENOLAKAN')
      return
    }

    try {
      setActionLoading(true)
      await api.patch(`/reservations/${rejectModal.id}/status`, {
        status: 'rejected',
        alasan_penolakan: rejectModal.reason.trim()
      })
      showSuccess('Pengajuan reservasi telah berhasil ditolak.', 'RESERVASI DITOLAK')
      setRejectModal({ open: false, id: null, mataKuliah: '', pemohon: '', reason: '' })
      fetchReservations()
    } catch (error) {
      console.error(error)
      showError(error.response?.data?.error || 'Gagal menolak status reservasi.', 'GAGAL UBAH STATUS')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter Data Berdasarkan Tab Status
  const filteredReservations = reservations.filter(res => {
    const expired = isReservationExpired(res)
    if (filterStatus === 'pending') return res.status === 'pending' && !expired
    if (filterStatus === 'expired') return expired
    if (filterStatus === 'approved') return res.status === 'approved'
    if (filterStatus === 'rejected') return res.status === 'rejected'
    return true // 'Semua'
  })

  // Perhitungan Paginasi (15 Data per Halaman)
  const totalItems = filteredReservations.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems)
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex)

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === validCurrentPage) return
    setCurrentPage(newPage)
    const tableEl = document.querySelector('.approval-table-card')
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (validCurrentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }
    if (validCurrentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages]
  }
  // Ekspor Excel (.CSV)
  const handleExportExcel = () => {
    const headers = ['ID Tiket', 'Mata Kuliah', 'Ruangan', 'Gedung', 'Pemohon (PJ)', 'NIM', 'Tanggal Peminjaman', 'Jam Perkuliahan', 'Status Reservasi']
    const rows = filteredReservations.map(r => [
      r.id,
      r.mata_kuliah,
      r.rooms?.nama || '-',
      r.rooms?.gedung || '-',
      r.users?.username || '-',
      r.users?.nim_nip || '-',
      r.tanggal,
      `${r.waktu_mulai.substring(0, 5)} - ${r.waktu_selesai.substring(0, 5)} WIB`,
      isReservationExpired(r) ? 'Kadaluarsa' : r.status === 'pending' ? 'Menunggu ACC' : r.status === 'approved' ? 'Disetujui' : 'Ditolak'
    ])
    if (rows.length === 0) {
      showWarning('Tidak ada data reservasi untuk diekspor pada filter ini!', 'DATA KOSONG')
      return
    }
    exportToCSV('Laporan_Reservasi_Kelas', headers, rows)
  }
  const handlePrintPDF = () => {
    window.print()
  }
  const pendingCount = reservations.filter(res => res.status === 'pending' && !isReservationExpired(res)).length
  const approvedCount = reservations.filter(res => res.status === 'approved').length
  const expiredCount = reservations.filter(res => isReservationExpired(res)).length
  return (
    <div className="approval-page animate-fade-in">
      <section className="approval-clock-card">
        <div className="approval-clock-icon" aria-hidden="true"><ClockFill size={20} /></div>
        <div>
          <h2>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {currentTime.toLocaleTimeString('id-ID')}</h2>
        </div>
        <span className="approval-online"><span /> SISTEM ONLINE</span>
      </section>

      <section className="approval-stats-grid" aria-label="Ringkasan reservasi">
        <article className="approval-stat stat-navy"><span>Total Reservasi</span><strong>{reservations.length}</strong></article>
        <article className="approval-stat stat-blue"><span>Menunggu ACC</span><strong>{pendingCount}</strong></article>
        <article className="approval-stat stat-green"><span>Disetujui</span><strong>{approvedCount}</strong></article>
        <article className="approval-stat stat-orange"><span>Kadaluarsa</span><strong>{expiredCount}</strong></article>
      </section>

      <div className="approval-heading">
        <div>
          <p className="approval-eyebrow">ADMINISTRATOR / RESERVATION CONTROL</p>
          <h1>Persetujuan & Log Reservasi</h1>
          <p>Kelola pengajuan peminjaman ruangan oleh PJ Kelas.</p>
        </div>
        <span className="approval-count-badge">{reservations.length} TOTAL</span>
      </div>
      {/* FILTER TAB BAR STATUS RESERVASI */}
      <div className="approval-filter-bar no-print">
        <span className="approval-filter-label">STATUS RESERVASI</span>
        <button
          className={`approval-filter-btn ${filterStatus === 'pending' ? 'is-active status-pending' : ''}`}
          style={{ background: filterStatus === 'pending' ? '#f59e0b' : '#e2e8f0', color: filterStatus === 'pending' ? '#fff' : '#475569', fontWeight: filterStatus === 'pending' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('pending')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><HourglassSplit size={14} /> Menunggu ACC ({reservations.filter(r => r.status === 'pending' && !isReservationExpired(r)).length})</span>
        </button>
        <button
          className={`approval-filter-btn ${filterStatus === 'approved' ? 'is-active status-approved' : ''}`}
          style={{ background: filterStatus === 'approved' ? '#059669' : '#e2e8f0', color: filterStatus === 'approved' ? '#fff' : '#475569', fontWeight: filterStatus === 'approved' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('approved')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircleFill size={14} /> Disetujui ({reservations.filter(r => r.status === 'approved').length})</span>
        </button>
        <button
          className={`approval-filter-btn ${filterStatus === 'rejected' ? 'is-active status-rejected' : ''}`}
          style={{ background: filterStatus === 'rejected' ? '#dc2626' : '#e2e8f0', color: filterStatus === 'rejected' ? '#fff' : '#475569', fontWeight: filterStatus === 'rejected' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('rejected')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><XCircleFill size={14} /> Ditolak ({reservations.filter(r => r.status === 'rejected').length})</span>
        </button>
        <button
          className={`approval-filter-btn ${filterStatus === 'expired' ? 'is-active status-expired' : ''}`}
          style={{ background: filterStatus === 'expired' ? '#6b7280' : '#e2e8f0', color: filterStatus === 'expired' ? '#fff' : '#475569', fontWeight: filterStatus === 'expired' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('expired')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ExclamationTriangleFill size={14} /> Kadaluarsa ({reservations.filter(r => isReservationExpired(r)).length})</span>
        </button>
        <button
          className={`approval-filter-btn ${filterStatus === 'Semua' ? 'is-active status-all' : ''}`}
          style={{ background: filterStatus === 'Semua' ? '#0f172a' : '#e2e8f0', color: filterStatus === 'Semua' ? '#fff' : '#475569', fontWeight: filterStatus === 'Semua' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('Semua')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CardList size={14} /> Semua Reservasi ({reservations.length})</span>
        </button>
      </div>
      {/* TABEL RESERVASI */}
      <div className="approval-table-card">

        {/* TOMBOL EKSPOR & CETAK (DI LUAR TABEL) */}
        <div className="approval-toolbar no-print">
          <div>
            <p className="approval-eyebrow">RESERVATION LOG</p>
            <h2>Daftar Pengajuan</h2>
          </div>
          <div className="approval-toolbar-actions">
            <button className="approval-action-btn" onClick={handlePrintPDF} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><PrinterFill size={14} /> Cetak PDF</button>
            <button className="approval-action-btn" onClick={handleExportExcel} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FileEarmarkSpreadsheetFill size={14} /> Ekspor CSV</button>
          </div>
        </div>
        {/* ELEMEN KOP SURAT KHUSUS CETAK */}
        <div className="print-only">
          <div className="kop-surat">
            <h2>PLATFORM KAMPUS SMART CLASSROOM</h2>
            <h3>LAPORAN REKAPITULASI RESERVASI RUANG KELAS</h3>
            <p>Dokumen Resmi Hasil Ekspor Log Sistem Manajemen Ruangan Kelas</p>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat data reservasi...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px' }}>Mata Kuliah</th>
                <th style={{ padding: '12px 16px' }}>Ruangan & Gedung</th>
                <th style={{ padding: '12px 16px' }}>Pemohon (PJ)</th>
                <th style={{ padding: '12px 16px' }}>Waktu Peminjaman</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }} className="no-print">Aksi Staf</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReservations.length > 0 ? paginatedReservations.map((res) => {
                const expired = isReservationExpired(res)
                return (
                  <tr key={res.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>
                      {res.mata_kuliah}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div><b>Ruang {res.rooms?.nama || 'Dihapus'}</b></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{res.rooms?.gedung} ({res.rooms?.kampus})</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div><b>{res.users?.username || 'PJ'}</b></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>NIM: {res.users?.nim_nip || '-'} ({res.users?.prodi})</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatTanggalIndonesia(res.tanggal)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{res.waktu_mulai.substring(0, 5)} - {res.waktu_selesai.substring(0, 5)} WIB</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {expired ? (
                        <span className="badge badge-error" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><ExclamationTriangleFill size={12} /> Kadaluarsa</span>
                      ) : res.status === 'approved' ? (
                        <span className="badge badge-success" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><CheckCircleFill size={12} /> Disetujui</span>
                      ) : res.status === 'rejected' ? (
                        <div>
                          <span className="badge badge-danger" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><XCircleFill size={12} /> Ditolak</span>
                          {res.alasan_penolakan && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>"{res.alasan_penolakan}"</div>}
                        </div>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><HourglassSplit size={12} /> Menunggu ACC</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }} className="no-print">
                      {res.status === 'pending' && !expired ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            style={{ marginRight: '8px' }}
                            onClick={() => handleApprove(res.id)}
                            disabled={actionLoading}
                          >
                            Setujui
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleOpenRejectModal(res)}
                            disabled={actionLoading}
                          >
                            Tolak
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          disabled={actionLoading}
                          title="Sudah Kadaluarsa"
                        >
                          Sudah Kadaluarsa
                        </button>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada data reservasi pada kategori filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* BILAH KONTROL PAGINASI (HANYA DITAMPILKAN JIKA LEBIH DARI 1 HALAMAN) */}
        {!loading && totalPages > 1 && (
          <div className="approval-pagination no-print">
            <div className="approval-pagination-info">
              Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> pengajuan
            </div>
            <div className="approval-pagination-controls">
              <button
                type="button"
                className="approval-page-btn approval-page-nav-btn"
                onClick={() => handlePageChange(validCurrentPage - 1)}
                disabled={validCurrentPage === 1}
              >
                <ChevronLeft size={13} /> Prev
              </button>

              {getPageNumbers().map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="approval-page-ellipsis">
                      ...
                    </span>
                  )
                }
                return (
                  <button
                    key={page}
                    type="button"
                    className={`approval-page-btn approval-page-num-btn ${validCurrentPage === page ? 'is-active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                type="button"
                className="approval-page-btn approval-page-nav-btn"
                onClick={() => handlePageChange(validCurrentPage + 1)}
                disabled={validCurrentPage === totalPages}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PENOLAKAN NEO-BRUTALIST */}
      {rejectModal.open && (
        <div className="approval-modal-backdrop" role="presentation" onClick={() => setRejectModal({ open: false, id: null, mataKuliah: '', pemohon: '', reason: '' })}>
          <div className="approval-modal-card" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="approval-modal-header">
              <h2 id="reject-modal-title" className="approval-modal-title">
                <XCircleFill size={20} color="#dc2626" /> Penolakan Reservasi
              </h2>
              <button
                type="button"
                className="approval-modal-close"
                onClick={() => setRejectModal({ open: false, id: null, mataKuliah: '', pemohon: '', reason: '' })}
                aria-label="Tutup modal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="approval-modal-info">
              <div><b>Mata Kuliah:</b> {rejectModal.mataKuliah}</div>
              <div><b>Pemohon (PJ):</b> {rejectModal.pemohon}</div>
            </div>

            <form onSubmit={handleConfirmReject}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--approval-ink)' }}>
                Alasan Penolakan:
              </label>
              <textarea
                className="approval-modal-textarea"
                placeholder="Tuliskan alasan penolakan untuk PJ (contoh: Ruangan sedang dialokasikan untuk ujian praktikum)..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                autoFocus
              />

              <div className="approval-modal-actions">
                <button
                  type="button"
                  className="approval-btn approval-btn-cancel"
                  onClick={() => setRejectModal({ open: false, id: null, mataKuliah: '', pemohon: '', reason: '' })}
                  disabled={actionLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="approval-btn approval-btn-reject"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Memproses...' : 'Tolak Reservasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default PersetujuanReservasi