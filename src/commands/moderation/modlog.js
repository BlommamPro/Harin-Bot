import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { getModLog } from '../../utils/modlog.js';
import { Warn } from '../../models/Warn.js';

const ACTION_NAMES = {
  ban: '🔨 Ban',
  unban: '🔓 Unban',
  kick: '👢 Kick',
  timeout: '⏱️ Timeout',
  untimeout: '⏱️ Untimeout',
  warn: '⚠️ Warn',
  unwarn: '🗑️ Unwarn',
  clear: '🧹 Clear',
};

export default {
  CMD: new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('Muestra el historial de moderación de un usuario')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a consultar').setRequired(true)
    ),

  PERMISSIONS: ['ModerateMembers'],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario');
    const logs = await getModLog(interaction.guildId, target.id, 50);

    if (logs.length === 0) {
      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '✅ Historial limpio',
          description: `${target} no tiene historial de moderación en este servidor.`,
          footer: { text: `Solicitado por ${interaction.user.username}`, icon: interaction.user.displayAvatarURL() },
        })],
      });
    }

    const activeWarns = await Warn.find({ guildId: interaction.guildId, userId: target.id }).select('_id');
    const activeWarnIds = new Set(activeWarns.map(w => w._id.toString()));

    const lines = logs.slice(0, 15).map(entry => {
      const name = ACTION_NAMES[entry.action] || entry.action;
      const time = `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R>`;
      const mod = `<@${entry.moderatorId}>`;

      const parts = [
        `${name} · ${time}`,
        `> **Moderador:** ${mod}`,
        `> **Razón:** ${entry.reason}`,
      ];

      if (entry.duration) parts.push(`> **Duración:** ${entry.duration}`);

      const displayId = entry.warnId || entry._id.toString();
      parts.push(`> **ID:** \`${displayId}\``);

      if (entry.action === 'warn') {
        const isActive = activeWarnIds.has(displayId);
        parts.push(`> **Estado:** ${isActive ? '✅ Activa' : '❌ Eliminada'}`);
      }

      return parts.join('\n');
    });

    const description = [
      block([
        kv('Usuario', `${target.tag} (\`${target.id}\`)`),
        kv('Warns activos', `\`${activeWarns.length}\``),
        kv('Acciones totales', `\`${logs.length}\``),
      ]),
      '',
      header('📜', `Últimas ${Math.min(logs.length, 15)} acciones`),
      '',
      lines.join('\n\n'),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.MODERATION,
      title: `📜 Historial de ${target.username}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description,
      footer: { text: `Solicitado por ${interaction.user.username}`, icon: interaction.user.displayAvatarURL() },
    });

    await interaction.reply({ embeds: [embed] });
  },
};