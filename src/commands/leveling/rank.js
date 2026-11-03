import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import {
  header, block, kv, createProgressBar, formatPercentage, formatNumber,
} from '../../utils/embedDecorations.js';
import { getGuildLevel, getXpForLevel } from '../../utils/levelSystem.js';
import { getUserData } from '../../utils/guildData.js';
import { GuildLevel } from '../../models/GuildLevel.js';
import { User } from '../../models/User.js';
import { getActiveEvents, formatEventType, formatMultiplier } from '../../utils/eventManager.js';

function getGlobalXpForLevel(level) {
  return level * level * 100;
}

async function getGuildPosition(guildId, userId, level, xp) {
  const above = await GuildLevel.countDocuments({
    guildId,
    $or: [
      { level: { $gt: level } },
      { level, xp: { $gt: xp } },
    ],
  });
  return above + 1;
}

async function getGlobalPosition(userId, level, xp) {
  const above = await User.countDocuments({
    $or: [
      { level: { $gt: level } },
      { level, xp: { $gt: xp } },
    ],
  });
  return above + 1;
}

function formatActiveEvents(events) {
  if (!events || events.length === 0) return null;
  return events.map(e => {
    const endTs = Math.floor(new Date(e.endTime).getTime() / 1000);
    return `> ${formatEventType(e.type)} — **${e.name || 'Sin nombre'}** ${formatMultiplier(e.multiplier)} · <t:${endTs}:R>`;
  }).join('\n');
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Muestra tu progreso de nivel')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a ver (opcional)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('tipo')
         .setDescription('Ver nivel del servidor o global')
         .setRequired(false)
         .addChoices(
           { name: '🏠 Servidor', value: 'guild' },
           { name: '🌍 Global', value: 'global' }
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const type = interaction.options.getString('tipo') || 'guild';

    const activeEvents = await getActiveEvents();
    const eventsBlock = formatActiveEvents(activeEvents);

    if (type === 'global') {
      const data = await getUserData(target.id, target.username);
      const xpNeeded = getGlobalXpForLevel(data.level);
      const bar = createProgressBar(data.xp, xpNeeded, 16);
      const pct = formatPercentage(data.xp, xpNeeded);
      const position = await getGlobalPosition(target.id, data.level, data.xp);

      const lines = [
        block([
          kv('Nivel', `\`${data.level}\``),
          kv('XP', `\`${formatNumber(data.xp)} / ${formatNumber(xpNeeded)}\``),
          `\`${bar}\` **${pct}%**`,
          kv('Mensajes', `\`${formatNumber(data.messages)}\``),
          kv('Posición global', `\`#${position}\``),
        ]),
      ];

      if (eventsBlock) {
        lines.push('', header('🎉', 'Eventos activos'), eventsBlock);
      }

      const embed = createEmbed({
        color: COLORS.LEVELING,
        title: `🌍 Rango global · ${target.username}`,
        thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
        description: lines.join('\n'),
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      return interaction.reply({ embeds: [embed] });
    }

    const data = await getGuildLevel(interaction.guildId, target.id);
    const xpNeeded = getXpForLevel(data.level);
    const bar = createProgressBar(data.xp, xpNeeded, 16);
    const pct = formatPercentage(data.xp, xpNeeded);
    const position = await getGuildPosition(interaction.guildId, target.id, data.level, data.xp);

    const lines = [
      block([
        kv('Nivel', `\`${data.level}\``),
        kv('XP', `\`${formatNumber(data.xp)} / ${formatNumber(xpNeeded)}\``),
        `\`${bar}\` **${pct}%**`,
        kv('Mensajes', `\`${formatNumber(data.messages)}\``),
        kv('Posición en el servidor', `\`#${position}\``),
      ]),
    ];

    if (eventsBlock) {
      lines.push('', header('🎉', 'Eventos activos'), eventsBlock);
    }

    const embed = createEmbed({
      color: COLORS.LEVELING,
      title: `🏠 Rango en ${interaction.guild.name} · ${target.username}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description: lines.join('\n'),
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};