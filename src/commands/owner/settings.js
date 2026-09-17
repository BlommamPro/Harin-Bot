import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { getGuildData, updateGuildData } from '../../utils/guildData.js';
import { getLevelConfig, updateLevelConfig } from '../../utils/levelSystem.js';
import { getWarnConfig, updateWarnConfig } from '../../utils/warns.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('⚙️ Panel de control del dueño del bot')
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('info')
         .setDescription('📋 Ver información detallada del servidor actual')
    )
    .addSubcommand(sub =>
      sub.setName('module')
         .setDescription('🔧 Activar/desactivar módulos del bot en este servidor')
         .addStringOption(opt =>
           opt.setName('modulo')
              .setDescription('Módulo a configurar')
              .setRequired(true)
              .addChoices(
                { name: '⭐ Niveles (XP por mensajes)', value: 'levels' },
                { name: '🛡️ Warns automáticos', value: 'auto_warns' },
                { name: '💰 Economía (comandos de dinero)', value: 'economy' },
                { name: '🎁 Sorteos', value: 'giveaways' }
              )
         )
         .addBooleanOption(opt =>
           opt.setName('activar')
              .setDescription('Activar o desactivar el módulo')
              .setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('clean')
         .setDescription('🧹 Limpiar datos del servidor actual (mantiene configuración)')
         .addStringOption(opt =>
           opt.setName('que')
              .setDescription('Qué limpiar')
              .setRequired(true)
              .addChoices(
                { name: '🗑️ Todos los datos de usuarios (niveles, warns y economía)', value: 'all_users' },
                { name: '💰 Datos de economía (balances)', value: 'economy' },
                { name: '⭐ Datos de niveles', value: 'levels' },
                { name: '⚠️ Warns de usuarios', value: 'warns' }
              )
         )
         .addBooleanOption(opt =>
           opt.setName('confirmar')
              .setDescription('Escribe "true" para confirmar')
              .setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('stats')
         .setDescription('📊 Ver estadísticas del servidor y el bot')
    )
    .addSubcommand(sub =>
      sub.setName('language')
         .setDescription('🌐 Cambiar el idioma del bot en este servidor')
         .addStringOption(opt =>
           opt.setName('idioma')
              .setDescription('Idioma')
              .setRequired(true)
              .addChoices(
                { name: '🇪🇸 Español', value: 'es' },
                { name: '🇬🇧 English', value: 'en' }
              )
         )
    ),

  OWNER: true,
  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'info') {
      const levelConfig = await getLevelConfig(interaction.guildId);
      const warnConfig = await getWarnConfig(interaction.guildId);
      const guildData = await getGuildData(interaction.guildId);

      const { User } = await import('../../models/User.js');
      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');

      const userCount = await User.countDocuments();
      const guildLevelCount = await GuildLevel.countDocuments({ guildId: interaction.guildId });
      const warnCount = await Warn.countDocuments({ guildId: interaction.guildId });

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: `📊 Panel de Control - ${guild.name}`,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        description: [
          `**🔹 ID:** \`${guild.id}\``,
          `**👑 Dueño:** <@${guild.ownerId}>`,
          `**📅 Creado:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          `**🤖 Bot unido:** <t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`,
          '',
          `**📊 Estadísticas del Servidor**`,
          `👥 **Miembros:** ${guild.memberCount}`,
          `🤖 **Bots:** ${guild.members.cache.filter(m => m.user.bot).size}`,
          `📢 **Canales:** ${guild.channels.cache.size}`,
          `💬 **Roles:** ${guild.roles.cache.size}`,
          '',
          `**📊 Datos en Base de Datos**`,
          `👤 **Usuarios totales (global):** ${userCount}`,
          `⭐ **Niveles en este servidor:** ${guildLevelCount}`,
          `⚠️ **Warns en este servidor:** ${warnCount}`,
          '',
          `**⚙️ Configuración**`,
          `🌐 **Idioma:** \`${guildData?.language || 'es'}\``,
          '',
          `**🔧 Módulos**`,
          `⭐ **Niveles:** ${levelConfig?.enabled ? '✅ Activado' : '❌ Desactivado'}`,
          `💰 **Economía:** ✅ Siempre activo`,
          `🎁 **Sorteos:** ✅ Siempre activo`,
          `🛡️ **Warns Auto:** ${warnConfig.actions.length > 0 ? `✅ Activado (${warnConfig.actions.length} reglas)` : '❌ Desactivado'}`
        ].join('\n'),
        footer: {
          text: `Usa /settings module para cambiar módulos`,
          icon: client.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'module') {
      const moduleName = interaction.options.getString('modulo');
      const enable = interaction.options.getBoolean('activar');

      switch (moduleName) {
        case 'levels':
          await updateLevelConfig(interaction.guildId, { enabled: enable });
          return interaction.reply({
            embeds: [successEmbed(
              `⭐ **Niveles:** ${enable ? '✅ Activado' : '❌ Desactivado'}\n` +
              (enable ? 'Los usuarios ganarán XP por mensajes.' : 'Los usuarios ya no ganarán XP por mensajes.')
            )]
          });

        case 'auto_warns':
          const warnConfig = await getWarnConfig(interaction.guildId);
          if (enable) {
            if (warnConfig.actions.length === 0) {
              warnConfig.actions = [
                { warns: 3, action: 'timeout', duration: 10 },
                { warns: 5, action: 'kick' },
                { warns: 7, action: 'ban' }
              ];
              await updateWarnConfig(interaction.guildId, { actions: warnConfig.actions });
            }
          } else {
            await updateWarnConfig(interaction.guildId, { actions: [] });
          }
          return interaction.reply({
            embeds: [successEmbed(
              `🛡️ **Warns Automáticos:** ${enable ? '✅ Activado' : '❌ Desactivado'}\n` +
              (enable ? '3 warns = timeout, 5 warns = kick, 7 warns = ban' : 'Los warns ya no ejecutarán acciones automáticas.')
            )]
          });

        case 'economy':
          await updateGuildData(interaction.guildId, { economyEnabled: enable });
          return interaction.reply({
            embeds: [successEmbed(
              `💰 **Economía:** ${enable ? '✅ Activado' : '❌ Desactivado'}\n` +
              (enable ? 'Los comandos de economía están disponibles.' : 'Los comandos de economía están desactivados.')
            )]
          });

        case 'giveaways':
          await updateGuildData(interaction.guildId, { giveawaysEnabled: enable });
          return interaction.reply({
            embeds: [successEmbed(
              `🎁 **Sorteos:** ${enable ? '✅ Activado' : '❌ Desactivado'}\n` +
              (enable ? 'Los sorteos están disponibles.' : 'Los sorteos están desactivados.')
            )]
          });

        default:
          return interaction.reply({
            embeds: [errorEmbed('❌ Módulo no reconocido.')],
            flags: MessageFlags.Ephemeral
          });
      }
    }

    if (sub === 'clean') {
      const what = interaction.options.getString('que');
      const confirm = interaction.options.getBoolean('confirmar');

      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes confirmar con `confirmar:true`')],
          flags: MessageFlags.Ephemeral
        });
      }

      let resultMessage = '';
      const { User } = await import('../../models/User.js');
      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');

      const guildUserIds = await GuildLevel
        .find({ guildId: interaction.guildId })
        .distinct('userId');

      const warnUserIds = await Warn
        .find({ guildId: interaction.guildId })
        .distinct('userId');

      const allGuildUserIds = [...new Set([...guildUserIds, ...warnUserIds])];

      switch (what) {
        case 'all_users': {
          let userResult = { deletedCount: 0 };

          if (allGuildUserIds.length > 0) {
            userResult = await User.deleteMany({ userId: { $in: allGuildUserIds } });
          }

          const levelResult = await GuildLevel.deleteMany({ guildId: interaction.guildId });
          const warnResult = await Warn.deleteMany({ guildId: interaction.guildId });

          resultMessage =
            `✅ **Datos limpiados en este servidor:**\n` +
            `👤 ${userResult.deletedCount} usuarios eliminados\n` +
            `⭐ ${levelResult.deletedCount} niveles eliminados\n` +
            `⚠️ ${warnResult.deletedCount} warns eliminados\n\n` +
            `🔒 **Solo se afectó a este servidor.** Los otros servidores no fueron tocados.`;
          break;
        }

        case 'economy': {
          let userUpdateResult = { modifiedCount: 0 };

          if (allGuildUserIds.length > 0) {
            userUpdateResult = await User.updateMany(
              { userId: { $in: allGuildUserIds } },
              { balance: 500, bank: 0, inventory: [] }
            );
          }

          resultMessage = `💰 **Economía reiniciada para ${userUpdateResult.modifiedCount} usuarios** de este servidor.\nTodos tienen ahora 500 coins y banco vacío.`;
          break;
        }

        case 'levels': {
          const levelDeleteResult = await GuildLevel.deleteMany({ guildId: interaction.guildId });
          resultMessage = `⭐ **${levelDeleteResult.deletedCount} niveles eliminados** en este servidor.`;
          break;
        }

        case 'warns': {
          const warnDeleteResult = await Warn.deleteMany({ guildId: interaction.guildId });
          resultMessage = `⚠️ **${warnDeleteResult.deletedCount} warns eliminados** en este servidor.`;
          break;
        }

        default:
          return interaction.reply({
            embeds: [errorEmbed('❌ Opción no reconocida.')],
            flags: MessageFlags.Ephemeral
          });
      }

      return interaction.reply({
        embeds: [successEmbed(resultMessage)]
      });
    }

    if (sub === 'stats') {
      const totalMembers = guild.memberCount;
      const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
      const botCount = guild.members.cache.filter(m => m.user.bot).size;
      const humanCount = totalMembers - botCount;

      const { User } = await import('../../models/User.js');
      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');
      const { Giveaway } = await import('../../models/Giveaway.js');

      const userCount = await User.countDocuments();
      const guildLevelCount = await GuildLevel.countDocuments({ guildId: interaction.guildId });
      const warnCount = await Warn.countDocuments({ guildId: interaction.guildId });
      const giveawayCount = await Giveaway.countDocuments({ guildId: interaction.guildId, ended: false });

      const topLevels = await GuildLevel.find({ guildId: interaction.guildId })
        .sort({ level: -1, xp: -1 })
        .limit(5);

      const topLevelsText = topLevels.length > 0
        ? topLevels.map((l, i) => `${i + 1}. <@${l.userId}> - Nivel ${l.level}`).join('\n')
        : 'No hay datos de niveles';

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: `📊 Estadísticas de ${guild.name}`,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        description: [
          `**👥 Miembros**`,
          `🔹 **Total:** ${totalMembers}`,
          `🔹 **Humanos:** ${humanCount}`,
          `🔹 **Bots:** ${botCount}`,
          `🔹 **En línea:** ${onlineMembers}`,
          '',
          `**📋 Datos del Bot**`,
          `🔹 **Usuarios en DB:** ${userCount}`,
          `🔹 **Niveles registrados:** ${guildLevelCount}`,
          `🔹 **Warns:** ${warnCount}`,
          `🔹 **Sorteos activos:** ${giveawayCount}`,
          '',
          `**🏆 Top 5 Niveles**`,
          topLevelsText
        ].join('\n'),
        footer: {
          text: `Actualizado: ${new Date().toLocaleString()}`,
          icon: client.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'language') {
      const lang = interaction.options.getString('idioma');
      await updateGuildData(interaction.guildId, { language: lang });

      return interaction.reply({
        embeds: [successEmbed(`🌐 Idioma actualizado a: \`${lang === 'es' ? 'Español' : 'English'}\``)]
      });
    }
  }
};