process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const authRouter = express.Router();
const secretKey = process.env.secretKey ?? 'default_secret_key';
const secretKeyOTP = process.env.secretKeyOTP ?? 'otp_secret_key';
if (!secretKey || !secretKeyOTP) {
  throw new Error("JWT secret keys are not properly defined in environment variables.");
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });
    user.pin = '0000'; // Ensure pin is set
    await user.save();

    // Set default PIN if not already set
    // if (!user.pin) {
    //   user.pin = '0000';
    //   await user.save();
    // }

    // ✅ Don't generate token here
    return res.json({ message: 'Login successful. Proceed to OTP.' });
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


authRouter.post('/send-otp', async (req, res) => {
  console.log("📬 /send-otp route called!");
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Sign OTP in JWT (expires in 10 mins)
    const otpToken = jwt.sign(
      { email, otp },
      process.env.secretKeyOTP,
      { expiresIn: '10m' }
    );

    // ✅ Send OTP via email
    const { token: accessToken } = await oAuth2Client.getAccessToken();
    if (!accessToken) return res.status(500).json({ error: 'Failed to get access token' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken
      }
    });

    const mailOptions = {
      from: `Securify 🔐 <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
      html: `<p><strong>Your OTP code is:</strong> <code>${otp}</code></p><p>This code will expire in 10 minutes.</p>`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", result.response);

    // ✅ Return token (not OTP) to frontend
    res.json({
      message: 'OTP sent to your Gmail account',
      otpToken // frontend needs to store this securely
    });
  } catch (err) {
    console.error('❌ Error sending OTP:', err.message);
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

    const storedPin = user.pin;

    // ⚠️ Handle default pin scenario
    if (!storedPin || storedPin === '0000') {
      if (pin === '0000') {
        // Allow access with default PIN
        const token = jwt.sign(
          { id: user._id, email: user.email },
          secretKey,
          { expiresIn: '1h' }
        );
        return res.json({ token });
      } else {
        return res.status(400).json({ error: 'Invalid PIN (default)' });
      }
    }

    const isValidPin = await bcryptjs.compare(pin, storedPin);
    if (!isValidPin) return res.status(400).json({ error: 'Invalid PIN' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      secretKey,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('❌ Error verifying PIN:', err.message);
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


authRouter.get('/api/user/details', async (req, res) => {
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
    console.error('Error in /api/user/details:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

authRouter.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) return res.status(400).json({ error: 'All fields are required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format.' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email is already in use.' });

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({ email, username, password: hashedPassword, pin: '0000' });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    console.error('Error during signup:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

authRouter.post('/update-pin', updatePin);


export default authRouter;
