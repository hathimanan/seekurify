import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
// dotenv.config({ path: '.env.development' });
import express from 'express';
const router = express.Router();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET);

oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

async function sendResetEmail(email, resetCode) {
  const accessToken = await oauth2Client.getAccessToken();

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  const mailOptions = {
    from: `Seekurify Reset <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset Code',
    text: `Your password reset code is: ${resetCode}`,
    html: `<h2>Password Reset</h2><p>Your 6-digit reset code is: <strong>${resetCode}</strong></p>`,
  };

  await transport.sendMail(mailOptions);
}

export default sendResetEmail;
