import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAchievements } from '../../utils/achievements.js';
import { applyRobSkill, applyPetBonus } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Intenta robarle coins a otro usuario')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Víctima del robo').setRequired(true)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) {
      return interaction.editReply({ embeds: economyDisabled.embeds });
    }

    const target = interaction.options.getUser('usuario');

    if (target.id === interaction.user.id) {
      return interaction.editReply({ embeds: [errorEmbed('No puedes robarte a ti mismo.')] });
    }
    if (target.bot) {
      return interaction.editReply({ embeds: [errorEmbed('No puedes robarle a un bot.')] });
    }

    const config = await getEconomyConfig(interaction.guildId);
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    const cd = await checkDbCooldown(interaction.user.id, `rob_${interaction.guildId}`, config.robCooldownMinutes);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`La policía te tiene en la mira. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    const targetEconomy = await getGuildEconomy(interaction.guildId, target.id, target.username);

    if ((targetEconomy.balance || 0) < 50) {
      return interaction.editReply({
        embeds: [errorEmbed(`${target.username} no tiene suficiente dinero para robarle.`)],
      });
    }

    const successChance = applyRobSkill(0.40, economy.upgrades);
    const success = Math.random() < successChance;

    if (success) {
      const stolenPercent = Math.random() * 0.20 + 0.10;
      const baseStolen = Math.floor(targetEconomy.balance * stolenPercent);
      const stolen = applyPetBonus(baseStolen, economy.upgrades);

      await updateGuildEconomy(interaction.guildId, interaction.user.id, {
        $inc: { balance: stolen, robs: 1 }
      });
      await updateGuildEconomy(interaction.guildId, target.id, {
        $inc: { balance: -stolen }
      });
      await setDbCooldown(interaction.user.id, `rob_${interaction.guildId}`);
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, stolen);

      const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
      const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

      const embed = successEmbed(`Le robaste **${stolen} coins** a **${target.username}**!`);
      embed.setTitle('🥷 Robo Exitoso');

      if (newAchievements.length > 0) {
        embed.addFields({
          name: '🏆 ¡Nuevos logros!',
          value: newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n')
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } else {
      const fine = Math.floor((economy.balance || 0) * 0.05);

      await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -fine } });
      await setDbCooldown(interaction.user.id, `rob_${interaction.guildId}`);

      const embed = errorEmbed(`**${target.username}** te descubrió y llamó a la policía. Pagaste **${fine} coins** de multa.`);
      embed.setTitle('👮 ¡Te Atraparon!');

      return interaction.editReply({ embeds: [embed] });
    }
  }
};