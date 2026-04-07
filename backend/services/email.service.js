import nodemailer from "nodemailer";

const createTransporter = () =>
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // STARTTLS on port 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS?.replace(/\s/g, ""), // strip any accidental spaces
        },
    });

export const sendVerificationEmail = async (email, name, token) => {
    const transporter = createTransporter();
    const verifyUrl = `${process.env.CLIENT_URL}verify-email?token=${token}`;

    try {
        const info = await transporter.sendMail({
            from: `"LocalLink" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Verify your LocalLink email address",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#2563eb;border-radius:10px;">
                            <div style="width:24px;height:24px;border:3px solid #fff;border-radius:50%;"></div>
                        </div>
                        <h1 style="color:#fff;font-size:22px;margin:16px 0 4px;">LocalLink</h1>
                    </div>
                    <h2 style="color:#fff;font-size:18px;margin-bottom:8px;">Hi ${name}, confirm your email</h2>
                    <p style="color:#94a3b8;line-height:1.6;margin-bottom:24px;">
                        Thanks for signing up. Click the button below to verify your email address and activate your account.
                    </p>
                    <a href="${verifyUrl}" style="display:block;text-align:center;background:#2563eb;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:600;font-size:15px;">
                        Verify Email Address
                    </a>
                    <p style="color:#475569;font-size:12px;margin-top:24px;text-align:center;">
                        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
            `,
        });
        console.log(`[Email] Verification email sent to ${email} — MessageId: ${info.messageId}`);
    } catch (err) {
        console.error(`[Email] Failed to send to ${email}:`, err.message);
        throw err; // re-throw so the caller knows it failed
    }
};
