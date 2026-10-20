import { Giveaway } from '../models/Giveaway.js';
import { createEmbed, COLORS } from './embeds.js';
import { block, kv, formatNumber } from './embedDecorations.js';
import { logger } from './logger.js';

function buildGiveawayDescription(gw) {
  const req = [];
  if (gw.requiredRoleId) req.push(kv('Rol requerido', `<@&${gw.requiredRoleId}>`));
  if (gw.requiredLevel) {
    const label = gw.requiredLevelType === 'global' ? 'Global' : 'Servidor';
    req.push(kv('Nivel mínimo', `\`${gw.requiredLevel}\` (${label})`));
  }

  const lines = [
    kv('Premio', `**${gw.prize}**`),
    kv('Ganadores', `\`${gw.winnerCount}\``),
    kv('Termina', `<t:${Math.floor(new Date(gw.endTime).getTime() / 1000)}:R>`),
    kv('Participantes', `\`${gw.participants.length}\``),
  ];

  if (req.length > 0) {
    lines.push('', '**Requisitos**');
    lines.push(...req.map(r => `> ${r}`));
  }

  lines.push('', '-# Usa los botones para participar o salir del sorteo.');
  return lines.join('\n');
}

export function buildGiveawayEmbed(gw) {
  return createEmbed({
    color: COLORS.GIVEAWAY,
    title: '🎉 Sorteo',
    description: buildGiveawayDescription(gw),
    footer: {
      text: `ID: ${gw.giveawayId} · Por ${gw.hostedBy}`,
    },
  });
}

export async function endGiveaway(client, giveawayId, guildId = null) {
  const query = { giveawayId, ended: false };
  if (guildId) query.guildId = guildId;

  const gw = await Giveaway.findOne(query);
  if (!gw) return null;

  const guild = await client.guilds.fetch(gw.guildId).catch(() => null);
  if (!guild) return null;

  const channel = await guild.channels.fetch(gw.channelId).catch(() => null);
  if (!channel) return null;

  const message = await channel.messages.fetch(gw.messageId).catch(() => {
    logger.warn(`Mensaje del giveaway ${gw.giveawayId} no encontrado, finalizando en DB`);
    return null;
  });

  if (!message) {
    gw.ended = true;
    await gw.save();
    return gw;
  }

  const reaction = message.reactions.cache.get('🎉');
  let reactionUsers = [];
  if (reaction) {
    const fetched = await reaction.users.fetch();
    reactionUsers = fetched.filter(u => !u.bot).map(u => u.id);
  }

  const allParticipants = [...new Set([...gw.participants, ...reactionUsers])]
    .filter(id => !gw.leftParticipants.includes(id));

  const winners = [];
  if (allParticipants.length > 0) {
    const pool = [...allParticipants];
    const count = Math.min(gw.winnerCount, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(idx, 1)[0]);
    }
  }

  gw.ended = true;
  gw.winners = winners;
  gw.participants = allParticipants;
  await gw.save();

  const winnerText = winners.length > 0
    ? winners.map(id => `<@${id}>`).join(', ')
    : '`Nadie participó`';

  const req = [];
  if (gw.requiredRoleId) req.push(kv('Rol requerido', `<@&${gw.requiredRoleId}>`));
  if (gw.requiredLevel) {
    const label = gw.requiredLevelType === 'global' ? 'Global' : 'Servidor';
    req.push(kv('Nivel mínimo', `\`${gw.requiredLevel}\` (${label})`));
  }

  const lines = [
    kv('Premio', `**${gw.prize}**`),
    kv('Ganador(es)', winnerText),
    kv('Participantes', `\`${allParticipants.length}\``),
  ];

  if (req.length > 0) {
    lines.push('', '**Requisitos**');
    lines.push(...req.map(r => `> ${r}`));
  }

  lines.push('', `-# ID: \`${gw.giveawayId}\``);

  const embed = createEmbed({
    color: COLORS.GIVEAWAY,
    title: '🎉 Sorteo finalizado',
    description: lines.join('\n'),
    footer: { text: `ID: ${gw.giveawayId}` },
  });

  await message.edit({ embeds: [embed], components: [] });

  await channel.send({
    content: winners.length > 0
      ? `🎉 ¡Felicidades ${winners.map(id => `<@${id}>`).join(', ')}! Ganaste **${gw.prize}**`
      : `😢 Nadie participó en el sorteo de **${gw.prize}**`,
    embeds: [embed],
  });

  return gw;
}

export async function rerollGiveaway(giveawayId, guildId = null) {
  const query = { giveawayId, ended: true };
  if (guildId) query.guildId = guildId;

  const gw = await Giveaway.findOne(query);
  if (!gw || gw.participants.length === 0) return null;

  const pool = [...gw.participants];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function joinGiveaway(giveawayId, userId) {
  const gw = await Giveaway.findOne({ giveawayId, ended: false });
  if (!gw) return { ok: false, reason: 'not_found' };

  if (gw.participants.includes(userId)) {
    return { ok: false, reason: 'already_in', giveaway: gw };
  }

  gw.participants.push(userId);
  gw.leftParticipants = gw.leftParticipants.filter(id => id !== userId);
  await gw.save();
  return { ok: true, giveaway: gw };
}

export async function leaveGiveaway(giveawayId, userId) {
  const gw = await Giveaway.findOne({ giveawayId, ended: false });
  if (!gw) return { ok: false, reason: 'not_found' };

  if (!gw.participants.includes(userId)) {
    return { ok: false, reason: 'not_in', giveaway: gw };
  }

  gw.participants = gw.participants.filter(id => id !== userId);
  if (!gw.leftParticipants.includes(userId)) {
    gw.leftParticipants.push(userId);
  }
  await gw.save();
  return { ok: true, giveaway: gw };
}

export async function updateGiveawayEmbed(message, giveawayId, { force = false } = {}) {
  const gw = await Giveaway.findOne({ giveawayId, ended: false });
  if (!gw) return;

  const now = Date.now();
  const lastEdit = gw.lastEdit ? new Date(gw.lastEdit).getTime() : 0;

  if (!force && now - lastEdit < 8000) return;

  const timeLeft = Math.ceil((new Date(gw.endTime).getTime() - now) / 1000);
  if (timeLeft <= 0) return;

  try {
    await message.edit({ embeds: [buildGiveawayEmbed(gw)] });
    gw.lastEdit = new Date();
    await gw.save();
  } catch { /* ignorar */ }
}

export function startGiveawayChecker(client) {
  setInterval(async () => {
    const now = new Date();
    const ending = await Giveaway.find({
      ended: false,
      endTime: { $lte: now },
    });

    for (const gw of ending) {
      try {
        await endGiveaway(client, gw.giveawayId);
      } catch (err) {
        logger.error('Error finalizando giveaway', gw.giveawayId, err.message);
      }
    }
  }, 30000);
}