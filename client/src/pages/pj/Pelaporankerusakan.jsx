import { useState, useEffect } from "react";
import api from '../../api/axios.js'
import './PelaporanKerusakan.css'
import {
    Snow,
    Display,
    LightningChargeFill,
    LayersFill,
    QuestionCircleFill,
    LockFill,
    InfoCircleFill,
    SendFill
} from 'react-bootstrap-icons'

function PelaporanKerusakan() {
    const [rooms, setRooms] = useState([])
    const [activeCategories, setActiveCategories] = useState([])
    const [kategori, setKategori] = useState('')
    const [rincian, setRincian] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })
    const [selectedKampus, setSelectedKampus] = useState('')
    const [selectedGedung, setSelectedGedung] = useState('')
    const [selectedRoomId, setSelectedRoomId] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())

    const daftarKategori = [
        { id: 'AC', label: 'AC / Pendingin', icon: <Snow size={18} /> },
        { id: 'Proyektor', label: 'Proyektor & Audio Visual', icon: <Display size={18} /> },
        { id: 'Kelistrikan', label: 'Kelistrikan dan Saklar', icon: <LightningChargeFill size={18} /> },
        { id: 'Mebel', label: 'Mebel & Sarana Fisik', icon: <LayersFill size={18} /> },
        { id: 'Lainnya', label: 'Lainnya / Kendala Khusus', icon: <QuestionCircleFill size={18} /> }
    ]

    const fetchRooms = async () => {
            try {
                setLoading(true)
                setLoadError('')
                const res = await api.get('/rooms')
                setRooms(res.data.rooms || [])
            } catch (error) {
                console.error('Gagal mengambil data ruangan:', error)
                setLoadError(error.response?.data?.error || 'Data ruangan belum dapat dimuat. Periksa koneksi server.')
            } finally {
                setLoading(false)
            }
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])
    const listKampus = Array.from(new Set(rooms.map(r => r.kampus).filter(Boolean)))
    const filteredByKampus = selectedKampus
        ? rooms.filter(r => r.kampus === selectedKampus)
        : rooms
    const listGedung = Array.from(new Set(filteredByKampus.map(r => r.gedung).filter(Boolean)))
    const filteredRooms = selectedGedung
        ? filteredByKampus.filter(r => r.gedung === selectedGedung)
        : filteredByKampus

    useEffect(() => {
        if (!selectedRoomId) {
            setActiveCategories([])
            return
        }
        const fetchActiveCategories = async () => {
            try {
                const res = await api.get(`/facility-reports/active?room_id=${selectedRoomId}`)
                setActiveCategories(res.data.activeCategories || [])
            } catch (error) {
                console.error('Gagal mengambil data kategori:', error)
            }
        }
        fetchActiveCategories()
    }, [selectedRoomId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedRoomId || !kategori || !rincian.trim()) return
        setSubmitting(true)
        setMessage({ text: '', type: '' })
        try {
            await api.post('/facility-reports', {
                room_id: Number(selectedRoomId),
                kategori,
                rincian: rincian.trim()
            })
            setMessage({ text: 'Laporan kerusakan fasilitas berhasil dikirim ke Tim Sarpras!', type: 'success' })
            setKategori('')
            setRincian('')

            // Refresh Kategori Aktif
            const res = await api.get(`/facility-reports/active?room_id=${selectedRoomId}`)
            setActiveCategories(res.data.activeCategories || [])
        } catch (err) {
            setMessage({
                text: err.response?.data?.error || 'Gagal mengirimkan laporan kerusakan.',
                type: 'error'
            })
        } finally {
            setSubmitting(false)
        }
    }
    const activeCategoryIds = activeCategories.map(c => c.kategori)
    return (
        <div className="damage-report-page animate-fade-in" style={{ maxWidth: '1120px', margin: '0 auto' }}>
            <div className="damage-report-heading page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div><p className="damage-eyebrow">PENANGGUNG JAWAB KELAS / FACILITY REPORT</p><h1 className="page-title">Pelaporan Kerusakan Fasilitas</h1><p className="page-subtitle">Laporkan kerusakan sarana prasarana kelas untuk penanganan cepat oleh tim teknis.</p></div>
                <div className="damage-report-clock">{currentTime.toLocaleTimeString('id-ID')}</div>
            </div>
            {message.text && (
                <div className={`damage-report-message ${message.type}`} style={{
                    background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                    padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
                }}>
                    {message.text}
                </div>
            )}
            {loadError && (
                <div className="damage-report-message error damage-load-error" role="alert">
                    <strong>Data lokasi belum tersedia.</strong>
                    <span>{loadError}</span>
                    <button type="button" onClick={fetchRooms}>Coba Muat Ulang</button>
                </div>
            )}
            <div className="damage-report-card card-flat" style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
                {loading && <div className="damage-loading-bar" aria-live="polite">Memuat lokasi ruangan...</div>}
                <form onSubmit={handleSubmit}>

                    {/* 1. PILIH RUANGAN */}
                    <div className="damage-location-grid" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>

                        {/* 1. DROPDOWN KAMPUS */}
                        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                            <label className="form-label">1. Pilih Kampus</label>
                            <select
                                className="input-field"
                                value={selectedKampus}
                                onChange={(e) => {
                                    setSelectedKampus(e.target.value)
                                    setSelectedGedung('')
                                    setSelectedRoomId('')
                                    setKategori('')
                                }}
                                required
                            >
                                <option value="">-- Pilih Kampus --</option>
                                {listKampus.map((k, i) => <option key={i} value={k}>{k}</option>)}
                            </select>
                        </div>
                        {/* 2. DROPDOWN GEDUNG */}
                        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                            <label className="form-label">2. Pilih Gedung</label>
                            <select
                                className="input-field"
                                value={selectedGedung}
                                onChange={(e) => {
                                    setSelectedGedung(e.target.value)
                                    setSelectedRoomId('')
                                    setKategori('')
                                }}
                                required
                                disabled={!selectedKampus}
                            >
                                <option value="">{selectedKampus ? '-- Pilih Gedung --' : '-- Pilih Kampus Dulu --'}</option>
                                {listGedung.map((g, i) => <option key={i} value={g}>{g}</option>)}
                            </select>
                        </div>
                        {/* 3. DROPDOWN RUANGAN */}
                        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                            <label className="form-label">3. Pilih Ruangan</label>
                            <select
                                className="input-field"
                                value={selectedRoomId}
                                onChange={(e) => {
                                    setSelectedRoomId(e.target.value)
                                    setKategori('')
                                }}
                                required
                                disabled={!selectedGedung}
                            >
                                <option value="">{selectedGedung ? '-- Pilih Ruangan --' : '-- Pilih Gedung Dulu --'}</option>
                                {filteredRooms.map(r => (
                                    <option key={r.id} value={r.id}>
                                        Ruang {r.nama} (Lt. {r.lantai || 1})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* INFORMASI TIKET AKTIF */}
                    {activeCategories.length > 0 && (
                        <div className="active-damage-tickets" style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                            <strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}><InfoCircleFill size={15} color="#b45309" /> Kendala yang sedang dalam penanganan di ruangan ini:</strong>
                            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                                {activeCategories.map((ac, idx) => (
                                    <li key={idx} style={{ color: '#78350f' }}>
                                        <b>{ac.kategori}:</b> "{ac.rincian}" ({ac.status === 'pending' ? 'Menunggu Teknisi' : 'Sedang Dikerjakan'})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* 2. PILIH KATEGORI KERUSAKAN */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">2. Pilih Kategori Fasilitas yang Bermasalah</label>
                        <div className="damage-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            {daftarKategori.map(kat => {
                                const isLocked = activeCategoryIds.includes(kat.id)
                                const isSelected = kategori === kat.id
                                return (
                                    <button
                                        key={kat.id}
                                        type="button"
                                        disabled={isLocked || !selectedRoomId}
                                        onClick={() => setKategori(kat.id)}
                                        className={`damage-category-tile ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                                            background: isLocked ? '#f1f5f9' : isSelected ? '#d1fae5' : '#fff',
                                            color: isLocked ? '#94a3b8' : isSelected ? '#065f46' : '#334155',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            cursor: isLocked || !selectedRoomId ? 'not-allowed' : 'pointer',
                                            textAlign: 'left',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '8px'
                                        }}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            {kat.icon}
                                            {kat.label}
                                        </span>
                                        {isLocked && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626' }}>
                                                <LockFill size={12} /> (Sedang Diperbaiki)
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    {/* 3. RINCIAN KERUSAKAN */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label">3. Rincian Deskripsi Kerusakan</label>
                        <textarea
                            className="input-field"
                            rows="4"
                            placeholder="Jelaskan detail kerusakan (Misal: AC bocor menetes ke meja dosen / proyektor mati total saat dinyalakan)..."
                            value={rincian}
                            onChange={(e) => setRincian(e.target.value)}
                            required
                            disabled={!kategori}
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        className="damage-submit-button btn btn-primary"
                        style={{ width: '100%', padding: '12px' }}
                        disabled={submitting || !selectedRoomId || !kategori || !rincian.trim()}
                    >
                        {submitting ? 'Kirim Laporan...' : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><SendFill size={16} /> Kirim Laporan Kerusakan ke Staf</span>}
                    </button>
                </form>
            </div>
        </div>
    )

}

export default PelaporanKerusakan