import supabase from "../config/supabase.js";

const runPhantomBookingCleaner = async () => {
    try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];

        const checkTimeObj = new Date(now.getTime() - 15 * 60000)
        const checkTime = checkTimeObj.toTimeString().split(' ')[0];

        const { data: expiredRes, error: resErr } = await supabase
            .from('reservations')
            .update({ status: 'expired' })
            .eq('status', 'approved')
            .eq('is_checked_in', false)
            .eq('tanggal', currentDate)
            .lt('waktu_mulai', checkTime)
            .select()

        if (expiredRes && expiredRes.length > 0) {
            console.log(`[CronJob - Sweeper] 🚨 ${expiredRes.length} reservasi diubah menjadi EXPIRED (Tidak Check-In >15 Menit).`)
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
        console.error('[CronJob - Midnight Error]:', error.message)
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
    setInterval(runMidnightReset, 60000)
}