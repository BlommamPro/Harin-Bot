import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { getGuildData } from '../../utils/guildData.js';
import { getLevelConfig } from '../../utils/levelSystem.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { getWarnConfig } from '../../utils/warns.js';
import { GuildLevel } from '../../models/GuildLevel.js';
import { Warn } from '../../models/Warn.js';
import { GuildEconomy } from '../../models/GuildEconomy.js';
import { Giveaway } from '../../models/Giveaway.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('config')
    .setDescription('⚙️ Panel de configuración del servidor')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  PERMISSIONS: ['ManageGuild'],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const guildData = await getGuildData(interaction.guildId);
    const levelConfig = await getLevelConfig(interaction.guildId);
    const economyConfig = await getEconomyConfig(interaction.guildId);
    const warnConfig = await getWarnConfig(interaction.guildId);

    const levelCount = await GuildLevel.countDocuments({ guildId: interaction.guildId });
    const warnCount = await Warn.countDocuments({ guildId: interaction.guildId });
    const econCount = await GuildEconomy.countDocuments({ guildId: interaction.guildId });
    const activeGiveaways = await Giveaway.countDocuments({ guildId: interaction.guildId, ended: false });

    const description = [
      header('📊', 'Datos del servidor'),
      block([
        kv('Usuarios con nivel', `\`${levelCount}\``),
        kv('Usuarios con economía', `\`${econCount}\``),
        kv('Warns totales', `\`${warnCount}\``),
        kv('Sorteos activos', `\`${activeGiveaways}\``),
        kv('Idioma', `\`${guildData?.language || 'es'}\``),
      ]),
      '',
      header('⚙️', 'Módulos'),
      block([
        kv('⭐ Niveles', levelConfig?.enabled ? '✅ Activado' : '❌ Desactivado'),
        kv('💰 Economía', economyConfig?.economyEnabled ? '✅ Activado' : '❌ Desactivado'),
        kv('🛡️ Warns auto', warnConfig.actions.length > 0 ? `✅ ${warnConfig.actions.length} reglas` : '❌ Desactivado'),
      ]),
      '',
      header('🛠️', 'Configuración de niveles'),
      [
        '`/levelconfig view` — Ver configuración',
        '`/levelconfig enable` — Activar/desactivar',
        '`/levelconfig role` — Rol por nivel',
        '`/levelconfig channel` — Canal de anuncios',
        '`/levelconfig message` — Mensaje de subida',
        '`/levelconfig ignore` — Excluir canal de XP',
      ].join('\n'),
      '',
      header('💰', 'Configuración de economía'),
      [
        '`/economyconfig view` — Ver configuración',
        '`/economyconfig cooldowns` — Ajustar cooldowns',
        '`/economyconfig rewards` — Ajustar recompensas',
        '`/economyconfig bet_limits` — Límites de apuesta',
        '`/economyconfig toggle` — Activar/desactivar',
        '`/economyconfig reset` — Restaurar valores por defecto',
      ].join('\n'),
      '',
      header('🛡️', 'Configuración de warns'),
      [
        '`/warnconfig view` — Ver configuración',
        '`/warnconfig add` — Añadir acción automática',
        '`/warnconfig remove` — Quitar acción',
        '`/warnconfig dm` — Avisar por DM al advertir',
      ].join('\n'),
      '',
      header('🧹', 'Reiniciar datos del servidor'),
      [
        '`/reset levels` — Borrar todos los niveles',
        '`/reset warns` — Borrar todos los warns',
        '`/reset economy` — Reiniciar toda la economía',
        '`/reset user` — Reiniciar un usuario específico',
      ].join('\n'),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.INFO,
      title: `⚙️ Configuración de ${interaction.guild.name}`,
      thumbnail: interaction.guild.iconURL({ dynamic: true, size: 256 }),
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    return interaction.reply({ embeds: [embed] });
  },
};