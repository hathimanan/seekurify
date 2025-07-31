process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

import sendResetEmail from '../emailService.js' ;
dotenv.config();
const OAuth2 = google.auth.OAuth2;

const authRouter = express.Router();
// const userPasswords = new Map();
const secretKeyOTP = process.env.secretKeyOTP ?? 'otp_secret_key';
if (!process.env.JWT_SECRET || !secretKeyOTP) {
  throw new Error("JWT secret keys are not properly defined in environment variables.");
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 7,
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
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
  });
}


authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  if (!email || !password) {
    return res.status(400).json({ field: 'email', error: 'Email and password are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ field: 'email', error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ field: 'email', error: 'Password length is too small' });
  }

  if (password.length > 18) {
    return res.status(400).json({ field: 'email', error: 'Password length is too large' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Log failed attempt: user not found
      await LoginEvent.create({
        userId: null,
        success: false,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      return res.status(401).json({ field: 'email', error: 'Incorrect email' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed attempt: wrong password
      await LoginEvent.create({
        userId: user._id,
        success: false,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      return res.status(401).json({ field: 'email', error: 'Invalid credentials' });
    }

    // ✅ Log successful login
    await LoginEvent.create({
      userId: user._id,
      success: true,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    const payload = {
      id: user._id,
      email: user.email,
      pin: user.pin,
    };
user.passwordStrength = getPasswordStrength(req.body.password);
    await user.save(); // optional if not updating anything

    return res.json({ message: 'Login successful. Proceed to OTP.', user: payload });

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

  console.log(`✅ Password reset for ${email}. New password: ${newPassword}`);

  return res.status(200).json({ message: 'Password has been reset successfully' });

});


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
// const accessToken = accessTokenResponse?.token;

// if (!accessToken) {
//   return res.status(500).json({ error: 'Failed to get access token' });
// }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN       }
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


    const isValidPin = await bcryptjs.compare(pin, storedPin);
    if (!isValidPin) return res.status(400).json({ error: 'Invalid PIN' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
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

authRouter.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Invalid email format.' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: 'Email is already in use.' });

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = new User({
      email,
      username,
      password,
      // pin:user.pin
    });
    await newUser.save();

    // 🔐 Generate email verification token
    const emailToken = jwt.sign({ email, newUser: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const verifyLink = `${process.env.FRONTEND_BASE_URL}/set-new-pin?token=${emailToken}`;

    // ⚙️ Set up OAuth2
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // redirect URL
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
const accessTokenResponse = await oauth2Client.getAccessToken();
const accessToken = accessTokenResponse?.token;

if (!accessToken) {
  console.error('Failed to retrieve access token.');
  return res.status(500).json({ error: 'Email service unavailable.' });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    accessToken: accessToken,
  },
});
    await transporter.sendMail({
      from: `"Securify" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email & Set Your PIN - Securify',
      html: `
        <h2>Welcome to Securify, ${username}!</h2>
        <p>Click the button below to verify your email and set your secure 4-digit PIN:</p>
        <a href="${verifyLink}" style="background-color:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Set Your PIN</a>
        <p>This link is valid for 15 minutes.</p>
      `,
    });

    return res.status(201).json({
      message: 'User created successfully! Check your email to verify and set your PIN.',
    });

  } catch (err) {
    console.error('Error during signup:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});



authRouter.post('/update-pin', async (req, res) => {
  const { email, newPin } = req.body;

  // Basic input validation
  if (!email || !newPin) {
    return res.status(400).json({ error: 'Email and new PIN are required' });
  }

  if (newPin.length !== 4) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the pin field
    user.pin = newPin;

    // Save the updated user
    await user.save();

    return res.status(200).json({ message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Error in /update-pin:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id; 
    const user = await User.findById(userId).select('-password'); // exclude password

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/change-password', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id); // now safe
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

export default authRouter;
