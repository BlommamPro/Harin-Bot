import { getUpgradeEffect } from './economyConfig.js';

function globalMultiplier(upgrades) {
  return 1
    + getUpgradeEffect(upgrades, 'pet')
    + getUpgradeEffect(upgrades, 'golden_touch');
}

export function applyWorkBonus(baseAmount, upgrades) {
  const jobBonus = getUpgradeEffect(upgrades, 'better_job');
  const businessBonus = getUpgradeEffect(upgrades, 'business');
  const total = globalMultiplier(upgrades) + jobBonus + businessBonus;
  return Math.floor(baseAmount * total);
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
  const total = globalMultiplier(upgrades) + betBonus;
  return Math.floor(baseWinnings * total);
}

export function applyDailyBonus(baseAmount, upgrades) {
  const dailyBonus = getUpgradeEffect(upgrades, 'daily_boost');
  const richFriend = getUpgradeEffect(upgrades, 'rich_friend');
  const baseWithDaily = baseAmount + dailyBonus;
  const total = globalMultiplier(upgrades) + richFriend;
  return Math.floor(baseWithDaily * total);
}

export function applyPetBonus(amount, upgrades) {
  return Math.floor(amount * globalMultiplier(upgrades));
}

export function applyLuckyCharm(baseChance, upgrades) {
  const luckyBonus = getUpgradeEffect(upgrades, 'lucky_charm');
  return Math.min(baseChance + luckyBonus, 0.95);
}

export function applyInsurance(penalty, upgrades) {
  const insurance = getUpgradeEffect(upgrades, 'insurance');
  return Math.floor(penalty * (1 - insurance));
}