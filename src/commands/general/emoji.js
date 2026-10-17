import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createEmbed, COLORS, errorEmbed } from '../../utils/embeds.js';

const ITEMS_PER_PAGE = 15;

export default {
  CMD: new SlashCommandBuilder()
    .setName('emojis')
    .setDescription('Lista todos los emojis del servidor con sus IDs')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('tipo')
         .setDescription('Filtrar por tipo')
         .setRequired(false)
         .addChoices(
           { name: 'Todos', value: 'all' },
           { name: 'Estáticos', value: 'static' },
           { name: 'Animados', value: 'animated' }
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const guild = interaction.guild;
    const filter = interaction.options.getString('tipo') || 'all';

    let emojis = Array.from(guild.emojis.cache.values());

    if (filter === 'static') {
      emojis = emojis.filter(e => !e.animated);
    } else if (filter === 'animated') {
      emojis = emojis.filter(e => e.animated);
    }

    if (emojis.length === 0) {
      return interaction.reply({
        embeds: [errorEmbed(
          `Este servidor no tiene emojis${filter !== 'all' ? ' de ese tipo' : ''}.`
        )],
        flags: MessageFlags.Ephemeral
      });
    }

    emojis.sort((a, b) => {
      if (a.animated && !b.animated) return -1;
      if (!a.animated && b.animated) return 1;
      return a.name.localeCompare(b.name);
    });

    const totalPages = Math.ceil(emojis.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageEmojis = emojis.slice(start, end);

      const lines = pageEmojis.map(e => {
        const textFormat = e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`;
        return `${e.toString()} \`${textFormat}\``;
      });

      const staticCount = emojis.filter(e => !e.animated).length;
      const animatedCount = emojis.filter(e => e.animated).length;

      return createEmbed({
        color: COLORS.GENERAL,
        title: `Emojis de ${guild.name}`,
        description: lines.join('\n'),
        fields: [
          { name: 'Estáticos', value: `\`${staticCount}\``, inline: true },
          { name: 'Animados', value: `\`${animatedCount}\``, inline: true },
          { name: 'Total', value: `\`${emojis.length}\``, inline: true }
        ],
        footer: {
          text: `Página ${page + 1} de ${totalPages} • Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL()
        }
      });
    };

    const generateButtons = (page) => {
      const row = new ActionRowBuilder();
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`emojis-prev-{${interaction.user.id}}`)
          .setLabel('Anterior')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`emojis-next-{${interaction.user.id}}`)
          .setLabel('Siguiente')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );
      return row;
    };

    await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [generateButtons(currentPage)] : []
    });

    if (totalPages <= 1) return;

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 120000
    });

    collector.on('collect', async (i) => {
      if (i.customId.startsWith('emojis-prev')) {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId.startsWith('emojis-next')) {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      }

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)]
      });
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch { /* mensaje ya borrado */ }
    });
  }
};