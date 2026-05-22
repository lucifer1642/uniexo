import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL_SERVICE_MOCK] Sending to: ${to}`);
    console.log(`[EMAIL_SERVICE_MOCK] Subject: ${subject}`);
    return { success: true, mock: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'UniExo <noreply@uniexo.in>',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[EMAIL_SERVICE] Error:', err.message);
    return { success: false, error: err.message };
  }
}

export const emailService = {
  sendEmail: async (to: string, subject: string, content: string) => 
    sendEmail({ to, subject, html: content }),

  /**
   * Template for Booking Confirmation
   */
  async sendBookingConfirmation(to: string, details: { bookingId: string, amount: number, service: string }) {
    const html = `
      <h1>Booking Confirmed!</h1>
      <p>Your booking for ${details.service} has been confirmed.</p>
      <p>Booking ID: ${details.bookingId}</p>
      <p>Amount Paid: ₹${details.amount}</p>
      <p>Thank you for choosing UniExo.</p>
    `;
    return this.sendEmail(to, 'Booking Confirmation - UniExo', html);
  },

  /**
   * Template for Vendor Notification
   */
  async sendVendorNewOrder(to: string, details: { bookingId: string, customer: string }) {
    const html = `
      <h1>New Booking Request!</h1>
      <p>You have a new booking request from ${details.customer}.</p>
      <p>Booking ID: ${details.bookingId}</p>
      <p>Please log in to your dashboard to manage this request.</p>
    `;
    return this.sendEmail(to, 'New Booking Request - UniExo', html);
  }
};
