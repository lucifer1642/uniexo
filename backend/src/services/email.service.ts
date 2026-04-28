import { mailTransporter } from '../config/mail';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmailService {
  private static renderBaseTemplate(title: string, content: string, cta?: { text: string, link: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            .email-container {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              border: 1px solid #e2e8f0;
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 900;
              letter-spacing: -1px;
            }
            .content {
              padding: 40px 30px;
              color: #1e293b;
              line-height: 1.6;
            }
            .greeting {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 20px;
              color: #0f172a;
            }
            .highlight-box {
              background-color: #f8fafc;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              border: 1px solid #f1f5f9;
            }
            .otp-code {
              font-size: 36px;
              font-weight: 900;
              color: #2563eb;
              letter-spacing: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .cta-button {
              display: inline-block;
              padding: 16px 32px;
              background-color: #2563eb;
              color: white !important;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 700;
              margin-top: 20px;
              transition: transform 0.2s;
            }
            .footer {
              padding: 30px;
              background-color: #f1f5f9;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
            .footer p { margin: 5px 0; }
          </style>
        </head>
        <body style="background-color: #f8fafc; padding: 20px 0;">
          <div class="email-container">
            <div class="header">
              <h1>UniExo</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello,</div>
              ${content}
              ${cta ? `<div style="text-align: center;"><a href="${cta.link}" class="cta-button">${cta.text}</a></div>` : ''}
            </div>
            <div class="footer">
              <p><strong>UniExo Platform</strong> — India's Largest Multi-Service Hub</p>
              <p>Sent with ❤️ from our headquarters</p>
              <p>© 2026 UniExo Inc. All rights reserved.</p>
              <p style="margin-top: 15px; opacity: 0.6;">If you didn't expect this email, please ignore it or contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async sendOTP(email: string, otp: string, purpose: string): Promise<void> {
    const subjects: Record<string, string> = {
      signup: 'Welcome to UniExo! 🚀',
      'password-reset': 'Reset Your Password',
      'email-verify': 'Verify Your Email Address',
      'login-verify': 'New Login Attempt Detected',
    };

    const messages: Record<string, string> = {
      signup: 'We are thrilled to have you join the UniExo community. To complete your registration, please use the following verification code:',
      'password-reset': 'We received a request to reset your password. Use the code below to proceed with the reset:',
      'email-verify': 'Please verify your email address to ensure you receive all future notifications. Your code is:',
      'login-verify': 'A new login attempt was made on your account. If this was you, use this code to authorize the device:',
    };

    const content = `
      <p style="font-size: 16px; color: #475569;">${messages[purpose] || 'Your security code is ready. Please enter it to proceed:'}</p>
      <div class="highlight-box">
        <div class="otp-code">${otp}</div>
        <p style="text-align: center; font-size: 13px; color: #94a3b8; margin: 0;">This code will expire in 5 minutes.</p>
      </div>
    `;

    try {
      await mailTransporter.sendMail({
        from: `"UniExo Notifications" <${env.SMTP_FROM}>`,
        to: email,
        subject: subjects[purpose] || 'Verification Code - UniExo',
        html: this.renderBaseTemplate(subjects[purpose] || 'Security Alert', content),
      });
      logger.info(`OTP sent to ${email} for ${purpose}`);
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  static async sendBookingConfirmation(
    userEmail: string,
    vendorEmail: string,
    details: {
      serviceName: string;
      serviceType: string;
      bookingId: string;
      amount: number;
      startDate: string;
      endDate: string;
      vendorPhone?: string;
    }
  ): Promise<void> {
    try {
      const userContent = `
        <p>Your payment was successful and your booking for <strong>${details.serviceName}</strong> is now confirmed! 🎉</p>
        <div class="highlight-box">
          <p style="margin: 0; font-weight: 700; color: #0f172a;">Booking Details:</p>
          <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #475569;">
            <li><strong>ID:</strong> ${details.bookingId}</li>
            <li><strong>Category:</strong> ${details.serviceType}</li>
            <li><strong>Dates:</strong> ${details.startDate} to ${details.endDate}</li>
            <li><strong>Total Paid:</strong> ₹${details.amount.toLocaleString()}</li>
            ${details.vendorPhone ? `<li><strong>Vendor Contact:</strong> ${details.vendorPhone}</li>` : ''}
          </ul>
        </div>
        <p>You can manage your booking and view more details in your dashboard.</p>
      `;

      await mailTransporter.sendMail({
        from: `"UniExo Bookings" <${env.SMTP_FROM}>`,
        to: userEmail,
        subject: `Confirmed: ${details.serviceName} 🏠`,
        html: this.renderBaseTemplate('Booking Confirmed', userContent, { text: 'View Dashboard', link: `${env.CLIENT_URL}/dashboard` }),
      });

      const vendorContent = `
        <p>Great news! A customer has successfully booked your listing: <strong>${details.serviceName}</strong>.</p>
        <div class="highlight-box" style="background-color: #ecfdf5; border-color: #d1fae5;">
          <p style="margin: 0; font-weight: 700; color: #065f46;">New Order Summary:</p>
          <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #065f46;">
            <li><strong>Booking ID:</strong> ${details.bookingId}</li>
            <li><strong>Check-in/Start:</strong> ${details.startDate}</li>
            <li><strong>Check-out/End:</strong> ${details.endDate}</li>
            <li><strong>Net Earnings:</strong> ₹${details.amount.toLocaleString()}</li>
          </ul>
        </div>
        <p>Please prepare for the service and contact the user if necessary.</p>
      `;

      await mailTransporter.sendMail({
        from: `"UniExo Vendor Alert" <${env.SMTP_FROM}>`,
        to: vendorEmail,
        subject: `New Sale: ${details.serviceName} 💰`,
        html: this.renderBaseTemplate('New Booking Alert', vendorContent, { text: 'Manage Order', link: `${env.CLIENT_URL}/vendor/dashboard` }),
      });

      logger.info(`Booking confirmation emails sent for ${details.bookingId}`);
    } catch (error) {
      logger.error('Failed to send booking confirmation emails:', error);
    }
  }

  static async sendBookingCreatedNotification(
    userEmail: string,
    vendorEmail: string,
    details: {
      serviceName: string;
      serviceType: string;
      bookingId: string;
      amount: number;
      startDate: string;
      endDate: string;
      paymentMethod: string;
    }
  ): Promise<void> {
    try {
      const userContent = `
        <p>Your request for <strong>${details.serviceName}</strong> has been received and is currently being processed.</p>
        <div class="highlight-box">
          <p><strong>Booking ID:</strong> ${details.bookingId}</p>
          <p><strong>Status:</strong> Pending Vendor Confirmation</p>
          <p><strong>Method:</strong> ${details.paymentMethod}</p>
        </div>
        <p>We'll notify you as soon as the vendor responds!</p>
      `;

      await mailTransporter.sendMail({
        from: `"UniExo Platform" <${env.SMTP_FROM}>`,
        to: userEmail,
        subject: `Request Received: ${details.serviceName}`,
        html: this.renderBaseTemplate('Booking Request Received', userContent),
      });

      const vendorContent = `
        <p>You have a new booking request for <strong>${details.serviceName}</strong>. Please review it at your earliest convenience.</p>
        <div class="highlight-box">
          <p><strong>Request ID:</strong> ${details.bookingId}</p>
          <p><strong>Payment Method:</strong> ${details.paymentMethod}</p>
          <p><strong>Estimated Earnings:</strong> ₹${details.amount.toLocaleString()}</p>
        </div>
      `;

      await mailTransporter.sendMail({
        from: `"UniExo Vendor Alert" <${env.SMTP_FROM}>`,
        to: vendorEmail,
        subject: `Action Required: New Request for ${details.serviceName}`,
        html: this.renderBaseTemplate('New Request Received', vendorContent, { text: 'Review Request', link: `${env.CLIENT_URL}/vendor/bookings` }),
      });
    } catch (error) {
      logger.error('Failed to send booking request emails:', error);
    }
  }

  static async sendOfferAcceptedEmail(
    buyerEmail: string,
    details: {
      itemTitle: string;
      offeredPrice: number;
      sellerName: string;
      sellerEmail: string;
      sellerPhone: string;
      message?: string;
    }
  ): Promise<void> {
    try {
      const content = `
        <p>Great news! Your offer for <strong>${details.itemTitle}</strong> has been <strong>accepted</strong>. 🎉</p>
        <div class="highlight-box" style="background-color: #f0f9ff; border-color: #bae6fd;">
          <p style="margin: 0; font-weight: 700; color: #0369a1;">Transaction Details:</p>
          <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #0369a1;">
            <li><strong>Final Price:</strong> ₹${details.offeredPrice.toLocaleString()}</li>
            <li><strong>Seller:</strong> ${details.sellerName}</li>
            <li><strong>Email:</strong> ${details.sellerEmail}</li>
            <li><strong>Phone:</strong> ${details.sellerPhone}</li>
          </ul>
        </div>
        ${details.message ? `<p style="font-style: italic; color: #64748b;">" ${details.message} "</p>` : ''}
        <p>Please coordinate directly with the seller to finalize the deal.</p>
      `;

      await mailTransporter.sendMail({
        from: `"UniExo Marketplace" <${env.SMTP_FROM}>`,
        to: buyerEmail,
        subject: `Offer Accepted: ${details.itemTitle}`,
        html: this.renderBaseTemplate('Offer Accepted!', content),
      });
    } catch (error) {
      logger.error('Failed to send offer accepted email:', error);
    }
  }

  static async sendGenericNotification(
    email: string,
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      const content = `
        <p style="font-size: 16px; color: #475569;">${message}</p>
        ${metadata ? `<div class="highlight-box"><pre style="font-size: 12px; margin:0;">${JSON.stringify(metadata, null, 2)}</pre></div>` : ''}
      `;

      await mailTransporter.sendMail({
        from: `"UniExo Notifications" <${env.SMTP_FROM}>`,
        to: email,
        subject: title,
        html: this.renderBaseTemplate(title, content),
      });
    } catch (error) {
      logger.error(`Failed to send notification email to ${email}:`, error);
    }
  }
}
