import supabase from "../config/supabase.js";

const runPhantomBookingCleaner = async () => {
    try {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const currentDate = `${yyyy}-${mm}-${dd}`;

        // Hitung waktu (Sekarang - 15 Menit) dalam format HH:MM:SS lokal
        const checkTimeObj = new Date(now.getTime() - 15 * 60000)
        const currentH = String(checkTimeObj.getHours()).padStart(2, '0')
        const currentM = String(checkTimeObj.getMinutes()).padStart(2, '0')
        const currentS = String(checkTimeObj.getSeconds()).padStart(2, '0')
        const checkTime = `${currentH}:${currentM}:${currentS}`

        // Update reservasi approved yang belum check-in jika tanggal < hari ini ATAU (tanggal == hari ini DAN waktu_mulai < checkTime)
        const { data: expiredRes, error: resErr } = await supabase
            .from('reservations')
            .update({ status: 'expired' })
            .eq('status', 'approved')
            .eq('is_checked_in', false)
            .or(`tanggal.lt.${currentDate},and(tanggal.eq.${currentDate},waktu_mulai.lt.${checkTime})`)
            .select()

        if (expiredRes && expiredRes.length > 0) {
            console.log(`[CronJob - Sweeper] 🚨 ${expiredRes.length} reservasi gantung diubah menjadi EXPIRED (Tidak Check-In >15 Menit).`)
        }

        // Hitung waktu sekarang HH:MM:SS untuk cek pending yang kadaluwarsa
        const currentHNow = String(now.getHours()).padStart(2, '0')
        const currentMNow = String(now.getMinutes()).padStart(2, '0')
        const currentSNow = String(now.getSeconds()).padStart(2, '0')
        const currentTimeNow = `${currentHNow}:${currentMNow}:${currentSNow}`

        // Update reservasi pending yang tanggal/jam mulainya sudah lewat tanpa di-ACC
        const { data: expiredPendingRes } = await supabase
            .from('reservations')
            .update({ status: 'expired' })
            .eq('status', 'pending')
            .or(`tanggal.lt.${currentDate},and(tanggal.eq.${currentDate},waktu_mulai.lte.${currentTimeNow})`)
            .select()

        if (expiredPendingRes && expiredPendingRes.length > 0) {
            console.log(`[CronJob - Sweeper] ⌛ ${expiredPendingRes.length} reservasi pending kadaluwarsa diubah menjadi EXPIRED.`)
        }

        const { data: expiredRep, error: repErr } = await supabase
            .from('reports')
            .update({ status: 'expired' })
            .eq('status', 'pending')
            .lt('tanggal', currentDate)
            .select()
        if (expiredRep && expiredRep.length > 0) {
            console.log(`[CronJob - Sweeper] 🧹 ${expiredRep.length} laporan pending hari sebelumnya diubah menjadi EXPIRED.`)
        }

    } catch (error) {
        console.error('[CronJob - Sweeper Error]:', error.message)
    }
}

const runPendingUserCleaner = async () => {
    try {
        const nowIso = new Date().toISOString()
        const { data: deletedUsers } = await supabase
            .from('users')
            .delete()
            .in('status', ['pending', 'pending_email_verification'])
            .lt('otp_expires_at', nowIso)
            .select()

        if (deletedUsers && deletedUsers.length > 0) {
            console.log(`[CronJob - Sweeper] 🧹 ${deletedUsers.length} akun pending kadaluwarsa (OTP expired) berhasil dihapus otomatis dari database.`)
        }
    } catch (error) {
        console.error('[CronJob - Pending User Cleaner Error]:', error.message)
    }
}

export const initCronJobs = () => {
    console.log('🤖 [CronJobs] Mengaktifkan Sweeper Latar Belakang & Task Automation...')
    setInterval(runPhantomBookingCleaner, 60000)
    setInterval(runPendingUserCleaner, 60000)
}