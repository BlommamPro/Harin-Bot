import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber, header, getMedal } from '../../utils/embedDecorations.js';
import { getGuildData, updateGuildData } from '../../utils/guildData.js';
import { getLevelConfig, updateLevelConfig } from '../../utils/levelSystem.js';
import { getWarnConfig, updateWarnConfig } from '../../utils/warns.js';
import { getEconomyConfig, updateEconomyConfig } from '../../utils/economyConfigGuild.js';
import { GuildEconomy } from '../../models/GuildEconomy.js';
import { emojis } from '../../utils/emojis.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('owner-settings')
    .setDescription('👑 Configuración de módulos (solo owner)')
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('info')
         .setDescription('📋 Ver información del servidor actual')
    )
    .addSubcommand(sub =>
      sub.setName('module')
         .setDescription('🔧 Activar/desactivar módulos')
         .addStringOption(opt =>
           opt.setName('modulo').setDescription('Módulo').setRequired(true)
              .addChoices(
                { name: '⭐ Niveles', value: 'levels' },
                { name: '🛡️ Warns automáticos', value: 'auto_warns' },
                { name: '💰 Economía', value: 'economy' }
              )
         )
         .addBooleanOption(opt =>
           opt.setName('activar').setDescription('Activar/desactivar').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('clean')
         .setDescription('🧹 Limpiar datos del servidor (mantiene config)')
         .addStringOption(opt =>
           opt.setName('que').setDescription('Qué limpiar').setRequired(true)
              .addChoices(
                { name: '🗑️ Todos los datos', value: 'all_users' },
                { name: '💰 Economía', value: 'economy' },
                { name: '⭐ Niveles', value: 'levels' },
                { name: '⚠️ Warns', value: 'warns' }
              )
         )
         .addBooleanOption(opt =>
           opt.setName('confirmar').setDescription('Confirmar').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('stats').setDescription('📊 Estadísticas del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('language')
         .setDescription('🌐 Cambiar idioma del servidor')
         .addStringOption(opt =>
           opt.setName('idioma').setDescription('Idioma').setRequired(true)
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

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'info') {
      const levelConfig = await getLevelConfig(interaction.guildId);
      const warnConfig = await getWarnConfig(interaction.guildId);
      const economyConfig = await getEconomyConfig(interaction.guildId);
      const guildDataFull = await getGuildData(interaction.guildId);

      const { User } = await import('../../models/User.js');
      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');

      const userCount = await User.countDocuments();
      const guildLevelCount = await GuildLevel.countDocuments({ guildId: interaction.guildId });
      const warnCount = await Warn.countDocuments({ guildId: interaction.guildId });

      const description = [
        block([
          kv('ID', `\`${guild.id}\``),
          kv('Dueño', `<@${guild.ownerId}>`),
          kv('Creado', `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`),
          kv('Bot unido', `<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`),
        ]),
        '',
        header('📊', 'Estadísticas'),
        block([
          kv('Miembros', `\`${formatNumber(guild.memberCount)}\``),
          kv('Bots', `\`${formatNumber(guild.members.cache.filter(m => m.user.bot).size)}\``),
          kv('Canales', `\`${formatNumber(guild.channels.cache.size)}\``),
          kv('Roles', `\`${formatNumber(guild.roles.cache.size)}\``),
        ]),
        '',
        header('🗄️', 'Datos en DB'),
        block([
          kv('Usuarios globales', `\`${formatNumber(userCount)}\``),
          kv('Niveles en este server', `\`${formatNumber(guildLevelCount)}\``),
          kv('Warns en este server', `\`${formatNumber(warnCount)}\``),
        ]),
        '',
        header('⚙️', 'Módulos'),
        block([
          kv('⭐ Niveles', levelConfig?.enabled ? `${emojis.on}` : `${emojis.off}`),
          kv('💰 Economía', economyConfig?.economyEnabled ? `${emojis.on}` : `${emojis.off}`),
          kv('🛡️ Warns Auto', warnConfig.actions.length > 0 ? `${emojis.on} ${warnConfig.actions.length} reglas` : `${emojis.off}`),
          kv('🌐 Idioma', `\`${guildDataFull?.language || 'es'}\``),
        ]),
      ].join('\n');

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: `👑 Panel · ${guild.name}`,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        description,
        footer: {
          text: 'Usa /owner-settings module para cambiar módulos',
          icon: client.user.displayAvatarURL(),
        },
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
            embeds: [createEmbed({
              color: enable ? COLORS.SUCCESS : COLORS.WARNING,
              title: enable ? '⭐ Niveles activados' : '⭐ Niveles desactivados',
              description: enable
                ? 'Los usuarios ganarán XP por mensajes.'
                : 'Los usuarios ya no ganarán XP por mensajes.',
            })],
          });

        case 'auto_warns': {
          const warnConfig = await getWarnConfig(interaction.guildId);
          if (enable) {
            if (warnConfig.actions.length === 0) {
              warnConfig.actions = [
                { warns: 3, action: 'timeout', duration: 10 },
                { warns: 5, action: 'kick' },
                { warns: 7, action: 'ban' },
              ];
              await updateWarnConfig(interaction.guildId, { actions: warnConfig.actions });
            }
          } else {
            await updateWarnConfig(interaction.guildId, { actions: [] });
          }
          return interaction.reply({
            embeds: [createEmbed({
              color: enable ? COLORS.SUCCESS : COLORS.WARNING,
              title: enable ? '🛡️ Warns auto activados' : '🛡️ Warns auto desactivados',
              description: enable
                ? '3 warns = timeout · 5 warns = kick · 7 warns = ban'
                : 'Los warns ya no ejecutarán acciones automáticas.',
            })],
          });
        }

        case 'economy':
          await updateEconomyConfig(interaction.guildId, { economyEnabled: enable });
          return interaction.reply({
            embeds: [createEmbed({
              color: enable ? COLORS.SUCCESS : COLORS.WARNING,
              title: enable ? '💰 Economía activada' : '💰 Economía desactivada',
              description: enable
                ? 'Los comandos de economía están disponibles.'
                : 'Los comandos de economía están desactivados.',
            })],
          });

        default:
          return interaction.reply({
            embeds: [errorEmbed('❌ Módulo no reconocido.')],
            flags: MessageFlags.Ephemeral,
          });
      }
    }

    if (sub === 'clean') {
      const what = interaction.options.getString('que');
      const confirm = interaction.options.getBoolean('confirmar');

      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('Debes confirmar con `confirmar:true`.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      let description = '';
      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');

      switch (what) {
        case 'all_users': {
          const levelResult = await GuildLevel.deleteMany({ guildId: interaction.guildId });
          const warnResult = await Warn.deleteMany({ guildId: interaction.guildId });
          const economyResult = await GuildEconomy.deleteMany({ guildId: interaction.guildId });

          description = block([
            kv('Niveles eliminados', `\`${formatNumber(levelResult.deletedCount)}\``),
            kv('Warns eliminados', `\`${formatNumber(warnResult.deletedCount)}\``),
            kv('Economías eliminadas', `\`${formatNumber(economyResult.deletedCount)}\``),
          ]);
          break;
        }
        case 'economy': {
          const economyResult = await GuildEconomy.updateMany(
            { guildId: interaction.guildId },
            { balance: 500, bank: 0, upgrades: [], inventory: [] }
          );
          description = block([
            kv('Usuarios afectados', `\`${formatNumber(economyResult.modifiedCount)}\``),
            kv('Balance nuevo', '`500 coins`'),
          ]);
          break;
        }
        case 'levels': {
          const levelResult = await GuildLevel.deleteMany({ guildId: interaction.guildId });
          description = block([kv('Niveles eliminados', `\`${formatNumber(levelResult.deletedCount)}\``)]);
          break;
        }
        case 'warns': {
          const warnResult = await Warn.deleteMany({ guildId: interaction.guildId });
          description = block([kv('Warns eliminados', `\`${formatNumber(warnResult.deletedCount)}\``)]);
          break;
        }
        default:
          return interaction.reply({
            embeds: [errorEmbed('Opción no reconocida.')],
            flags: MessageFlags.Ephemeral,
          });
      }

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🧹 Limpieza completada',
          description,
        })],
      });
    }

    if (sub === 'stats') {
      const totalMembers = guild.memberCount;
      const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
      const botCount = guild.members.cache.filter(m => m.user.bot).size;
      const humanCount = totalMembers - botCount;

      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');
      const { Giveaway } = await import('../../models/Giveaway.js');

      const guildLevelCount = await GuildLevel.countDocuments({ guildId: interaction.guildId });
      const warnCount = await Warn.countDocuments({ guildId: interaction.guildId });
      const giveawayCount = await Giveaway.countDocuments({ guildId: interaction.guildId, ended: false });

      const topLevels = await GuildLevel.find({ guildId: interaction.guildId })
        .sort({ level: -1, xp: -1 })
        .limit(5);

      const topLevelsText = topLevels.length > 0
        ? topLevels.map((l, i) => `${getMedal(i)} <@${l.userId}> — Nv. \`${l.level}\``).join('\n')
        : '`Sin datos`';

      const description = [
        header('👥', 'Miembros'),
        block([
          kv('Total', `\`${formatNumber(totalMembers)}\``),
          kv('Humanos', `\`${formatNumber(humanCount)}\``),
          kv('Bots', `\`${formatNumber(botCount)}\``),
          kv('En línea', `\`${formatNumber(onlineMembers)}\``),
        ]),
        '',
        header('📋', 'Datos del bot'),
        block([
          kv('Niveles', `\`${formatNumber(guildLevelCount)}\``),
          kv('Warns', `\`${formatNumber(warnCount)}\``),
          kv('Sorteos activos', `\`${formatNumber(giveawayCount)}\``),
        ]),
        '',
        header('🏆', 'Top 5 niveles'),
        topLevelsText,
      ].join('\n');

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.OWNER,
          title: `📊 ${guild.name}`,
          thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
          description,
          footer: {
            text: `Actualizado: ${new Date().toLocaleString('es-ES')}`,
            icon: client.user.displayAvatarURL(),
          },
        })],
      });
    }

    if (sub === 'language') {
      const lang = interaction.options.getString('idioma');
      await updateGuildData(interaction.guildId, { language: lang });

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🌐 Idioma actualizado',
          description: block([kv('Nuevo idioma', `\`${lang === 'es' ? 'Español' : 'English'}\``)]),
        })],
      });
    }
  },
};