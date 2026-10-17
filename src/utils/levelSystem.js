import { GuildLevel } from "../models/GuildLevel.js";
import { LevelConfig } from "../models/LevelConfig.js";
import { logger } from "./logger.js";

export async function getGuildLevel(guildId, userId) {
  let data = await GuildLevel.findOne({ guildId, userId });
  if (!data) {
    data = await GuildLevel.create({ guildId, userId });
  }
  return data;
}

export async function addGuildXp(guildId, userId, amount) {
  const data = await getGuildLevel(guildId, userId);
  let newXp = data.xp + amount;
  let newLevel = data.level;
  let leveledUp = false;
  let safety = 0;

  while (newXp >= getXpForLevel(newLevel) && safety < 100) {
    newXp -= getXpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
    safety++;
  }

  if (safety >= 100) {
    logger.warn(
      `Posible bucle infinito en addGuildXp para ${userId} en ${guildId}`,
    );
    return { leveledUp: false, newLevel: data.level, newXp: data.xp };
  }

  await GuildLevel.updateOne(
    { guildId, userId },
    { xp: newXp, level: newLevel, $inc: { messages: 1 } },
  );

  return { leveledUp, newLevel, newXp };
}

export function getXpForLevel(level) {
  return level * level * 100;
}

export async function getLevelConfig(guildId) {
  let config = await LevelConfig.findOne({ guildId });
  if (!config) {
    config = await LevelConfig.create({ guildId });
  }
  return config;
}

export async function updateLevelConfig(guildId, update) {
  return await LevelConfig.findOneAndUpdate({ guildId }, update, {
    new: true,
    upsert: true,
  });
}

export async function getGuildLeaderboard(guildId, limit = 10) {
  return await GuildLevel.find({ guildId })
    .sort({ level: -1, xp: -1 })
    .limit(limit);
}