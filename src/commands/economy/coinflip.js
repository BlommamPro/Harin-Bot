import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { applyBetLuck } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Apuesta a cara o cruz')
    .setDMPermission(false)
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true).setMinValue(10)
    )
    .addStringOption(opt =>
      opt.setName('lado').setDescription('Cara o cruz').setRequired(true)
        .addChoices(
          { name: 'Cara', value: 'cara' },
          { name: 'Cruz', value: 'cruz' }
        )
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

    const amount = interaction.options.getInteger('cantidad');
    const side = interaction.options.getString('lado');

    const config = await getEconomyConfig(interaction.guildId);

    if (amount < config.minBet) {
      return interaction.editReply({ embeds: [errorEmbed(`La apuesta mínima es ${config.minBet} coins.`)] });
    }
    if (amount > config.maxBet) {
      return interaction.editReply({ embeds: [errorEmbed(`La apuesta máxima es ${config.maxBet} coins.`)] });
    }

    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    if ((economy?.balance || 0) < amount) {
      return interaction.editReply({
        embeds: [errorEmbed(`No tienes suficientes coins. Tienes ${economy.balance} y apostaste ${amount}.`)],
      });
    }

    const cd = await checkDbCooldown(interaction.user.id, `coinflip_${interaction.guildId}`, config.coinflipCooldownSeconds / 60);
    if (cd.onCooldown) {
      return interaction.editReply({ embeds: [errorEmbed(`Espera un momento. Vuelve <t:${cd.nextTimestamp}:R>.`)] });
    }

    const result = Math.random() < 0.5 ? 'cara' : 'cruz';
    const won = result === side;

    await setDbCooldown(interaction.user.id, `coinflip_${interaction.guildId}`);

    const lines = [
      header('🪙', `Resultado: ${result.toUpperCase()}`),
      block([
        kv('Tu elección', side.toUpperCase()),
        won
          ? kv('Ganancia', `\`${formatNumber(applyBetLuck(amount, economy.upgrades))} coins\``)
          : kv('Pérdida', `\`${formatNumber(amount)} coins\``),
      ]),
    ];

    if (won) {
      const winnings = applyBetLuck(amount, economy.upgrades);
      await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: winnings } });
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, winnings);

      const embed = successEmbed(lines.join('\n'), '🪙 ¡Ganaste!');
      return interaction.editReply({ embeds: [embed] });
    }

    await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -amount } });

    const embed = errorEmbed(lines.join('\n'), '🪙 Perdiste');
    return interaction.editReply({ embeds: [embed] });
  },
};