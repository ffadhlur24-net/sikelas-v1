import { useState, useEffect } from "react";
import api from '../../api/axios.js'
import './PelaporanKerusakan.css'
import NeoSelect from '../../components/Select/NeoSelect.jsx'
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

    const daftarKategori = [
        { id: 'AC', label: 'AC / Pendingin', icon: <Snow size={18} /> },
        { id: 'Proyektor', label: 'Proyektor & Audio Visual', icon: <Display size={18} /> },
        { id: 'Kelistrikan', label: 'Kelistrikan & Saklar', icon: <LightningChargeFill size={18} /> },
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

    // Option lists for NeoSelect
    const kampusOptions = [
        { value: '', label: '-- Pilih Kampus --' },
        ...listKampus.map(k => ({ value: k, label: k }))
    ]
    const gedungOptions = [
        { value: '', label: selectedKampus ? '-- Pilih Gedung --' : '-- Pilih Kampus Dulu --' },
        ...listGedung.map(g => ({ value: g, label: g }))
    ]
    const roomOptions = [
        { value: '', label: selectedGedung ? '-- Pilih Ruangan --' : '-- Pilih Gedung Dulu --' },
        ...filteredRooms.map(r => ({
            value: String(r.id),
            label: `Ruang ${r.nama} (Lt. ${r.lantai || 1})`
        }))
    ]

    return (
        <div className="damage-report-page animate-fade-in">
            <div className="damage-report-heading page-header">
                <div>
                    <p className="damage-eyebrow">PENANGGUNG JAWAB KELAS / FACILITY REPORT</p>
                    <h1 className="page-title">Pelaporan Kerusakan Fasilitas</h1>
                    <p className="page-subtitle">Laporkan kerusakan sarana prasarana kelas untuk penanganan cepat oleh tim teknis.</p>
                </div>
            </div>

            {message.text && (
                <div className={`damage-report-message ${message.type}`}>
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

            <div className="damage-report-card card-flat">
                {loading && <div className="damage-loading-bar" aria-live="polite">Memuat lokasi ruangan...</div>}
                
                <form onSubmit={handleSubmit}>
                    {/* 1. PILIH RUANGAN */}
                    <div className="damage-location-grid">
                        {/* 1. DROPDOWN KAMPUS */}
                        <div className="form-group damage-col">
                            <label className="form-label">1. Pilih Kampus</label>
                            <NeoSelect
                                value={selectedKampus}
                                onChange={(val) => {
                                    setSelectedKampus(val)
                                    setSelectedGedung('')
                                    setSelectedRoomId('')
                                    setKategori('')
                                }}
                                options={kampusOptions}
                                placeholder="-- Pilih Kampus --"
                            />
                        </div>

                        {/* 2. DROPDOWN GEDUNG */}
                        <div className="form-group damage-col">
                            <label className="form-label">2. Pilih Gedung</label>
                            <NeoSelect
                                value={selectedGedung}
                                onChange={(val) => {
                                    setSelectedGedung(val)
                                    setSelectedRoomId('')
                                    setKategori('')
                                }}
                                options={gedungOptions}
                                placeholder={selectedKampus ? '-- Pilih Gedung --' : '-- Pilih Kampus Dulu --'}
                                disabled={!selectedKampus}
                            />
                        </div>

                        {/* 3. DROPDOWN RUANGAN */}
                        <div className="form-group damage-col">
                            <label className="form-label">3. Pilih Ruangan</label>
                            <NeoSelect
                                value={selectedRoomId}
                                onChange={(val) => {
                                    setSelectedRoomId(val)
                                    setKategori('')
                                }}
                                options={roomOptions}
                                placeholder={selectedGedung ? '-- Pilih Ruangan --' : '-- Pilih Gedung Dulu --'}
                                disabled={!selectedGedung}
                            />
                        </div>
                    </div>

                    {/* INFORMASI TIKET AKTIF */}
                    {activeCategories.length > 0 && (
                        <div className="active-damage-tickets" role="status">
                            <div className="active-damage-header">
                                <InfoCircleFill size={15} />
                                <span>Kendala yang sedang dalam penanganan di ruangan ini:</span>
                            </div>
                            <ul className="active-damage-list">
                                {activeCategories.map((ac, idx) => (
                                    <li key={idx}>
                                        <b>{ac.kategori}:</b> &ldquo;{ac.rincian}&rdquo; <span className="active-damage-badge">({ac.status === 'pending' ? 'Menunggu Teknisi' : 'Sedang Dikerjakan'})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 2. PILIH KATEGORI KERUSAKAN */}
                    <div className="form-group damage-category-section">
                        <label className="form-label">2. Pilih Kategori Fasilitas yang Bermasalah</label>
                        <div className="damage-category-grid">
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
                                    >
                                        <span className="damage-category-label">
                                            <span className="damage-category-icon">{kat.icon}</span>
                                            <span>{kat.label}</span>
                                        </span>
                                        {isLocked && (
                                            <span className="damage-category-locked-badge">
                                                <LockFill size={12} /> Sedang Diperbaiki
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 3. RINCIAN KERUSAKAN */}
                    <div className="form-group damage-desc-section">
                        <label className="form-label">3. Rincian Deskripsi Kerusakan</label>
                        <textarea
                            className="input-field damage-textarea"
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
                        className="damage-submit-button btn btn-primary"
                        disabled={submitting || !selectedRoomId || !kategori || !rincian.trim()}
                    >
                        {submitting ? 'Mengirim Laporan...' : (
                            <span className="damage-submit-content">
                                <SendFill size={16} /> Kirim Laporan Kerusakan ke Tim Sarpras
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default PelaporanKerusakan
