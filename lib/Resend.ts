import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ganti "onboarding@resend.dev" nanti kalau domain udah diverifikasi di Resend
// buat sekarang (belum verifikasi domain), WAJIB pake alamat ini biar bisa kirim
const FROM_EMAIL = "MyClass <onboarding@resend.dev>";

export async function sendOtpEmail(toEmail: string, nama: string, otp: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Kode OTP Reset Password MyClass",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #00D2D9;">MyClass</h2>
        <p>Halo <strong>${nama}</strong>,</p>
        <p>Berikut kode OTP untuk mengubah password akun MyClass anda:</p>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 13px;">
          Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
          Jika anda tidak meminta perubahan password, abaikan email ini.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Gagal kirim email OTP:", error);
    throw new Error("Gagal mengirim email OTP.");
  }

  return data;
}