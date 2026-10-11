import { Achievement } from '../models/Achievement.js';
import { ACHIEVEMENTS } from './economyConfig.js';
import { logger } from './logger.js';

export async function checkAchievements(guildId, userId, economy) {
  const newAchievements = [];

  for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
    try {
      const existing = await Achievement.findOne({ guildId, userId, achievementId });
      if (existing) continue;

      if (achievement.check(economy)) {
        await Achievement.create({ guildId, userId, achievementId });
        newAchievements.push(achievement);
      }
    } catch (err) {
      logger.error(`Error verificando logro ${achievementId}:`, err.message);
    }
  }

  return newAchievements;
}

export async function getUserAchievements(guildId, userId) {
  return await Achievement.find({ guildId, userId });
}

export async function formatAchievements(guildId, userId) {
  const unlocked = await getUserAchievements(guildId, userId);
  const unlockedIds = new Set(unlocked.map(a => a.achievementId));

  const lines = [];
  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    const has = unlockedIds.has(id);
    lines.push(`${has ? ach.emoji : '🔒'} **${ach.name}** — ${ach.description}`);
  }

  return {
    total: Object.keys(ACHIEVEMENTS).length,
    unlocked: unlocked.length,
    text: lines.join('\n')
  };
}