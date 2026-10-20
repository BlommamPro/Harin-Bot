import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { GuildLevel } from '../../models/GuildLevel.js';
import { Warn } from '../../models/Warn.js';
import { GuildEconomy } from '../../models/GuildEconomy.js';
import { WeeklyRanking } from '../../models/WeeklyRanking.js';
import { Achievement } from '../../models/Achievement.js';
import { logger } from '../../utils/logger.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reinicia datos del servidor o de un usuario')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('levels')
         .setDescription('Reinicia los niveles de TODOS los usuarios del servidor')
         .addBooleanOption(opt =>
           opt.setName('confirmar').setDescription('Escribe true para confirmar').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('warns')
         .setDescription('Elimina TODOS los warns del servidor')
         .addBooleanOption(opt =>
           opt.setName('confirmar').setDescription('Escribe true para confirmar').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('economy')
         .setDescription('Reinicia la economía de TODOS los usuarios del servidor')
         .addBooleanOption(opt =>
           opt.setName('confirmar').setDescription('Escribe true para confirmar').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('user')
         .setDescription('Reinicia un usuario (niveles + warns + economía) en este servidor')
         .addUserOption(opt =>
           opt.setName('usuario').setDescription('Usuario a reiniciar').setRequired(true)
         )
         .addBooleanOption(opt =>
           opt.setName('confirmar').setDescription('Escribe true para confirmar').setRequired(true)
         )
    ),

  PERMISSIONS: ['Administrator'],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    const confirm = interaction.options.getBoolean('confirmar');

    if (!confirm) {
      return interaction.reply({
        embeds: [errorEmbed('Debes confirmar con `confirmar:true`.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'levels') {
      const result = await GuildLevel.deleteMany({ guildId: interaction.guildId });

      logger.warn(
        `[RESET] ${interaction.user.tag} reinició niveles de ${interaction.guild.name} (${result.deletedCount} registros)`
      );

      const description = block([
        kv('Niveles eliminados', `\`${formatNumber(result.deletedCount)}\``),
        kv('Servidor', interaction.guild.name),
        kv('Ejecutado por', interaction.user.tag),
      ]);

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🧹 Niveles reiniciados',
          description,
        })],
      });
    }

    if (sub === 'warns') {
      const result = await Warn.deleteMany({ guildId: interaction.guildId });

      logger.warn(
        `[RESET] ${interaction.user.tag} eliminó warns de ${interaction.guild.name} (${result.deletedCount} registros)`
      );

      const description = block([
        kv('Warns eliminados', `\`${formatNumber(result.deletedCount)}\``),
        kv('Servidor', interaction.guild.name),
        kv('Ejecutado por', interaction.user.tag),
      ]);

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🧹 Warns eliminados',
          description,
        })],
      });
    }

    if (sub === 'economy') {
      const economyResult = await GuildEconomy.deleteMany({ guildId: interaction.guildId });
      const rankingResult = await WeeklyRanking.deleteMany({ guildId: interaction.guildId });
      const achievementsResult = await Achievement.deleteMany({ guildId: interaction.guildId });

      logger.warn(
        `[RESET] ${interaction.user.tag} reinició economía de ${interaction.guild.name} (${economyResult.deletedCount} cuentas)`
      );

      const description = block([
        kv('Cuentas eliminadas', `\`${formatNumber(economyResult.deletedCount)}\``),
        kv('Registros ranking', `\`${formatNumber(rankingResult.deletedCount)}\``),
        kv('Logros eliminados', `\`${formatNumber(achievementsResult.deletedCount)}\``),
        kv('Balance inicial', '`500 coins`'),
        kv('Servidor', interaction.guild.name),
        kv('Ejecutado por', interaction.user.tag),
      ]);

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🧹 Economía reiniciada',
          description,
        })],
      });
    }

    if (sub === 'user') {
      const target = interaction.options.getUser('usuario');

      const levels = await GuildLevel.deleteOne({ guildId: interaction.guildId, userId: target.id });
      const warns = await Warn.deleteMany({ guildId: interaction.guildId, userId: target.id });
      const economy = await GuildEconomy.deleteOne({ guildId: interaction.guildId, userId: target.id });
      const ranking = await WeeklyRanking.deleteMany({ guildId: interaction.guildId, userId: target.id });
      const achievements = await Achievement.deleteMany({ guildId: interaction.guildId, userId: target.id });

      logger.warn(
        `[RESET] ${interaction.user.tag} reinició a ${target.tag} en ${interaction.guild.name}`
      );

      const description = block([
        kv('Usuario', target),
        kv('Niveles borrados', `\`${levels.deletedCount}\``),
        kv('Warns borrados', `\`${warns.deletedCount}\``),
        kv('Economía', economy.deletedCount > 0 ? '`Reiniciada`' : '`Sin datos previos`'),
        kv('Registros ranking', `\`${ranking.deletedCount}\``),
        kv('Logros eliminados', `\`${achievements.deletedCount}\``),
        kv('Ejecutado por', interaction.user.tag),
      ]);

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: `🧹 ${target.username} reiniciado`,
          description,
        })],
      });
    }
  },
};