import { Giveaway } from '../models/Giveaway.js';
import { createEmbed, COLORS } from './embeds.js';
import { logger } from './logger.js';

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
  let users = [];

  if (reaction) {
    const fetched = await reaction.users.fetch();
    users = fetched.filter(u => !u.bot).map(u => u.id);
  }

  const allParticipants = [...new Set([...gw.participants, ...users])];

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
    : 'Nadie participó';

  const finalLines = [
    `**Premio:** ${gw.prize}`,
    `**Ganador(es):** ${winnerText}`,
    `**Participantes:** ${allParticipants.length}`,
  ];

  if (gw.requiredRoleId) {
    finalLines.push(`**Requisito de Rol:** <@&${gw.requiredRoleId}>`);
  }

  if (gw.requiredLevel) {
    const levelLabel = gw.requiredLevelType === 'global' ? 'Global' : 'Servidor';
    finalLines.push(`**Requisito de Nivel:** ${gw.requiredLevel} (${levelLabel})`);
  }

  finalLines.push(`**ID:** \`${gw.giveawayId}\``);

  const embed = createEmbed({
    color: COLORS.GIVEAWAY,
    title: '🎉 Sorteo Finalizado',
    description: finalLines.join('\n'),
    footer: { text: `Finalizado • ID: ${gw.giveawayId}` }
  });

  await message.edit({ embeds: [embed], components: [] });

  await channel.send({
    content: winners.length > 0
      ? `🎉 ¡Felicidades ${winners.map(id => `<@${id}>`).join(', ')}! Ganaste **${gw.prize}**`
      : `😢 Nadie participó en el sorteo de **${gw.prize}**`,
    embeds: [embed]
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

export async function addParticipant(giveawayId, userId) {
  const gw = await Giveaway.findOne({ giveawayId, ended: false });
  if (!gw) return false;

  if (!gw.participants.includes(userId)) {
    gw.participants.push(userId);
    await gw.save();
    return true;
  }
  return false;
}

export async function updateGiveawayEmbed(message, giveawayId) {
  const gw = await Giveaway.findOne({ giveawayId, ended: false });
  if (!gw) return;

  const now = Date.now();
  const lastEdit = gw.lastEdit ? new Date(gw.lastEdit).getTime() : 0;
  
  if (now - lastEdit < 8000) return;

  const timeLeft = Math.ceil((gw.endTime - now) / 1000);
  if (timeLeft <= 0) return;

  const descriptionLines = [
    `**Premio:** ${gw.prize}`,
    `**Ganadores:** ${gw.winnerCount}`,
    `**Termina:** <t:${Math.floor(gw.endTime / 1000)}:R>`,
    `**Participantes:** ${gw.participants.length}`,
  ];

  const requirements = [];

  if (gw.requiredRoleId) {
    requirements.push(`**Requisito de Rol:** <@&${gw.requiredRoleId}>`);
  }

  if (gw.requiredLevel) {
    const levelLabel = gw.requiredLevelType === 'global' ? 'Global' : 'Servidor';
    requirements.push(`**Requisito de Nivel:** ${gw.requiredLevel} (${levelLabel})`);
  }

  if (requirements.length > 0) {
    descriptionLines.push('', ...requirements);
  }

  descriptionLines.push('', 'Reacciona con 🎉 para participar');

  const embed = createEmbed({
    color: COLORS.GIVEAWAY,
    title: '🎉 Sorteo',
    description: descriptionLines.join('\n'),
    footer: { text: `ID: ${gw.giveawayId} • Creado por ${gw.hostedBy}` }
  });

  try {
    await message.edit({ embeds: [embed] });
    gw.lastEdit = new Date();
    await gw.save();
  } catch { /* ignorar */ }
}

export function startGiveawayChecker(client) {
  setInterval(async () => {
    const now = new Date();
    const ending = await Giveaway.find({
      ended: false,
      endTime: { $lte: now }
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