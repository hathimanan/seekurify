import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const passwordSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    default: 'General'
  },
  notes: {
    type: String,
    default: ''
  }
});

// Hash password before saving
passwordSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
passwordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// module.exports = mongoose.model('Password', passwordSchema);

const Password = mongoose.model('Password', passwordSchema);
export default Password;