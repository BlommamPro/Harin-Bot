export function createProgressBar(current, max, length = 12, options = {}) {
  const {
    filled = '█',
    empty = '░',
  } = options;

  if (!max || max <= 0) return empty.repeat(length);

  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filledCount = Math.round(percentage * length);
  const emptyCount = length - filledCount;

  return filled.repeat(filledCount) + empty.repeat(emptyCount);
}

export function formatPercentage(current, max) {
  if (!max || max <= 0) return 0;
  return Math.round((Math.min(Math.max(current / max, 0), 1)) * 100);
}

export function header(emoji, text) {
  return `${emoji} **${text}**`;
}

export function block(lines, marker = '>') {
  return lines.map(line => `${marker} ${line}`).join('\n');
}

export function bullets(items, bullet = '›') {
  return items.map(item => `${bullet} ${item}`).join('\n');
}

export function kv(key, value) {
  return `**${key}:** ${value}`;
}

export function kvList(pairs) {
  return pairs.map(([k, v]) => kv(k, v)).join('\n');
}

export function formatTime(timestamp) {
  return `<t:${Math.floor(timestamp / 1000)}:F>`;
}

export function formatRelativeTime(timestamp) {
  return `<t:${Math.floor(timestamp / 1000)}:R>`;
}

export function formatShortTime(timestamp) {
  return `<t:${Math.floor(timestamp / 1000)}:d>`;
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('es-ES');
}

export function formatCoins(n) {
  return `${formatNumber(n)} coins`;
}

export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (mins % 60 > 0) parts.push(`${mins % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

  return parts.join(' ') || '0s';
}

export const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function getMedal(index) {
  return MEDALS[index] || '🔹';
}

export function formatEconomy(wallet, bank, total = null) {
  const t = total ?? (wallet + bank);
  return [
    kv('En mano', `\`${formatNumber(wallet)}\``),
    kv('Banco', `\`${formatNumber(bank)}\``),
    kv('Total', `\`${formatNumber(t)}\``),
  ].join('\n');
}

export function formatRank(level, xp, xpNeeded, barLength = 14) {
  const bar = createProgressBar(xp, xpNeeded, barLength);
  const pct = formatPercentage(xp, xpNeeded);
  return [
    kv('Nivel', `\`${level}\``),
    `\`${bar}\` **${pct}%**`,
    `\`${formatNumber(xp)} / ${formatNumber(xpNeeded)} XP\``,
  ].join('\n');
}