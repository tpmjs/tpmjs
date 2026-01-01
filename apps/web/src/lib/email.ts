import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors when RESEND_API_KEY is not set
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const { error } = await getResend().emails.send({
    from: 'TPMJS <noreply@tpmjs.com>',
    to,
    subject: 'Verify your email - TPMJS',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Verify your email</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Click the button below to verify your email address and complete your registration.
          </p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500;">
            Verify Email
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't create an account on TPMJS, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}
