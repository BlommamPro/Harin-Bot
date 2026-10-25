import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAchievements } from '../../utils/achievements.js';
import { applyRobSkill, applyPetBonus, applyInsurance } from '../../utils/applyUpgrades.js';
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

  async execute(client, interaction) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) return interaction.editReply({ embeds: economyDisabled.embeds });

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
        embeds: [errorEmbed(`La policía te está buscando. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    const targetEconomy = await getGuildEconomy(interaction.guildId, target.id, target.username);

    if ((targetEconomy.balance || 0) < 50) {
      return interaction.editReply({
        embeds: [errorEmbed(`${target.username} no tiene suficiente dinero para que valga la pena robarle.`)],
      });
    }

    const successChance = applyRobSkill(0.40, economy.upgrades);
    const success = Math.random() < successChance;

    if (success) {
      const stolenPercent = Math.random() * 0.20 + 0.10;
      const baseStolen = Math.floor(targetEconomy.balance * stolenPercent);
      const stolen = applyPetBonus(baseStolen, economy.upgrades);

      await updateGuildEconomy(interaction.guildId, interaction.user.id, {
        $inc: { balance: stolen, robs: 1 },
      });
      await updateGuildEconomy(interaction.guildId, target.id, {
        $inc: { balance: -stolen },
      });
      await setDbCooldown(interaction.user.id, `rob_${interaction.guildId}`);
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, stolen);

      const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
      const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

      const description = block([
        kv('Víctima', target.username),
        kv('Robado', `\`${formatNumber(stolen)} coins\``),
        kv('Robos exitosos', `\`${updatedEconomy.robs}\``),
        kv('Balance actual', `\`${formatNumber(updatedEconomy.balance)} coins\``),
      ]);

      const embed = createEmbed({
        color: COLORS.SUCCESS,
        title: '🥷 Robo exitoso',
        description,
      });

      if (newAchievements.length > 0) {
        embed.addFields({
          name: '🏆 Logros desbloqueados',
          value: newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n'),
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    const baseFine = Math.floor((economy.balance || 0) * 0.05);
    const fine = applyInsurance(baseFine, economy.upgrades);

    await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -fine } });
    await setDbCooldown(interaction.user.id, `rob_${interaction.guildId}`);

    const description = block([
      kv('Víctima', target.username),
      kv('Motivo', 'Te descubrieron y llamaron a la policía'),
      kv('Multa', `\`${formatNumber(fine)} coins\``),
    ]);

    const embed = createEmbed({
      color: COLORS.ERROR,
      title: '🚔 Te atraparon',
      description,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};