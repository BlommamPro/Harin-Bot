import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: '' },
  balance: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  messages: { type: Number, default: 0 },
  crimes: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  inventory: [{
    itemId: String,
    name: String,
    quantity: { type: Number, default: 1 },
    boughtAt: { type: Date, default: Date.now }
  }],
  badges: { type: [String], default: [] },
  cooldowns: {
    type: Object,
    default: {}
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);