import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import {
  header, block, kv, createProgressBar, formatPercentage,
  formatNumber, formatRelativeTime,
} from '../../utils/embedDecorations.js';
import { getUserData, getGuildEconomy } from '../../utils/guildData.js';
import { getGuildLevel, getXpForLevel } from '../../utils/levelSystem.js';
import { getAllBadgesText } from '../../utils/badges.js';
import { formatAchievements } from '../../utils/achievements.js';
import { GuildLevel } from '../../models/GuildLevel.js';
import { User } from '../../models/User.js';
import { getActiveEvents, formatEventType, formatMultiplier } from '../../utils/eventManager.js';

function getGlobalXpForLevel(level) {
  return level * level * 100;
}

async function getGuildPosition(guildId, level, xp) {
  const above = await GuildLevel.countDocuments({
    guildId,
    $or: [
      { level: { $gt: level } },
      { level, xp: { $gt: xp } },
    ],
  });
  return above + 1;
}

async function getGlobalPosition(level, xp) {
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
    .setName('profile')
    .setDescription('👤 Muestra tu perfil o el de otro usuario')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a ver (opcional)').setRequired(false)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const data = await getUserData(target.id, target.username);
    const economy = await getGuildEconomy(interaction.guildId, target.id, target.username);

    const guildLevelData = await getGuildLevel(interaction.guildId, target.id);
    const guildXpNeeded = getXpForLevel(guildLevelData.level);
    const guildPct = formatPercentage(guildLevelData.xp, guildXpNeeded);
    const guildBar = createProgressBar(guildLevelData.xp, guildXpNeeded, 14);
    const guildPosition = await getGuildPosition(interaction.guildId, guildLevelData.level, guildLevelData.xp);

    const globalXpNeeded = getGlobalXpForLevel(data.level);
    const globalPct = formatPercentage(data.xp, globalXpNeeded);
    const globalBar = createProgressBar(data.xp, globalXpNeeded, 14);
    const globalPosition = await getGlobalPosition(data.level, data.xp);

    const wallet = economy?.balance || 0;
    const bank = economy?.bank || 0;
    const total = wallet + bank;

    const achievements = await formatAchievements(interaction.guildId, target.id);

    const activeEvents = await getActiveEvents();
    const eventsBlock = formatActiveEvents(activeEvents);

    const lines = [
      block([
        kv('Cuenta creada', formatRelativeTime(target.createdTimestamp)),
        kv('Mensajes', `\`${formatNumber(data.messages || 0)}\``),
        kv('Racha diaria', `\`${economy.dailyStreak || 0} días\``),
      ]),
      '',
      header('💰', `Economía en ${interaction.guild.name}`),
      block([
        kv('En mano', `\`${formatNumber(wallet)} coins\``),
        kv('Banco', `\`${formatNumber(bank)} coins\``),
        kv('Total', `\`${formatNumber(total)} coins\``),
      ]),
      '',
      header('🏠', 'Nivel del servidor'),
      block([
        kv('Nivel', `\`${guildLevelData.level}\``),
        kv('Posición', `\`#${guildPosition}\``),
        `\`${guildBar}\` **${guildPct}%**`,
        `\`${formatNumber(guildLevelData.xp)} / ${formatNumber(guildXpNeeded)} XP\``,
      ]),
      '',
      header('🌍', 'Nivel global'),
      block([
        kv('Nivel', `\`${data.level}\``),
        kv('Posición', `\`#${globalPosition}\``),
        `\`${globalBar}\` **${globalPct}%**`,
        `\`${formatNumber(data.xp)} / ${formatNumber(globalXpNeeded)} XP\``,
      ]),
      '',
      header('🏆', `Logros (${achievements.unlocked}/${achievements.total})`),
      '',
      header('🎖️', 'Insignias'),
      getAllBadgesText(data.badges) || '`Ninguna`',
    ];

    if (eventsBlock) {
      lines.push('', header('🎉', 'Eventos activos'), eventsBlock);
    }

    const embed = createEmbed({
      color: COLORS.LEVELING,
      title: `👤 ${target.username}`,
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