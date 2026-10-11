import mongoose from 'mongoose';

const WeeklyRankingSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  coinsEarned: { type: Number, default: 0 },
  weekStart: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

WeeklyRankingSchema.index({ guildId: 1, userId: 1, weekStart: 1 }, { unique: true });
WeeklyRankingSchema.index({ guildId: 1, weekStart: 1, coinsEarned: -1 });

export const WeeklyRanking = mongoose.model('WeeklyRanking', WeeklyRankingSchema);