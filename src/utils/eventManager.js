import { GlobalEvent } from '../models/GlobalEvent.js';
import { logger } from './logger.js';

const CACHE_TTL_MS = 30_000;
let cache = { at: 0, events: [] };

function invalidateCache() {
  cache = { at: 0, events: [] };
}

export async function refreshActiveEvents() {
  const now = new Date();
  const events = await GlobalEvent.find({
    active: true,
    startTime: { $lte: now },
    endTime: { $gt: now },
  }).lean();

  cache = { at: Date.now(), events };
  return events;
}

export async function getActiveEvents() {
  if (Date.now() - cache.at > CACHE_TTL_MS) {
    await refreshActiveEvents().catch((err) => {
      logger.warn('Error refrescando eventos activos:', err.message);
    });
  }
  return cache.events;
}

export async function getActiveMultiplier(type) {
  const events = await getActiveEvents();
  const relevant = events.filter(e => e.type === type);
  if (relevant.length === 0) return 1;

  const totalBonus = relevant.reduce((acc, e) => acc + (e.multiplier - 1), 0);
  return 1 + totalBonus;
}

export function applyEventMultiplier(baseAmount, multiplier) {
  if (!multiplier || multiplier <= 1 || baseAmount <= 0) return baseAmount;
  return Math.floor(baseAmount * multiplier);
}

export async function createEvent({ type, multiplier, durationMs, name, createdBy }) {
  if (!['xp', 'coins'].includes(type)) {
    return { ok: false, reason: 'invalid_type' };
  }
  if (!(multiplier > 1)) {
    return { ok: false, reason: 'invalid_multiplier' };
  }
  if (!(durationMs > 0)) {
    return { ok: false, reason: 'invalid_duration' };
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + durationMs);

  await GlobalEvent.updateMany(
    { type, active: true },
    { $set: { active: false } }
  );

  const doc = await GlobalEvent.create({
    type,
    name: name || (type === 'xp' ? 'Doble XP' : 'Doble Coins'),
    multiplier,
    startTime: now,
    endTime,
    createdBy: createdBy || '',
    active: true,
  });

  invalidateCache();
  return { ok: true, event: doc };
}

export async function cancelEvent(id) {
  const doc = await GlobalEvent.findByIdAndUpdate(
    id,
    { $set: { active: false } },
    { new: true }
  );
  if (doc) invalidateCache();
  return doc;
}

export async function cancelAllByType(type) {
  const res = await GlobalEvent.updateMany(
    { type, active: true },
    { $set: { active: false } }
  );
  if (res.modifiedCount > 0) invalidateCache();
  return res.modifiedCount;
}

export async function listUpcomingAndActive(limit = 20) {
  const now = new Date();
  const docs = await GlobalEvent.find({
    active: true,
    endTime: { $gt: now },
  })
    .sort({ endTime: 1 })
    .limit(limit)
    .lean();
  return docs;
}

export async function cleanupExpiredEvents() {
  const now = new Date();
  const res = await GlobalEvent.updateMany(
    { active: true, endTime: { $lte: now } },
    { $set: { active: false } }
  );
  if (res.modifiedCount > 0) invalidateCache();
  return res.modifiedCount;
}

export function formatEventType(type) {
  return type === 'xp' ? '⭐ XP' : '💰 Coins';
}

export function formatMultiplier(multiplier) {
  const pct = Math.round((multiplier - 1) * 100);
  return `x${multiplier.toFixed(2)} (+${pct}%)`;
}