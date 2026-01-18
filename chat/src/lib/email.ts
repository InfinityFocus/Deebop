import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'Deebop Chat <noreply@deebop.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify your Deebop Chat account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #06b6d4; font-size: 32px; margin: 0;">Deebop Chat</h1>
              </div>

              <div style="background-color: #111111; border-radius: 16px; padding: 40px; border: 1px solid #333333;">
                <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">
                  Welcome, ${name}!
                </h2>

                <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  Thanks for signing up for Deebop Chat. Please verify your email address by clicking the button below to complete your registration.
                </p>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #10b981); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 12px;">
                    Verify Email Address
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                  This link will expire in 24 hours. If you didn't create a Deebop Chat account, you can safely ignore this email.
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <p style="color: #4b5563; font-size: 12px; margin: 0;">
                  If the button doesn't work, copy and paste this link:
                </p>
                <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
                  ${verifyUrl}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

export function generateVerificationToken(): string {
  // Generate a random 32-character hex string
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getVerificationExpiry(): Date {
  // Token expires in 24 hours
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}
