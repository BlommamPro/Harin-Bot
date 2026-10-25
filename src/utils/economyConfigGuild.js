import { EconomyConfig } from '../models/EconomyConfig.js';

const DEFAULTS = {
  dailyCooldownMinutes: 24 * 60,
  workCooldownMinutes: 30,
  crimeCooldownMinutes: 60,
  robCooldownMinutes: 120,
  coinflipCooldownSeconds: 10,
  slotsCooldownSeconds: 15,
  blackjackCooldownSeconds: 10,
  payCooldownMinutes: 1,
  fishCooldownMinutes: 5,
  mineCooldownMinutes: 8,
  horseRaceCooldownMinutes: 2,
  dailyReward: 100,
  dailyStreakBonus: 50,
  workMinReward: 25,
  workMaxReward: 150,
  startingBalance: 500,
  economyEnabled: true,
  currencyName: 'coins',
  currencyEmoji: '💰',
  maxBet: 100000,
  minBet: 10,
};

export async function getEconomyConfig(guildId) {
  let config = await EconomyConfig.findOne({ guildId });
  if (!config) {
    config = await EconomyConfig.create({ guildId });
  }
  return config;
}

export async function updateEconomyConfig(guildId, update) {
  return await EconomyConfig.findOneAndUpdate(
    { guildId },
    update,
    { new: true, upsert: true }
  );
}

export async function getEconomyValues(guildId) {
  const config = await getEconomyConfig(guildId);
  return { ...DEFAULTS, ...config.toObject() };
}

export { DEFAULTS };