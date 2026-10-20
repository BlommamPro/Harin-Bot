import { logger } from './logger.js';

const races = new Map();
const guildCooldowns = new Map();

export const HORSES = [
  { name: 'Rayo',     emoji: '🐎', weight: 30, odds: 2.0 },
  { name: 'Trueno',   emoji: '🐎', weight: 25, odds: 2.5 },
  { name: 'Tormenta', emoji: '🐎', weight: 20, odds: 3.0 },
  { name: 'Centella', emoji: '🐎', weight: 15, odds: 4.0 },
  { name: 'Fantasma', emoji: '🐎', weight: 8,  odds: 5.0 },
  { name: 'Leyenda',  emoji: '🐎', weight: 2,  odds: 7.0 },
];

const TOTAL_WEIGHT = HORSES.reduce((s, h) => s + h.weight, 0);
const MAX_DISTANCE = 100;
const STEPS = 12;

const RACE_COMMENTS = [
  '¡{horse} toma la delantera!',
  '¡{horse} se acerca al líder!',
  '¡Cuidado! ¡{horse} está remontando!',
  '¡{horse} se mantiene firme en cabeza!',
  '¡{horse} acelera!',
  '¡{horse} no se rinde!',
  '¡{horse} empuja con todo!',
  '¡{horse} aprieta el paso!',
  '¡{horse} va lanzado!',
  '¡{horse} no baja el ritmo!',
];

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];

const SPEED_BONUS = HORSES.map(h => {
  const normalized = h.weight / 30;
  return 0.95 + normalized * 0.1;
});

export function createRace({ raceId, channelId, guildId, hostId, minBet, maxBet }) {
  races.set(raceId, {
    raceId, channelId, guildId, hostId, minBet, maxBet,
    players: new Map(),
    status: 'lobby',
    vsBot: false,
  });
  return races.get(raceId);
}

export function getRace(raceId) {
  return races.get(raceId);
}

export function deleteRace(raceId) {
  races.delete(raceId);
}

export function addPlayer(raceId, userId, horseIndex, bet, isBot = false) {
  const race = races.get(raceId);
  if (!race || race.status !== 'lobby') return { ok: false, reason: 'closed' };
  if (race.players.has(userId)) return { ok: false, reason: 'already_joined' };
  race.players.set(userId, { horseIndex, bet, isBot });
  return { ok: true };
}

export function addBotPlayer(raceId, username = 'Bot', excludeHorseIndex = null) {
  const race = races.get(raceId);
  if (!race || race.status !== 'lobby') return { ok: false };

  const availableIndices = HORSES
    .map((_, i) => i)
    .filter(i => i !== excludeHorseIndex);

  const horseIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

  const bet = race.minBet;
  const botId = `BOT_${Date.now()}`;

  race.players.set(botId, { horseIndex, bet, isBot: true, username });
  race.vsBot = true;
  return { ok: true, horseIndex, bet };
}

export function isGuildBusy(guildId) {
  for (const race of races.values()) {
    if (race.guildId === guildId && race.status !== 'finished') {
      return { busy: true, reason: 'active_race' };
    }
  }
  const expires = guildCooldowns.get(guildId);
  if (expires && Date.now() < expires) {
    return { busy: true, reason: 'cooldown', timeLeftMs: expires - Date.now() };
  }
  return { busy: false };
}

export function setGuildCooldown(guildId, ms = 60_000) {
  guildCooldowns.set(guildId, Date.now() + ms);
}

export function clearGuildCooldown(guildId) {
  guildCooldowns.delete(guildId);
}

export function simulateRace() {
  const positions = HORSES.map(() => 0);
  const timeline = [];
  const arrivalTick = HORSES.map(() => null);

  for (let tick = 0; tick < STEPS; tick++) {
    for (let i = 0; i < HORSES.length; i++) {
      const baseSpeed = 6.0 + Math.random() * 4.0;
      const speed = baseSpeed * SPEED_BONUS[i];

      const leader = Math.max(...positions);
      const gap = leader - positions[i];
      let catchUp = 1.0;
      if (gap > 30) catchUp = 1.4;
      else if (gap > 15) catchUp = 1.2;

      positions[i] += speed * catchUp;

      if (positions[i] >= MAX_DISTANCE && arrivalTick[i] === null) {
        arrivalTick[i] = tick;
      }
      if (positions[i] > MAX_DISTANCE) positions[i] = MAX_DISTANCE;
    }
    timeline.push([...positions]);
  }

  const finalMax = Math.max(...timeline[timeline.length - 1]);
  if (finalMax > 0 && finalMax !== MAX_DISTANCE) {
    const scale = MAX_DISTANCE / finalMax;
    for (let t = 0; t < timeline.length; t++) {
      for (let i = 0; i < HORSES.length; i++) {
        timeline[t][i] = Math.min(MAX_DISTANCE, timeline[t][i] * scale);
      }
    }
  }

  for (let i = 0; i < HORSES.length; i++) {
    arrivalTick[i] = null;
    for (let t = 0; t < timeline.length; t++) {
      if (timeline[t][i] >= MAX_DISTANCE && arrivalTick[i] === null) {
        arrivalTick[i] = t;
      }
    }
  }

  let winnerIndex = 0;
  let bestTick = Infinity;
  let bestPos = -1;

  for (let i = 0; i < HORSES.length; i++) {
    const tick = arrivalTick[i] ?? Infinity;
    const pos = timeline[timeline.length - 1][i];

    if (tick < bestTick || (tick === bestTick && pos > bestPos)) {
      bestTick = tick;
      bestPos = pos;
      winnerIndex = i;
    }
  }

  if (bestTick === Infinity) {
    winnerIndex = timeline[timeline.length - 1].indexOf(Math.max(...timeline[timeline.length - 1]));
  }

  return { winnerIndex, timeline };
}

export function renderTrack(positions, totalSteps = 20) {
  const ranked = HORSES
    .map((h, i) => ({ ...h, index: i, pos: positions[i] }))
    .sort((a, b) => b.pos - a.pos);

  return ranked.map((h, rank) => {
    const progress = Math.round((h.pos / MAX_DISTANCE) * totalSteps);
    const pct = Math.round((h.pos / MAX_DISTANCE) * 100);
    const filled = Math.min(totalSteps, Math.max(0, progress));
    const empty = totalSteps - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const medal = MEDALS[rank] || '🔹';

    return `${medal} ${h.emoji} **${h.name.padEnd(9, ' ')}** \`${bar}\` ${String(pct).padStart(3, ' ')}%`;
  }).join('\n');
}

export function getRaceComment(positions) {
  const max = Math.max(...positions, 1);
  const leaderIndex = positions.indexOf(max);
  const leader = HORSES[leaderIndex];
  const template = RACE_COMMENTS[Math.floor(Math.random() * RACE_COMMENTS.length)];
  return template.replace('{horse}', `**${leader.name}**`);
}

export function getHorseWinChance(horseIndex) {
  return Math.round((HORSES[horseIndex].weight / TOTAL_WEIGHT) * 100);
}