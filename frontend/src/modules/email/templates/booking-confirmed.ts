import { SITE_URL } from '../email.config';

export function bookingConfirmedTemplate(name: string, serviceName: string, amount: number): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #a3e635; font-size: 28px; font-weight: 900; margin: 0;">UniExo</h1>
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 4px 0 0;">Booking Confirmed</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #fff; font-size: 18px; font-weight: 700; margin: 0 0 16px;">Hi ${name}! ✅</h2>
      <div style="background: #111; border-radius: 16px; padding: 20px; margin: 0 0 20px;">
        <p style="color: #aaa; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Service</p>
        <p style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 16px;">${serviceName}</p>
        <p style="color: #aaa; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
        <p style="color: #a3e635; font-size: 24px; font-weight: 900; margin: 0;">₹${amount.toLocaleString()}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin: 0;">View details at <a href="${SITE_URL}/orders" style="color: #a3e635;">${SITE_URL.replace('https://', '')}/orders</a></p>
    </div>
  </div>`;
}
