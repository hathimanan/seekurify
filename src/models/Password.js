// models/Password.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

// dotenv.config({ path: '.env.development' });
// Ensure encryption key is provided
const SECRET_HEX = process.env.PASSWORD_ENCRYPTION_KEY;
if (!SECRET_HEX) { 
  throw new Error('Missing PASSWORD_ENCRYPTION_KEY in environment');
}
const SECRET_KEY = Buffer.from(SECRET_HEX, 'hex'); // 32-byte key

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
export function decrypt(data) {
  if (typeof data !== 'string' || data.indexOf(':') === -1) {
    // Nothing to decrypt or invalid format
    return data;
  }
  const [ivHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
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
lastReminderSent: { type: Date }
});

// Encrypt password before saving
passwordSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();




  if (isEncrypted(this.password)) {
    // Already encrypted, skip re-encryption
    return next();
  }

  try {
    this.password = encrypt(this.password);
    this.updatedAt = new Date();
    if (this.isModified('password')) {
    const now = new Date();
    this.expiresAt = new Date(now.getTime() + this.expireAfterDays * 24*60*60*1000);
    this.updatedAt = now;
  }
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
