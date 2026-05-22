export function otpEmailTemplate(code: string): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #a3e635; font-size: 28px; font-weight: 900; margin: 0 0 8px;">UniExo</h1>
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Verification Code</p>
    </div>
    <div style="padding: 32px; text-align: center;">
      <p style="color: #ccc; font-size: 14px; margin: 0 0 24px;">Enter this code to verify your identity:</p>
      <div style="background: #111; border: 2px solid #a3e635; border-radius: 16px; padding: 20px; margin: 0 0 24px;">
        <span style="color: #a3e635; font-size: 36px; font-weight: 900; letter-spacing: 12px;">${code}</span>
      </div>
      <p style="color: #666; font-size: 12px; margin: 0;">This code expires in <strong style="color: #a3e635;">10 minutes</strong>.</p>
      <p style="color: #444; font-size: 11px; margin: 16px 0 0;">If you didn't request this, please ignore this email.</p>
    </div>
  </div>`;
}
