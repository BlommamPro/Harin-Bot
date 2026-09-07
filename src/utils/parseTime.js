const MAX_MS = 31536000000;

export function parseTime(input) {
  if (!input || typeof input !== 'string') return null;

  const regex = /(\d+)\s*([smhdw])/gi;
  const matches = [...input.matchAll(regex)];

  if (matches.length === 0) return null;

  let totalMs = 0;
  const usedUnits = new Set();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  for (const match of matches) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (value <= 0 || !multipliers[unit]) continue;

    if (usedUnits.has(unit)) {
      return null;
    }
    usedUnits.add(unit);

    totalMs += value * multipliers[unit];
  }

  if (totalMs <= 0) return null;

  if (totalMs > MAX_MS) {
    return {
      ms: MAX_MS,
      text: '1 año (máximo permitido)'
    };
  }

  const seconds = Math.floor(totalMs / 1000);
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let textParts = [];
  if (days > 0) textParts.push(`${days}d`);
  if (hours % 24 > 0) textParts.push(`${hours % 24}h`);
  if (mins % 60 > 0) textParts.push(`${mins % 60}m`);
  if (seconds % 60 > 0) textParts.push(`${seconds % 60}s`);

  return {
    ms: totalMs,
    text: textParts.join(' ') || '0s'
  };
}

export const TIME_LIMITS = {
  timeout: 28 * 24 * 60 * 60 * 1000,
  ban: 365 * 24 * 60 * 60 * 1000
};