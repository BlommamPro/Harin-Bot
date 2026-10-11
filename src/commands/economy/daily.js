import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { getGuildEconomy, updateGuildEconomy } from "../../utils/guildData.js";
import { checkDbCooldown, setDbCooldown } from "../../utils/economyCooldowns.js";
import { checkAchievements } from "../../utils/achievements.js";
import { applyDailyBonus } from "../../utils/applyUpgrades.js";
import { addWeeklyCoins } from "../../utils/weeklyRanking.js";
import { getEconomyConfig } from "../../utils/economyConfigGuild.js";
import { checkEconomyEnabled } from "../../utils/economyGuard.js";

export default {
  CMD: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Reclama tu recompensa diaria de coins")
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) return interaction.reply(economyDisabled);

    const config = await getEconomyConfig(interaction.guildId);
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    const cd = await checkDbCooldown(interaction.user.id, `daily_${interaction.guildId}`, config.dailyCooldownMinutes);
    if (cd.onCooldown) {
      return interaction.reply({
        embeds: [errorEmbed(`Ya reclamaste tu daily en este servidor. Vuelve <t:${cd.nextTimestamp}:R>.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const nowMs = Date.now();
    let newStreak = 1;
    const lastDaily = economy.cooldowns?.daily;

    if (lastDaily) {
      const diffHours = (nowMs - new Date(lastDaily).getTime()) / (1000 * 60 * 60);
      if (diffHours < 48) {
        if (diffHours >= 24) newStreak = (economy.dailyStreak || 0) + 1;
        else newStreak = economy.dailyStreak || 1;
      }
    }

    const streakBonus = newStreak > 1 ? config.dailyStreakBonus * (newStreak - 1) : 0;
    const baseReward = config.dailyReward + streakBonus;
    const totalReward = applyDailyBonus(baseReward, economy.upgrades);

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: totalReward },
      $set: {
        dailyStreak: newStreak,
        [`cooldowns.daily`]: new Date()
      }
    });

    await setDbCooldown(interaction.user.id, `daily_${interaction.guildId}`);
    await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, totalReward);

    const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
    const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

    const embed = successEmbed(
      `Reclamaste **${totalReward} coins**!` +
      (newStreak > 1 ? `\n🔥 Racha de **${newStreak} días**! (+${streakBonus} bonus)` : "")
    );
    embed.setFooter({ text: `Vuelve a reclamar en ${Math.floor(config.dailyCooldownMinutes / 60)}H` });

    if (newAchievements.length > 0) {
      embed.addFields({
        name: '🏆 ¡Nuevos logros!',
        value: newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n')
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};