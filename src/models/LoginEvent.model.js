// models/LoginEvent.model.js
import mongoose from 'mongoose';

const loginEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // allow null if user not found
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true }, // ✅ Add this field
  ipAddress: { type: String },                // (optional, useful for tracking)
  userAgent: { type: String },                // (optional)
});

export default mongoose.model('LoginEvent', loginEventSchema);
