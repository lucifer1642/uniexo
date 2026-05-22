export function genericEmailTemplate(title: string, body: string): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #a3e635; font-size: 28px; font-weight: 900; margin: 0 0 8px;">UniExo</h1>
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Notification</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #fff; font-size: 18px; font-weight: 700; margin: 0 0 16px;">${title}</h2>
      <p style="color: #aaa; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body}</p>
      <p style="color: #444; font-size: 11px; margin: 0; border-top: 1px solid #222; padding-top: 16px;">This is an automated message from UniExo. Please do not reply.</p>
    </div>
  </div>`;
}
