import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { type } from 'os';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  resetToken: { type: String },                 // ✅ Added for password reset
  resetTokenExpiry: { type: Date }, 
  otp: { type: String },
  otpEpiry: { type: Date },  
  pin: {
    type: String,
    default: '0000',
  },          // ✅ Added for password reset
});

// ✅ Auto-hash password before saving user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
export default User;
