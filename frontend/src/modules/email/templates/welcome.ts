import { SITE_URL } from '../email.config';

export function welcomeEmailTemplate(name: string): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #a3e635; font-size: 28px; font-weight: 900; margin: 0 0 8px;">UniExo</h1>
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Welcome Aboard</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 12px;">Hi ${name}! 🎉</h2>
      <p style="color: #aaa; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        Your UniExo account has been created successfully. You now have access to:
      </p>
      <ul style="color: #ccc; font-size: 13px; line-height: 2; padding-left: 20px; margin: 0 0 24px;">
        <li>🚗 Vehicle Rentals (Cars & Bikes)</li>
        <li>🏠 PG & Room Listings</li>
        <li>👕 Laundry Services</li>
        <li>🛒 Student Marketplace</li>
      </ul>
      <p style="color: #666; font-size: 12px; margin: 0;">Start exploring at <a href="${SITE_URL}" style="color: #a3e635; text-decoration: none;">${SITE_URL.replace('https://', '')}</a></p>
    </div>
  </div>`;
}
