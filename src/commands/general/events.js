import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header } from '../../utils/embedDecorations.js';
import {
  listUpcomingAndActive,
  cleanupExpiredEvents,
  formatEventType,
  formatMultiplier,
} from '../../utils/eventManager.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('events')
    .setDescription('📅 Muestra los eventos globales activos'),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    await cleanupExpiredEvents().catch(() => {});
    const events = await listUpcomingAndActive();

    if (events.length === 0) {
      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.INFO,
          title: '📅 Eventos globales',
          description: 'No hay eventos activos ahora mismo.\n\n-# Vuelve más tarde o revisa con `/profile`.',
          footer: {
            text: `Solicitado por ${interaction.user.username}`,
            icon: interaction.user.displayAvatarURL(),
          },
        })],
      });
    }

    const lines = events.map(e => {
      const endTs = Math.floor(new Date(e.endTime).getTime() / 1000);
      return [
        `${formatEventType(e.type)} — **${e.name || 'Sin nombre'}**`,
        `> ${formatMultiplier(e.multiplier)}`,
        `> Termina <t:${endTs}:R> (<t:${endTs}:f>)`,
      ].join('\n');
    });

    const xpCount = events.filter(e => e.type === 'xp').length;
    const coinsCount = events.filter(e => e.type === 'coins').length;

    const description = [
      header('📅', `Eventos activos (${events.length})`),
      '',
      lines.join('\n\n'),
      '',
      `-# XP: \`${xpCount}\` · Coins: \`${coinsCount}\``,
    ].join('\n');

    return interaction.reply({
      embeds: [createEmbed({
        color: COLORS.INFO,
        title: '🎉 Eventos globales activos',
        description,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      })],
    });
  },
};