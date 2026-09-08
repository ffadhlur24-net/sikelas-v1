import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from "../api/axios"
import {
    BellFill,
    CheckAll,
    XCircleFill,
    CheckSquareFill,
    TrashFill
} from 'react-bootstrap-icons'
import './Notification.css'

function Notification() {
    const location = useLocation()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [isSelectMode, setIsSelectMode] = useState(false)
    const dropdownRef = useRef(null)

    // Tutup Pop-up Notifikasi secara Otomatis saat Berpindah Halaman/Rute
    useEffect(() => {
        setIsOpen(false)
        setIsSelectMode(false)
        setSelectedIds([])
    }, [location.pathname])

    // Tutup Pop-up Notifikasi saat mengklik di luar area pop-up
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
                setIsSelectMode(false)
                setSelectedIds([])
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const fetcNotification = async () => {
        try {
            const res = await api.get('/notifications')
            setNotifications(res.data.notifications || [])
            setUnreadCount(res.data.unreadCount || 0)
        } catch (error) {
            console.error('Gagal mengambil notifikasi:', error)
        }
    }

    useEffect(() => {
        fetcNotification()
        const timer = setInterval(fetcNotification, 30000)
        return () => clearInterval(timer)
    }, [])

    const handleMarkReadAll = async () => {
        try {
            await api.patch('/notifications/read-all')
            fetcNotification()
        } catch (error) {
            console.error('Gagal tandai baca:', error)
        }
    }

    const handleDelete = async (deleteAll = false) => {
        if (!deleteAll && selectedIds.length === 0) {
            alert('Pilih minimal satu pesan untuk dihapus!')
            return
        }
        if (!window.confirm(deleteAll ? 'Hapus SEMUA pesan notifikasi?' : `Hapus ${selectedIds.length} pesan terpilih?`))
            return

        try {
            await api.post('/notifications/delete-all', { ids: deleteAll ? null : selectedIds })
            setSelectedIds([])
            setIsSelectMode(false)
            fetcNotification()
        } catch (error) {
            console.error('Gagal menghapus notifikasi:', error)
        }
    }

    const toggleSelectId = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
    }

    return (
        <div className="neo-noti-container" ref={dropdownRef}>
            {/* Tombol Lonceng Pemicu */}
            <button
                type="button"
                className={`neo-noti-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifikasi"
            >
                <BellFill size={19} />
                {unreadCount > 0 && (
                    <span className="neo-noti-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* DROPDOWN KOTAK MASUK NEO-BRUTALIST */}
            {isOpen && (
                <div className="neo-noti-window">
                    {/* Header Pop-up */}
                    <div className="neo-noti-header">
                        <h4 className="neo-noti-title">
                            <BellFill size={15} color="#0058be" />
                            Notifikasi
                        </h4>
                        <button
                            type="button"
                            className="neo-noti-btn neo-noti-btn-readall"
                            onClick={handleMarkReadAll}
                            title="Tandai semua notifikasi sudah dibaca"
                        >
                            <CheckAll size={16} />
                            <span>Dibaca Semua</span>
                        </button>
                    </div>

                    {/* Toolbar Aksi & Bulk Actions */}
                    <div className="neo-noti-toolbar">
                        <button
                            type="button"
                            className={`neo-noti-btn ${isSelectMode ? 'is-active' : ''}`}
                            onClick={() => {
                                setIsSelectMode(!isSelectMode)
                                setSelectedIds([])
                            }}
                        >
                            {isSelectMode ? (
                                <>
                                    <XCircleFill size={13} />
                                    <span>Batal</span>
                                </>
                            ) : (
                                <>
                                    <CheckSquareFill size={13} />
                                    <span>Pilih Banyak</span>
                                </>
                            )}
                        </button>

                        {isSelectMode && selectedIds.length > 0 && (
                            <button
                                type="button"
                                className="neo-noti-btn neo-noti-btn-danger"
                                onClick={() => handleDelete(false)}
                            >
                                <TrashFill size={13} />
                                <span>Hapus ({selectedIds.length})</span>
                            </button>
                        )}

                        {notifications.length > 0 && (
                            <button
                                type="button"
                                className="neo-noti-btn"
                                style={{ marginLeft: 'auto', color: '#dc2626' }}
                                onClick={() => handleDelete(true)}
                                title="Hapus semua riwayat notifikasi"
                            >
                                <TrashFill size={13} />
                                <span>Bersihkan</span>
                            </button>
                        )}
                    </div>

                    {/* Info Mode Seleksi Aktif */}
                    {isSelectMode && (
                        <div className="neo-noti-select-bar">
                            <span>MODE PILIH: {selectedIds.length} DIPILIH</span>
                            <span style={{ fontSize: '10px', color: '#4b5563' }}>Klik kartu untuk memilih</span>
                        </div>
                    )}

                    {/* Daftar Pesan Notifikasi */}
                    <div className="neo-noti-list">
                        {notifications.length === 0 ? (
                            <div className="neo-noti-empty">
                                Kotak masuk Anda bersih, belum ada notifikasi baru.
                            </div>
                        ) : (
                            notifications.map(n => {
                                const isSelected = selectedIds.includes(n.id)
                                const typeClass = n.type === 'success' ? 'type-success' : n.type === 'danger' ? 'type-danger' : n.type === 'warning' ? 'type-warning' : 'type-info'
                                return (
                                    <div
                                        key={n.id}
                                        className={`neo-noti-card ${n.is_read ? 'is-read' : 'is-unread'} ${typeClass} ${isSelected ? 'is-selected' : ''}`}
                                        onClick={isSelectMode ? () => toggleSelectId(n.id) : undefined}
                                        style={{ cursor: isSelectMode ? 'pointer' : 'default' }}
                                    >
                                        {isSelectMode && (
                                            <input
                                                type="checkbox"
                                                className="neo-noti-checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectId(n.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                        <div className="neo-noti-content">
                                            <div className="neo-noti-item-title">{n.title}</div>
                                            <div className="neo-noti-item-msg">{n.message}</div>
                                            <div className="neo-noti-item-time">
                                                {new Date(n.created_at).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Notification
