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
        return true
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
