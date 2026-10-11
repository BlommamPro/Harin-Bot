import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { createProgressBar, formatPercentage } from '../../utils/embedDecorations.js';
import { getUserData, getGuildEconomy } from '../../utils/guildData.js';
import { getGuildLevel, getXpForLevel } from '../../utils/levelSystem.js';
import { getAllBadgesText } from '../../utils/badges.js';
import { formatAchievements } from '../../utils/achievements.js';

function getGlobalXpForLevel(level) {
  return level * level * 100;
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

  async execute(client, interaction, guildData, userData) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const data = await getUserData(target.id, target.username);
    const economy = await getGuildEconomy(interaction.guildId, target.id, target.username);

    const guildLevelData = await getGuildLevel(interaction.guildId, target.id);
    const guildXpNeeded = getXpForLevel(guildLevelData.level);
    const guildProgress = formatPercentage(guildLevelData.xp, guildXpNeeded);
    const guildBar = createProgressBar(guildLevelData.xp, guildXpNeeded, 16);

    const globalXpNeeded = getGlobalXpForLevel(data.level);
    const globalProgress = formatPercentage(data.xp, globalXpNeeded);
    const globalBar = createProgressBar(data.xp, globalXpNeeded, 16);

    const wallet = economy?.balance || 0;
    const bank = economy?.bank || 0;
    const total = wallet + bank;

    const achievements = await formatAchievements(interaction.guildId, target.id);

    const embed = createEmbed({
      color: COLORS.LEVELING,
      title: `👤 Perfil de ${target.username}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description: [
        `📅 **Cuenta creada:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
        `💬 **Mensajes:** \`${data.messages || 0}\``,
        `🔥 **Racha diaria:** \`${economy.dailyStreak || 0} días\``,
        '',
        `💰 **Economía (${interaction.guild.name})**`,
        `💵 En mano: \`${wallet} coins\``,
        `🏦 Banco: \`${bank} coins\``,
        `📊 Total: \`${total} coins\``,
        '',
        `⭐ **Niveles**`,
        `🏠 Servidor: Nivel \`${guildLevelData.level}\``,
        `\`${guildBar}\` \`${guildProgress}%\``,
        `🌍 Global: Nivel \`${data.level}\``,
        `\`${globalBar}\` \`${globalProgress}%\``,
        '',
        `🏆 **Logros:** \`${achievements.unlocked}/${achievements.total}\``,
        '',
        `🎖️ **Insignias**`,
        getAllBadgesText(data.badges) || '`Ninguna`'
      ].join('\n'),
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};