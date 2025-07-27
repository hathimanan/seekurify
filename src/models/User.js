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
  passwordStrength: { type: String, enum: ['Poor', 'Medium', 'Good', 'Strong'] }, 
  pin: {
    type: String
    }          // ✅ Added for password reset
});


function getPasswordStrength(password) {
  const length = password.length;

  if (length < 8) return 'Poor';
  else if (length >= 9 && length <= 16) return 'Medium';
  else if (length >= 17 && length <= 24) return 'Good';
  else if (length >= 25) return 'Strong';
}


// ✅ Auto-hash password before saving user
userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password')) {
      // Set strength before hashing
      this.passwordStrength = getPasswordStrength(this.password);

      const salt = await bcryptjs.genSalt(10);
      this.password = await bcryptjs.hash(this.password, salt);
    }

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
