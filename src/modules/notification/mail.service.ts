import 'dotenv/config';
import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
  throw new Error('SMTP_USER and SMTP_PASS are required');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  const verificationUrl = new URL('/api/v1/auth/verify-email', baseUrl);
  verificationUrl.searchParams.set('token', token);

  await transporter.sendMail({
    from: { name: 'BandUp', address: smtpUser },
    to: email,
    subject: 'Verify your BandUp account',
    text: `Click this link to verify your BandUp account:\n${verificationUrl.toString()}\n\nThis link expires in 30 minutes.`,
  });
}
