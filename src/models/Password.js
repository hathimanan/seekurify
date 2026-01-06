// models/Password.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

// dotenv.config({ path: '.env.development' });
// Ensure encryption key is provided
const SECRET_HEX = process.env.PASSWORD_ENCRYPTION_KEY;
let SECRET_KEY;

if (!SECRET_HEX) {
  if (process.env.NODE_ENV === 'production') {
    // In production we must fail loudly
    throw new Error('Missing PASSWORD_ENCRYPTION_KEY in environment (required in production)');
  } else {
    // Development fallback: generate a temporary key (non-persistent)
    // or use an explicit DEV_PASSWORD_ENCRYPTION_KEY if provided for reproducibility
    const devHex = process.env.DEV_PASSWORD_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    console.warn('⚠️ PASSWORD_ENCRYPTION_KEY is not set. Using a temporary development key. Do NOT use this in production.');
    SECRET_KEY = Buffer.from(devHex, 'hex');
  }
} else {
  SECRET_KEY = Buffer.from(SECRET_HEX, 'hex');
}

// Ensure we have the expected 32-byte key
if (!Buffer.isBuffer(SECRET_KEY) || SECRET_KEY.length !== 32) {
  throw new Error('PASSWORD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}

// Encrypt plaintext using AES-256-CBC
export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  // Combine IV and ciphertext
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Check if a string is already encrypted (basic format check: IV:EncryptedHex)
export function isEncrypted(password) {
  return (
    typeof password === 'string' &&
    password.includes(':') &&
    /^[a-f0-9]{32}:[a-f0-9]+$/.test(password)
  );
}



// Decrypt ciphertext back to plaintext
export function decrypt(encrypted) {
  try {
    if (!encrypted || typeof encrypted !== "string") return null;

    const [ivHex, encryptedHex] = encrypted.split(":");
    if (!ivHex || !encryptedHex) return null;

    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );

    return Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]).toString("utf8");

  } catch (err) {
    console.error("❌ Decryption failed – corrupted or legacy data");
    return null; // ⬅️ THIS IS CRITICAL
  }
}



// Define the schema
const passwordSchema = new mongoose.Schema({
  website: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true },  // holds encrypted data
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  category: { type: String, default: 'General' },
  notes: { type: String, default: '' },
  expiresAt: { type: Date },                       // actual expiry date
expireAfterDays: { type: Number, default: 90 },  // default expiry period
lastReminderSent: { type: Date },
lastChanged: { type: Date, default: Date.now},
isExpired: { type: Boolean, default: false }
});

// Encrypt password before saving
passwordSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();

  try {
    if (!isEncrypted(this.password)) {
      this.password = encrypt(this.password);
    }

    const now = new Date();
    this.updatedAt = now;
    this.lastChanged = now;
    this.expiresAt = new Date(
      now.getTime() + this.expireAfterDays * 24 * 60 * 60 * 1000
    );

    next();
  } catch (err) {
    next(err);
  }
});


// Transform to JSON: decrypt password field
passwordSchema.set('toJSON', {
  transform(doc, ret) {
    try {
      ret.isExpired = ret.expiresAt ? new Date() > new Date(ret.expiresAt) : false;

if (ret.expiresAt) {
  const msLeft = new Date(ret.expiresAt) - new Date();
  ret.daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}
      ret.password = decrypt(ret.password);
    } catch (err) {
      console.error('Error decrypting password:', err);
      ret.password = '';
    }
    // remove internal fields if needed
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Password', passwordSchema);
