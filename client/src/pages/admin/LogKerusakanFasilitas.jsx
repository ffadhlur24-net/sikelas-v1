import { useState, useEffect } from 'react'
import { exportToCSV } from '../../utils/exportExcel'
import api from '../../api/axios'
import './LogKerusakanFasilitas.css'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/Modal/ConfirmModal'
import NeoSelect from '../../components/Select/NeoSelect'
import {
  WrenchAdjustable,
  HourglassSplit,
  Tools,
  CheckCircleFill,
  CardList,
  PrinterFill,
  FileEarmarkSpreadsheetFill,
  LockFill,
  InboxFill,
  ChevronLeft,
  ChevronRight,
  CalendarEventFill,
  GeoAltFill,
  ClockFill
} from 'react-bootstrap-icons'

function LogKerusakanFasilitas() {
    const { showSuccess, showError, showWarning } = useToast()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('pending')
    const [confirmModal, setConfirmModal] = useState({ open: false, roomId: null, roomName: '', loading: false })
    const [currentTime, setCurrentTime] = useState(new Date())

    // Real-time Clock Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Paginasi Setup
    const ITEMS_PER_PAGE = 10
    const [currentPage, setCurrentPage] = useState(1)

    const fetchReports = async () => {
        try {
            setLoading(true)
            const res = await api.get('/facility-reports')
            setReports(res.data.reports || [])
        } catch (err) {
            console.error('Gagal mengambil log kerusakan:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [])

    // Reset pagination to page 1 whenever filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filterStatus])

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/facility-reports/${id}/status`, { status })
            showSuccess('Status tiket kerusakan berhasil diperbarui!', 'STATUS TIKET')
            fetchReports()
        } catch (err) {
            showError(err.response?.data?.error || 'Gagal memperbarui status tiket.', 'STATUS TIKET')
        }
    }

    const handleLockRoom = (roomId, roomName) => {
        setConfirmModal({
            open: true,
            roomId,
            roomName: roomName || 'ini',
            loading: false
        })
    }

    const handleConfirmLockRoom = async () => {
        const { roomId, roomName } = confirmModal
        setConfirmModal(prev => ({ ...prev, loading: true }))
        try {
            await api.patch(`/rooms/${roomId}/status`, { status: 'terkunci' })
            showSuccess(`Ruang ${roomName} berhasil DIKUNCI! Ruangan dinonaktifkan sementara.`, 'KUNCI RUANGAN')
            setConfirmModal({ open: false, roomId: null, roomName: '', loading: false })
            fetchReports()
        } catch (err) {
            showError(err.response?.data?.error || 'Gagal mengunci ruangan.', 'KUNCI RUANGAN')
            setConfirmModal(prev => ({ ...prev, loading: false }))
        }
    }

    const filteredReports = filterStatus === 'Semua'
        ? reports
        : reports.filter(r => r.status === filterStatus)

    // Perhitungan Ringkasan Statistik
    const pendingCount = reports.filter(r => r.status === 'pending').length
    const progressCount = reports.filter(r => r.status === 'in_progress').length
    const resolvedCount = reports.filter(r => r.status === 'resolved').length

    // Perhitungan Paginasi
    const totalItems = filteredReports.length
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems)
    const paginatedReports = filteredReports.slice(startIndex, endIndex)

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === validCurrentPage) return
        setCurrentPage(newPage)
        const tableEl = document.querySelector('.damage-table-card')
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

    const formatClockIndonesia = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
        return date.toLocaleDateString('id-ID', options).replace(' pukul', ' —').replace(/\./g, '.')
    }

    const formatTanggalIndonesia = (dateString) => {
        if (!dateString) return '-'
        const dateObj = new Date(dateString)
        if (isNaN(dateObj.getTime())) return dateString
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        return `${namaHari[dateObj.getDay()]}, ${dateObj.getDate()} ${namaBulan[dateObj.getMonth()]} ${dateObj.getFullYear()}`
    }

    const handleExportExcel = () => {
        const headers = ['ID Tiket', 'Kampus', 'Gedung', 'Ruangan', 'Kategori', 'Rincian Kerusakan', 'Pelapor (PJ)', 'Prodi', 'Status Penanganan', 'Tanggal Lapor']
        const rows = filteredReports.map(r => {
            const reporter = r.reporter || r.users || {}
            return [
                r.id,
                r.rooms?.kampus || 'Kampus 3',
                r.rooms?.gedung || '-',
                r.rooms?.nama || '-',
                r.kategori,
                r.rincian,
                reporter.username || '-',
                reporter.prodi || '-',
                r.status === 'pending' ? 'Menunggu' : r.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Selesai',
                new Date(r.created_at).toLocaleDateString('id-ID')
            ]
        })
        if (rows.length === 0) {
            showWarning('Tidak ada data kerusakan untuk diekspor pada kategori filter ini!', 'DATA KOSONG')
            return
        }
        exportToCSV('Laporan_Kerusakan_Fasilitas', headers, rows)
    }

    const handlePrintPDF = () => {
        window.print()
    }

    const statusSelectOptions = [
        { value: 'pending', label: '⏳ Menunggu Perbaikan' },
        { value: 'in_progress', label: '🛠️ Sedang Dikerjakan' },
        { value: 'resolved', label: '✅ Selesai Diperbaiki' }
    ]

    return (
        <div className="damage-log-page animate-fade-in">
            {/* 1. Real-time Clock Micro-Chip Status Bar */}
            <section className="damage-clock-card no-print">
                <div className="damage-clock-content">
                    <div className="damage-clock-icon" aria-hidden="true"><ClockFill size={18} /></div>
                    <div className="damage-clock-meta">
                        <p className="damage-clock-eyebrow">SERVER TIME &bull; REALTIME</p>
                        <h2>{formatClockIndonesia(currentTime)}</h2>
                    </div>
                </div>
                <span className="damage-online"><span /> SISTEM ONLINE</span>
            </section>

            {/* 2. Ringkasan Statistik Sistem */}
            <section className="damage-stats-grid no-print" aria-label="Ringkasan kerusakan fasilitas">
                <article className="damage-stat stat-navy"><span>Total Tiket</span><strong>{reports.length}</strong></article>
                <article className="damage-stat stat-orange"><span>Menunggu</span><strong>{pendingCount}</strong></article>
                <article className="damage-stat stat-blue"><span>Dikerjakan</span><strong>{progressCount}</strong></article>
                <article className="damage-stat stat-green"><span>Selesai</span><strong>{resolvedCount}</strong></article>
            </section>

            {/* 3. Page Header */}
            <div className="damage-log-heading">
                <p className="damage-eyebrow">ADMINISTRATOR / FACILITY INCIDENTS</p>
                <h1><span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", marginRight: "10px" }}><WrenchAdjustable size={30} /></span>Log Kerusakan Fasilitas Kampus</h1>
                <p>Kelola perbaikan sarana kelas dan kunci ruangan jika terjadi kerusakan parah.</p>
            </div>

            {/* 4. Filter Status Penanganan (Swipeable di Mobile) */}
            <div className="damage-filter-bar no-print">
                <span className="damage-filter-label">Status Tiket:</span>
                <div className="damage-filter-scroll-wrapper">
                    <button
                        type="button"
                        className={`damage-filter-btn ${filterStatus === 'pending' ? 'is-active status-pending' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><HourglassSplit size={14} /> Menunggu ({pendingCount})</span>
                    </button>

                    <button
                        type="button"
                        className={`damage-filter-btn ${filterStatus === 'in_progress' ? 'is-active status-progress' : ''}`}
                        onClick={() => setFilterStatus('in_progress')}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Tools size={14} /> Sedang Dikerjakan ({progressCount})</span>
                    </button>

                    <button
                        type="button"
                        className={`damage-filter-btn ${filterStatus === 'resolved' ? 'is-active status-resolved' : ''}`}
                        onClick={() => setFilterStatus('resolved')}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CheckCircleFill size={14} /> Selesai ({resolvedCount})</span>
                    </button>

                    <button
                        type="button"
                        className={`damage-filter-btn ${filterStatus === 'Semua' ? 'is-active status-all' : ''}`}
                        onClick={() => setFilterStatus('Semua')}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CardList size={14} /> Semua ({reports.length})</span>
                    </button>
                </div>
            </div>

            {/* 5. Tabel Log Tiket (Dual Layout: Desktop Table & Mobile Cards) */}
            <div className="damage-table-card">
                <div className="damage-toolbar no-print">
                    <button type="button" className="damage-action-btn" onClick={handlePrintPDF} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><PrinterFill size={14} /> Cetak PDF</button>
                    <button type="button" className="damage-action-btn" onClick={handleExportExcel} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FileEarmarkSpreadsheetFill size={14} /> Ekspor Excel (.CSV)</button>
                </div>

                {/* ELEMEN KOP SURAT KHUSUS CETAK */}
                <div className="print-only">
                    <div className="kop-surat">
                        <h2>PLATFORM KAMPUS SMART CLASSROOM</h2>
                        <h3>LAPORAN REKAPITULASI KERUSAKAN FASILITAS & SARPRAS</h3>
                        <p>Dokumen Resmi Hasil Ekspor Log Sistem Manajemen Ruangan Kelas</p>
                    </div>
                </div>

                {loading ? (
                    <div className="damage-empty-state">
                        <div className="damage-empty-icon" aria-hidden="true"><HourglassSplit size={32} /></div>
                        <p>Memuat data tiket kerusakan...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="damage-empty-state">
                        <div className="damage-empty-icon" aria-hidden="true"><InboxFill size={32} /></div>
                        <p>Belum ada laporan kerusakan fasilitas pada kategori ini.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="damage-table-wrapper">
                            <table className="damage-table">
                                <thead className="damage-table-head">
                                    <tr>
                                        <th style={{ width: '28%' }}>Kategori & Rincian</th>
                                        <th style={{ width: '30%' }}>Detail Ruangan</th>
                                        <th style={{ width: '22%' }}>Pelapor (PJ)</th>
                                        <th style={{ width: '20%' }} className="no-print">Status & Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReports.map((item) => {
                                        const reporter = item.reporter || item.users || {}
                                        const reporterName = reporter.username || 'PJ Mahasiswa'
                                        const reporterProdi = reporter.prodi || '-'
                                        const reporterNim = reporter.nim_nip || (reporter.email ? reporter.email.split('@')[0] : null) || '-'

                                        return (
                                            <tr key={item.id} className="damage-table-row">
                                                {/* Kolom 1: Kategori & Rincian Kerusakan */}
                                                <td className="damage-table-cell">
                                                    <div className="damage-kategori-title">{item.kategori || 'FASILITAS KELAS'}</div>
                                                    <div className="damage-rincian-text">"{item.rincian}"</div>
                                                    <div className="damage-time-text">
                                                        Dilaporkan: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>

                                                {/* Kolom 2: Detail Ruangan */}
                                                <td className="damage-table-cell">
                                                    <div className="damage-detail-container">
                                                        <div className="damage-detail-date">
                                                            <span aria-hidden="true" style={{ display: 'inline-flex' }}><CalendarEventFill size={13} /></span>
                                                            <span>{formatTanggalIndonesia(item.created_at)}</span>
                                                        </div>
                                                        <div className="damage-room-name">
                                                            <span aria-hidden="true" style={{ display: 'inline-flex' }}><GeoAltFill size={14} /></span>
                                                            <span>Ruang {item.rooms?.nama || 'Ruangan'}</span>
                                                        </div>
                                                        <div className="damage-room-building">
                                                            {item.rooms?.gedung || '-'} • {item.rooms?.kampus || 'Kampus 3'}
                                                        </div>
                                                        {item.rooms?.status === 'terkunci' && (
                                                            <div className="damage-room-locked-badge">
                                                                <LockFill size={12} /> Ruangan Terkunci
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Kolom 3: Identitas Pelapor (PJ) */}
                                                <td className="damage-table-cell">
                                                    <div className="damage-reporter-box">
                                                        <p className="damage-reporter-badge">Pelapor (PJ)</p>
                                                        <p className="damage-reporter-name">{reporterName}</p>
                                                        <p className="damage-reporter-prodi">{reporterProdi}</p>
                                                        {reporterNim !== '-' && <p className="damage-reporter-nim">NIM: {reporterNim}</p>}
                                                    </div>
                                                </td>

                                                {/* Kolom 4: Status Penanganan & Aksi Staf */}
                                                <td className="damage-table-cell no-print">
                                                    <div className="damage-action-container">
                                                        {/* Status Selector via NeoSelect */}
                                                        <div className="damage-status-select-wrap">
                                                            <NeoSelect
                                                                value={item.status}
                                                                onChange={(val) => handleUpdateStatus(item.id, val)}
                                                                options={statusSelectOptions}
                                                                className="damage-neo-select-table"
                                                            />
                                                        </div>

                                                        {/* Emergency Lock Room Button */}
                                                        {item.rooms?.status !== 'terkunci' ? (
                                                            <button
                                                                type="button"
                                                                className="damage-btn-lock"
                                                                onClick={() => handleLockRoom(item.room_id, item.rooms?.nama)}
                                                            >
                                                                <LockFill size={13} /> Kunci Ruangan
                                                            </button>
                                                        ) : (
                                                            <div className="damage-text-locked">
                                                                <LockFill size={12} /> Akses Terkunci
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="damage-mobile-cards no-print">
                            {paginatedReports.map((item) => {
                                const reporter = item.reporter || item.users || {}
                                const reporterName = reporter.username || 'PJ Mahasiswa'
                                const reporterProdi = reporter.prodi || '-'
                                const reporterNim = reporter.nim_nip || (reporter.email ? reporter.email.split('@')[0] : null) || '-'
                                const reporterHp = reporter.no_hp || null

                                return (
                                    <div key={`m-dmg-${item.id}`} className="damage-mobile-item">
                                        <div className="damage-mobile-header">
                                            <div className="damage-mobile-kategori-box">
                                                <span className="damage-mobile-id-tag">#TIKET-{item.id}</span>
                                                <h4 className="damage-mobile-kategori-title">{item.kategori || 'FASILITAS KELAS'}</h4>
                                            </div>
                                            <div className="damage-mobile-badge-box">
                                                {item.status === 'resolved' ? (
                                                    <span className="damage-mobile-status-badge status-resolved">
                                                        <CheckCircleFill size={12} /> Selesai
                                                    </span>
                                                ) : item.status === 'in_progress' ? (
                                                    <span className="damage-mobile-status-badge status-progress">
                                                        <Tools size={12} /> Dikerjakan
                                                    </span>
                                                ) : (
                                                    <span className="damage-mobile-status-badge status-pending">
                                                        <HourglassSplit size={12} /> Menunggu
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="damage-mobile-body">
                                            <div className="damage-mobile-rincian">
                                                "{item.rincian}"
                                            </div>

                                            <div className="damage-mobile-location-card">
                                                <div className="damage-mobile-loc-row">
                                                    <GeoAltFill size={14} color="#0284c7" />
                                                    <strong>Ruang {item.rooms?.nama || 'Ruangan'}</strong>
                                                    <span>({item.rooms?.gedung || '-'} • {item.rooms?.kampus || 'Kampus 3'})</span>
                                                </div>
                                                <div className="damage-mobile-loc-row sub-row">
                                                    <CalendarEventFill size={12} color="#64748b" />
                                                    <span>Dilaporkan: {formatTanggalIndonesia(item.created_at)}</span>
                                                </div>
                                                {item.rooms?.status === 'terkunci' && (
                                                    <div className="damage-mobile-locked-alert">
                                                        <LockFill size={12} /> Akses Ruangan Sedang Terkunci
                                                    </div>
                                                )}
                                            </div>

                                            <div className="damage-mobile-reporter-card">
                                                <div className="damage-mobile-rep-header">
                                                    <span>PELAPOR (PJ KELAS):</span>
                                                </div>
                                                <div className="damage-mobile-rep-info">
                                                    <strong>{reporterName}</strong> &bull; {reporterProdi}
                                                    {reporterNim !== '-' && <span> (NIM: {reporterNim})</span>}
                                                </div>
                                                {reporterHp && (
                                                    <div className="damage-mobile-rep-contact">
                                                        <span>No. HP: {reporterHp}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="damage-mobile-actions">
                                            <div className="damage-mobile-select-group">
                                                <label className="damage-mobile-action-label">Status Penanganan:</label>
                                                <NeoSelect
                                                    value={item.status}
                                                    onChange={(val) => handleUpdateStatus(item.id, val)}
                                                    options={statusSelectOptions}
                                                    className="damage-neo-select-mobile"
                                                />
                                            </div>

                                            {item.rooms?.status !== 'terkunci' ? (
                                                <button
                                                    type="button"
                                                    className="damage-mobile-btn-lock"
                                                    onClick={() => handleLockRoom(item.room_id, item.rooms?.nama)}
                                                >
                                                    <LockFill size={13} /> Kunci Ruangan Ini (Darurat)
                                                </button>
                                            ) : (
                                                <div className="damage-mobile-locked-status">
                                                    <LockFill size={13} /> Ruangan Ini Telah Dikunci
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Bilah Paginasi Neo-Brutalist */}
                {totalPages > 1 && (
                    <div className="damage-pagination no-print">
                        <div className="damage-pagination-info">
                            Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> tiket
                        </div>
                        <div className="damage-pagination-controls">
                            <button
                                type="button"
                                className="damage-page-btn damage-page-nav-btn"
                                onClick={() => handlePageChange(validCurrentPage - 1)}
                                disabled={validCurrentPage === 1}
                            >
                                <ChevronLeft size={13} /> Prev
                            </button>

                            {getPageNumbers().map((page, idx) => {
                                if (page === '...') {
                                    return <span key={`ellipsis-${idx}`} className="damage-page-ellipsis">...</span>
                                }
                                return (
                                    <button
                                        key={`page-${page}`}
                                        type="button"
                                        className={`damage-page-btn damage-page-num-btn ${validCurrentPage === page ? 'is-active' : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                )
                            })}

                            <button
                                type="button"
                                className="damage-page-btn damage-page-nav-btn"
                                onClick={() => handlePageChange(validCurrentPage + 1)}
                                disabled={validCurrentPage === totalPages}
                            >
                                Next <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Konfirmasi Kunci Ruangan */}
            <ConfirmModal
                isOpen={confirmModal.open}
                title="Konfirmasi Kunci Ruangan"
                message={`Apakah Anda yakin ingin MENGUNCI akses Ruang "${confirmModal.roomName}"? Status ruangan akan diubah menjadi 'terkunci' sehingga tidak dapat digunakan untuk perkuliahan maupun reservasi hingga perbaikan selesai.`}
                confirmText="Ya, Kunci Ruangan"
                cancelText="Batal"
                variant="danger"
                isLoading={confirmModal.loading}
                onConfirm={handleConfirmLockRoom}
                onCancel={() => setConfirmModal({ open: false, roomId: null, roomName: '', loading: false })}
            />
        </div>
    )
}

export default LogKerusakanFasilitas
