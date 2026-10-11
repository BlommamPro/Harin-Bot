import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now }
});

AchievementSchema.index({ guildId: 1, userId: 1, achievementId: 1 }, { unique: true });

export const Achievement = mongoose.model('Achievement', AchievementSchema);