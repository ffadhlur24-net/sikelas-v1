import supabase from "../config/supabase.js";

const runPhantomBookingCleaner = async () => {
    try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];

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

const runMidnightReset = async () => {
    try {
        const now = new Date()
        if (now.getHours() === 23 && now.getMinutes() === 59) {
            console.log('🌙 [CronJob - Midnight Reset] Pembersihan harian selesai. Server siap untuk besok!')
        }
    } catch (error) {
        console.error('[CronJob - Midnight Error]:', error.message)
    }
}

export const initCronJobs = () => {
    console.log('🤖 [CronJobs] Mengaktifkan Sweeper Latar Belakang & Task Automation...')
    setInterval(runPhantomBookingCleaner, 60000)
    setInterval(runPendingUserCleaner, 60000)
    setInterval(runMidnightReset, 60000)
}