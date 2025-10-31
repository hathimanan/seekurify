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
