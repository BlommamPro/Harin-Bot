import { ActivityType } from 'discord.js';
import { config } from '../../config/config.js';
import { logger } from './logger.js';

let currentIndex = 0;
let intervalId = null;

const TYPE_MAP = {
  Playing: ActivityType.Playing,
  Streaming: ActivityType.Streaming,
  Listening: ActivityType.Listening,
  Watching: ActivityType.Watching,
  Competing: ActivityType.Competing,
  Custom: ActivityType.Custom,
};

function buildActivity(client, entry) {
  let name = entry.name;

  name = name.replace(/{servers}/g, client.guilds.cache.size);
  name = name.replace(/{users}/g, client.users.cache.size);
  name = name.replace(/{commands}/g, client.slashCommands?.size || 0);

  return {
    name,
    type: TYPE_MAP[entry.type] || ActivityType.Playing,
  };
}

function applyNextActivity(client) {
  const list = config.activity?.list;

  if (!Array.isArray(list) || list.length === 0) return;

  const entry = list[currentIndex % list.length];
  const activity = buildActivity(client, entry);

  client.user.setPresence({
    activities: [activity],
    status: config.status,
  });

  logger.info(`🔄 Estado cambiado: ${entry.type} "${activity.name}"`);

  currentIndex = (currentIndex + 1) % list.length;
}

export function startStatusRotation(client) {
  applyNextActivity(client);

  if (!config.activity?.rotate) return;

  const interval = config.activity.intervalMs || 15 * 60_000;
  intervalId = setInterval(() => applyNextActivity(client), interval);

  logger.success(`⏱️ Rotación de estado activada (cada ${Math.round(interval / 60_000)} min)`);
}

export function stopStatusRotation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}