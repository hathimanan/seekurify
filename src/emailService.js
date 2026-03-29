import nodemailer from "nodemailer";
import { google } from "googleapis";

async function createTransporter() {
  // read env at call time (avoid using module-top cached values)
  const GMAIL_CLIENT_ID = (process.env.GMAIL_CLIENT_ID || "").trim();
  const GMAIL_CLIENT_SECRET = (process.env.GMAIL_CLIENT_SECRET || "").trim();
  const GMAIL_REFRESH_TOKEN = (process.env.GMAIL_REFRESH_TOKEN || "").trim();
  const GMAIL_USER = (process.env.GMAIL_USER || "").trim();

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_USER) {
    throw new Error("No valid Gmail OAuth2 credentials found (GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN/GMAIL_USER required)");
  }

  const oAuth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  // getAccessToken may return a string or an object { token: string }
  const accessTokenResult = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenResult?.token ?? accessTokenResult;

  if (!accessToken) {
    throw new Error("Failed to obtain Gmail access token via refresh token");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL_USER,
      clientId: GMAIL_CLIENT_ID,
      clientSecret: GMAIL_CLIENT_SECRET,
      refreshToken: GMAIL_REFRESH_TOKEN,
      accessToken,
    },
  });
}

export async function sendWatchAlertsEmail(toEmail, alerts) {
  const transporter = await createTransporter();

  const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', improvement: '🟢' };

  const alertRows = alerts.map(a => {
    const emoji = severityEmoji[a.severity] ?? '⚪';
    const delta = a.scoreDelta !== 0
      ? `<span style="color:${a.scoreDelta < 0 ? '#dc2626' : '#16a34a'}">${a.scoreDelta > 0 ? '+' : ''}${a.scoreDelta} pts</span>`
      : '';
    return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:10px 8px">${emoji} <strong>${a.severity.toUpperCase()}</strong></td>
        <td style="padding:10px 8px;font-family:monospace;font-size:13px">${a.hostname}</td>
        <td style="padding:10px 8px">${a.newScore}/100 ${delta}</td>
        <td style="padding:10px 8px;color:#374151">${a.summary}</td>
      </tr>`;
  }).join('');

  const mailOptions = {
    from: `Seekurify <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Seekurify Watch Agent — ${alerts.length} security alert${alerts.length > 1 ? 's' : ''} detected`,
    html: `
      <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5;margin-bottom:4px">🔍 Seekurify Watch Agent</h2>
        <p style="color:#6b7280;margin-top:0">Security changes were detected during your latest scan.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
          <thead>
            <tr style="background:#f3f4f6;text-align:left">
              <th style="padding:10px 8px">Severity</th>
              <th style="padding:10px 8px">Host</th>
              <th style="padding:10px 8px">Score</th>
              <th style="padding:10px 8px">Summary</th>
            </tr>
          </thead>
          <tbody>${alertRows}</tbody>
        </table>
        <p style="margin-top:24px;font-size:13px;color:#9ca3af">
          Log in to Seekurify to view full details and mark alerts as read.
        </p>
      </div>`,
  };

  return transporter.sendMail(mailOptions);
}

export default async function sendResetEmail(toEmail, resetCode) {
  const transporter = await createTransporter();

  const mailOptions = {
    from: `Seekurify <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Seekurify — Password reset code",
    html: `
      <p>Your password reset code is <strong>${resetCode}</strong>.</p>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}
