import { useState, useEffect } from 'react'
import { exportToCSV } from '../../untils/exportExcel'
import { sendWANotifications } from '../../untils/waNotification'
import api from '../../api/axios'
function PersetujuanReservasi() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending') // Default tab
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
  const handleAction = async (id, status) => {
    let alasan_penolakan = '';
    if (status === 'rejected') {
      alasan_penolakan = prompt('Masukan alasan penolakan reservasi ini:');
      if (alasan_penolakan === null) return;
      if (!alasan_penolakan.trim()) {
        alert('Alasan penolakan wajib diisi!');
        return;
      }
    }

    const targetRes = reservations.find(r => r.id === id)
    let isWASent = false

    // 1. Cobakan Kirim Notifikasi WhatsApp Direct Link
    if (targetRes) {
      const pjPhone = targetRes.users?.no_hp || targetRes.users?.phone || ''
      const pjName = targetRes.users?.username || 'PJ Kelas'
      const matkul = targetRes.mata_kuliah || 'Mata Kuliah'
      const ruang = targetRes.rooms?.nama || '-'
      const gedung = targetRes.rooms?.gedung || '-'
      const msg = status === 'approved'
        ? `🎓 *[SiKelas - Konfirmasi Reservasi Ruangan]*\n\nHalo *${pjName}*,\nPengajuan peminjaman ruangan kelas Anda telah *DISETUJUI* oleh Admin.\n\n📖 *Detail Peminjaman:*\n• Mata Kuliah: *${matkul}*\n• Lokasi: Ruang *${ruang}* (${gedung})\n• Waktu: ${targetRes.tanggal}, ${targetRes.waktu_mulai.substring(0, 5)} - ${targetRes.waktu_selesai.substring(0, 5)} WIB\n\nSilakan gunakan ruangan dengan tertib dan jaga kebersihan fasilitas. Terima kasih!`
        : `🚨 *[SiKelas - Pemberitahuan Reservasi Ruangan]*\n\nHalo *${pjName}*,\nMohon maaf, pengajuan reservasi kelas untuk mata kuliah *${matkul}* pada ${targetRes.tanggal} *DITOLAK* oleh Admin.\n\n📌 *Alasan Penolakan:*\n"${alasan_penolakan}"\n\nSilakan mengajukan ulang pada slot waktu atau ruangan lain. Terima kasih!`

      isWASent = sendWANotifications({ phone: pjPhone, message: msg })
    }

    // 2. STATUS TETAP BERUBAH DI DATABASE (TIDAK DIBATALKAN)
    try {
      setActionLoading(true)
      await api.patch(`/reservations/${id}/status`, { status, alasan_penolakan });
      
      // ⚡ 3. BUAT NOTIFIKASI IN-APP KE KOTAK MASUK PJ (DENGAN WA FALLBACK WARNING JIKA WA GAGAL)
      if (targetRes?.user_id) {
        try {
          const waNote = !isWASent ? ' (⚠️ WhatsApp gagal terkirim karena nomor HP tidak valid/terdaftar. Silakan perbarui nomor di Profil)' : ''
          await api.post('/notifications', {
            user_id: targetRes.user_id,
            title: status === 'approved' ? '🎓 Reservasi Disetujui!' : '🚨 Reservasi Ditolak',
            message: (status === 'approved'
              ? `Pengajuan reservasi Anda untuk ${targetRes.mata_kuliah} di Ruang ${targetRes.rooms?.nama || ''} (${targetRes.rooms?.gedung || ''}) telah disetujui Admin.`
              : `Pengajuan reservasi Anda untuk ${targetRes.mata_kuliah} ditolak dengan alasan: "${alasan_penolakan}"`) + waNote,
            type: status === 'approved' ? 'success' : 'danger'
          })
        } catch (notifErr) {
          console.error('Gagal membuat notifikasi in-app:', notifErr)
        }
      }

      fetchReservations();
    } catch (error) {
      console.error(error);
      alert('Gagal mengubah status reservasi.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000)
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
    exportToCSV('Laporan_Reservasi_Kelas', headers, rows)
  }
  const handlePrintPDF = () => {
    window.print()
  }
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📌 Persetujuan & Log Reservasi Kelas</h1>
        <p className="subtitle">Kelola dan pantau persetujuan peminjaman ruangan oleh PJ Kelas.</p>
      </div>
      {message && (
        <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>
          {message}
        </div>
      )}
      {/* 📌 FILTER TAB BAR STATUS RESERVASI */}
      <div className="card-flat no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>📌 Status Reservasi:</span>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'pending' ? '#f59e0b' : '#e2e8f0', color: filterStatus === 'pending' ? '#fff' : '#475569', fontWeight: filterStatus === 'pending' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('pending')}
        >
          🟡 Menunggu ACC ({reservations.filter(r => r.status === 'pending' && !isReservationExpired(r)).length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'approved' ? '#059669' : '#e2e8f0', color: filterStatus === 'approved' ? '#fff' : '#475569', fontWeight: filterStatus === 'approved' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('approved')}
        >
          🟢 Disetujui ({reservations.filter(r => r.status === 'approved').length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'rejected' ? '#dc2626' : '#e2e8f0', color: filterStatus === 'rejected' ? '#fff' : '#475569', fontWeight: filterStatus === 'rejected' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('rejected')}
        >
          🔴 Ditolak ({reservations.filter(r => r.status === 'rejected').length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'expired' ? '#6b7280' : '#e2e8f0', color: filterStatus === 'expired' ? '#fff' : '#475569', fontWeight: filterStatus === 'expired' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('expired')}
        >
          🚨 Kadaluarsa ({reservations.filter(r => isReservationExpired(r)).length})
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: filterStatus === 'Semua' ? '#0f172a' : '#e2e8f0', color: filterStatus === 'Semua' ? '#fff' : '#475569', fontWeight: filterStatus === 'Semua' ? 'bold' : 'normal' }}
          onClick={() => setFilterStatus('Semua')}
        >
          📋 Semua Reservasi ({reservations.length})
        </button>
      </div>
      {/* TABEL RESERVASI */}
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
              {filteredReservations.length > 0 ? filteredReservations.map((res) => {
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
                        <span className="badge badge-error" style={{ fontSize: '12px' }}>🚨 Kadaluarsa</span>
                      ) : res.status === 'approved' ? (
                        <span className="badge badge-success" style={{ fontSize: '12px' }}>🟢 Disetujui</span>
                      ) : res.status === 'rejected' ? (
                        <div>
                          <span className="badge badge-danger" style={{ fontSize: '12px' }}>🔴 Ditolak</span>
                          {res.alasan_penolakan && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>"{res.alasan_penolakan}"</div>}
                        </div>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '12px' }}>🟡 Menunggu ACC</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }} className="no-print">
                      {res.status === 'pending' && !expired ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            style={{ marginRight: '8px' }}
                            onClick={() => handleAction(res.id, 'approved')}
                            disabled={actionLoading}
                          >
                            Setujui
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(res.id, 'rejected')}
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
      </div>
    </div>
  )
}
export default PersetujuanReservasi