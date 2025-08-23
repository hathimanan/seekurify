import express from 'express';
import crypto from 'crypto';
import jwt  from 'jsonwebtoken';
import Password from '../models/Password.js';
import bcryptjs from 'bcryptjs';
const passwordRouter = express.Router();
const SECRET_HEX = process.env.PASSWORD_ENCRYPTION_KEY;
if (!SECRET_HEX) {
  throw new Error('Missing PASSWORD_ENCRYPTION_KEY in environment');
}
const SECRET_KEY = Buffer.from(SECRET_HEX, 'hex'); // 32-byte key

function decrypt(data) {
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

const authenticateToken = (req, res, next) => {



  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
console.log("Authorization Header:", authHeader);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload to request
    console.log("Generated token:", token);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};


passwordRouter.post('/', authenticateToken, async (req, res) => {
  const userId = req.user._id; // From verified token
  const { website, username, password } = req.body;

  if (!website || !username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newPassword = new Password({ website, username, password, userId });
    await newPassword.save();
    res.status(201).json({ message: "Password saved securely" });
  } catch (error) {
    console.error("Error saving password:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});

// 🔐 Retrieve all passwords
passwordRouter.get('/', authenticateToken, async (req, res) => {
  const userId = req.user._id;

  try {
    const passwords = await Password.find({ userId });
    res.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes for the specific user
    res.json(passwords);
  } catch (error) {
    console.error("Error retrieving passwords:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});

// 🔐 Update a password
// Assuming Express and middleware (like auth) are already in place
passwordRouter.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user?._id; // Set via auth middleware
  const { website, username, password, currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: "Current password is required." });
  }

  try {
    const entry = await Password.findOne({ _id: req.params.id, userId });

    if (!entry) {
      return res.status(404).json({ error: "Password entry not found." });
    }

    const decryptedStoredPassword = decrypt(entry.password);
console.log("Decrypted stored password:", decryptedStoredPassword);
console.log("Current password provided:", currentPassword);
    if (decryptedStoredPassword !== currentPassword) {
  return res.status(403).json({
    error: "Current password does not match.",
    reason: "incorrect_current_password"
  });
}


    // ✅ Update fields — encryption assumed in pre('save') middleware
    entry.website = website ?? entry.website;
    entry.username = username ?? entry.username;
    entry.password = password ?? entry.password;

    await entry.save();

    const updatedEntry = {
      ...entry.toObject(),
      password: decrypt(entry.password), // Decrypt before sending
    };

    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});



passwordRouter.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const entry = await Password.findOneAndDelete({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Password entry not found' });
    }
    return res.json({ message: 'Password deleted successfully' });
  } catch (err) {
    console.error('Error deleting password:', err);
    return res.status(500).json({ error: 'Server error, please try again.' });
  }
});




export default passwordRouter;
