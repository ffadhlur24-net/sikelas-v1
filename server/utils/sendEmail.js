// ================================
// Kirim OTP ke Email via Resend
// ================================

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * @param {string} toEmail 
 * @param {string} otpCode 
 * @param {string} username
 */

export async function sendOtpEmail(toEmail, otpCode, username) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Sikelas <noreply@sikelas.online>',
            to: [toEmail],
            subject: `👾 Kode berbahaya Sikelas: ${otpCode}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
                    <h2 style="text-align: center; color: #0f172a; margin-bottom: 8px;">🎓 SiKelas — Verifikasi Email</h2>
                    <p style="text-align: center; color: #64748b; font-size: 14px;">Hay Bray <b>${username}</b>, gunakan kode Keramat berikut untuk memverifikasi akun Anda:</p>
                    
                    <div style="text-align: center; margin: 24px 0;">
                        <div style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px;">
                            ${otpCode}
                        </div>
                    </div>
                    
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">Masa berlaku hanya <b>15 menit</b>. Gak usah dibagi kesiapapun.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="text-align: center; color: #94a3b8; font-size: 11px;">Jika Anda tidak merasa mendaftar di SiKelas, berarti email anda sedang dalam bahaya👹.</p>
                </div>
            `
        })

        if (error) {
            console.error('Gagal mengirim kode OTP:', error)
            return false
        }
        console.log(`OTP berhasil dikirim ke ${toEmail} (ID:${data?.id})`)
        return { success: true, emailId: data && data.id ? data.id : null }
    } catch (error) {
        console.error('Error kirim email:', error.message)
        return false
    }
}

/**
 * Kirim OTP khusus untuk Penggantian / Reset Password
 * @param {string} toEmail 
 * @param {string} otpCode 
 * @param {string} username 
 */
export async function sendPasswordOtpEmail(toEmail, otpCode, username) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Sikelas <noreply@sikelas.online>',
            to: [toEmail],
            subject: `🔐 Kode OTP Ubah Password SiKelas: ${otpCode}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
                <h2 style="text-align: center; color: #0f172a; margin-bottom: 8px;">🔐 SiKelas — Konfirmasi Ubah Password</h2>
                <p style="text-align: center; color: #64748b; font-size: 14px;">Halo <b>${username}</b>, berikut adalah Kode OTP untuk mengonfirmasi permintaan penggantian password akun Anda:</p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <div style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px;">
                        ${otpCode}
                    </div>
                </div>
                
                <p style="text-align: center; color: #94a3b8; font-size: 12px;">Kode OTP berlaku selama <b>15 menit</b>. Jangan berikan kode ini kepada siapapun.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="text-align: center; color: #94a3b8; font-size: 11px;">Jika Anda tidak merasa melakukan permintaan ubah password, segera abaikan pesan ini atau hubungi Admin.</p>
            </div>
            `
        })
        if (error) {
            console.error('Gagal mengirim OTP ubah password:', error)
            return false
        }
        console.log(`OTP ubah password berhasil dikirim ke ${toEmail} (ID:${data?.id})`)
        return true
    } catch (error) {
        console.error('Error kirim email OTP ubah password:', error.message)
        return false
    }
}

/**
 * Fungsi Pengiriman Email Notifikasi Status Reservasi (ACC / Ditolak)
 */
export async function sendReservationNotificationEmail(toEmail, username, status, roomName, date, timeSlot, note = '') {
    try {
        const isApproved = status === 'approved'
        const statusText = isApproved ? 'DISETUJUI (ACC)' : 'DITOLAK'
        const statusBadgeBg = isApproved ? '#166534' : '#991b1b'

        const { data, error } = await resend.emails.send({
            from: 'SiKelas <noreply@sikelas.online>',
            to: [toEmail],
            subject: `📌 Status Reservasi Ruangan SiKelas: ${statusText} (${roomName})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <div style="background: ${statusBadgeBg}; color: #ffffff; padding: 16px; border-radius: 8px; text-align: center;">
                        <h2 style="margin: 0; font-size: 18px;">Pengajuan Reservasi ${statusText}</h2>
                    </div>
                    
                    <p style="color: #334155; font-size: 14px; margin-top: 20px;">
                        Halo <b>${username}</b>, pengajuan peminjaman ruangan Anda telah diproses oleh Admin SiKelas:
                    </p>
                    
                    <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #1e293b;">
                        <p style="margin: 6px 0;">🏛️ <b>Ruangan:</b> ${roomName}</p>
                        <p style="margin: 6px 0;">📅 <b>Tanggal:</b> ${date}</p>
                        <p style="margin: 6px 0;">⏰ <b>Waktu:</b> ${timeSlot}</p>
                        ${note ? `<p style="margin: 6px 0; color: #dc2626; background: #fef2f2; padding: 8px; border-radius: 6px;">📝 <b>Catatan Admin:</b> ${note}</p>` : ''}
                    </div>

                    <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
                        SiKelas — Platform Smart Classroom UIN Walisongo Semarang
                    </p>
                </div>
            `
        })

        if (error) console.error('❌ Gagal kirim email notifikasi reservasi:', error)
        return !error
    } catch (err) {
        console.error('❌ Error email reservasi:', err.message)
        return false
    }
}

/**
 * Fungsi untuk memeriksa status pengiriman email langsung dari Resend API
 */
/**
 * Fungsi untuk memeriksa status pengiriman email langsung dari Resend API (Support EmailID & Alamat Email)
 */
export async function checkEmailDeliveryStatus(emailId, recipientEmail) {
    try {
        let targetId = emailId;

        // Fallback: Jika emailId tidak ada (misal server restart), cari dari daftar Resend terbaru
        if (!targetId && recipientEmail) {
            const list = await resend.emails.list();
            if (list.data && list.data.data) {
                const match = list.data.data.find(e => e.to && e.to.map(t => t.toLowerCase()).includes(recipientEmail.toLowerCase()));
                if (match) {
                    targetId = match.id;
                }
            }
        }

        if (!targetId) return { status: 'queued', isBounced: false };

        const { data, error } = await resend.emails.get(targetId);
        if (error || !data) return { status: 'unknown', isBounced: false };

        const lastEvent = data.last_event; // 'delivered', 'bounced', 'sent', 'queued'
        const isBounced = lastEvent === 'bounced';

        return {
            status: lastEvent,
            isBounced,
            bounceReason: data.bounce && data.bounce.message ? data.bounce.message : 'Email ditolak oleh server kampus penerima.'
        };
    } catch (err) {
        console.error('Error check delivery status:', err.message);
        return { status: 'unknown', isBounced: false };
    }
}
