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

export function addBotPlayer(raceId, username = 'Bot') {
  const race = races.get(raceId);
  if (!race || race.status !== 'lobby') return { ok: false };

  const horseIndex = Math.floor(Math.random() * HORSES.length);
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
  const total = HORSES.reduce((s, h) => s + h.weight, 0);
  const roll = Math.random() * total;
  let acc = 0;
  let winnerIndex = 0;
  for (let i = 0; i < HORSES.length; i++) {
    acc += HORSES[i].weight;
    if (roll <= acc) { winnerIndex = i; break; }
  }

  const steps = 12;
  const timeline = [];
  const positions = HORSES.map(() => 0);

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < HORSES.length; i++) {
      const base = 0.5 + Math.random() * 0.8;
      const boost = i === winnerIndex ? 1.4 : 1.0;
      positions[i] += base * boost;
    }
    timeline.push([...positions]);
  }

  const maxOthers = Math.max(...positions.filter((_, i) => i !== winnerIndex));
  if (positions[winnerIndex] <= maxOthers) {
    positions[winnerIndex] = maxOthers + 1;
    timeline[timeline.length - 1] = [...positions];
  }

  return { winnerIndex, timeline };
}

export function renderTrack(positions, totalSteps = 20) {
  const max = Math.max(...positions, 1);

  const ranked = HORSES
    .map((h, i) => ({ ...h, index: i, pos: positions[i] }))
    .sort((a, b) => b.pos - a.pos);

  return ranked.map((h, rank) => {
    const progress = Math.round((h.pos / max) * totalSteps);
    const pct = Math.round((h.pos / max) * 100);
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