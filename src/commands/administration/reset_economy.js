import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed, COLORS } from '../../utils/embeds.js';
import { GuildEconomy } from '../../models/GuildEconomy.js';
import { WeeklyRanking } from '../../models/WeeklyRanking.js';
import { Achievement } from '../../models/Achievement.js';
import { logger } from '../../utils/logger.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('reset_economy')
    .setDescription('🔄 Reinicia la economía del servidor (¡CUIDADO!)')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand(sub =>
      sub.setName('all')
         .setDescription('🗑️ Borrar TODA la economía del servidor')
         .addBooleanOption(opt =>
           opt.setName('confirmar')
              .setDescription('Escribe true para confirmar')
              .setRequired(true)
         )
    )

    .addSubcommand(sub =>
      sub.setName('user')
         .setDescription('👤 Reiniciar la economía de UN usuario')
         .addUserOption(opt =>
           opt.setName('usuario')
              .setDescription('Usuario a reiniciar')
              .setRequired(true)
         )
         .addBooleanOption(opt =>
           opt.setName('confirmar')
              .setDescription('Escribe true para confirmar')
              .setRequired(true)
         )
    )

    .addSubcommand(sub =>
      sub.setName('stats')
         .setDescription('📊 Ver cuánto dinero hay en circulación en este servidor')
    ),

  PERMISSIONS: ['Administrator'],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'all') {
      const confirm = interaction.options.getBoolean('confirmar');
      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes confirmar con `confirmar:true`.')],
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        const economyResult = await GuildEconomy.deleteMany({ guildId: interaction.guildId });
        const rankingResult = await WeeklyRanking.deleteMany({ guildId: interaction.guildId });
        const achievementsResult = await Achievement.deleteMany({ guildId: interaction.guildId });

        logger.warn(
          `[RESET_ECONOMY] ${interaction.user.tag} reinició la economía de ${interaction.guild.name}`
        );

        const embed = successEmbed(
          `🔄 Economía del servidor reiniciada.\n\n` +
          `**Datos eliminados:**\n` +
          `• ${economyResult.deletedCount} cuentas de economía\n` +
          `• ${rankingResult.deletedCount} registros del ranking semanal\n` +
          `• ${achievementsResult.deletedCount} logros desbloqueados\n\n` +
          `💡 Los usuarios empezarán de cero con el nuevo balance inicial.`
        );
        embed.setTitle('🗑️ Economía Reiniciada');

        return interaction.reply({ embeds: [embed] });
      } catch (err) {
        logger.error('Error al reiniciar economía:', err);
        return interaction.reply({
          embeds: [errorEmbed(`❌ Error al reiniciar: ${err.message}`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (sub === 'user') {
      const target = interaction.options.getUser('usuario');
      const confirm = interaction.options.getBoolean('confirmar');

      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes confirmar con `confirmar:true`.')],
          flags: MessageFlags.Ephemeral
        });
      }

      const economyResult = await GuildEconomy.deleteOne({
        guildId: interaction.guildId,
        userId: target.id
      });
      const rankingResult = await WeeklyRanking.deleteMany({
        guildId: interaction.guildId,
        userId: target.id
      });
      const achievementsResult = await Achievement.deleteMany({
        guildId: interaction.guildId,
        userId: target.id
      });

      if (economyResult.deletedCount === 0) {
        return interaction.reply({
          embeds: [errorEmbed(`❌ ${target} no tiene economía en este servidor.`)],
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = successEmbed(
        `🔄 Economía de ${target} reiniciada.\n\n` +
        `• Cuenta de economía eliminada\n` +
        `• ${rankingResult.deletedCount} registros del ranking eliminados\n` +
        `• ${achievementsResult.deletedCount} logros eliminados\n\n` +
        `💡 Empezará de cero la próxima vez que use un comando.`
      );
      embed.setTitle('🗑️ Economía Reiniciada');

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'stats') {
      const top = await GuildEconomy.aggregate([
        { $match: { guildId: interaction.guildId } },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' },
            totalBank: { $sum: '$bank' },
            userCount: { $sum: 1 },
            avgBalance: { $avg: '$balance' },
            maxBalance: { $max: '$balance' }
          }
        }
      ]);

      if (top.length === 0) {
        return interaction.reply({
          embeds: [createEmbed({
            color: COLORS.INFO,
            title: '📊 Estadísticas de Economía',
            description: 'No hay datos de economía en este servidor todavía.'
          })]
        });
      }

      const data = top[0];
      const totalWealth = data.totalBalance + data.totalBank;

      const embed = createEmbed({
        color: COLORS.ECONOMY,
        title: `📊 Economía de ${interaction.guild.name}`,
        description: [
          `**💵 Dinero en circulación**`,
          `• En mano: \`${data.totalBalance.toLocaleString()} coins\``,
          `• En bancos: \`${data.totalBank.toLocaleString()} coins\``,
          `• Total: \`${totalWealth.toLocaleString()} coins\``,
          '',
          `**👥 Usuarios**`,
          `• Con economía: \`${data.userCount}\``,
          `• Promedio: \`${Math.floor(data.avgBalance).toLocaleString()} coins\``,
          `• Máximo: \`${data.maxBalance.toLocaleString()} coins\``
        ].join('\n'),
        footer: {
          text: `Usa /economyconfig para ajustar la economía`,
          icon: interaction.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed] });
    }
  }
};