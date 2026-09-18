import { useState, useEffect } from 'react'
import { exportToCSV } from '../../utils/exportExcel'
import api from '../../api/axios'
import './LogKerusakanFasilitas.css'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/Modal/ConfirmModal'
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
  GeoAltFill
} from 'react-bootstrap-icons'

function LogKerusakanFasilitas() {
    const { showSuccess, showError, showWarning } = useToast()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('pending')
    const [confirmModal, setConfirmModal] = useState({ open: false, roomId: null, roomName: '', loading: false })

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
        const rows = filteredReports.map(r => [
            r.id,
            r.rooms?.kampus || 'Kampus 3',
            r.rooms?.gedung || '-',
            r.rooms?.nama || '-',
            r.kategori,
            r.rincian,
            r.users?.username || '-',
            r.users?.prodi || '-',
            r.status === 'pending' ? 'Menunggu' : r.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Selesai',
            new Date(r.created_at).toLocaleDateString('id-ID')
        ])
        if (rows.length === 0) {
            showWarning('Tidak ada data kerusakan untuk diekspor pada kategori filter ini!', 'DATA KOSONG')
            return
        }
        exportToCSV('Laporan_Kerusakan_Fasilitas', headers, rows)
    }

    const handlePrintPDF = () => {
        window.print()
    }

    return (
        <div className="damage-log-page animate-fade-in">
            <div className="damage-log-heading">
                <p className="damage-eyebrow">ADMINISTRATOR / FACILITY INCIDENTS</p>
                <h1><span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", marginRight: "10px" }}><WrenchAdjustable size={30} /></span>Log Kerusakan Fasilitas Kampus</h1>
                <p>Kelola perbaikan sarana kelas dan kunci ruangan jika terjadi kerusakan parah.</p>
            </div>

            {/* Filter Status Penanganan (Terarah & Profesional) */}
            <div className="damage-filter-bar no-print">
                <span className="damage-filter-label">Status:</span>

                {/* 1. Menunggu Perbaikan (Default Active) */}
                <button
                    className={`damage-filter-btn ${filterStatus === 'pending' ? 'is-active status-pending' : ''}`}
                    onClick={() => setFilterStatus('pending')}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><HourglassSplit size={14} /> Menunggu Perbaikan</span>
                </button>

                {/* 2. Sedang Dikerjakan */}
                <button
                    className={`damage-filter-btn ${filterStatus === 'in_progress' ? 'is-active status-progress' : ''}`}
                    onClick={() => setFilterStatus('in_progress')}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Tools size={14} /> Sedang Dikerjakan</span>
                </button>

                {/* 3. Selesai Diperbaiki */}
                <button
                    className={`damage-filter-btn ${filterStatus === 'resolved' ? 'is-active status-resolved' : ''}`}
                    onClick={() => setFilterStatus('resolved')}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CheckCircleFill size={14} /> Selesai Diperbaiki</span>
                </button>

                {/* 4. Semua Laporan */}
                <button
                    className={`damage-filter-btn ${filterStatus === 'Semua' ? 'is-active status-all' : ''}`}
                    onClick={() => setFilterStatus('Semua')}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CardList size={14} /> Semua Laporan</span>
                </button>
            </div>

            {/* Tabel Log Tiket (Menyerupai Log Pelaporan Kelas Kosong) */}
            <div className="damage-table-card">
                <div className="damage-toolbar no-print">
                    <button className="damage-action-btn" onClick={handlePrintPDF} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><PrinterFill size={14} /> Cetak PDF Resmi</button>
                    <button className="damage-action-btn" onClick={handleExportExcel} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FileEarmarkSpreadsheetFill size={14} /> Ekspor Excel (.CSV)</button>
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
                            {paginatedReports.map((item) => (
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
                                            <p className="damage-reporter-name">{item.users?.username || 'PJ Mahasiswa'}</p>
                                            <p className="damage-reporter-prodi">{item.users?.prodi || '-'}</p>
                                            {item.users?.nim_nip && <p className="damage-reporter-nim">NIM: {item.users.nim_nip}</p>}
                                        </div>
                                    </td>

                                    {/* Kolom 4: Status Penanganan & Aksi Staf */}
                                    <td className="damage-table-cell no-print">
                                        <div className="damage-action-container">
                                            {/* Status Badge */}
                                            {item.status === 'resolved' ? (
                                                <div className="damage-status-badge status-resolved">
                                                    <CheckCircleFill size={13} /> Selesai Diperbaiki
                                                </div>
                                            ) : item.status === 'in_progress' ? (
                                                <div className="damage-status-badge status-progress">
                                                    <Tools size={13} /> Sedang Dikerjakan
                                                </div>
                                            ) : (
                                                <div className="damage-status-badge status-pending">
                                                    <HourglassSplit size={13} /> Menunggu Perbaikan
                                                </div>
                                            )}

                                            {/* Status Selector */}
                                            <div className="damage-status-select-wrap">
                                                <select
                                                    className="damage-status-select"
                                                    value={item.status}
                                                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                                >
                                                    <option value="pending">Menunggu Perbaikan</option>
                                                    <option value="in_progress">Sedang Dikerjakan</option>
                                                    <option value="resolved">Selesai Diperbaiki</option>
                                                </select>
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
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Bilah Paginasi Neo-Brutalist */}
                {totalPages > 1 && (
                    <div className="damage-pagination no-print">
                        <div className="damage-pagination-info">
                            Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> laporan kerusakan
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
                                    return (
                                        <span key={`ellipsis-${idx}`} className="damage-page-ellipsis">
                                            ...
                                        </span>
                                    )
                                }
                                return (
                                    <button
                                        key={page}
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

            {/* Neo-Brutalist Confirm Modal for Emergency Room Lock */}
            <ConfirmModal
                isOpen={confirmModal.open}
                title="Kunci Ruangan Darurat"
                message={`Kerusakan Parah! Apakah Anda yakin ingin MENGUNCI Ruang ${confirmModal.roomName}? Ruangan tidak akan bisa dipinjam oleh PJ lain.`}
                confirmText="Ya, Kunci Ruangan"
                cancelText="Batal"
                variant="warning"
                loading={confirmModal.loading}
                onConfirm={handleConfirmLockRoom}
                onCancel={() => !confirmModal.loading && setConfirmModal({ open: false, roomId: null, roomName: '', loading: false })}
            />
        </div>
    )
}

export default LogKerusakanFasilitas