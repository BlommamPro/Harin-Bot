import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { updateUserData } from "../../utils/guildData.js";
import {
  checkDbCooldown,
  setDbCooldown,
} from "../../utils/economyCooldowns.js";
import { checkAndAwardBadge, checkRichBadge } from "../../utils/badges.js";

const DAILY_REWARD = 100;
const STREAK_BONUS = 50;

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
    const cd = await checkDbCooldown(interaction.user.id, "daily", 24 * 60);
    if (cd.onCooldown) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `Ya reclamaste tu daily. Vuelve <t:${cd.nextTimestamp}:R>.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const nowMs = Date.now();
    let newStreak = 1;
    const isFirstDaily = !userData.cooldowns?.daily;

    const lastDaily = userData.cooldowns?.daily;
    if (lastDaily) {
      const lastDailyDate = new Date(lastDaily);
      const diffHours = (nowMs - lastDailyDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 48) {
        if (diffHours >= 24) {
          newStreak = (userData.dailyStreak || 0) + 1;
        } else {
          newStreak = userData.dailyStreak || 1;
        }
      } else {
        newStreak = 1;
      }
    }

    const streakBonus = newStreak > 1 ? STREAK_BONUS * (newStreak - 1) : 0;
    const totalReward = DAILY_REWARD + streakBonus;

    await updateUserData(interaction.user.id, {
      $inc: { balance: totalReward },
      dailyStreak: newStreak,
      $set: { [`cooldowns.daily`]: new Date() },
    });
    
    await setDbCooldown(interaction.user.id, "daily");

    if (isFirstDaily) {
      await checkAndAwardBadge(interaction.user.id, "early_bird", client);
    }
    if (newStreak === 7) {
      await checkAndAwardBadge(interaction.user.id, "streak_7", client);
    }
    if (newStreak === 30) {
      await checkAndAwardBadge(interaction.user.id, "streak_30", client);
    }
    await checkRichBadge(interaction.user.id, client);

    const embed = successEmbed(
      `Reclamaste **${totalReward} coins**!` +
        (newStreak > 1
          ? `\n🔥 Racha de **${newStreak} días**! (+${streakBonus} bonus)`
          : ""),
    );
    embed.setFooter({ text: `Vuelve a reclamar 24H` });

    await interaction.reply({ embeds: [embed] });
  },
};