import { useState, useEffect } from 'react'
import { exportToCSV } from '../../untils/exportExcel'
import api from '../../api/axios'
function LogKerusakanFasilitas() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('pending')
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
    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/facility-reports/${id}/status`, { status })
            fetchReports()
        } catch (err) {
            alert('Gagal memperbarui status tiket.')
        }
    }
    const handleLockRoom = async (roomId, roomName) => {
        if (!window.confirm(`Kerusakan Parah! Apakah Anda yakin ingin MENGUNCI Ruang ${roomName}? Ruangan tidak akan bisa dipinjam oleh PJ lain.`)) {
            return
        }
        try {
            await api.patch(`/rooms/${roomId}/status`, { status: 'terkunci' })
            alert(`Ruang ${roomName} berhasil DIKUNCI!`)
            fetchReports()
        } catch (err) {
            alert('Gagal mengunci ruangan.')
        }
    }
    const filteredReports = filterStatus === 'Semua'
        ? reports
        : reports.filter(r => r.status === filterStatus)

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
        exportToCSV('Laporan_Kerusakan_Fasilitas', headers, rows)
    }
    const handlePrintPDF = () => {
        window.print()
    }
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">🛠️ Log Kerusakan Fasilitas Kampus</h1>
                <p className="page-subtitle">Kelola perbaikan sarana kelas dan kunci ruangan jika terjadi kerusakan parah.</p>
            </div>
            {/* Filter Status Penanganan (Terarah & Profesional) */}
            <div className="card-flat no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>📌 Status:</span>

                {/* 1. Menunggu Perbaikan (Default Active) */}
                <button
                    className="btn btn-secondary btn-sm"
                    style={{
                        background: filterStatus === 'pending' ? '#f59e0b' : '#e2e8f0',
                        color: filterStatus === 'pending' ? '#fff' : '#475569',
                        fontWeight: filterStatus === 'pending' ? 'bold' : 'normal'
                    }}
                    onClick={() => setFilterStatus('pending')}
                >
                    🟡 Menunggu Perbaikan
                </button>

                {/* 2. Sedang Dikerjakan */}
                <button
                    className="btn btn-secondary btn-sm"
                    style={{
                        background: filterStatus === 'in_progress' ? '#3b82f6' : '#e2e8f0',
                        color: filterStatus === 'in_progress' ? '#fff' : '#475569',
                        fontWeight: filterStatus === 'in_progress' ? 'bold' : 'normal'
                    }}
                    onClick={() => setFilterStatus('in_progress')}
                >
                    🔧 Sedang Dikerjakan
                </button>

                {/* 3. Selesai Diperbaiki */}
                <button
                    className="btn btn-secondary btn-sm"
                    style={{
                        background: filterStatus === 'resolved' ? '#059669' : '#e2e8f0',
                        color: filterStatus === 'resolved' ? '#fff' : '#475569',
                        fontWeight: filterStatus === 'resolved' ? 'bold' : 'normal'
                    }}
                    onClick={() => setFilterStatus('resolved')}
                >
                    🟢 Selesai Diperbaiki
                </button>

                {/* 4. Semua Laporan (Dipindah ke Paling Akhir) */}
                <button
                    className="btn btn-secondary btn-sm"
                    style={{
                        background: filterStatus === 'Semua' ? '#64748b' : '#e2e8f0',
                        color: filterStatus === 'Semua' ? '#fff' : '#475569',
                        fontWeight: filterStatus === 'Semua' ? 'bold' : 'normal'
                    }}
                    onClick={() => setFilterStatus('Semua')}
                >
                    📋 Semua Laporan
                </button>
            </div>
            {/* Tabel Log Tiket */}
            <div className="card-flat" style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
                <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={handlePrintPDF}>🖨️ Cetak PDF Resmi</button>
                    <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>📊 Ekspor Excel (.CSV)</button>
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
                    <p>Memuat tiket kerusakan...</p>
                ) : filteredReports.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Belum ada laporan kerusakan fasilitas pada kategori ini.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                <th style={{ padding: '10px 12px' }}>Lokasi Ruangan</th>
                                <th style={{ padding: '10px 12px' }}>Kategori & Rincian</th>
                                <th style={{ padding: '10px 12px' }}>Pelapor (PJ)</th>
                                <th style={{ padding: '10px 12px' }}>Status Penangan</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi Staf</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                        Ruang {item.rooms?.nama || 'Ruangan'}
                                        <br />
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
                                            {item.rooms?.gedung} ({item.rooms?.kampus})
                                        </span>
                                        <br />
                                        {item.rooms?.status === 'terkunci' && <span className="badge badge-error" style={{ marginTop: '4px' }}>🔒 Terkunci</span>}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className="badge badge-warning" style={{ marginBottom: '4px', display: 'inline-block' }}>{item.kategori}</span>
                                        <br />
                                        <span>"{item.rincian}"</span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <b>{item.users?.username || 'PJ'}</b>
                                        <br />
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{item.users?.prodi}</span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {item.status === 'resolved' ? (
                                            <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}>
                                                🟢 Selesai Diperbaiki (Closed)
                                            </span>
                                        ) : (
                                            <select
                                                className="input-field"
                                                style={{ padding: '4px 8px', height: 'auto', width: 'auto' }}
                                                value={item.status}
                                                onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                            >
                                                <option value="pending">🟡 Menunggu Perbaikan</option>
                                                <option value="in_progress">🔧 Sedang Dikerjakan Teknisi</option>
                                                <option value="resolved">🟢 Selesai Diperbaiki</option>
                                            </select>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        {item.status === 'resolved' ? (
                                            <span style={{ fontSize: '13px', color: '#059669', fontWeight: 'bold' }}>✓ Selesai</span>
                                        ) : item.rooms?.status !== 'terkunci' ? (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                                onClick={() => handleLockRoom(item.room_id, item.rooms?.nama)}
                                            >
                                                🔒 Kunci Ruangan
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>Terkunci 🔒</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
export default LogKerusakanFasilitas