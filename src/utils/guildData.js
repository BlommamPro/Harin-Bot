import { Guild } from '../models/Guild.js';
import { User } from '../models/User.js';
import { GuildEconomy } from '../models/GuildEconomy.js';

export async function getGuildData(guildId) {
  let data = await Guild.findOne({ guildId });
  if (!data) {
    data = await Guild.create({ guildId });
  }
  return data;
}

export async function updateGuildData(guildId, update) {
  return await Guild.findOneAndUpdate(
    { guildId },
    update,
    { new: true, upsert: true }
  );
}

export async function getUserData(userId, username = '') {
  let data = await User.findOne({ userId });
  if (!data) {
    data = await User.create({ userId, username });
  }
  return data;
}

export async function updateUserData(userId, update) {
  return await User.findOneAndUpdate(
    { userId },
    update,
    { new: true, upsert: true }
  );
}

export async function getGuildEconomy(guildId, userId, username = '') {
  let data = await GuildEconomy.findOne({ guildId, userId });
  if (!data) {
    data = await GuildEconomy.create({ guildId, userId, username });
  }
  return data;
}

export async function updateGuildEconomy(guildId, userId, update) {
  return await GuildEconomy.findOneAndUpdate(
    { guildId, userId },
    update,
    { new: true, upsert: true }
  );
}

export async function getGuildEconomyLeaderboard(guildId, limit = 10) {
  return await GuildEconomy.find({ guildId })
    .sort({ balance: -1, bank: -1 })
    .limit(limit);
}