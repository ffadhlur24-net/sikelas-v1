export const formatPhoneToWA = (phone) => {
    if (!phone) return;
    let cleaned = String(phone).replace(/\D/g, '') // Hapus non angkat
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1)
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned
    }
    return cleaned
}

export const sendWANotifications = ({ phone, message }) => {
    let targetPhone = formatPhoneToWA(phone)

    if (!targetPhone || targetPhone.length < 10) {
        const inputNewPhone = prompt(
            '⚠️ Nomor HP PJ belum terdaftar atau formatnya salah!\n\nSilakan masukkan Nomor WhatsApp PJ yang aktif (Contoh: 08123456789):',
            phone || ''
        )
        if (!inputNewPhone) {
            alert('Pengiriman notifikasi dibatalkan')
            return false
        }

        targetPhone = formatPhoneToWA(inputNewPhone)
        if (!targetPhone || targetPhone.length < 10) {
            alert('Format nomor tidak valid, coba lagi')
            return false
        }
    }

    const encodedText = encodeURIComponent(message)
    const waUrl = `https://wa.me/${targetPhone}?text=${encodedText}`

    window.open(waUrl, '_blank')
    return true
}