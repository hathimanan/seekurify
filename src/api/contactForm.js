import express from 'express';
import jwt from 'jsonwebtoken';
import Contact from '../models/Contact.js'; // ✅ Ensure correct model path
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
dotenv.config();

const contactRouter = express.Router();
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});


async function sendEmail({ to, subject, text }) {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      }
    });

    const mailOptions = {
      from: `Securify <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", result.response);
  } catch (err) {
    console.error("❌ Email error:", err.message || err);
  }
}

// 🔐 JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing in Authorization header' });
  }

  const secret = process.env.JWT_SECRET || process.env.secretKey;

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}

// 📩 POST /contact - Submit a contact message (protected route)
contactRouter.post('/contact', authenticateToken, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newMessage = new Contact({ name, email, subject, message });
    await newMessage.save();

    // ✉️ Use the OAuth2 sendEmail helper
    await sendEmail({
      to: process.env.MAIL_USER, // Your inbox
      subject: `Contact Form: ${subject}`,
      text: `
        You have a new message from the contact form:

        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `
    });

    res.status(200).json({ message: 'Message received and email sent successfully' });
  } catch (error) {
    console.error("❌ Contact submission or email failed:", error.message);
    res.status(500).json({ error: 'Server error while submitting contact' });
  }
});

export default contactRouter;
