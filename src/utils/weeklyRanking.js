import { WeeklyRanking } from '../models/WeeklyRanking.js';
import { logger } from './logger.js';

export function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export async function addWeeklyCoins(guildId, userId, username, amount) {
  if (!guildId || amount <= 0) return;

  try {
    const weekStart = getWeekStart();
    await WeeklyRanking.findOneAndUpdate(
      { guildId, userId, weekStart },
      {
        $inc: { coinsEarned: amount },
        $set: { username }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.warn('Error registrando coins semanales:', err.message);
  }
}