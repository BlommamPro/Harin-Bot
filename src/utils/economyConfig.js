export const UPGRADES = {
  better_job: {
    name: '💼 Mejor Trabajo',
    description: 'Aumenta las ganancias de /work',
    maxLevel: 4,
    levels: [
      { level: 1, cost: 1000,   effect: 0.10 },
      { level: 2, cost: 5000,   effect: 0.25 },
      { level: 3, cost: 20000,  effect: 0.50 },
      { level: 4, cost: 100000, effect: 1.00 }
    ]
  },
  better_bank: {
    name: '🏦 Banco Mejorado',
    description: 'Aumenta la capacidad del banco',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 2000,  effect: 2 },
      { level: 2, cost: 10000, effect: 5 },
      { level: 3, cost: 50000, effect: 10 }
    ]
  },
  crime_luck: {
    name: '🍀 Suerte Criminal',
    description: 'Aumenta el éxito en /crime',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 2000,  effect: 0.05 },
      { level: 2, cost: 10000, effect: 0.10 },
      { level: 3, cost: 50000, effect: 0.20 }
    ]
  },
  rob_skill: {
    name: '🥷 Habilidad de Ladrón',
    description: 'Aumenta el éxito en /rob',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 2000,  effect: 0.05 },
      { level: 2, cost: 10000, effect: 0.10 },
      { level: 3, cost: 50000, effect: 0.20 }
    ]
  },
  bet_luck: {
    name: '🎰 Suerte en Apuestas',
    description: 'Aumenta las ganancias en apuestas',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 3000,  effect: 0.05 },
      { level: 2, cost: 15000, effect: 0.10 },
      { level: 3, cost: 75000, effect: 0.20 }
    ]
  },
  pet: {
    name: '🐾 Mascota',
    description: 'Aumenta TODAS las ganancias',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 10000,  effect: 0.05 },
      { level: 2, cost: 50000,  effect: 0.10 },
      { level: 3, cost: 250000, effect: 0.20 }
    ]
  },
  daily_boost: {
    name: '🎁 Multiplicador de Daily',
    description: 'Aumenta la recompensa de /daily (+coins fijos)',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 3000,  effect: 50 },
      { level: 2, cost: 15000, effect: 150 },
      { level: 3, cost: 75000, effect: 500 }
    ]
  },
  lucky_charm: {
    name: '🍀 Amuleto de la Suerte',
    description: 'Chance de recuperar la apuesta en /coinflip y /horse-race',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 5000,   effect: 0.05 },
      { level: 2, cost: 25000,  effect: 0.10 },
      { level: 3, cost: 100000, effect: 0.20 }
    ]
  },
  rich_friend: {
    name: '🤝 Amigo Rico',
    description: 'Aumenta la recompensa de /daily (%)',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 5000,   effect: 0.10 },
      { level: 2, cost: 25000,  effect: 0.25 },
      { level: 3, cost: 100000, effect: 0.50 }
    ]
  },
  business: {
    name: '🏢 Negocio',
    description: 'Aumenta las ganancias de /work',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 5000,   effect: 0.20 },
      { level: 2, cost: 25000,  effect: 0.50 },
      { level: 3, cost: 100000, effect: 1.00 }
    ]
  },
  insurance: {
    name: '🛡️ Seguro',
    description: 'Reduce la multa en /crime y /rob',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 5000,   effect: 0.20 },
      { level: 2, cost: 25000,  effect: 0.40 },
      { level: 3, cost: 100000, effect: 0.60 }
    ]
  },
  golden_touch: {
    name: '✨ Toque Dorado',
    description: 'Aumenta TODAS las ganancias (acumulable con pet)',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 20000,  effect: 0.02 },
      { level: 2, cost: 100000, effect: 0.05 },
      { level: 3, cost: 500000, effect: 0.10 }
    ]
  }
};

export const ACHIEVEMENTS = {
  first_thousand: {
    id: 'first_thousand',
    name: '💰 Primer Mil',
    description: 'Alcanza 1.000 coins',
    emoji: '💰',
    check: (economy) => (economy.balance || 0) + (economy.bank || 0) >= 1000
  },
  millionaire: {
    id: 'millionaire',
    name: '💎 Millonario',
    description: 'Alcanza 1.000.000 coins',
    emoji: '💎',
    check: (economy) => (economy.balance || 0) + (economy.bank || 0) >= 1000000
  },
  streak_7: {
    id: 'streak_7',
    name: '🔥 Racha x7',
    description: '7 días de /daily seguidos',
    emoji: '🔥',
    check: (economy) => economy.dailyStreak >= 7
  },
  streak_30: {
    id: 'streak_30',
    name: '🔥 Racha x30',
    description: '30 días de /daily seguidos',
    emoji: '🔥',
    check: (economy) => economy.dailyStreak >= 30
  },
  worker_100: {
    id: 'worker_100',
    name: '💼 Trabajador',
    description: '100 /work completados',
    emoji: '💼',
    check: (economy) => economy.works >= 100
  },
  robber_50: {
    id: 'robber_50',
    name: '🥷 Ladrón Pro',
    description: '50 /rob exitosos',
    emoji: '🥷',
    check: (economy) => economy.robs >= 50
  },
  crime_lord: {
    id: 'crime_lord',
    name: '🦹 Señor del Crimen',
    description: '50 /crime exitosos',
    emoji: '🦹',
    check: (economy) => economy.crimes >= 50
  },
  slots_winner: {
    id: 'slots_winner',
    name: '🎰 Suertudo',
    description: 'Gana 100 /slots',
    emoji: '🎰',
    check: (economy) => economy.slotsWins >= 100
  },
  blackjack_master: {
    id: 'blackjack_master',
    name: '🃏 Maestro del Blackjack',
    description: 'Gana 50 /blackjack',
    emoji: '🃏',
    check: (economy) => economy.blackjackWins >= 50
  }
};

export function getUpgradeEffect(upgrades, upgradeId) {
  const upgrade = upgrades?.find(u => u.upgradeId === upgradeId);
  if (!upgrade || upgrade.level === 0) return 0;
  const config = UPGRADES[upgradeId];
  if (!config) return 0;
  const levelConfig = config.levels.find(l => l.level === upgrade.level);
  return levelConfig ? levelConfig.effect : 0;
}

export function getUpgradeLevel(upgrades, upgradeId) {
  const upgrade = upgrades?.find(u => u.upgradeId === upgradeId);
  return upgrade?.level || 0;
}

export function getUpgradeCost(upgrades, upgradeId) {
  const config = UPGRADES[upgradeId];
  if (!config) return null;
  const currentLevel = getUpgradeLevel(upgrades, upgradeId);
  if (currentLevel >= config.maxLevel) return null;
  const nextLevel = currentLevel + 1;
  const levelConfig = config.levels.find(l => l.level === nextLevel);
  return levelConfig?.cost || null;
}