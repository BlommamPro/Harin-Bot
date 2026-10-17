import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAchievements } from '../../utils/achievements.js';
import { applyBetLuck } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

const SLOTS = ['🍒', '🍋', '💎', '7️⃣', '🍀', '🔔'];

function spin() {
  return [
    SLOTS[Math.floor(Math.random() * SLOTS.length)],
    SLOTS[Math.floor(Math.random() * SLOTS.length)],
    SLOTS[Math.floor(Math.random() * SLOTS.length)],
  ];
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Juega a la tragamonedas')
    .setDMPermission(false)
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true).setMinValue(10)
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

    const cd = await checkDbCooldown(interaction.user.id, `slots_${interaction.guildId}`, config.slotsCooldownSeconds / 60);
    if (cd.onCooldown) {
      return interaction.editReply({ embeds: [errorEmbed(`La máquina se está enfriando. Vuelve <t:${cd.nextTimestamp}:R>.`)] });
    }

    await setDbCooldown(interaction.user.id, `slots_${interaction.guildId}`);

    const [a, b, c] = spin();

    let baseWinnings = 0;
    let title = '';
    let isWin = false;

    if (a === b && b === c) {
      if (a === '7️⃣') { baseWinnings = amount * 10; title = 'Mega jackpot · 7️⃣7️⃣7️⃣'; }
      else if (a === '💎') { baseWinnings = amount * 5; title = 'Diamond jackpot'; }
      else { baseWinnings = amount * 3; title = 'Jackpot'; }
      isWin = true;
    } else if (a === b || b === c || a === c) {
      baseWinnings = amount * 1.5;
      title = 'Casi · dos iguales';
      isWin = true;
    } else {
      baseWinnings = -amount;
      title = 'Mala suerte';
    }

    let winnings = baseWinnings;
    if (isWin) winnings = applyBetLuck(Math.floor(baseWinnings), economy.upgrades);

    const netChange = isWin ? winnings - amount : -amount;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: {
        balance: netChange,
        ...(isWin ? { slotsWins: 1 } : {}),
      },
    });

    if (isWin && winnings > 0) {
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, winnings);
    }

    const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
    const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

    const display = `| ${a} | ${b} | ${c} |`;
    const netWin = isWin ? winnings - amount : -amount;

    const lines = [
      header(isWin ? '🎉' : '💀', title),
      '',
      display,
      '',
      block([
        kv('Apuesta', `\`${formatNumber(amount)} coins\``),
        kv(isWin ? 'Ganancia' : 'Pérdida', `\`${formatNumber(Math.abs(netWin))} coins\``),
        kv('Balance actual', `\`${formatNumber(updatedEconomy.balance)} coins\``),
      ]),
    ];

    if (newAchievements.length > 0) {
      lines.push('', header('🏆', 'Logros desbloqueados'));
      lines.push(newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n'));
    }

    const embed = isWin
      ? successEmbed(lines.join('\n'), '🎰 Ganaste')
      : errorEmbed(lines.join('\n'), '🎰 Perdiste');

    return interaction.editReply({ embeds: [embed] });
  },
};