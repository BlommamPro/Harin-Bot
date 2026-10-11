import mongoose from 'mongoose';

const UpgradeSchema = new mongoose.Schema({
  upgradeId: { type: String, required: true },
  level: { type: Number, default: 0 }
});

const GuildEconomySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },

  balance: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  crimes: { type: Number, default: 0 },
  robs: { type: Number, default: 0 },
  works: { type: Number, default: 0 },
  slotsWins: { type: Number, default: 0 },
  blackjackWins: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },

  upgrades: { type: [UpgradeSchema], default: [] },

  lastPassiveCollect: { type: Date, default: Date.now },

  cooldowns: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now }
});

GuildEconomySchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const GuildEconomy = mongoose.model('GuildEconomy', GuildEconomySchema);