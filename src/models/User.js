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
    type: String
    }          // ✅ Added for password reset
});

// ✅ Auto-hash password before saving user
userSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcryptjs.genSalt(10);
      this.password = await bcryptjs.hash(this.password, salt);
    }

    // Hash pin if modified
    if (this.isModified('pin')) {
      const salt = await bcryptjs.genSalt(10);
      this.pin = await bcryptjs.hash(this.pin, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
export default User;
