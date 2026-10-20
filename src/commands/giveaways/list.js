import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { Giveaway } from '../../models/Giveaway.js';

const ITEMS_PER_PAGE = 5;

export default {
  CMD: new SlashCommandBuilder()
    .setName('giveaway-list')
    .setDescription('📋 Lista los sorteos activos del servidor')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const giveaways = await Giveaway.find({
      guildId: interaction.guildId,
      ended: false,
    }).sort({ endTime: 1 });

    if (giveaways.length === 0) {
      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.INFO,
          title: '📋 Sorteos activos',
          description: 'No hay sorteos activos en este servidor.\n\n-# Crea uno con `/giveaway`',
        })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const totalPages = Math.ceil(giveaways.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * ITEMS_PER_PAGE;
      const slice = giveaways.slice(start, start + ITEMS_PER_PAGE);

      const fields = slice.map(g => {
        const timeLeft = Math.ceil((new Date(g.endTime).getTime() - Date.now()) / 1000);
        const timeText = timeLeft > 0 ? `<t:${Math.floor(new Date(g.endTime).getTime() / 1000)}:R>` : '`Finalizando...`';

        return {
          name: `🎉 ${g.prize}`,
          value: [
            `> ID: \`${g.giveawayId}\``,
            `> Termina: ${timeText}`,
            `> Ganadores: \`${g.winnerCount}\``,
            `> Participantes: \`${formatNumber(g.participants.length)}\``,
            g.requiredRoleId ? `> Rol: <@&${g.requiredRoleId}>` : null,
            g.requiredLevel ? `> Nivel mín: \`${g.requiredLevel}\`` : null,
          ].filter(Boolean).join('\n'),
          inline: false,
        };
      });

      return createEmbed({
        color: COLORS.GIVEAWAY,
        title: `📋 Sorteos activos (${giveaways.length})`,
        description: block([
          kv('Página', `\`${page + 1} / ${totalPages}\``),
        ]),
        fields,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });
    };

    const generateButtons = (page) => {
      const row = new ActionRowBuilder();
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`glist_prev_${interaction.user.id}`)
          .setLabel('Anterior')
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`glist_next_${interaction.user.id}`)
          .setLabel('Siguiente')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
      return row;
    };

    await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [generateButtons(currentPage)] : [],
      flags: MessageFlags.Ephemeral,
    });

    if (totalPages <= 1) return;

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 120000,
    });

    collector.on('collect', async (i) => {
      if (i.customId.includes('prev')) currentPage = Math.max(0, currentPage - 1);
      else if (i.customId.includes('next')) currentPage = Math.min(totalPages - 1, currentPage + 1);

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on('end', async () => {
      try { await interaction.editReply({ components: [] }); } catch { /* ignorar */ }
    });
  },
};