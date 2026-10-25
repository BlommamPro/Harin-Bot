import mongoose from 'mongoose';

const EconomyConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  dailyCooldownMinutes: { type: Number, default: 24 * 60 },
  workCooldownMinutes: { type: Number, default: 30 },
  crimeCooldownMinutes: { type: Number, default: 60 },
  robCooldownMinutes: { type: Number, default: 120 },
  coinflipCooldownSeconds: { type: Number, default: 10 },
  slotsCooldownSeconds: { type: Number, default: 15 },
  blackjackCooldownSeconds: { type: Number, default: 10 },
  payCooldownMinutes: { type: Number, default: 1 },
  fishCooldownMinutes: { type: Number, default: 5 },
  mineCooldownMinutes: { type: Number, default: 8 },
  horseRaceCooldownMinutes: { type: Number, default: 2 },

  dailyReward: { type: Number, default: 100 },
  dailyStreakBonus: { type: Number, default: 50 },
  workMinReward: { type: Number, default: 25 },
  workMaxReward: { type: Number, default: 150 },
  startingBalance: { type: Number, default: 500 },

  economyEnabled: { type: Boolean, default: true },
  currencyName: { type: String, default: 'coins' },
  currencyEmoji: { type: String, default: '💰' },

  maxBet: { type: Number, default: 100000 },
  minBet: { type: Number, default: 10 },

  createdAt: { type: Date, default: Date.now },
});

export const EconomyConfig = mongoose.model('EconomyConfig', EconomyConfigSchema);