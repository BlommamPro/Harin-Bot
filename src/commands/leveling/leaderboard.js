import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { getMedal, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildLeaderboard } from '../../utils/levelSystem.js';
import { User } from '../../models/User.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Tabla de clasificación de niveles')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('tipo')
         .setDescription('Qué leaderboard ver')
         .setRequired(false)
         .addChoices(
           { name: '🏠 Niveles del servidor', value: 'guild_levels' },
           { name: '🌍 Niveles globales', value: 'global_levels' }
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const type = interaction.options.getString('tipo') || 'guild_levels';

    if (type === 'guild_levels') {
      const top = await getGuildLeaderboard(interaction.guildId, 10);

      if (top.length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('Nadie tiene niveles en este servidor todavía.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = top.map((u, i) =>
        `${getMedal(i)} <@${u.userId}> — **Nv. ${u.level}** · \`${formatNumber(u.xp)} XP\``
      );

      const description = [
        `-# Top niveles de **${interaction.guild.name}**`,
        '',
        lines.join('\n'),
      ].join('\n');

      const embed = createEmbed({
        color: COLORS.LEVELING,
        title: '🏆 Ranking del servidor',
        description,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (type === 'global_levels') {
      const top = await User.find().sort({ level: -1, xp: -1 }).limit(10);

      if (top.length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('Nadie tiene niveles globales todavía.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = top.map((u, i) =>
        `${getMedal(i)} <@${u.userId}> — **Nv. ${u.level}** · \`${formatNumber(u.xp)} XP\``
      );

      const description = [
        `-# Top niveles globales del bot`,
        '',
        lines.join('\n'),
      ].join('\n');

      const embed = createEmbed({
        color: COLORS.LEVELING,
        title: '🌍 Ranking global',
        description,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      return interaction.reply({ embeds: [embed] });
    }
  },
};