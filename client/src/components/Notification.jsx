import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from "../api/axios"

function Notification() {
    const location = useLocation()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [isSelectMode, setIsSelectMode] = useState(false)

    // ⚡ Tutup Pop-up Notifikasi secara Otomatis saat Berpindah Halaman/Rute
    useEffect(() => {
        setIsOpen(false)
        setIsSelectMode(false)
        setSelectedIds([])
    }, [location.pathname])

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
            alert('Pilih mininal satu pesan untuk dihapus!')
            return
        }
        if (!window.confirm(deleteAll ? 'Hapus SEMUA pesan notifikasi' : `Hapus ${selectedIds.length} pesan terpilih`))
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
        <div style={{ position: 'relative', zIndex: '1000' }}>
            {/* Tombol Lonceng */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px'
                }}
            >
                <span style={{ fontSize: '20px' }}>🔔</span>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        padding: '2px 6px'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* DROPDOWN KOTAK MASUK */}
            {isOpen && (
                <div style={{
                    position: 'absolute', right: 0, top: '45px', width: '360px', maxWidth: '90vw', background: '#fff',
                    borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 9999,
                    border: '1px solid #e2e8f0', padding: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>🔔 Kotak Masuk Notifikasi</h4>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={handleMarkReadAll}>
                            ✓ Dibaca Semua
                        </button>
                    </div>
                    {/* OPSI AKSES HAPUS MASSAL */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', fontSize: '11px' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11px', background: isSelectMode ? '#dbeafe' : '#f1f5f9' }}
                            onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]) }}
                        >
                            {isSelectMode ? '✖️ Batal Pilih' : '☑️ Pilih Banyak'}
                        </button>
                        {isSelectMode && selectedIds.length > 0 && (
                            <button className="btn btn-danger btn-sm" style={{ fontSize: '11px' }} onClick={() => handleDelete(false)}>
                                🗑️ Hapus ({selectedIds.length})
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px', color: '#dc2626' }} onClick={() => handleDelete(true)}>
                                🗑️ Hapus Semua
                            </button>
                        )}
                    </div>
                    {/* DAFTAR PESAN NOTIFIKASI */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                                Kotak masuk Anda bersih, belum ada notifikasi baru.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    style={{
                                        padding: '10px', borderRadius: '8px', marginBottom: '8px',
                                        background: n.is_read ? '#f8fafc' : '#eff6ff',
                                        borderLeft: `4px solid ${n.type === 'success' ? '#10b981' : n.type === 'danger' ? '#ef4444' : '#3b82f6'}`,
                                        display: 'flex', gap: '8px', alignItems: 'flex-start'
                                    }}
                                >
                                    {isSelectMode && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(n.id)}
                                            onChange={() => toggleSelectId(n.id)}
                                            style={{ marginTop: '3px' }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a' }}>{n.title}</div>
                                        <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px', lineHeight: '1.4' }}>{n.message}</div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                            {new Date(n.created_at).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Notification