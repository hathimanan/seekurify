import express from 'express';
import jwt  from 'jsonwebtoken';
import Password from '../models/Password.js';
import bcryptjs from 'bcryptjs';
const passwordRouter = express.Router();

// Add password
passwordRouter.post('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { website, username, password } = req.body;
    if (!website || !username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newPassword = new Password({ website, username, password, userId });
    await newPassword.save();
    res.status(201).json({ message: "Password saved securely" });
  } catch (error) {
    console.error("Error saving password:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});

// Retrieve passwords for the user
passwordRouter.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Missing or invalid Authorization header' });
}
const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const passwords = await Password.find({ userId });
    res.json(passwords);
  } catch (error) {
    console.error("Error retrieving passwords:", error);
    res.status(500).json({ error: "Server error, please try again." });
  }
});

passwordRouter.put('/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { website, username, password, currentPassword } = req.body;

    // 1. Find the password entry
    const entry = await Password.findOne({ _id: req.params.id, userId });
    if (!entry) {
      return res.status(404).json({ error: "Password entry not found." });
    }

    // 2. Compare the hash (using bcryptjs)
    const isMatch = await bcryptjs.compare(currentPassword, entry.password);
    if (!isMatch) {
      return res.status(403).json({ error: "Current password does not match." });
    }

    // 3. Update fields (password will be re-hashed by pre-save hook)
    entry.website = website;
    entry.username = username;
    entry.password = password; // This will be hashed by pre-save hook

    await entry.save();

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Server error, please try again." });
  }
});

export default passwordRouter;
