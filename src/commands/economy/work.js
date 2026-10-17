import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAchievements } from '../../utils/achievements.js';
import { applyWorkBonus } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

const JOBS = [
  { name: 'desarrollador de software', description: 'trabajaste en una startup tecnológica', emoji: '💻' },
  { name: 'chef', description: 'cocinaste en un restaurante de lujo', emoji: '👨‍🍳' },
  { name: 'músico callejero', description: 'tocaste en la plaza principal', emoji: '🎵' },
  { name: 'entrenador personal', description: 'diste clases de fitness', emoji: '💪' },
  { name: 'diseñador gráfico', description: 'hiciste logos para clientes', emoji: '🎨' },
  { name: 'repartidor de comida', description: 'entregaste pedidos en bicicleta', emoji: '🛵' },
  { name: 'fotógrafo de bodas', description: 'capturaste momentos especiales', emoji: '📸' },
  { name: 'profesor particular', description: 'diste clases de matemáticas', emoji: '📚' },
  { name: 'youtuber', description: 'subiste un video viral', emoji: '📹' },
  { name: 'traductor', description: 'tradujiste documentos importantes', emoji: '🌐' },
];

export default {
  CMD: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabaja para ganar coins')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) return interaction.editReply({ embeds: economyDisabled.embeds });

    const config = await getEconomyConfig(interaction.guildId);
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    const cd = await checkDbCooldown(interaction.user.id, `work_${interaction.guildId}`, config.workCooldownMinutes);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`Ya trabajaste recientemente. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const isBadDay = Math.random() < 0.4;

    let baseReward, quality;
    const minReward = config.workMinReward;
    const maxReward = config.workMaxReward;

    if (isBadDay) {
      baseReward = Math.floor(Math.random() * (Math.floor(maxReward * 0.3) - minReward + 1)) + minReward;
      quality = 'Tuviste un mal día';
    } else {
      baseReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
      if (baseReward >= maxReward * 0.8) quality = 'Tuviste un día excelente';
      else if (baseReward >= maxReward * 0.5) quality = 'Trabajaste muy bien';
      else quality = 'Trabajaste bien';
    }

    const reward = applyWorkBonus(baseReward, economy.upgrades);

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: reward, works: 1 },
    });

    await setDbCooldown(interaction.user.id, `work_${interaction.guildId}`);
    await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, reward);

    const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
    const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

    const lines = [
      header(`${job.emoji}`, job.name),
      `-# ${job.description}`,
      '',
      block([
        kv('Calidad', quality),
        kv('Ganancia', `\`${formatNumber(reward)} coins\``),
        kv('Balance actual', `\`${formatNumber(updatedEconomy.balance)} coins\``),
      ]),
    ];

    if (newAchievements.length > 0) {
      lines.push('', header('🏆', 'Logros desbloqueados'));
      lines.push(newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n'));
    }

    const embed = successEmbed(lines.join('\n'), '💼 Trabajo completado');
    embed.setFooter({ text: `Siguiente trabajo en ${config.workCooldownMinutes} min` });

    return interaction.editReply({ embeds: [embed] });
  },
};