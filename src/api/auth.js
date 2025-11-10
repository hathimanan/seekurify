// Only disable TLS certificate verification in development
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.log("⚠️ TLS certificate verification is disabled in development");
} else {
  // Production / Staging: keep TLS checks enabled
  console.log("🔒 TLS certificate verification is enabled");
}

import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.ts';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import validator from 'validator'; // npm install validator
import LoginEvent from '../models/LoginEvent.model.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import PasswordChangeEvent from '../models/PasswordChangeEvent.model.js';
import { getPasswordStrength } from '../models/User.ts';
import Razorpay from "razorpay";
import Trial from "../models/Trial.js";
import requestIp from 'request-ip';
import axios from 'axios';            // ← you reference axios but never imported
import { pushAlert } from '../realtime/socketHub.js';
import { UAParser } from 'ua-parser-js'; // Add this import at the top
import Notification from '../models/Notification.model.js';
import mongoose from 'mongoose';

import sendResetEmail from '../emailService.js' ;
const NODE_ENV = process.env.NODE_ENV || "development";
dotenv.config({
  path: NODE_ENV === "production"
    ? ".env.production"
    : NODE_ENV === "test"
    ? ".env.test"
    : ".env.development"
});
const OAuth2 = google.auth.OAuth2;
const app = express();
const authRouter = express.Router();
// const userPasswords = new Map();
const secretKeyOTP = process.env.secretKeyOTP ?? 'otp_secret_key';
if (!process.env.JWT_SECRET || !secretKeyOTP) {
  throw new Error("JWT secret keys are not properly defined in environment variables.");
}

// Custom function to send email
async function sendSuspiciousLoginEmail(ip, email) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN
      }
    });

   const htmlContent = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #d9534f;">⚠️ Suspicious Login Detected</h2>
    <p>We noticed multiple failed login attempts to your <strong>Seekurify</strong> account from the following IP address:</p>
    <p style="background-color: #f8d7da; padding: 10px; border-radius: 5px; font-weight: bold;">${ip}</p>
    <p>If this wasn’t you, we strongly recommend you:</p>
    <ul>
      <li>Reset your password immediately</li>
      <li>
        Review your account security settings <br/>
        <span style="font-size: 14px;">
          Want to Report the incident to Government Official Cybercrime Portal? 
          <a href="https://cybercrime.gov.in/Webform/Crime_AuthoLogin.aspx" target="_blank" style="color: #007bff; text-decoration: underline;">
            Click here
          </a>
        </span>
      </li>
    </ul>
    <a href="${process.env.REACT_APP_BASE_URL}/reset-password" 
       style="display: inline-block; padding: 10px 20px; margin: 10px 0; background-color: #d9534f; color: #fff; text-decoration: none; border-radius: 5px;">
       Reset Password
    </a>
    <p style="font-size: 12px; color: #666;">If you did attempt to login, you can safely ignore this message.</p>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Seekurify. All rights reserved.</p>
  </div>
`;


    await transporter.sendMail({
      from: 'Seekurify <no-reply@Seekurify.com>',
      to: email,
      subject: 'Suspicious Login Attempts Detected',
      html: htmlContent
    });

    console.log('⚠️ Suspicious login email sent.');
  } catch (error) {
    console.error('Error sending suspicious login email:', error);
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },

handler: async (req, res, next, options) => {
  try {
    const clientIp = requestIp.getClientIp(req) || req.headers['x-real-ip'] || req.ip;
    const userAgent = req.get('User-Agent');
    const targetEmail = req.body?.email || process.env.ADMIN_EMAIL;

    let ipDetails = {};
    try {
      const response = await axios.get(`https://ipinfo.io/${clientIp}/json`);
      ipDetails = response.data;
    } catch (err) {
      console.error('IP Lookup failed:', err.message);
    }

    const isSuspicious =
      ipDetails.org?.toLowerCase().includes('vpn') ||
      ipDetails.org?.toLowerCase().includes('hosting') ||
      ipDetails.org?.toLowerCase().includes('cloud');

    await LoginEvent.create({
      userId: null,
      success: false,
      ipAddress: clientIp,
      userAgent,
      timestamp: new Date(),
      reason: isSuspicious ? 'Rate limit hit from suspected VPN/Proxy' : 'Rate limit hit',
      geoLocation: ipDetails.city
        ? `${ipDetails.city}, ${ipDetails.region}, ${ipDetails.country}`
        : 'Unknown',
    });

    // 🔔 Email to account email (if provided) or admin
    await sendSuspiciousLoginEmail(clientIp, targetEmail);

    // 🔔 Optional: if the email belongs to a user who is currently logged in, push a realtime alert
    if (req.body?.email) {
      const victim = await User.findOne({ email: req.body.email }).select('_id');
      if (victim?._id) {
        pushAlert(String(victim._id), "suspiciousLogin", {
          type: "rate_limited",
          ip: clientIp,
          org: ipDetails?.org || "Unknown",
          location: ipDetails?.city ? `${ipDetails.city}, ${ipDetails.region}, ${ipDetails.country}` : "Unknown",
          userAgent,
          at: new Date().toISOString(),
          message: "Multiple rapid login attempts detected (possible VPN/Proxy).",
        });
      }
    }

return res.status(options.statusCode).json({
  status: "suspicious",
  error: "Too many login attempts. Please try again later.",
  details: {
    ip: clientIp,
    org: ipDetails?.org || "Unknown",
    location: ipDetails?.city
      ? `${ipDetails.city}, ${ipDetails.region}, ${ipDetails.country}`
      : "Unknown",
    reason: isSuspicious
      ? "Rate limit hit from suspected VPN/Proxy"
      : "Rate limit hit",
  },
});
  } catch (err) {
    console.error('Login limiter handler error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
},
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;

    next();
          console.log('Decoded user in middleware:', user)

  });
}


authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = requestIp.getClientIp(req) || req.ip;
  const userAgent = req.get('User-Agent');

  if (!email || !password) {
    return res.status(400).json({ field: 'email', error: 'Email and password are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ field: 'email', error: 'Invalid email format' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      await LoginEvent.create({ userId: null, success: false, ipAddress, userAgent, timestamp: new Date() });
      return res.status(401).json({ field: 'email', error: 'Incorrect email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await LoginEvent.create({ userId: user._id, success: false, ipAddress, userAgent, timestamp: new Date() });

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentFails = await LoginEvent.countDocuments({
        userId: user._id,
        success: false,
        timestamp: { $gte: fiveMinAgo },
        ipAddress,
      });

      if (recentFails >= 3 && typeof pushAlert === "function") {
        pushAlert(String(user._id), "suspiciousLogin", {
          type: "bruteforce",
          ip: ipAddress,
          userAgent,
          at: new Date().toISOString(),
          message: `Multiple failed password attempts from ${ipAddress}.`,
          count: recentFails
        });
        sendSuspiciousLoginEmail?.(ipAddress, user.email).catch(()=>{});
      }

      return res.status(401).json({ field: 'password', error: 'Incorrect email or password' });
    }

    // Successful login
    await LoginEvent.create({ userId: user._id, success: true, ipAddress, userAgent, timestamp: new Date() });

    const isNewIp = user.lastIp && user.lastIp !== ipAddress;
    const isNewUa = user.lastUa && user.lastUa !== userAgent;
    if ((isNewIp || isNewUa) && typeof pushAlert === "function") {
      pushAlert(String(user._id), "suspiciousLogin", {
        type: "anomalous_session",
        ip: ipAddress,
        userAgent,
        at: new Date().toISOString(),
        message: `Sign-in from a new ${isNewIp ? "IP" : ""}${isNewIp && isNewUa ? " & " : ""}${isNewUa ? "device" : ""}.`,
      });
      sendSuspiciousLoginEmail?.(ipAddress, user.email).catch(()=>{});
    }

    user.lastIp = ipAddress;
    user.lastUa = userAgent;
    user.passwordStrength = getPasswordStrength?.(req.body.password);
    await user.save();

    return res.json({ message: 'Login successful. Proceed to OTP.', user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_USER
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });


const resetTokens = new Map();

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric code
}

authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // ✅ Check if user with that email exists
    const user = await User.findOne({ email });

    if (!user) {
      // If user not found, return an error
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // If user exists, proceed with sending reset code
    const resetCode = generateResetCode();
    resetTokens.set(email, resetCode); // store in memory (or use DB/Redis in production)

    await sendResetEmail(email, resetCode);

    res.status(200).json({ message: 'Reset code sent to your email' });
  } catch (err) {
    console.error('Failed to send reset email:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

authRouter.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }

  // Find email by matching code
  const emailEntry = [...resetTokens.entries()].find(([email, code]) => code === token);

  if (!emailEntry) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const [email] = emailEntry;

  // Example password validation
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Save new password (you should hash this in real apps)
const hashedPassword = await bcrypt.hash(newPassword, 10);

await User.updateOne(
  { email },
  { $set: { password: hashedPassword } }
);
  // Clear reset token after use
  resetTokens.delete(email);

  console.log(`✅ Password reset for ${email}. New password stored.`);
  // Send HTTP 200 only — frontend will display its own modal/message
  return res.sendStatus(200);
});


authRouter.post('/send-otp', async (req, res) => {
  console.log("📬 /send-otp route called!");
  const { email } = req.body;

  try {
    // 🔍 1. Validate user existence
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // 🔢 2. Generate random OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔏 3. Sign OTP inside a JWT (valid for 10 mins)
    const otpToken = jwt.sign(
      { email, otp },
      process.env.secretKeyOTP,
      { expiresIn: '10m' }
    );

    // 🔐 4. Get a fresh Gmail access token
    const accessTokenObj = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenObj?.token;

    if (!accessToken) {
      console.error("❌ Failed to retrieve access token");
      return res.status(500).json({ error: 'Email service unavailable. Try again later.' });
    }

    // ✉️ 5. Create reusable transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken
      },
    });

    // 📨 6. Email Template
    const mailOptions = {
      from: `Seekurify 🔐 <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔒 Your One-Time Password (OTP)',
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #4a90e2; color: white; text-align: center; padding: 20px;">
            <h2>Seekurify</h2>
            <p style="margin: 0;">Your Secure OTP</p>
          </div>
          <div style="padding: 30px; text-align: center;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Use the OTP below to complete your login:</p>
            <p style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #4a90e2;">${otp}</p>
            <p style="font-size: 14px; color: #555;">This OTP will expire in <strong>10 minutes</strong>.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">If you did not request this OTP, please ignore this email.</p>
          </div>
          <div style="background-color: #f7f7f7; text-align: center; padding: 15px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Seekurify. All rights reserved.
          </div>
        </div>
      `,
    };

    // 🚀 7. Send the email
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", result.response);

    // 🎯 8. Respond with OTP token
    res.json({
      message: 'OTP sent successfully to your email.',
      otpToken,
    });

  } catch (err) {
    // 🧯 9. Handle Gmail token or sendMail errors
    if (err.message?.includes("invalid_grant")) {
      console.error("⚠️ Refresh token expired or revoked. Reauthorize Gmail API.");
    } else {
      console.error("❌ Error in /send-otp:", err.message);
    }
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});



authRouter.post('/verify-otp', async (req, res) => {
  const { email, otp, otpToken } = req.body;

  if (!email || !otp || !otpToken || typeof otp !== 'string' || otp.length !== 6) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const decoded = jwt.verify(otpToken, process.env.secretKeyOTP);

    if (decoded.email !== email) {
      return res.status(400).json({ error: 'Email does not match token' });
    }

    if (decoded.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error verifying OTP JWT:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'OTP expired' });
    }
    return res.status(400).json({ error: 'Invalid OTP token' });
  }
});




authRouter.post('/verify-pin', async (req, res) => {
  const { email, pin } = req.body;

  if (!email || !pin || typeof pin !== 'string' || pin.length !== 4) {
    return res.status(400).json({ error: 'Invalid PIN or email' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const storedPin = user.pin; // assume hashed PIN

    const isValidPin = await bcryptjs.compare(pin, storedPin);
    if (!isValidPin) return res.status(400).json({ error: 'Invalid PIN' });

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('❌ Error verifying PIN:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export const updatePin = async (req, res) => {
  const { email, newPin } = req.body;

  // Basic validation
  if (!email || !newPin || newPin.length !== 4) {
    return res.status(400).json({ message: 'Invalid email or PIN format' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hash the new PIN before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    user.pin = hashedPin;
    await user.save();

    return res.status(200).json({ message: 'PIN updated successfully' });
  } catch (err) {
    console.error('Error updating PIN:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

authRouter.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const count = await LoginEvent.countDocuments({ userId });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching login events' });
  }
});


authRouter.get('/user', async (req, res) => {
  const { pin } = req.query;

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  try {
    const user = await User.findOne({ pin });

    if (!user) {
      return res.status(404).json({ error: 'User not found for provided PIN' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
      pin: user.pin, // You can omit this if it’s sensitive
    });
  } catch (err) {
    console.error('Error in /api/user/:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



authRouter.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;

  // 1️⃣ Validate input
  if (!email || !username || !password)
    return res.status(400).json({ error: "All fields are required." });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: "Invalid email format." });

  try {
    // 2️⃣ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email is already in use." });

    // 3️⃣ Save user (you already hash elsewhere)
    const newUser = new User({
      email,
      username,
      password, // already hashed before saving
    });
    await newUser.save();

    // 4️⃣ Create email verification token (15 min expiry)
    const emailToken = jwt.sign(
      { email, newUser: true },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const verifyLink = `${process.env.REACT_APP_BASE_URL}/set-new-pin?token=${emailToken}`;

    // 5️⃣ Set up Google OAuth2 client (auto-refresh)
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI // must match in Google Cloud Console
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;

    if (!accessToken) {
      console.error("❌ Failed to retrieve Gmail access token");
      return res.status(500).json({ error: "Email service unavailable." });
    }

    // 6️⃣ Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken,
      },
    });

    // 7️⃣ Prepare and send verification email
    const mailOptions = {
      from: `"Seekurify" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email & Set Your PIN - Seekurify",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #4a90e2;">Welcome to Seekurify, ${username}!</h2>
          <p>Click below to verify your email and set your secure PIN:</p>
          <a href="${verifyLink}"
             style="background-color:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">
             Set Your PIN
          </a>
          <p style="color:#555;">This link is valid for 15 minutes.</p>
          <hr />
          <p style="font-size:12px;color:#888;">If you did not register, ignore this email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Verification email sent to ${email}`);
    } catch (emailErr) {
      console.error("❌ Failed to send email:", emailErr.message);
      return res
        .status(500)
        .json({ error: "User created, but failed to send verification email." });
    }

    // 8️⃣ Final response
    res.status(201).json({
      message:
        "User created successfully! Check your email to verify and set your PIN.",
    });
  } catch (err) {
    console.error("❌ Error during signup:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});





authRouter.post('/update-pin',authenticateToken, async (req, res) => {
  const { email, newPin } = req.body;

  if (!email || !newPin) {
    return res.status(400).json({ error: 'Email and new PIN are required' });
  }

  if (newPin.length !== 4) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Set the new PIN
    user.pin = newPin;

    // Save (triggers pre-save hook and hashes the PIN)
    await user.save();

    return res.status(200).json({ message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Error in /update-pin:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; 
    const user = await User.findById(userId).select('-password'); // exclude password

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/change-password', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user._id); // now safe
  const { currentPassword, newPassword } = req.body;
  user.passwordStrength = getPasswordStrength(newPassword); // ✅ use correct field

  if (!user) return res.status(404).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

  // const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = newPassword;
  
  await user.save();
 console.log('Received currentPassword:', req.body.currentPassword);
  console.log('Received newPassword:', req.body.newPassword);
  // Log password change event
  await PasswordChangeEvent.create({ userId: user._id });

  res.status(200).json({ message: 'Password changed successfully' });
});





const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


authRouter.post("/create-order", authenticateToken, async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // Convert INR to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      order,
      key: process.env.RAZORPAY_KEY_ID, // send key to frontend
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: error?.description || error?.message || "Failed to create order",
    });
  }
});

// ----------------- PAYMENT SUCCESS -----------------
authRouter.post("/payment-success", authenticateToken, async (req, res) => {
  console.log("req.user:", req.user);
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Incomplete payment details received" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Payment verified
      await User.findByIdAndUpdate(req.user._id, { hasPaid: true });
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, message: "Server error while verifying payment" });
  }
});

// ----------------- CHECK PAYMENT -----------------
// ==========================
// CHECK PAYMENT STATUS
// ==========================
authRouter.post("/check-payment", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id;
    console.log("Decoded user:", req.user?._id);
    if (!userId) {
      return res.status(401).json({ hasPaid: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("hasPaid plan");
    if (!user) {
      return res.status(404).json({ hasPaid: false, message: "User not found" });
    }

    const trial = await Trial.findOne({ userId }).sort({ endDate: -1 });
    const now = new Date();

    let isTrialActive = false;
    let isTrialExpired = false;
    let trialEndDate = null;

    if (trial) {
      trialEndDate = trial.endDate;
      if (now <= new Date(trial.endDate)) {
        isTrialActive = true;
      } else {
        isTrialExpired = true;
      }
    }

    return res.status(200).json({
      hasPaid: !!user.hasPaid,
      plan: user.plan || "free",
      isTrialActive,
      isTrialExpired,
      trialEndDate,
    });
  } catch (err) {
    console.error("check-payment error:", err);
    res.status(500).json({ hasPaid: false, message: "Internal server error" });
  }
});

// ==========================
// START TRIAL
// ==========================
authRouter.post("/start-trial", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("hasPaid");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.hasPaid) return res.status(400).json({ message: "Paid users cannot start a trial." });

    const activeTrial = await Trial.findOne({ userId, endDate: { $gte: new Date() } });
    if (activeTrial) return res.status(400).json({ message: "Active trial already exists" });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    const newTrial = await Trial.create({ userId, startDate, endDate });
    await User.findByIdAndUpdate(userId, { plan: "trial" });

    return res.status(200).json({
      message: "Trial started successfully",
      trialActive: true,
      startDate,
      endDate,
    });
  } catch (err) {
    console.error("start-trial error:", err);
    res.status(500).json({ message: "Failed to start trial" });
  }
});

authRouter.post("/check-user", authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ exists: false, error: "Email required" });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ exists: false, error: "Server error" });
  }
});

// GET /devices - Get all devices for the authenticated user
authRouter.post('/devices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      console.error('User not authenticated in /devices');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Fetch last 10 successful login events
    const loginEvents = await LoginEvent.find({ userId, success: true })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    if (!loginEvents || loginEvents.length === 0) {
      return res.json({ devices: [] }); // Safe fallback
    }

    // Transform login events to devices
    const devices = loginEvents.map(event => {
      const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
      const ipAddress = event.ipAddress || 'Unknown';
      const userAgent = event.userAgent || 'Unknown';
      const location = event.location || 'Unknown';

      return {
        deviceId: `${ipAddress}-${event._id || new mongoose.Types.ObjectId()}`,
        deviceType: 'desktop', // default
        browser: userAgent,
        os: 'Unknown',          // no parsing needed
        lastLogin: timestamp,
        ipAddress,
        location,
        status: timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'active' : 'inactive'
      };
    });

    return res.json({ devices });

  } catch (err) {
    console.error('Error in /devices route:', err);
    return res.status(500).json({
      error: 'Error fetching devices',
      details: err?.message || 'Unknown server error'
    });
  }
});


// POST /devices/logout - Log out from a specific device
authRouter.post('/devices/logout', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user._id;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    // Extract IP and UA from deviceId (assuming format: "ip-useragent")
    const [ipAddress, ...userAgentParts] = deviceId.split('-');
    const userAgent = userAgentParts.join('-');

    // Update the most recent login event for this device to mark it as logged out
    await LoginEvent.updateOne(
      {
        userId,
        ipAddress,
        userAgent,
        success: true
      },
      {
        $set: { loggedOut: true }
      }
    );

    res.json({ message: 'Device logged out successfully' });
  } catch (error) {
    console.error('Error logging out device:', error);
    res.status(500).json({ error: 'Failed to log out device' });
  }
});

// POST /devices/logout-all - Log out from all devices except current
authRouter.post('/devices/logout-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDeviceId = req.body.currentDeviceId;

    if (!currentDeviceId) {
      return res.status(400).json({ error: 'Current device ID is required' });
    }

    const [currentIp, ...currentUaParts] = currentDeviceId.split('-');
    const currentUa = currentUaParts.join('-');

    await LoginEvent.updateMany(
      {
        userId,
        success: true,
        $or: [
          { ipAddress: { $ne: currentIp } },
          { userAgent: { $ne: currentUa } }
        ]
      },
      {
        $set: { loggedOut: true }
      }
    );

    res.json({ message: 'All other devices logged out successfully' });
  } catch (error) {
    console.error('Error logging out all devices:', error);
    res.status(500).json({ error: 'Failed to log out devices' });
  }
});

authRouter.post('/logout', authenticateToken, (req, res) => {
  // Clear cookies
  res.clearCookie('token'); // name of your cookie
  res.status(200).json({ message: 'Logged out successfully' });
});



authRouter.post("/createNewNotification", authenticateToken, async (req, res) => {
  try {
    const { message, type } = req.body;
    const userId = req.user.id;

    const notification = await Notification.create({ userId, message, type });
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Get all notifications for a user
// router.get("/", authenticateToken, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
//     res.json(notifications);
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     res.status(500).json({ error: "Failed to fetch notifications" });
//   }
// });

// Mark as read
authRouter.put("/:id/readNotification", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default authRouter;