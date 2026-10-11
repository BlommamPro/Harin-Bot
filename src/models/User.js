import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: '' },

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  messages: { type: Number, default: 0 },

  badges: { type: [String], default: [] },

  cooldowns: {
    type: Object,
    default: {}
  },

  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);