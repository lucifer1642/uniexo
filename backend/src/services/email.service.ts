import { mailTransporter } from '../config/mail';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmailService {
  private static renderPremiumTemplate(title: string, content: string, cta?: { text: string, link: string }, badge?: string): string {
    const accentColor = '#a3e635'; // Lime 400
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            
            body { background-color: #050505; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            .wrapper { width: 100%; background-color: #050505; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
            .hero { background: #111; padding: 60px 40px; text-align: center; }
            .logo { font-size: 24px; font-weight: 900; color: ${accentColor}; letter-spacing: -1px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 6px 16px; background: rgba(163, 230, 53, 0.1); border: 1px solid rgba(163, 230, 53, 0.2); color: ${accentColor}; border-radius: 100px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 16px; }
            h1 { color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -1.5px; margin: 0; }
            .content { padding: 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center; }
            .highlight-box { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 24px; margin: 24px 0; text-align: left; }
            .otp-code { font-size: 40px; font-weight: 900; color: ${accentColor}; letter-spacing: 8px; text-align: center; margin: 16px 0; }
            .cta-button { display: inline-block; padding: 18px 32px; background-color: ${accentColor}; color: #000 !important; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px; text-transform: uppercase; }
            .footer { padding: 40px; text-align: center; font-size: 11px; color: #52525b; border-top: 1px solid rgba(255, 255, 255, 0.03); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="hero">
                <div class="logo">UNIEXO</div>
                ${badge ? `<div class="badge">${badge}</div>` : ''}
                <h1>${title}</h1>
              </div>
              <div class="content">
                ${content}
                ${cta ? `<div style="margin-top: 32px;"><a href="${cta.link}" class="cta-button">${cta.text}</a></div>` : ''}
              </div>
              <div class="footer">
                <p><strong>UniExo Ecosystem</strong> — Redefining Campus Life</p>
                <p>© 2026 UniExo Inc. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async sendOTP(email: string, otp: string, purpose: string): Promise<void> {
    const subjects: Record<string, string> = { signup: 'Ignite Your Journey! 🚀', 'password-reset': 'Unlock Your Account', 'email-verify': 'Verify Your Presence', 'login-verify': 'New Access Request' };
    const content = `<p>Activate your account or authorize access with the synchronization code below:</p><div class="highlight-box"><div class="otp-code">${otp}</div><p style="text-align: center; font-size: 11px; color: #52525b; margin: 0;">VALID FOR 5 MINUTES</p></div>`;
    try {
      await mailTransporter.sendMail({ from: `"UniExo Nexus" <${env.SMTP_FROM}>`, to: email, subject: subjects[purpose] || 'Security Code - UniExo', html: this.renderPremiumTemplate(subjects[purpose] || 'Security Alert', content, undefined, 'SECURITY PROTOCOL') });
    } catch (error) { logger.error('Failed to send OTP:', error); throw new Error('Failed to send OTP'); }
  }

  static async sendKycStatusEmail(email: string, name: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    const isApproved = status === 'approved';
    const content = isApproved ? `<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndzRxd3RndzRxd3RndzRxd3RndzRxd3RndzRxd3RndzRxd3RndzRxd3ZpZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif" width="100" style="border-radius: 12px; margin-bottom: 24px;"><p>Congratulations <strong>${name}</strong>, your identity has been verified. You now have full access to the UniExo ecosystem.</p><div class="highlight-box"><strong>UNLOCKED:</strong><ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;"><li>Premium Listings</li><li>Vendor Privileges</li><li>Verified Badge</li></ul></div>` : `<p>Verification failed for <strong>${name}</strong>.</p><div class="highlight-box" style="border-color: #ef4444;"><strong>REASON:</strong><p style="margin-top: 5px;">${reason || 'Document mismatch or lack of clarity.'}</p></div><p>Please resubmit your documents in the Command Center.</p>`;
    try {
      await mailTransporter.sendMail({ from: `"UniExo Compliance" <${env.SMTP_FROM}>`, to: email, subject: isApproved ? 'Verified Circle Unlocked! 🌟' : 'Action Required: KYC Update', html: this.renderPremiumTemplate(isApproved ? 'Identity Verified' : 'Verification Failed', content, { text: 'Launch Hub', link: `${env.CLIENT_URL}/dashboard` }, isApproved ? 'VERIFIED' : 'FAILED') });
    } catch (error) { logger.error('Failed to send KYC email:', error); }
  }

  static async sendBookingConfirmation(userEmail: string, vendorEmail: string, details: any): Promise<void> {
    const userContent = `<p>Your booking for <strong>${details.serviceName}</strong> is confirmed! 🚀</p><div class="highlight-box"><strong>DETAILS:</strong><ul style="margin-top: 10px;"><li><strong>ID:</strong> ${details.bookingId}</li><li><strong>Dates:</strong> ${details.startDate} - ${details.endDate}</li><li><strong>Paid:</strong> ₹${details.amount}</li></ul></div>`;
    try {
      await mailTransporter.sendMail({ from: `"UniExo Bookings" <${env.SMTP_FROM}>`, to: userEmail, subject: `Confirmed: ${details.serviceName} ⚡`, html: this.renderPremiumTemplate('Mission Confirmed', userContent, { text: 'View Dashboard', link: `${env.CLIENT_URL}/dashboard` }, 'SUCCESS') });
    } catch (error) { logger.error('Failed to send booking confirmation:', error); }
  }

  static async sendBookingCreatedNotification(userEmail: string, vendorEmail: string, details: any): Promise<void> {
    const userContent = `<p>Your request for <strong>${details.serviceName}</strong> has been transmitted and is awaiting vendor synchronization.</p><div class="highlight-box"><strong>STATUS:</strong> PENDING APPROVAL</div>`;
    try {
      await mailTransporter.sendMail({ from: `"UniExo Nexus" <${env.SMTP_FROM}>`, to: userEmail, subject: `Request Received: ${details.serviceName}`, html: this.renderPremiumTemplate('Transmission Received', userContent, undefined, 'PENDING') });
    } catch (error) { logger.error('Failed to send booking created email:', error); }
  }

  static async sendOfferAcceptedEmail(buyerEmail: string, details: any): Promise<void> {
    const content = `<p>Your offer for <strong>${details.itemTitle}</strong> was accepted! 🎉</p><div class="highlight-box"><strong>DEAL:</strong> ₹${details.offeredPrice}</div><p>Coordinate with the seller to finalize the deal.</p>`;
    try {
      await mailTransporter.sendMail({ from: `"UniExo Marketplace" <${env.SMTP_FROM}>`, to: buyerEmail, subject: `Offer Accepted: ${details.itemTitle}`, html: this.renderPremiumTemplate('Offer Accepted!', content, undefined, 'DEAL FOUND') });
    } catch (error) { logger.error('Failed to send offer accepted email:', error); }
  }

  static async sendGenericNotification(email: string, title: string, message: string, metadata?: any): Promise<void> {
    const content = `<p>${message}</p>${metadata ? `<div class="highlight-box" style="font-family: monospace; font-size: 11px; opacity: 0.7;">${JSON.stringify(metadata, null, 2)}</div>` : ''}`;
    try {
      await mailTransporter.sendMail({ from: `"UniExo Nexus" <${env.SMTP_FROM}>`, to: email, subject: title, html: this.renderPremiumTemplate(title, content, undefined, 'SYSTEM ALERT') });
    } catch (error) { logger.error('Failed to send generic email:', error); }
  }
}
