import { getUpgradeEffect } from './economyConfig.js';

export function applyWorkBonus(baseAmount, upgrades) {
  const jobBonus = getUpgradeEffect(upgrades, 'better_job');
  const petBonus = getUpgradeEffect(upgrades, 'pet');
  const totalBonus = jobBonus + petBonus;
  return Math.floor(baseAmount * (1 + totalBonus));
}

export function applyCrimeLuck(baseChance, upgrades) {
  const crimeBonus = getUpgradeEffect(upgrades, 'crime_luck');
  const petBonus = getUpgradeEffect(upgrades, 'pet');
  return Math.min(baseChance + crimeBonus + petBonus, 0.95);
}

export function applyRobSkill(baseChance, upgrades) {
  const robBonus = getUpgradeEffect(upgrades, 'rob_skill');
  const petBonus = getUpgradeEffect(upgrades, 'pet');
  return Math.min(baseChance + robBonus + petBonus, 0.95);
}

export function applyBetLuck(baseWinnings, upgrades) {
  const betBonus = getUpgradeEffect(upgrades, 'bet_luck');
  const petBonus = getUpgradeEffect(upgrades, 'pet');
  const totalBonus = betBonus + petBonus;
  return Math.floor(baseWinnings * (1 + totalBonus));
}

export function applyDailyBonus(baseAmount, upgrades) {
  const dailyBonus = getUpgradeEffect(upgrades, 'daily_boost');
  const petBonus = getUpgradeEffect(upgrades, 'pet');
  return Math.floor((baseAmount + dailyBonus) * (1 + petBonus));
}

export function applyPetBonus(amount, upgrades) {
  const petBonus = getUpgradeEffect(upgrades, 'pet');
  return Math.floor(amount * (1 + petBonus));
}

export function applyCooldownReduction(baseMinutes, upgrades) {
  const reduction = getUpgradeEffect(upgrades, 'hourglass');
  if (reduction === 0) return baseMinutes;
  return Math.max(baseMinutes * (1 - reduction), 0.1);
}

export function calculatePassiveIncome(upgrades, lastCollect) {
  const house = getUpgradeEffect(upgrades, 'house');
  const mine = getUpgradeEffect(upgrades, 'mine');
  const perHour = house + mine;
  if (perHour === 0) return 0;

  const now = Date.now();
  const last = new Date(lastCollect).getTime();
  const hoursPassed = (now - last) / (1000 * 60 * 60);

  if (hoursPassed < 1) return 0;

  const fullHours = Math.floor(hoursPassed);
  return perHour * fullHours;
}